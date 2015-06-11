package com.deblox.solacemonitor.unit.test;

import com.deblox.solacemonitor.MonitorVerticle;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;


/*
 * Example of an asynchronous unit test written in JUnit style using vertx-unit
 *
 * @author <a href="http://tfox.org">Tim Fox</a>
 */
@RunWith(VertxUnitRunner.class)
public class MyJUnitTest {

  Vertx vertx;
  HttpServer server;

  @Before
  public void before(TestContext context) {
    vertx = Vertx.vertx();
    Async async = context.async();
    server =
            vertx.createHttpServer().requestHandler(req -> req.response().end("foo")).listen(8080, res -> {
              if (res.succeeded()) {
                async.complete();
              } else {
                context.fail();
              }
            });
  }

  @Test
  public void test2(TestContext test) {
    // Deploy and undeploy a verticle
    Async async = test.async();
    vertx.deployVerticle(MonitorVerticle.class.getName(), res -> {
      if (res.succeeded()) {
        String deploymentID = res.result();
        vertx.undeploy(deploymentID, res2 -> {
          if (res2.succeeded()) {
            async.complete();
          } else {
            test.fail();
          }
        });
      } else {
        test.fail();
      }
    });
  }
}