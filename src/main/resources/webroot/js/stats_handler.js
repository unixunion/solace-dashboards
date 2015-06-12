

    /*
    
    This is the total message counter, it just sets target_rate which is monitored
    by a flipclock instance
    
    */

    var stats_handler = function (msg) {

        var logging = chance_of_logging();

        if (logging) {
            console.log("generic_stats: ");
            console.log(msg);
        }


        var data = data_shifter(msg.data, msg.config['data_path'], logging );

        target_rate = data['total-client-messages-received'] + data['total-client-messages-sent'];

    }