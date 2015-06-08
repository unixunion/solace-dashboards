
	var force_legend = true;

    var toggle_legend = function() {

    	force_legend = !force_legend;

    	// vpn_data object
        try {
            for ( vpn in vpn_data) {
                for (emitter in vpn_data[vpn].charts ) {
                    for (data in vpn_data[vpn].charts[emitter].chart.options.data) {
                        try {
                            vpn_data[vpn].charts[emitter].chart.options.data[data].showInLegend = force_legend;
                        } catch (err) {
                            console.log("error changing legend in " + vpn + " emitter " + emitter  + " data " + data); 
                        }
                    }
                }
            }
        } catch (err) {
            console.log("error trying to iterate through vpn_data object");
        }

        // charts object has slightly different structure
		try {
            for ( chart in charts) { 
            	for (data in charts[chart].chart.options.data) {
		            try {
		                charts[chart].chart.options.data[data].showInLegend = force_legend;
		            } catch (err) {
		                console.log("error changing legend in " + chart); 
		            }
	        	}
            }
        } catch (err) {
            console.log("error trying to iterate through vpn_data object");
        }
    }

    /*
    shift data object into each element of datapath.

    data_object: json object
    data_path: string e.g. foo.bar.baz
    logging: boolean

    */
    var data_shifter = function(data_object, data_path, logging) {
        // get the pathing hint from msg.config
        try {
            var path_hint = data_path.split(".");
            if (logging) { console.log("data_shifter: path_hint: " + path_hint) }
            for (var word in path_hint) {
                data_object = data_object[path_hint[word]]
            }
            if (logging) {
                console.log("data_shifter shifted data");
                console.log(data_object);
            }
            return data_object;
        } catch (err) {
            app_error("Data Shift Error, is data_path defined?");
            console.log("----DATA SHIFT ERROR-----")
            console.log(data_object);
            console.log(data_path);
            console.log("-----END DATA SHIFT ERROR -----")
            return data_object;
        }
    }