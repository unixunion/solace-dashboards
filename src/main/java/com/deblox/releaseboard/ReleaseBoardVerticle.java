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

import io.vertx.core.AbstractVerticle;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;


/**
 * Maintains a map of "releases" and sends them out to clients at interval
 *
 * message example:
 *
 * {
 *   "id": "SD-1234",
 *   "product": "foo",
 *   "version": "1.2.3.4",
 *   "status": "preparing"
 * }
 *
 *
 *
 */
public class ReleaseBoardVerticle extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(ReleaseBoardVerticle.class);
  EventBus eb;
  Map<String, JsonObject> releasesData;

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

    // connect to the eventbus
    eb = vertx.eventBus();


    // listen for release events from other verticles / clients
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

      body.put("id", body.getValue("component") + "-" + body.getValue("version"));

      // add the date now
      body.put("date", LocalDateTime.now().format(formatter));

      // pop the old matching JIRA release
      releasesData.remove(body.getString("id"));

      // put the updated one
      releasesData.put(body.getString("id"), body);

      event.reply(new JsonObject().put("result", "success"));

    });



    vertx.setPeriodic(10000, tid -> {

      JsonObject msg = new JsonObject();
      msg.put("topic", "releases");

      JsonArray rel = new JsonArray();

      Iterator<Map.Entry<String, JsonObject>> iter = releasesData.entrySet().iterator();
      while (iter.hasNext()) {
        Map.Entry<String, JsonObject> entry = iter.next();
        rel.add(entry.getValue());
      }

      msg.put("data", rel);

      eb.publish("releases", msg);

    });



    // create metric emitters
//    Iterator iter = config.getJsonObject("metrics", new JsonObject()).iterator();
//    while (iter.hasNext()) {
//
//      Map.Entry<String, JsonObject> metricConfig = (Map.Entry) iter.next();
//
//
//    }




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
          logger.info("expiring stale release: " + entry.getValue());
          iter.remove();
        }

      }


    });


    startFuture.complete();

  }





}
