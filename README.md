# Solace Monitor

realtime metrics for Solace

## features

* config defined metrics
* websocket html client
* eventbus requests for metrics
* broadcasting of metrics
* highly discernible colour schema

## configuring

Everything lives within conf.json, basically a metric is something you want to read from solace and put onto the eventbus.
The HTML client subscribes to the eventbus for topics like "vpns", "stats", and VPN_NAME 

A metric configuration contains:

|Name    |Description|
|--------|-----------|
|request |XML request to POST to solace|
|interval|the interval in ms to request the metric from solace and publish it|

Some metrics can have additional configs e.g.:

|Name|Description|
|----|-----------|
|data_path|UNUSED at the moment but is inteneded for aiding the client to extract the neccesary data.|
|view|the name of the view|



### metrics

Core metrics are 'stats' and 'vpns', these MUST always be present since they control aspects of the UI. 

```

"metrics": {
  "stats": {
    "request": "<rpc semp-version=\"soltr/6_0\"><show><stats><client></client></stats></show></rpc>",
    "interval": 2000
  },
  "vpns": {
    "request": "<rpc semp-version=\"soltr/6_0\"><show><message-vpn><vpn-name>*</vpn-name><stats></stats></message-vpn></show></rpc>",
    "interval": 5000
  },
  ...
  ...
}

```

### VPN stats

VPN stats are defined in exactly the same way metrics are, but contain some additional view configuration.

```

  "some_vpn_name": {
    "request": "<rpc semp-version=\"soltr/6_0\"><show><message-vpn><vpn-name>some_vpn_name</vpn-name><stats></stats></message-vpn></show></rpc>",
    "interval": 5000,
    "config": {
      "data_path": "rpc-reply.rpc.show.message-vpn.vpn.stats",
      "view": "generic_vpn_stats"
    }
  }
  

```

### views

Views control how information is extracted and displayed on the MaterializeCss grid system in the UI's index.html

e.g.

```

  "generic_vpn_stats": {
    // name of a graph
    "rate-per-second": {
      "show": [
        // keys within the RPC response from Solace
        "current-egress-rate-per-second",
        "current-ingress-rate-per-second"
      ],
      // chartType as per canvasjs
      "chart_type": "stackedColumn",
      // the posistion of the chart in the 4 column setup
      "div": "smallcharts-1"
    },
    "denied-by-acl": {
      "show": [
        "denied-client-connect-acl"
      ],
      "counter": true,
      "div": "smallcharts-2"
    },
    "ingress-discards": {
      "show": [
        "msg-spool-discards",
        "msg-too-big",
        "no-subscription-match",
        "parse-error",
        "publish-topic-acl",
        "topic-parse-error",
        "ttl-exceeded"
      ],
      "hide": [
        "total-ingress-discards"
      ],
      "counter": true,
      "data_path": "ingress-discards",
      "div": "smallcharts-3"
    },
    "egress-discards": {
      "show": [
        "compression-congestion",
        "message-elided",
        "message-promotion-congestion",
        "msg-spool-egress-discards",
        "transmit-congestion"
      ],
      "counter": true,
      "data_path": "egress-discards",
      "div": "smallcharts-4"
    },
    "denies": {
      "show": [
        "denied-authorization-failed",
        "denied-client-connect-acl",
        "denied-duplicate-clients",
        "denied-subscribe-permission",
        "denied-subscribe-topic-acl",
        "denied-unsubscribe-permission",
        "denied-unsubscribe-topic-acl"
      ],
      "counter": true,
      "div": "smallcharts-1"
    },
    "errors": {
      "show": [
        "max-exceeded-msgs-sent",
        "not-enough-space-msgs-sent",
        "not-found-msgs-sent",
        "parse-error-on-add-msgs-sent",
        "parse-error-on-remote-msgs-sent",
        "subscribe-client-not-found",
        "unsubscribe-client-not-found",
        "already-exists-msgs-sent"
      ],
      "counter": true,
      "div": "smallcharts-2"
    }
  }
  
```



## client side

entire responses from solace are transformed into JSON and sent to the client. Up to the client
to dig through the data for points of interest.

see the index.html for layout of MaterializeCSS divs.

## requesting metrics

send a message on the eventbus to `metrics` topic e.g:

```
eb.send("metrics", "memory", req -> {
  ...
});
```

## periodic metrics

metrics defined in conf.json are polled by the server and broadcast to their respective topics.

## TODO

* per-vpn graphs
* cool stuff
* metric response emitter pathing defined in config
* switch frontend to something better
* boot class "hot" redeploy of modules

## building

the gradle task *shadowJar* will build a executable jar

```
./gradlew shadowJar
```

## running

when running as a fatJar, remember to specify the alternate logging implementation.


```
JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.impl.SLF4JLogDelegateFactory"
java $JAVA_OPTS -jar solace-monitor-1.0.8-fat.jar -conf conf.json
```

