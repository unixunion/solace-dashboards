package com.deblox.auth;

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
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.time.format.DateTimeFormatter;
import java.util.*;


/**
 * Authorizes a used and send back session key
 *
 * holds a map of the current active sessions, also decides on if a user may or may not perform a action.
 *
 * message example:
 *
 * {
 *   "username": "userX",
 *   "password": "password"
 * }
 *
 * response:
 * {
 *   "result": "success",
 *   "uuid": "some uuid"
 * }
 *
 *
 */
public class AuthVerticle extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(AuthVerticle.class);
  EventBus eb;
  Map<String, JsonObject> sessionData;

  // date formatter
  DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  /**
   * Start the verticle
   *
   * @param startFuture
   * @throws Exception
   */
  public void start(Future<Void> startFuture) throws Exception {

    logger.info("startup with config: " + config().toString());

    // map of releases, should contain date events were fired in  / updated also
    sessionData = new HashMap<>();

    // connect to the eventbus
    eb = vertx.eventBus();


    // listen for release events from other verticles / clients
    eb.consumer("auth-request", event -> {
      logger.info(event.body().toString());

      JsonObject body = null;

      // create a json object from the message
      try {
        body = new JsonObject(event.body().toString());
      } catch (Exception e) {
        logger.warn("not a json object");
        event.reply(new JsonObject().put("result", "failure").put("reason", "that wasn't json"));
      }

      // call some auth mechanism


      // create some profile
      JsonObject profile = new JsonObject().put("date", new Date());

      // create a uuid
      String uuid = UUID.randomUUID().toString();

      // put the updated one
      sessionData.put(uuid, profile);

      event.reply(new JsonObject().put("result", "success").put("uuid", uuid));

    });


    startFuture.complete();

  }

  @Override
  public void stop(Future<Void> stopFuture) {

    vertx.setTimer(1000, tid -> {
      logger.info("shutdown");
      stopFuture.complete();
    });

  }

}
