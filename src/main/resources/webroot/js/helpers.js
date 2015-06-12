
    var chance_of_logging = function() {
        if (Math.floor((Math.random() * 100) + 1) < logging_chance) {
            return true;
        } else {
            return false;
        }
    }


    var toggle_alarms = function() {
        show_alarms = ! show_alarms;
        var d_c = "mdi-action-alarm-" + ((show_alarms === false) ? "off" : "on");
        var nav_alarms = document.getElementById("nav_alarms");
        nav_alarms.setAttribute("class",  d_c);
    }


    var toggle_legend = function() {
        show_legend = ! show_legend;
        toggle_chart_property("showInLegend", show_legend);
    }



    var toggle_chart_type = function(msg) {
        toggle_chart_property("type" ,msg);
    }



    // iterate through all data object's charts and turn off legend.
    var toggle_chart_property = function(option, msg) {

        console.log("set chart " +option + " to " + msg);

    	// view_data object
        try {
            for ( vpn in view_data) {
                for (emitter in view_data[vpn].charts ) {
                    for (data in view_data[vpn].charts[emitter].chart.options.data) {
                        try {
                            view_data[vpn].charts[emitter].chart.options.data[data][option] = msg;
                        } catch (err) {
                            console.log("error changing option in " + vpn + " emitter " + emitter  + " data " + data); 
                        }
                    }
                }
            }

        } catch (err) {
            console.log("error trying to iterate through view_data object");

        }

        // charts object has slightly different structure
		try {
            for ( chart in charts) { 
            	for (data in charts[chart].chart.options.data) {
		            try {
		                charts[chart].chart.options.data[data][option] = msg;
		            } catch (err) {
		                console.log("error changing option in " + chart); 
		            }
	        	}
            }

        } catch (err) {
            console.log("error trying to iterate through chart object");

        }
    }

    /*

    shift data object into each element of data_path.

    data_object: json object
    data_path: string e.g. foo.bar.baz
    logging: boolean

    e.g. var data = data_shifter(msg.data, msg.config['data_path'], logging );

    */
    var data_shifter = function(data_object, data_path, logging) {

        // force silence!
        // logging=false;

        if (logging) {
            console.log("data_shifter: before shift ");
            console.log(data_object);
        }

        // get the pathing hint from msg.config
        try {
            var path_hint = data_path.split(".");
            if (logging) { console.log("data_shifter: path_hint: " + path_hint) }

            for (var word in path_hint) {
                data_object = data_object[path_hint[word]]
            }

            if (logging) {
                console.log("data_shifter: shifted data");
                console.log(data_object);
            }
            return data_object;

        } catch (err) {
            app_error("Data Shift Error, is data_path defined?");
            console.log("data_shifter: error, object:");
            console.log(data_object);
            console.log("data_shifter: path:");
            console.log(data_path);
            return data_object;

        }
    }


    var plot_data = function(chartObject, metric, tmp_results, tmpDate) {

        if (chartObject.counter) {
           
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



    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function checkCookie() {
        var user = getCookie("username");
        if (user != "") {
            alert("Welcome again " + user);
        } else {
            user = prompt("Please enter your name:", "");
            if (user != "" && user != null) {
                setCookie("username", user, 365);
            }
        }
    }


    function agreeTerns() {
        setCookie("agreeterms", true, 365);
        $('#termsandconditions').closeModal();
    }