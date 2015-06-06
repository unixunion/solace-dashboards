package com.deblox;

import io.vertx.core.*;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.impl.LoggerFactory;

import java.io.File;
import java.util.function.Consumer;

/*
 * Runner for Running from within IDE only!
 */
public class DebloxRunner {

  private static final Logger logger = LoggerFactory.getLogger(DebloxRunner.class);

  public static void runJava(String prefix, Class clazz, boolean clustered, String confFile) {
    runJava(prefix, clazz, new VertxOptions().setClustered(clustered), confFile);
  }

  public static void runJava(String prefix, Class clazz, boolean clustered) {
    runJava(prefix, clazz, new VertxOptions().setClustered(clustered), "conf.json");
  }

  public static void runJava(String prefix, Class clazz, VertxOptions options, String confFile) {
    String runDir = prefix + clazz.getPackage().getName().replace(".", "/");
    run(runDir, clazz.getName(), options, confFile);
  }

  public static void runScript(String prefix, String scriptName, boolean clustered) {
    File file = new File(scriptName);
    String dirPart = file.getParent();
    String scriptDir = prefix + dirPart;
    DebloxRunner.run(scriptDir, scriptDir + "/" + file.getName(), clustered);
  }

//  public static void runScript(String prefix, String scriptName, VertxOptions options) {
//    File file = new File(scriptName);
//    String dirPart = file.getParent();
//    String scriptDir = prefix + dirPart;
//    DebloxRunner.run(scriptDir, scriptDir + "/" + file.getName(), options);
//  }

  public static void run(String runDir, String verticleID, boolean clustered) {
    run(runDir, verticleID, new VertxOptions().setClustered(clustered), "/conf.json");
  }

  public static void run(String runDir, String verticleID, VertxOptions options, String confFile) {
    logger.info("booting");
    System.setProperty("vertx.cwd", runDir);
    Consumer<Vertx> runner = vertx -> {
      try {
        JsonObject config = Util.loadConfig(confFile);
        // put config inside a config tag to solve issue between running as fatJar and running main[]
        DeploymentOptions deploymentOptions = new DeploymentOptions(new JsonObject().put("config", config));
        vertx.deployVerticle(verticleID, deploymentOptions);
      } catch (Throwable t) {
        t.printStackTrace();
      }
    };
    if (options.isClustered()) {
      Vertx.clusteredVertx(options, res -> {
        if (res.succeeded()) {
          Vertx vertx = res.result();
          runner.accept(vertx);
        } else {
          res.cause().printStackTrace();
        }
      });
    } else {
      Vertx vertx = Vertx.vertx(options);
      runner.accept(vertx);
    }
  }
}