#!/usr/bin/env bash
JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory"
JAVA_HOME="/opt/jdk1.8.0_45"
$JAVA_HOME/bin/java $JAVA_OPTS -jar solace-dashboards-1.2.2-fat.jar -conf conf.json
