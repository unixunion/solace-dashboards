JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.impl.SLF4JLogDelegateFactory"
java $JAVA_OPTS -jar build/libs/solace-monitor-1.0.8-fat.jar -conf conf.json
