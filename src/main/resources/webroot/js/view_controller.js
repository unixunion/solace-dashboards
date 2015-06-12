    var hide_view = function(view) {
        // hide view
        for (chart in view.charts) {
            console.log("hiding view chart: " + chart);
            try {
                var d = document.getElementById(view.charts[chart].divName);
                d.setAttribute("class", "hide");
            } catch (err) {
                console.log("unable hide div in view: " + active_view);
            }
        }
    }


    var show_view = function(view) {
        // hide view
        for (chart in view.charts) {
            console.log("hiding view chart: " + chart);
            try {
                var d = document.getElementById(view.charts[chart].divName);
                d.removeAttribute("class");
            } catch (err) {
                console.log("unable hide div in view: " + active_view);
            }
        }
    }



    // set the view
    var set_view = function(msg) {

        if (active_view != msg) {
            app_status("Changing View to " + msg);

            if (msg == "default") {

                hide_view(view_data[active_view]);

                // show default
                for (chart in charts) {
                    console.log("showing view: " + chart);
                    try {
                        var d = document.getElementById(charts[chart].divName);
                        d.removeAttribute("class");
                    } catch (err) {
                        console.log("unable show div in view: " + msg);
                    }
                    
                }


            } else if (active_view == "default") {
                console.log("hide default");

                // hide default
                for (c in charts) {
                    console.log("hiding chart: " + c);
                    try {
                        var d = document.getElementById(charts[c].divName);
                        d.setAttribute("class", "hide");
                    } catch (err) {
                        console.log("unable hide div in view default");
                    }
                   
                }

                show_view(view_data[msg]);

            } else {
                console.log("show view " + msg + " hide view " + active_view);
                hide_view(view_data[active_view]);
                show_view(view_data[msg]);

            }
            

            active_view = msg;

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
            app_status("View is already set");
        }

        
    }