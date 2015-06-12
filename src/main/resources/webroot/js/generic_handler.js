






    /*

    View Handler
    
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


    depends on variables defined:

    var view_data;
    var active_view = "default";
    

    */

    var generic_handler = function(msg) {
        
        // on chance of logging, set to true
        var logging = chance_of_logging();
        var tmpDate = new Date();
        
        if (logging) {
            console.log("view_data topic: " + msg.topic);
            console.log(msg);
        }

        // get the shifted data
        var data = data_shifter(msg.data, msg.config['data_path'], logging );

        // read the config out of the message
        var view_format = msg.config['view_format'];
        
        if (logging) {
            console.log("view_handler config:");
            console.log(msg.view_format);
        }
        
        // if this msg.topic has no charts, create a array for it
        try {
             if (view_data[msg.topic].charts == undefined) {
                view_data[msg.topic].charts = [];
            }
        } catch (err) {
            app_error(msg.topic + " Config Error: " + err);
        }

        
        // iterate over objects in the view_format
        for (var chart_config in view_format) {
            
            var metric_list = view_format[chart_config].show;
            
            if (view_data[msg.topic].charts[chart_config] == undefined) {

                // always log creations
                console.log("create chart config: " + chart_config);
                console.log(view_format[chart_config]);
                

                var div_name = (view_format[chart_config].div === undefined) ? "bigcharts" : view_format[chart_config].div;
                var chart_type = (view_format[chart_config].chart_type == undefined) ? "stackedColumn" : view_format[chart_config].chart_type;
                var chart_length = (view_format[chart_config].chart_length == undefined) ? 10 : view_format[chart_config].chart_length;
                var counter = (view_format[chart_config].counter == undefined) ? false : view_format[chart_config].counter;
                var metric_list = view_format[chart_config].show;
                var parent_is_array = (view_format[chart_config].parent_is_array == undefined) ? false : view_format[chart_config].parent_is_array;
                                
                view_data[msg.topic].charts[chart_config] = new ZChart(chart_config, chart_length, div_name, chart_type);
                view_data[msg.topic].charts[chart_config].counter = counter;
                
                // if multiple values, create multiple datapoint objects
                view_data[msg.topic].charts[chart_config].chart.options.data = [];

                               

                for (var e in metric_list ) {
                    view_data[msg.topic].charts[chart_config].chart.options.data.push(
                        {
                            type: chart_type,
                            dataPoints: [],
                            name: view_format[chart_config].show[e],
                            showInLegend: true,
                        }
                    );
                }

                // hide this if its not needed
                if (active_view != msg.topic) {
                    hide_view(view_data[msg.topic])
                }


            }

            var data_path = view_format[chart_config].data_path;

            for (var e in metric_list ){

                if (logging) {
                    console.log("metric_list: " + metric_list);
                }
                
                var tmp_results = 0;
                
                // ADD_TOGETHER if you really want it... gonna remove this I think.
                if ( view_format[chart_config].modifier != undefined ) {
                    if ( view_format[chart_config].modifier == "add_together" ) {
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

                plot_data(view_data[msg.topic].charts[chart_config], e, tmp_results, tmpDate);
                
                data = data_before_decend;
            }
            
        }
        
    }



