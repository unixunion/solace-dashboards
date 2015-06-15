
package com.deblox.server;

/*

Copyright 2015 Kegan Holtzhausen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpHeaders;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;


public class Server extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(Server.class);
  EventBus eb;

  @Override
  public void start(Future<Void> startFuture) {
    logger.info("starting with config: " + config().toString());

    Router router = Router.router(vertx);

    // Allow events for the designated addresses in/out of the event bus bridge
    BridgeOptions opts = new BridgeOptions()
            .addInboundPermitted(new PermittedOptions())
            .addOutboundPermitted(new PermittedOptions());

    // Create the event bus bridge and add it to the router.
    SockJSHandler ebHandler = SockJSHandler.create(vertx).bridge(opts);
    router.route("/eventbus/*").handler(ebHandler);

    // broadcast some arbitary message
    router.post("/api/broadcast").handler(ctx -> {
      ctx.response().putHeader("content-type", "text/json");

      // curl -H "Content-Type: application/json" -X POST -d '{"action":"broadcast", "data":"something"}' localhost:8080/api/broadcast
      ctx.request().bodyHandler(req -> {
        JsonObject msg = new JsonObject(req.toString());
        logger.info(msg);
        eb.publish(msg.getString("topic", "unknown"), msg);

        ctx.response().putHeader(HttpHeaders.CONTENT_TYPE, "application/json").end("{}");
      });



    });

    // Serve the static pages
    router.route().handler(StaticHandler.create()
            .setCachingEnabled(false)
            .setWebRoot(config().getString("webroot", "webroot"))
            .setDirectoryListing(false));

    // the server itself
    vertx.createHttpServer()
            .requestHandler(router::accept)
            .listen(config().getInteger("port", 8080));

    // need a bus!
    eb = vertx.eventBus();

    // send back deployment complete
    startFuture.complete();
  }

  @Override
  public void stop(Future<Void> stopFuture) {
    eb.publish("broadcast", "server going down");

    vertx.setTimer(1000, tid -> {
      logger.info("shutdown");
      stopFuture.complete();
    });

  }

}