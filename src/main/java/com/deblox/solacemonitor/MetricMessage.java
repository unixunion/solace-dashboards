package com.deblox.solacemonitor;

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
