JAVA_OPTS="-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory"
java $JAVA_OPTS -jar build/libs/solace-dashboards-1.1.1-fat.jar $@
