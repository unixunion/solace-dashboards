package com.deblox.releaseboard;

/*

Copyright 2015 Kegan Holtzhausen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the ßLicense is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import com.deblox.Util;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.Future;
import io.vertx.core.file.AsyncFile;
import io.vertx.core.file.OpenOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;


/**
 * ReleaseBoard Verticle
 *
 * Maintains a map of "releases" and sends them out to clients at interval. the id is used as the unique identifier, and
 * is typically made up of the component + version string, can be set explicitly. the code's are used to control the UI elements essentially
 * in the HTML client.
 *
 *
 * RELEASE EVENT:
 *
 * consumes from: "release-event"
 * publishes to "releases"
 *
 * consumed message format:
 *
 * {
 *   "component": String,
 *   "version": String,
 *   "status": String,
 *   "environment": String,
 *   "code": Int,
 *   // optional
 *   "id": "some unique identifier"
 * }
 *
 * emitted message format:
 *
 * {
 *   "id": "foo-1.2.3.4",
 *   "component": "foo",
 *   "version": "1.2.3.4",
 *   "status": "event in progress",
 *   "environment": "qa1",
 *   "date": "yyyy-MM-dd HH:mm:ss",
 *   "code": 302,
 *   "expired" : false
 * }
 *
 * codes are a loose contract between the client application (HTML) and the publisher, they are
 * defined in any way you like,
 *
 * example:
 *
 *  100's -> process stage required ( approve the jira! )
 *  200's -> completed stage
 *  300's -> stage in progress
 *  500's -> error in stage
 *
 * define as you like, and remember to check the release_handler.js and release.py files to sync up YOUR code's
 *
 *
 * EXPIRE RELEASE EVENT
 *
 * consumes from: "expire-release-event"
 *
 * message:
 * {
 *   "id": "some id"
 * }
 *
 *
 * VERTICLE CONFIG
 *
 "config": {
 "expire_timeout": 108000, // seconds
 "check_expiry": 60000, // millis
 "state_file": "/tmp/state.json",
 "save_interval": 60000 // millis
 }
 *
 */
