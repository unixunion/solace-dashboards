package com.deblox.solacemonitor.unit.test;

import com.deblox.Boot;
import com.deblox.Util;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;


/*
 * Example of an asynchronous unit test written in JUnit style using vertx-unit
 *
 * @author <a href="http://tfox.org">Tim Fox</a>
 */
@RunWith(VertxUnitRunner.class)
public class MonitorVerticleTest {

  Vertx vertx;
  EventBus eb;
  JsonObject config;
  private static final Logger logger = LoggerFactory.getLogger(MonitorVerticleTest.class);

  @Before
  public void before(TestContext context) {
    logger.info("@Before");
    vertx = Vertx.vertx();
    eb = vertx.eventBus();

    // empty config
    config = new JsonObject();

    try {
      config = Util.loadConfig(Boot.class, "/conf.json");
    } catch (Exception e) {
      logger.warn(e.getMessage());
    }

    DeploymentOptions serviceConfig = new DeploymentOptions(new JsonObject().put("config", config));

    Async async = context.async();
    vertx.deployVerticle(Boot.class.getName(), serviceConfig, res -> {
      if (res.succeeded()) {
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
        async.complete();
      } else {
        context.fail();
      }
    });
  }

  @After
  public void after(TestContext context) {
    logger.info("@After");
    Async async = context.async();

    // the correct way after next release
    //vertx.close(context.assertAsyncSuccess());

    vertx.close( event -> {
      async.complete();
    });

  }

  @Test
  public void test(TestContext test) {
    Async async = test.async();
    eb.send("ping-address", "ping!", reply -> {
      if (reply.succeeded()) {
        async.complete();
      } else {
        test.fail();
      }
    });

  }

  @Test
  public void test2(TestContext test) {
    Async async = test.async();
    eb.send("request-metrics", "memory", reply -> {
      if (reply.succeeded()) {
        logger.info(reply.result().body());
        async.complete();
      } else {
        test.fail();
      }
    });
  }

  @Test
  public void test3(TestContext test) {
    Async async = test.async();
    eb.send("request-metrics", "stats", reply -> {
      if (reply.succeeded()) {
        logger.info(reply.result().body());
        async.complete();
      } else {
        test.fail();
      }
    });
  }

}