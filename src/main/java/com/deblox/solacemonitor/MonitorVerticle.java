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


/**
 * Monitor some rest endpoints and put the results onto the EventBus for the clients
 */
public class MonitorVerticle extends AbstractVerticle {

  private static final Logger logger = LoggerFactory.getLogger(MonitorVerticle.class);
  EventBus eb;
  String uuid;
  HttpClient client;
  JsonObject config;
  String host;
  int port;
  String uri;
  String username;
  String password;
  String credentials;
  String method;
  Map<UUID, String> clients;

  /**
   * Start the verticle
   *
   * @param startFuture
   * @throws Exception
   */
  public void start(Future<Void> startFuture) throws Exception {

    logger.info("starup with config: " + config().toString());

    // read startup config
    config = config();

    // vars
    host = config.getString("host", null);
    port = config.getInteger("port", 80);
    uri = config.getString("uri", "/");
    username = config.getString("username", "DEFAULT_USERNAME");
    password = config.getString("password", "DEFAULT_PASSWORD");
    credentials = String.format("%s:%s", username, password);
    method = config.getString("method", "GET");

    // map for connected clients
    clients = new HashMap<UUID, String>();

    // generate a uuid
    uuid = UUID.randomUUID().toString();

    // connect to the eventbus
    eb = vertx.eventBus();

    // create a instance of http client
    client = vertx.createHttpClient();

    // eventbus ping listner
    eb.consumer("ping-address", message -> {
      logger.info(uuid + ": replying");
      message.reply("pong!");
    });


    // handler for requests for metrics
    eb.consumer("request-metrics", message -> {
      logger.info(uuid + ": requesting metrics");

      getRest(message.body().toString(), event -> {
        logger.debug("response: " + event.toString());
        message.reply(Util.xml2json(event.toString()));
      });

    });


    // returns a array of names for all metrics defined in config
    // used for setting up the client
    eb.consumer("request-config", message -> {

      String req = message.body().toString();

      logger.debug("config request for: " + req );

      JsonObject response = new JsonObject();

      // all = return a list of metrics
      if (req.equals("all")) {

        JsonArray results = new JsonArray(config.getJsonObject("metrics").stream()
                .filter(r -> ((JsonObject) r.getValue()).getBoolean("show_in_menu", true))
                .map(r -> r.getKey())
                .sorted()
                .collect(Collectors.toList()));
        response.put("metrics", results);


      } else {
        // get a specific metric's config
        response = config.getJsonObject("metrics").getJsonObject(req);
        response.put("topic", req);
        logger.debug(response.toString());

      }

      message.reply(response);

    });


    // register new clients
    eb.consumer("newclient", message -> {
      logger.info("new client: " + message.body().toString());
      JsonObject client = new JsonObject(message.body().toString());
      clients.remove(client.getString("uuid"));
      clients.put(UUID.fromString(client.getString("uuid")), client.getString("version"));
    });


    // client ping maintains the clients map
    eb.consumer("client-ping", message -> {
      JsonObject client = new JsonObject(message.body().toString());
      clients.remove(client.getString("uuid"));
      clients.put(UUID.fromString(client.getString("uuid")), client.getString("version"));
    });


    // create metric emitters
    Iterator iter = config.getJsonObject("metrics", new JsonObject()).iterator();
    while (iter.hasNext()) {

      Map.Entry<String, JsonObject> metricConfig = (Map.Entry) iter.next();

      logger.debug("registering metric: " + metricConfig.getKey());

      int interval = metricConfig.getValue().getInteger("interval", 5000);

      if (interval != 0) {
        vertx.setPeriodic(interval, tid -> {

          logger.debug("metric interval handler for " + metricConfig.getKey() + " every " + interval);

          getRest(metricConfig.getKey(), event -> {
            logger.debug("metric: " + event.toString());

            JsonObject metricMessage = new JsonObject();
            metricMessage.put("topic", metricConfig.getKey());
            metricMessage.put("data", Util.xml2json(event.toString()));

            // get the config for the metric
            JsonObject msgConfig = config.getJsonObject("metrics")
                    .getJsonObject(metricConfig.getKey())
                    .getJsonObject("config", new JsonObject());

            // get the view_format by name
            msgConfig.put("view_format", config.getJsonObject("views", new JsonObject())
                    .getJsonObject(msgConfig.getString("view", "default")));

            // put the config into the message
            metricMessage.put("config", msgConfig);

            // publish the metric
            eb.publish(metricConfig.getKey(), metricMessage);

          });
        });

      } else {
        logger.warn("metric " + metricConfig.getKey() + " is disabled ");

      }
    }


    // after 10 seconds, announce the server version to all clients
    vertx.setTimer(10000, tid -> {
      broadcast("broadcast", "Server Startup " + config.getString("version", "unknown"));
    });


    // periodically nuke all the client sessions
    vertx.setPeriodic(config().getInteger("client_session_refresh", 300000), res -> {
      clients = new HashMap<UUID, String>();
    });


    // periodically log number of clients in the map
    vertx.setPeriodic(config().getInteger("client_session_show", 180000), res -> {
      logger.info(clients.size() + " connected clients");
    });

    startFuture.complete();

  }



  /**
   * Broadcasts a message to all clients
   *
   * @param action the action name
   * @param msg the body / message
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


  /**
   * Perform the actual rest call
   *
   * @param metricName the named metric as in conf.json
   * @param handler the handler to call with the results
   */
  public void getRest(String metricName, Handler handler) {

    try {

      if (host == null) {
        logger.warn("no config");

      } else {

        logger.debug(uuid + " getting metric: " + metricName + " from: " + host);

        HttpClientRequest req;

        // GET
        if (method.equals("GET")) {
          req = client.post(port, host, uri, resp -> {
            resp.bodyHandler(body -> {
              logger.debug("Response: " + body.toString());
              handler.handle(body.toString());
            });

          });

        // POST
        } else if (method.equals("POST")) {
          req = client.post(port, host, uri, resp -> {
            resp.bodyHandler(body -> {
              logger.debug("Response: " + body.toString());
              handler.handle(body.toString());
            });

          });

        // PUT
        } else if (method.equals("PUT")) {
          req = client.put(port, host, uri, resp -> {
            resp.bodyHandler(body -> {
              logger.debug("Response: " + body.toString());
              handler.handle(body.toString());
            });

          });

        // FTS
        } else {
          throw new Exception("method " + method + " is not supported");
        }

        if (config.getBoolean("basic_auth", true)) {
          req.putHeader(HttpHeaders.Names.AUTHORIZATION, "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes()));
        }

        req.end(config.getJsonObject("metrics").getJsonObject(metricName).getString("request"));

      }
    } catch (Exception e) {
      logger.warn(e.getMessage());

    }
  }

}
