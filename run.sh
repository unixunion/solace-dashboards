#!/usr/bin/env bash

platform='unknown'

unamestr=`uname`

JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory"

if [[ "$unamestr" == 'Linux' ]]; then
   platform='linux'
elif [[ "$unamestr" == 'Darwin' ]]; then
   platform='osx'
fi

if [[ $platform == 'linux' ]]; then
   JAVA_HOME="/opt/jdk1.8.0_45"
elif [[ $platform == 'osx' ]]; then
   JAVA_HOME=`/usr/libexec/java_home -v 1.8`
fi


$JAVA_HOME/bin/java $JAVA_OPTS -jar build/libs/solace-dashboards-1.2.2-fat.jar -conf conf.json
