# solace monitor

realtime metrics for Solace

## features

* configurable metrics gatherer
* websocket based html client
* eventbus server serving metric requests
* highly discernible colour schema

## implemented

* individual vpn dashboards
* overview stats

## roadmap

* universal javascript metrics handler ( currently 3 individual handler )
* universal data path hinting ( Array support, ... )

## configuring

everything lives within conf.json, basically a metric is something you want to read from solace and put onto the eventbus.
the HTML client subscribes to the eventbus for topics like "vpns", "stats", "queues" and "Some VPN Name" 

a metric configuration contains:

|Name    |Description|
|--------|-----------|
|request |XML request to POST to solace appliance|
|interval|the interval in ms to request the metric from solace appliance and publish it onto vertx eventbus|

some metrics can have additional configs e.g.:

|Name|Description|
|----|-----------|
|data_path|path hinting to aid the client javascript to extract the neccesary data points.|
|view|the name of the view|



### metrics

core metrics are 'stats', 'queues' and 'vpns', these MUST always be present since they control aspects of the Overview.

#### stats

stats are total rate information for the appliance.

#### vpns

vpns populates the rate-per-vpn graph on Overview page. You can limit this down to a few VPNS by replacing the * in the request with a suitable filter. e.g. prod_* to supress default vpn and test-vpns. 

#### queues

queues populates the spool usage per-queue graph on the Overview page.


```

      "metrics": {
        "stats": {
          "request": "<rpc semp-version=\"soltr/6_0\"><show><stats><client></client></stats></show></rpc>",
          "interval": 5000,
          "config": {
            "data_path": "rpc-reply.rpc.show.stats.client.global.stats"
          }
        },
        "vpns": {
          "request": "<rpc semp-version=\"soltr/6_0\"><show><message-vpn><vpn-name>*</vpn-name><stats></stats></message-vpn></show></rpc>",
          "interval": 5000,
          "config": {
            "data_path": "rpc-reply.rpc.show.message-vpn.vpn"
          }
        },
        "queues": {
          "request": "<rpc semp-version=\"soltr/6_0\"><show><queue><name>*</name><vpn-name>*</vpn-name></queue></show></rpc>",
          "interval": 5000,
          "config": {
            "data_path": "rpc-reply.rpc.show.queue.queues.queue",
            "view": "generic_queue_stats"
          }
        },
        ...
        ...
      }

```

#### vpn dahboards

for each vpn you want to create a dashboard for, you need to create a "metric" definition. e.g.

```

      "metrics" : {
        ...
        ...
        "Some Vpn": {
          "request": "<rpc semp-version=\"soltr/6_0\"><show><message-vpn><vpn-name>vpn_name_here</vpn-name><stats></stats></message-vpn></show></rpc>",
          "interval": 5000,
          "show_in_menu": true,
          "config": {
            "data_path": "rpc-reply.rpc.show.message-vpn.vpn.stats",
            "view": "generic_vpn_stats"
          }
        },
        "Some Other VPN": {
          "request": "<rpc semp-version=\"soltr/6_0\"><show><message-vpn><vpn-name>another_vpn_name</vpn-name><stats></stats></message-vpn></show></rpc>",
          "interval": 5000,
          "show_in_menu": true,
          "config": {
            "data_path": "rpc-reply.rpc.show.message-vpn.vpn.stats",
            "view": "generic_vpn_stats"
          }
        }
      }

```



### views

views control how information is extracted and displayed in the UI, currently only the per-named-vpn dashboards view works.

the view describes the graphs to the javascript client which runs in the browser. Each "show" array element refers to a item in the JSON metric blob which was sent to the client with this view config.

E.g.

```

      "views": {
        "default": {},
        "generic_vpn_stats": {
          "Message Rate": { // a human readable name
            "show": [
              "current-egress-rate-per-second", // items in to plot
              "current-ingress-rate-per-second"
            ],
            "chart_type": "stackedColumn", // canvasjs chartType
            "div": "smallcharts-1", // div to place the chart in
            "chart_length": 20 // the chart length in samples / columns
          },
          "Message Byte Rate": {
            "show": [
              "average-egress-byte-rate-per-minute",
              "average-ingress-byte-rate-per-minute"
            ],
            "chart_type": "stackedColumn",
            "div": "smallcharts-2",
            "chart_length": 20
          },
          "Ingress Discards": {
            "show": [
              "msg-spool-discards",
              "msg-too-big",
              "no-subscription-match",
              "parse-error",
              "publish-topic-acl",
              "topic-parse-error",
              "ttl-exceeded"
            ],
            "counter": true,
            "data_path": "ingress-discards", // the keys above are in this sub-field
            "div": "smallcharts-3",
            "chart_length": 10
          },
          "Egress Discards": {
            "show": [
              "compression-congestion",
              "message-elided",
              "message-promotion-congestion",
              "msg-spool-egress-discards",
              "transmit-congestion"
            ],
            "counter": true,
            "data_path": "egress-discards",
            "div": "smallcharts-3",
            "chart_length": 10
          },
          "Denies": {
            "show": [
              "denied-authorization-failed",
              "denied-client-connect-acl",
              "denied-duplicate-clients",
              "denied-subscribe-permission",
              "denied-subscribe-topic-acl",
              "denied-unsubscribe-permission",
              "denied-unsubscribe-topic-acl",
              "denied-client-connect-acl"
            ],
            "counter": true,
            "div": "smallcharts-1",
            "chart_length": 40
          },
          "Errors": {
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
            "div": "smallcharts-2",
            "chart_length": 40
          }
        }
      }
  
```



## client side

entire responses from solace are transformed into JSON and sent to the client. Its Up to the client to dig through the data for points of interest. The view configs are sent along with the JSON document to the client to aid the client in this aspect.

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
JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory"
JAVA_HOME="/opt/jdk1.8.0_45"
$JAVA_HOME/bin/java $JAVA_OPTS -jar solace-dashboards-1.2.1-fat.jar -conf conf.json
```

