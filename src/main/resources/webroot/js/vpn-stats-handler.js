


    // a place to store VPN objects
    var vpn_data;
    // set the initial data object name to the "default" vpn.
    var vpn_data_active_topic = "default";


    var plot_data = function(chartObject, metric, tmp_results, tmpDate) {
        // console.log("chartObject");
        // console.log(chartObject);

        if (chartObject.counter) {
           
            // console.log("counter!");
            var chart = chartObject.chart.options.data[metric].dataPoints;
            
            try {
                var last_val = chartObject.chart.options.data[metric].dataPoints[chartObject.chart.options.data[metric].dataPoints.length-1].last_val;
            } catch(err) {
                console.log("no history, setting to current value for delta");
                
                if (hide_counter_first_sample) {
                    var last_val = tmp_results;
                } else {
                    // If you want to see the initial SPIKE
                    var last_val = 0;
                }
                
            }
        } else {
            var last_val = 0;
        }

        // push custom
        var dp = {
            "x": tmpDate,
            "y": tmp_results - last_val,
            "last_val": tmp_results
        }
        chartObject.chart.options.data[metric].dataPoints.push(dp);
    }



    /*

    VPN STATS HANDLER
    
    This Stats Handler processes a Message which contains "topic", "data", "confif", the data MUST be a  JsonObject ( NOT Array )
    the data_path of the object MUST be the where the plotable key:values are, though some values can be in sub leafs which the 
    config can hint at with more data_paths.

    example message:

    {  
       "topic":"metricName / VPN name",
       "data":{  
          // entire RPC response from Solace in JSON format
       },
       "config":{
          // the data_path tells the stats handler where to find the keys and values
          "data_path":"rpc-reply.rpc.show.message-vpn.vpn.stats",
          "view":"generic_vpn_stats",
          "view_format": {
             // view document describes what to plot and when to descend into sub-keys
          }
       }
    }
    

    */

    var vpn_stats_handler = function(msg) {
        
        // on chance of logging, set to true
        var logging = chance_of_logging();
        var tmpDate = new Date();
        
        if (logging) {
            console.log("vpn_data topic: " + msg.topic);
            console.log(msg);
        }

        // get the shifted data
        var data = data_shifter(msg.data, msg.config['data_path'], logging );

        // read the config out of the message
        var view_format = msg.config['view_format'];
        
        if (logging) {
            console.log("vpn_stats_handler config:");
            console.log(msg.view_format);
        }
        
        // if this msg.topic has no charts, create a array for it
        try {
             if (vpn_data[msg.topic].charts == undefined) {
                vpn_data[msg.topic].charts = [];
            }
        } catch (err) {
            app_error(msg.topic + " Config Error: " + err);
        }

        
        // iterate over objects in the view_format
        for (var emit_config in view_format) {
            
            var metric_list = view_format[emit_config].show;
            
            if (vpn_data[msg.topic].charts[emit_config] == undefined) {

                // always log creations
                console.log("create chart config: " + emit_config);
                console.log(view_format[emit_config]);
                

                var div_name = (view_format[emit_config].div === undefined) ? "bigcharts" : view_format[emit_config].div;
                var chart_type = (view_format[emit_config].chart_type == undefined) ? "stackedColumn" : view_format[emit_config].chart_type;
                var chart_length = (view_format[emit_config].chart_length == undefined) ? 10 : view_format[emit_config].chart_length;
                var counter = (view_format[emit_config].counter == undefined) ? false : view_format[emit_config].counter;
                var metric_list = view_format[emit_config].show;
                var parent_is_array = (view_format[emit_config].parent_is_array == undefined) ? false : view_format[emit_config].parent_is_array;
                                
                vpn_data[msg.topic].charts[emit_config] = new ZChart(emit_config, chart_length, div_name, chart_type);
                vpn_data[msg.topic].charts[emit_config].counter = counter;
                
                // if multiple values, create multiple datapoint objects
                vpn_data[msg.topic].charts[emit_config].chart.options.data = [];

                               

                for (var e in metric_list ) {
                    vpn_data[msg.topic].charts[emit_config].chart.options.data.push(
                        {
                            type: chart_type,
                            dataPoints: [],
                            name: view_format[emit_config].show[e],
                            showInLegend: true,
                        }
                    );
                }
            }

            var data_path = view_format[emit_config].data_path;

            for (var e in metric_list ){

                if (logging) {
                    console.log("metric_list: " + metric_list);
                }
                
                var tmp_results = 0;
                
                // ADD_TOGETHER if you really want it... gonna remove this I think.
                if ( view_format[emit_config].modifier != undefined ) {
                    if ( view_format[emit_config].modifier == "add_together" ) {
                        try {
                            tmp_results = tmp_results + data[metric_list[e]];
                        } catch (err) {
                            app_error("Key Error: " + metric_list[e]);
                            console.log("---Key Error---");
                            console.log("error in metric for: " + msg.topic);
                            console.log("key was " + metric_list[e] + " and its not present in");
                            console.log(data);
                            console.log("entire message");
                            console.log(msg);
                            console.log("---END Key Error---");
                        }
                    }
                    
                // DEFAULT
                } else {

                    var data_before_decend = data;

                    if (data_path == undefined) {
                        try {
                            tmp_results = data[metric_list[e]];
                        } catch (err) {
                            console.log("---START---");
                            console.log("error in metric: " + msg.topic);
                            console.log("key was " + metric_list[e] + " and its not present in");
                            console.log(data);
                            console.log("---END---");
                        }

                    } else {
                        try {
                            data = data_shifter(data, data_path, logging);
                        } catch (err) {
                            app_error("Data Path Error: " + msg.topic + "/" + metric_list[e]);
                            console.log("error in data_path: " + msg.topic);
                            console.log(msg);
                        }

                        try {
                            tmp_results = data[metric_list[e]];
                        } catch (err) {
                            app_error("Error getting key " + metric_list[e]);
                            console.log("---START---");
                            console.log("error in metric: " + msg.topic);
                            console.log("key was " + metric_list[e] + " and its not present in");
                            console.log(data);
                            console.log("---END---");
                        }
                        
                    }
                }
                
            

                plot_data(vpn_data[msg.topic].charts[emit_config], e, tmp_results, tmpDate);

                
                data = data_before_decend;
            }
            
        }

      
        
    }


    // set the view
    var set_view_vpn = function(msg) {

        if (vpn_data_active_topic != msg) {
            app_status("Changing View to " + msg);

            eb.unregisterHandler("queues", queues_handler);
            eb.unregisterHandler("vpns", vpns_handler);
            
            // clear all charts out
            for (cd in chart_divs) {
                try {
                    var list = document.getElementById(chart_divs[cd]);
                    while (list.hasChildNodes()) {   
                        list.removeChild(list.firstChild);
                    }
                } catch (err) {
                    console.log("unable to purge children of: " + chart_divs[cd]);
                }
            }

            try {
                vpn_data[vpn_data_active_topic].charts = {}
            } catch (err) {
                console.log("no object " + vpn_data_active_topic + " in vpn_data");
            }
            chartCount = 0;
            
            // unregister and register the new topic
            console.log("registering handler vpn_stats_handler for: " + msg);
            eb.unregisterHandler(vpn_data_active_topic, vpn_stats_handler);
            eb.registerHandler(msg, vpn_stats_handler);
            vpn_data_active_topic = msg;

            // set the VPN name in the NavBar
            document.getElementById("app_title").innerHTML = msg;
            
            // shrink the counter
            try {
                document.getElementById("flipclock").style.zoom = 0.5;
                document.getElementById("flipclock").style.MozTransition = "transform: scale(0.5)";
            } catch (err) {
                console.log("unable to resize flipclock");
            }
            
            app_status("Please Standby");
            
        } else {
            app_status("you're already there, resubscribing");
            eb.unregisterHandler(vpn_data_active_topic, vpn_stats_handler);
            eb.registerHandler(msg, vpn_stats_handler);
        }

        
    }