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

import com.deblox.Util;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Future;
import io.vertx.core.VertxOptions;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.impl.Deployment;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.CorsHandler;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.Map;

/*

A simple solace MOCK service which answers SEMP requests

 */

public class MockServer extends AbstractVerticle {

    private static final Logger logger = LoggerFactory.getLogger(MockServer.class);
    private JsonObject serverConfig = new JsonObject();
    private JsonObject metrics = new JsonObject();

    @Override
    public void start(Future<Void> startFuture) {
        logger.info("starting with config: " + config().toString());
        Router router = Router.router(vertx);

        try {
            serverConfig = Util.loadConfig(config().getString("serverConfig", "/conf.json"))
                    .getJsonObject(config().getString("serverVerticle", "com.deblox.solacemonitor.MonitorVerticle"));
            metrics = serverConfig.getJsonObject("config").getJsonObject("metrics");
            logger.info("metrics: " + metrics);
        } catch (IOException e) {
            e.printStackTrace();
        }

        router.route().handler(CorsHandler.create("*")
                .allowedMethod(HttpMethod.GET)
                .allowedMethod(HttpMethod.POST)
                .allowedMethod(HttpMethod.OPTIONS)
                .allowedHeader("Content-Type"));

        router.get("/SEMP").handler(ctx -> {
            logger.debug("mock server taking request");
            ctx.response().setChunked(true);
            ctx.response().write("POST YOUR SEMP REQUESTS HERE");
            ctx.response().end();
        });


        /*

        accepts XML posted to /SEMP,
        matches XML against metrics's request string in serverConfig's metrics object
        reads a XML file from resources matching the NAME of the metric e.g. stats

         */

        router.post("/SEMP").handler(ctx -> {
            logger.debug("mock server taking request");

            for (Map.Entry<String, String> entry : ctx.request().headers()) {
                logger.debug("Header: " + entry.getKey() + " : " + entry.getValue());
            }

            ctx.request().bodyHandler(body -> {
                logger.debug("Body Handler");
                logger.debug(body.toString());

                logger.debug("Matching metrics:");

                metrics.forEach(e -> {
                    logger.debug(e.getKey());

                    JsonObject j = (JsonObject) e.getValue();

                    if (j.getString("request").equals(body.toString())) {
                        logger.debug("MATCHED");

                        ctx.response().setChunked(true);
                        try {
                            ctx.response().sendFile("mock/" + e.getKey() + ".xml");
                        } catch (Exception x) {
                            x.printStackTrace();
                        }

                    }

                    logger.debug(j.getString("request"));

                });



            });



        });

        // the server itself
        vertx.createHttpServer().requestHandler(router::accept).listen(config().getInteger("port", 8081));

        // send back deployment complete
        startFuture.complete();
    }

}