    // vpns handler
    var vpns_handler = function (msg) {

        logging = chance_of_logging;

        var tmpDate = new Date();

        var data = data_shifter(msg.data, msg.config['data_path'], logging);

        if (logging) {
            console.log("vpns_handler: ");
            console.log(msg);
        }
        
        for (var i in data){
            if (charts[0].chart.options.data[i] == undefined) {
                console.log("vpns_handler: creating initial element for " + data[i].name);
                charts[0].chart.options.data.push(
                    {
                        type: chart_type,
                        click: function(e){Materialize.toast("Click Handler", 1000)},
                        dataPoints: [],
                        name: data[i].name,
                        showInLegend: true
                    }
                );

                charts[1].chart.options.data.push(
                    {
                        type: chart_type,
                        click: function(e){Materialize.toast("Fixme", 1000)},
                        dataPoints: [],
                        name: data[i].name,
                        showInLegend: true
                    }
                );


            } else {

                // "y": data[i].stats['current-egress-rate-per-second'] + data[i].stats['current-ingress-rate-per-second']
                var dp = {
                    "x": tmpDate,
                    "y": data[i].stats['average-egress-rate-per-minute'] + data[i].stats['average-ingress-rate-per-minute']
                }
                charts[0].chart.options.data[i].dataPoints.push(dp);
                
                var tmp_val = data[i].stats['egress-discards']['total-egress-discards'] + data[i].stats['ingress-discards']['total-ingress-discards'];

                try {
                    var last_val = charts[1].chart.options.data[i].dataPoints[charts[1].chart.options.data[i].dataPoints.length-1].last_val;
                } catch(err) {
                    // if no datapoints, set last_val to current val to kill of the HUGE spike in new graph creation
                    if ( hide_counter_first_sample ) {
                        var last_val = tmp_val;
                    } else {
                        var last_val = 0;
                    }
                    
                }

                var dp = {
                    "x": tmpDate,
                    "y": tmp_val - last_val,
                    "last_val": tmp_val
                }

                charts[1].chart.options.data[i].dataPoints.push(dp);

            }
        }

    }