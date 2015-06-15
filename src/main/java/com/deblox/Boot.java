package com.deblox;

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
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Future;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import net.sourceforge.argparse4j.ArgumentParsers;
import net.sourceforge.argparse4j.inf.ArgumentParser;
import net.sourceforge.argparse4j.inf.ArgumentParserException;
import net.sourceforge.argparse4j.inf.Namespace;


/**
 * Created by Kegan Holtzhausen on 29/05/14.
 *
 * This loads the config and then starts the main application services
 *
 * run with -conf conf.json
 *
 */
public class Boot extends AbstractVerticle {
  JsonObject config;
  EventBus eb;

  private static final Logger logger = LoggerFactory.getLogger(Boot.class);

  // Allow running direct from IDE, args "-conf conf.json"
  public static void main(String[] args) {

    ArgumentParser parser = ArgumentParsers.newArgumentParser("deBlox Boot")
            .defaultHelp(true)
            .description("development boot main");
    parser.addArgument("-conf")
            .help("config file");

    Namespace ns = null;
    try {
      ns = parser.parseArgs(args);
    } catch (ArgumentParserException e) {
      parser.handleError(e);
      System.exit(1);
    }

    // if conf is passed or not
    if (ns.get("conf") == null) {
      DebloxRunner.runJava("src/main/java", Boot.class, false);
    } else {
      DebloxRunner.runJava("src/main/java", Boot.class, false, ns.get("conf"));
    }

  }

  @Override
  public void start(final Future<Void> startedResult) {

    logger.info("\n" +
            "████████▄     ▄████████ ▀█████████▄   ▄█        ▄██████▄  ▀████    ▐████▀      ▀█████████▄   ▄██████▄   ▄██████▄      ███     \n" +
            "███   ▀███   ███    ███   ███    ███ ███       ███    ███   ███▌   ████▀         ███    ███ ███    ███ ███    ███ ▀█████████▄ \n" +
            "███    ███   ███    █▀    ███    ███ ███       ███    ███    ███  ▐███           ███    ███ ███    ███ ███    ███    ▀███▀▀██ \n" +
            "███    ███  ▄███▄▄▄      ▄███▄▄▄██▀  ███       ███    ███    ▀███▄███▀          ▄███▄▄▄██▀  ███    ███ ███    ███     ███   ▀ \n" +
            "███    ███ ▀▀███▀▀▀     ▀▀███▀▀▀██▄  ███       ███    ███    ████▀██▄          ▀▀███▀▀▀██▄  ███    ███ ███    ███     ███     \n" +
            "███    ███   ███    █▄    ███    ██▄ ███       ███    ███   ▐███  ▀███           ███    ██▄ ███    ███ ███    ███     ███     \n" +
            "███   ▄███   ███    ███   ███    ███ ███▌    ▄ ███    ███  ▄███     ███▄         ███    ███ ███    ███ ███    ███     ███     \n" +
            "████████▀    ██████████ ▄█████████▀  █████▄▄██  ▀██████▀  ████       ███▄      ▄█████████▀   ▀██████▀   ▀██████▀     ▄████▀   1.0\n" +
            "                                     ▀                    https://github.com/unixunion/deblox-vertx-template                  \n");

    config = config();

    eb = vertx.eventBus();

    // warn a brother!
    if (config.equals(new JsonObject())) {
      logger.warn("you have no config here!");
    } else {
      logger.info("config: " + config);
    }

    // Start each class mentioned in services
    for (final Object serviceClassName : config.getJsonArray("services", new JsonArray())) {

      logger.info("deploying service: " + serviceClassName);

      // get the config for the named service
      JsonObject serviceConfigJson = config.getJsonObject(serviceClassName.toString(), new JsonObject());
      logger.info("serviceConfigJson: " + serviceConfigJson);

      // See DeploymentOptions.fromJson for all the possible configurables
      DeploymentOptions serviceConfig = new DeploymentOptions(serviceConfigJson);

      vertx.deployVerticle(serviceClassName.toString(), serviceConfig, res -> {

        if (res.succeeded()) {
          logger.info("successfully deployed service: " + serviceClassName);

        } else {
          logger.error("failure while deploying service: " + serviceClassName);
          res.cause().printStackTrace();
        }

      });

    }


    // for testing purposes, we need a litte delay since its less code than wait implement all verticles to boot.
    vertx.setTimer(1000, event -> {
      startedResult.complete();
      logger.info("startup complete");
    });


  }

  @Override
  public void stop(Future<Void> stopFuture) {
    vertx.setTimer(1000, tid -> {
      logger.info("shutdown");
      stopFuture.complete();
    });
  }


}


