package com.deblox;

import com.google.gson.Gson;

import com.deblox.xml.JSONObject;
import com.deblox.xml.XML;

import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.impl.LoggerFactory;

import java.io.*;
import java.lang.reflect.Type;

public class Util {

  private static final Logger logger = LoggerFactory.getLogger(Util.class);

  /*
  Config loader
   */
  static public JsonObject loadConfig(String file) throws IOException {
    logger.info("loading file: " + file);
    try (InputStream stream = new FileInputStream(file)) {
      StringBuilder sb = new StringBuilder();
      BufferedReader reader = new BufferedReader(new InputStreamReader(stream, "UTF-8"));

      String line = reader.readLine();
      while (line != null) {
        sb.append(line).append('\n');
        line = reader.readLine();
        logger.debug(line);
      }

      return new JsonObject(sb.toString());

    } catch (IOException e) {
      logger.error("Unable to load config file: " + file);
      e.printStackTrace();
      throw new IOException("Unable to open file: " + file );
    }
  }

  /*
  classpath resource hunting config loader
   */
  static public JsonObject loadConfig(Object o, String file) {

    try (InputStream stream = o.getClass().getResourceAsStream(file)) {
      StringBuilder sb = new StringBuilder();
      BufferedReader reader = new BufferedReader(new InputStreamReader(stream, "UTF-8"));

      String line = reader.readLine();
      while (line != null) {
        sb.append(line).append('\n');
        line = reader.readLine();
      }

      return new JsonObject(sb.toString());

    } catch (IOException e) {
      System.err.println("Unable to load config, returning with nothing");
      e.printStackTrace();
      return new JsonObject();
    }

  }

  /*
  convert XML to Json
   */
  static public JsonObject xml2json(String xml) {
    JsonObject response = new JsonObject();
    try {
      JSONObject j = XML.toJSONObject(xml);
      response = new JsonObject(j.toString(4));
    } catch (Exception e) {
      logger.warn("error converting XML to JSON");
      logger.warn(e.getMessage());
    }
    return response;
  }


  /**
   * encode an object to json
   * @param val
   * @return
   */
  static public String encode(Object val) {
    Gson gson = new Gson();
    return gson.toJson(val);
  }

  /**
   * decode a string back into a class type of instance ?
   *
   * example:
   * MyClass something = (MyClass)Utils.decode(someJsonString, MyClass.class);
   *
   * @param val
   * @param typeOfT
   * @return
   */
  static public Object decode(String val, Class<?> typeOfT) {
    Gson gson = new Gson();
    return gson.fromJson(val, typeOfT);
  }

  /**
   * decode a string into a type
   * @param val
   * @param typeOfT
   * @return
   */
  static public Object decode(String val, Type typeOfT) {
    Gson gson = new Gson();
    return gson.fromJson(val, typeOfT);
  }

  /**
   * decode a message to json object
   * @param val
   * @return
   */
  static public JsonObject decode(Message val) {
    JsonObject jo = new JsonObject(val.body().toString());
    return jo;
  }


}