public class ReleaseBoardVerticle extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(ReleaseBoardVerticle.class);
  EventBus eb;
  Map<String, JsonObject> releasesData;
  String stateFile;

  // date formatter
  DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  /**
   * Start the verticle
   *
   * @param startFuture
   * @throws Exception
   */
  public void start(Future<Void> startFuture) throws Exception {

    logger.info("starup with config: " + config().toString());

    // get expire_release in seconds
    int expire_timeout = config().getInteger("expire_timeout", 86000);

    // map of releases, should contain date events were fired in  / updated also
    releasesData = new HashMap<>();

    stateFile = config().getString("state_file", "/state.json");

    // connect to the eventbus
    eb = vertx.eventBus();

    // load the state file if exists
    vertx.fileSystem().exists(stateFile, h -> {
      if (h.succeeded()) {
        try {
          JsonArray history = Util.loadConfig(stateFile).getJsonArray("releases");
          for (Object release  : history) {
            JsonObject releaseJson = new JsonObject(release.toString());
            logger.info("loading release: " + releaseJson.getString("id"));
            releasesData.put(releaseJson.getString("id"), releaseJson.getJsonObject("data"));
          }

        } catch (IOException e) {
          logger.warn("unable to load state file, it will be created / overwritten");
          e.printStackTrace();
        }

      }
    });



    /*
     * listen for release events from other verticles / clients
     *
     * example release-event published direct to the eventbus ( see Server.java )
     *

      {
          "code": 205,
          "component": "maximus",
          "environment": "CI1",
          "status": "Deploy Succeeded",
          "version": "1.0.0.309"
      }

     *
     *
     */
    eb.consumer("release-event", event -> {
      logger.info(event.body().toString());

      JsonObject body = null;

      // create a json object from the message
      try {
        body = new JsonObject(event.body().toString());
      } catch (Exception e) {
        logger.warn("not a json object");
        event.reply(new JsonObject().put("result", "failure").put("reason", "that wasn't json"));
      }

      // create check if a id is specified, else combine component and version
      body.put("id", body.getString("id", body.getValue("component") + "-" + body.getValue("version")));

      // used for marking expired messages when time is not enough or too much
      body.put("expired", false);

      // add the date now
      body.put("date", LocalDateTime.now().format(formatter));

      // pop the old matching JIRA release
      releasesData.remove(body.getString("id"));

      // put the updated one
      releasesData.put(body.getString("id"), body);

      event.reply(new JsonObject().put("result", "success"));

    });


    // expire a release event and remove it from the map
    eb.consumer("expire-release-event", event -> {
      try {
        logger.info("delete event: " + event.body().toString());
        JsonObject request = new JsonObject(event.body().toString());
        releasesData.remove(request.getString("id"));

        // forulate the expire message
        JsonObject msg = new JsonObject()
                .put("topic", "releases")
                .put("action", "expire");
        JsonArray arr = new JsonArray()
                .add(request.getString("id"));
        msg.put("data", arr);

        eb.publish("releases", msg);

        event.reply(new JsonObject().put("result", "success"));
      } catch (Exception e) {
        event.reply(new JsonObject().put("result", "error"));
      }
    });


    vertx.setPeriodic(10000, tid -> {

      JsonObject msg = new JsonObject();
      msg.put("topic", "releases");
      msg.put("action", "default");

      JsonArray rel = new JsonArray();

      Iterator<Map.Entry<String, JsonObject>> iter = releasesData.entrySet().iterator();
      while (iter.hasNext()) {
        Map.Entry<String, JsonObject> entry = iter.next();
        rel.add(entry.getValue());
      }

      msg.put("data", rel);

      eb.publish("releases", msg);

    });



    // periodically expire old releases in the map
    vertx.setPeriodic(config().getInteger("check_expiry", 1000), res -> {
      // iterate over map, check dates for each, expire as needed

      Iterator<Map.Entry<String, JsonObject>> iter = releasesData.entrySet().iterator();
      while (iter.hasNext()) {
        Map.Entry<String,JsonObject> entry = iter.next();


        logger.debug("checking expiry on " + entry.getKey() + " v " + entry.getValue());

        // now
        LocalDateTime now = LocalDateTime.now();

        // then
        LocalDateTime then = LocalDateTime.parse(entry.getValue().getString("date"), formatter);

        // delta
        Long delta = now.toEpochSecond(ZoneOffset.UTC) - then.toEpochSecond(ZoneOffset.UTC);

        if (delta >= expire_timeout) {
          logger.info("expiring stale release: " + entry.getValue() + " delta: " + delta.toString());
          iter.remove();
        }

      }


    });


    // save the current pile of releases into a JSON periodically
    vertx.setPeriodic(config().getInteger("save_interval", 60000), t -> {
      saveState();
    });

    startFuture.complete();

  }

  @Override
  public void stop(Future<Void> stopFuture) {
    saveState();

    vertx.setTimer(1000, tid -> {
      logger.info("shutdown");
      stopFuture.complete();
    });

  }

  public void saveState() {
    logger.info("saving state");
    JsonObject db = new JsonObject();
    JsonArray releases = new JsonArray();

    Iterator<Map.Entry<String, JsonObject>> iter = releasesData.entrySet().iterator();
    while (iter.hasNext()) {
      Map.Entry<String, JsonObject> entry = iter.next();
      JsonObject rel = new JsonObject();
      rel.put("id", entry.getKey());
      rel.put("data", entry.getValue());
      releases.add(rel);
    }

    db.put("releases", releases);

    vertx.fileSystem().exists(stateFile, te -> {
      if (te.succeeded()) {
        if (te.result().booleanValue()) {
          vertx.fileSystem().deleteBlocking(stateFile);
          vertx.fileSystem().createFileBlocking(stateFile);
        } else {
          vertx.fileSystem().createFileBlocking(stateFile);
        }

      } else {
        logger.warn("unable to check if file exists: " + stateFile);
      }

      vertx.fileSystem().open(stateFile, new OpenOptions().setCreate(true).setWrite(true), r -> {
        if (r.succeeded()) {
          AsyncFile file = r.result();
          file.write(Buffer.buffer(db.toString()));
          file.close();
        } else {
          logger.warn(r.cause());
        }
      });

    });




  }


}