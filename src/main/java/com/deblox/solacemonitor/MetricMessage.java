package com.deblox.solacemonitor;


import com.deblox.Util;

import io.vertx.core.json.JsonObject;

/**
 * Created by keghol on 03/06/15.
 */
public class MetricMessage {

  private String topic;
  private String metric;
  private JsonObject data;
  private JsonObject config;

  public MetricMessage() {
    // blank
  }

  public String getTopic() {
    return topic;
  }

  public MetricMessage setTopic(String topic) {
    this.topic = topic;
    return this;
  }

  public String getMetric() {
    return metric;
  }

  public MetricMessage setMetric(String metric) {
    this.metric = metric;
    return this;
  }

  public JsonObject getData() {
    return data;
  }

  public MetricMessage setData(JsonObject data) {
    this.data = data;
    return this;
  }

  public JsonObject getConfig() {
    return config;
  }

  public MetricMessage setConfig(JsonObject config) {
    this.config = config;
    return this;
  }

  @Override
  public String toString() {
    return Util.encode(this).toString();
  }

}
