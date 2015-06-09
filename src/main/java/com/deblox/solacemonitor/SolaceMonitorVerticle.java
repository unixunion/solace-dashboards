package com.deblox.solacemonitor;


import com.deblox.Util;
import io.netty.handler.codec.http.HttpHeaders;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.Future;
import io.vertx.core.http.HttpClient;
import io.vertx.core.http.HttpClientRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/*
 * Solace Monitor Dashboard Verticle
 *
 * reads a config and creates periodic metric monitors
 * answer specific monitor requests on the eventbus for "on-demand"
 *
 */

public class SolaceMonitorVerticle extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(SolaceMonitorVerticle.class);
  EventBus eb;
  String uuid;
  HttpClient client;
  JsonObject config;

  String host;
  int port;
  String username;
  String password;
  String credentials;

  Map<UUID, String> clients;

  public void start(Future<Void> startFuture) throws Exception {

    logger.info("starup with config: " + config().toString());

    config = config();
    host = config().getString("host", null);
    port = config().getInteger("port", 80);
    username = config().getString("username", "DEFAULT_USERNAME");
    password = config().getString("password", "DEFAULT_PASSWORD");
    credentials = String.format("%s:%s", username, password);

    clients = new HashMap<UUID, String>();

    uuid = UUID.randomUUID().toString();
    eb = vertx.eventBus();
    client = vertx.createHttpClient();

    // eventbus request ping listner
    eb.consumer("ping-address", message -> {
      logger.info(uuid + ": replying");
      message.reply("pong!");
    });

    // eventbus request for metrics listener
    eb.consumer("request-metrics", message -> {
      logger.info(uuid + ": requesting metrics");
      getSolaceMetric(message.body().toString(), new Handler() {
        @Override
        public void handle(Object event) {
          logger.debug("response: " + event.toString());
          message.reply(Util.xml2json(event.toString()));
        }
      });
    });


    // returns a array of names for all metrics defined in config
    // used for setting up the client
    eb.consumer("request-config", message -> {
      logger.info("config request " + message.body().toString());

      JsonObject response = new JsonObject();

      JsonArray results = new JsonArray(config.getJsonObject("metrics").stream()
                      .filter(r -> ((JsonObject)r.getValue()).getBoolean("show_in_menu", false))
                      .map(r -> r.getKey())
                      .sorted()
                      .collect(Collectors.toList()));

      response.put("metrics", results);

      message.reply(response);

    });

    eb.consumer("newclient", message -> {
      logger.info("new client: " + message.body().toString());
      JsonObject client = new JsonObject(message.body().toString());
      clients.remove(client.getString("uuid"));
      clients.put(UUID.fromString(client.getString("uuid")), client.getString("version"));
    });

    eb.consumer("broadcast", message -> {
      logger.info("broadcast: " + message.body().toString());
    });

    // create periodicals
    Iterator iter = config.getJsonObject("metrics", new JsonObject()).iterator();
    while (iter.hasNext()) {
      Map.Entry<String, JsonObject> entry = (Map.Entry) iter.next();
      logger.info("registering metric: " + entry.getKey());
      int interval = entry.getValue().getInteger("interval", 5000);
      if (interval != 0) {
        vertx.setPeriodic(interval, tid -> {
          logger.debug("metric interval handler for " + entry.getKey() + " every " + interval);
          getSolaceMetric(entry.getKey(), event -> {
            logger.debug("metric: " + event.toString());

            JsonObject pj = new JsonObject();
            pj.put("topic", entry.getKey());
            pj.put("data", Util.xml2json(event.toString()));

            // get the config for the metric
            JsonObject msgConfig = config.getJsonObject("metrics")
                    .getJsonObject(entry.getKey())
                    .getJsonObject("config", new JsonObject());

            msgConfig.put("view_format", config.getJsonObject("views", new JsonObject())
                    .getJsonObject(msgConfig.getString("view", "default")));

            pj.put("config", msgConfig);

            eb.publish(entry.getKey(), pj);
          });
        });
      } else {
        logger.warn("metric " + entry.getKey() + " is disabled ");
      }
    }


    vertx.setTimer(10000, tid -> {
//      clients.forEach((k,v) -> {
//        logger.info("clients: " + k + ": " + v);
//          eb.send(k.toString(), "Server Startup " + config.getString("version", "unknown"));
//      });
      broadcast("broadcast", "Server Startup " + config.getString("version", "unknown"));
    });

    // send completed startup event
    startFuture.complete();

  }


  /*
  broadcast something
   */

  public void broadcast(String action, String msg) {

    JsonObject message = new JsonObject();
    message.put("action", action);
    message.put("data", msg);

    clients.forEach((k,v) -> {
      logger.info("sending broadcast to client: " + k + ": " + v);
      eb.send(k.toString(), message);
    });

  }


  /*
  does the request
   */
  public void getSolaceMetric(String metricName, Handler handler) {

    try {

      if (host == null) {
        logger.warn("no config");
      } else {
        logger.debug(uuid + " getting metrics from: " + host);
        HttpClientRequest req = client.post(port, host, "/SEMP", resp -> {
          resp.bodyHandler(body -> {
            logger.debug("Response: " + body.toString());
            handler.handle(body.toString());
          });
        });

        req.putHeader(HttpHeaders.Names.AUTHORIZATION, "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes()));
        req.end(config.getJsonObject("metrics").getJsonObject(metricName).getString("request"));

      }
    } catch (Exception e) {
      logger.warn(e.getMessage());

    }
  }

}
