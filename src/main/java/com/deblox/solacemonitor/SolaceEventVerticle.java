// package com.deblox.solacemonitor;

// /*

// Copyright 2015 Kegan Holtzhausen

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// */

// import java.util.Hashtable;

// import javax.jms.Connection;
// import javax.jms.ConnectionFactory;
// import javax.jms.ConnectionMetaData;
// import javax.jms.JMSException;
// import javax.jms.Message;
// import javax.jms.MessageConsumer;
// import javax.jms.Queue;
// import javax.jms.Session;
// import javax.jms.Topic;
// import javax.naming.Context;
// import javax.naming.InitialContext;
// import javax.naming.NamingException;

// import com.solacesystems.jms.SupportedProperty;

// import io.vertx.core.AbstractVerticle;
// import io.vertx.core.Future;
// import io.vertx.core.json.JsonObject;
// import io.vertx.core.logging.Logger;
// import io.vertx.core.logging.LoggerFactory;

// /**
//  * Created by keghol on 09/06/15.
//  *
//  * System Events
//  * #LOG/<level>/SYSTEM/<routerName>/<eventName>
//  * #LOG/ * /SYSTEM/>
//  *
//  * Message VPN Events
//  * #LOG/<level>/VPN/<routerName>/<eventName>/<vpnName>
//  * #LOG/ * /VPN/>
//  *
//  * Client Events
//  * #LOG/<level>/CLIENT/<routerName>/<eventName>/<vpnName>/<ClientName>
//  * #LOG/ * /CLIENT/>
//  *
//  * ALL
//  *
//  * #LOG/>
//  *
//  */

// public class SolaceEventVerticle extends AbstractVerticle {

//   // verticle config
//   JsonObject config;

//   private static final Logger logger = LoggerFactory.getLogger(SolaceEventVerticle.class);

//   private static final String SOLJMS_INITIAL_CONTEXT_FACTORY =
//           "com.solacesystems.jndi.SolJNDIInitialContextFactory";

//   // The default JNDI name of the connection factory.
//   private String cfJNDIName = "cf/default";


//   public void start(Future<Void> startFuture) throws Exception {
//     config = config();
//     startFuture.complete();
//     run();
//   }


//   private void run() {

//     // The client needs to specify both of the following properties:
//     Hashtable<String, Object> env = new Hashtable<String, Object>();
//     env.put(InitialContext.INITIAL_CONTEXT_FACTORY, SOLJMS_INITIAL_CONTEXT_FACTORY);
//     env.put(InitialContext.PROVIDER_URL, config.getString("jndiProviderURL", "smf://solace1:55555"));
//     env.put(Context.SECURITY_PRINCIPAL, config.getString("username", "readonly"));
//     env.put(Context.SECURITY_CREDENTIALS, config.getString("password", "readonly"));
//     env.put(SupportedProperty.SOLACE_JMS_SSL_VALIDATE_CERTIFICATE, config.getBoolean("ssl_validate", false));  // enables the use of smfs://  without specifying a trust store
//     env.put(SupportedProperty.SOLACE_JMS_VPN, config.getString("vpn", null));
//     env.put(SupportedProperty.SOLACE_JMS_COMPRESSION_LEVEL, config.getInteger("compression_level", 1));
//     env.put(SupportedProperty.SOLACE_JMS_OPTIMIZE_DIRECT, config.getBoolean("optimize_direct", false));

//     // InitialContext is used to lookup the JMS administered objects.
//     InitialContext initialContext = null;

//     // JMS Connection
//     Connection connection = null;

//     try {
//       // Create InitialContext.
//       initialContext = new InitialContext(env);

//       // Lookup ConnectionFactory.
//       ConnectionFactory cf = (ConnectionFactory)initialContext.lookup(cfJNDIName);

//       // Create a JMS Connection instance using the specified username/password.
//       connection = cf.createConnection();

//       // Runtime.getRuntime().addShutdownHook(new VMExitHandler(connection, initialContext));

//       // Print version information.
//       ConnectionMetaData metadata = connection.getMetaData();
//       logger.info(metadata.getJMSProviderName() + " " + metadata.getProviderVersion());

//       // Create a non-transacted, Auto Ack session.
//       Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

//       // Lookup Topic.
//       Topic topic = null;
//       if (config.getString("topicJNDIName", null) != null) {
//         topic = (Topic)initialContext.lookup(config.getString("topicJNDIName"));
//       }

//       // Create a Topic.
//       if (config.getString("topicName", null) != null) {
//         topic = session.createTopic(config.getString("topicName"));
//       }

//       // Create a Temporary Topic.
//       if (config.getBoolean("tempTopic", false)) {
//         topic = session.createTemporaryTopic();
//       }

//       // Lookup Queue, if Specified.
//       Queue queue = null;
//       if (config.getString("queueJNDIName", null) != null) {
//         queue = (Queue)initialContext.lookup(config.getString("queueJNDIName"));
//       }

//       // Create a Queue.
//       if (config.getString("queueName", null) != null) {
//         queue = session.createQueue(config.getString("queueName"));
//       }

//       // Create a Temporary Queue.
//       if (config.getBoolean("tempQueue", false)) {
//         queue = session.createTemporaryQueue();
//       }

//       // From the session, create a consumer for the destination.
//       MessageConsumer consumer = null;
//       if (topic != null) {
//         if (config.getString("durableSubscriptionName", null) == null) {
//           consumer = session.createConsumer(topic);
//         } else {
//           consumer = session.createDurableSubscriber(topic, config.getString("durableSubscriptionName"));
//         }
//       }
//       else {
//         consumer = session.createConsumer(queue);
//       }

//       // Do not forget to start the JMS Connection.
//       connection.start();

//       // Output a message on the console.
//       logger.info("Waiting for a message ... (press Ctrl+C) to terminate ");

//       // Wait for messages.
//       while (true) {
//         Message testMessage = consumer.receive();
//         if (testMessage == null) {
//           logger.info("Exiting.....");
//           System.exit(1);
//         } else {
//           logger.info("Received a JMS Message of type: " + testMessage.getClass().getName());
//         }
//       }
//     } catch (NamingException e) {
//       // Most likely we are not able to lookup an administered object (Topic, Queue or ConnectionFactory).
//       e.printStackTrace();
//     } catch (JMSException e) {
//       e.printStackTrace();
//     }
//   }


// }
