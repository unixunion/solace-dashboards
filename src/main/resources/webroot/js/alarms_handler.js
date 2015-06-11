var alarms_handler = function (msg) {
                
    var d = data_shifter(msg.data, msg.config['data_path'], chance_of_logging)

    var node = document.getElementById('alarmscollection');
    while (node.hasChildNodes()) {   
            node.removeChild(node.firstChild);
    }

    if ( d != undefined ) {

        var found_alarm = false;

        for (alarm in d) {

            var a = document.createElement('li');
            a.setAttribute('class', "collection-item avatar red accent-2");

            var icon = document.createElement('i')
            icon.setAttribute('class', 'mdi-alert-warning circle');
            a.appendChild(icon);

            var title = document.createElement('span');
            title.setAttribute('class', 'title');
            title.innerHTML = d[alarm]['message'];
            a.appendChild(title);

            for (k in d[alarm]) {
                if (k != "message") {
                    var desc = document.createElement('p');
                    desc.innerHTML = k + ":" + d[alarm][k];
                    a.appendChild(desc);
                    node.appendChild(a);
                    found_alarm = true;
                }
            }
                           
        }

        if (found_alarm && show_alarms) {
            $('#alarmmodal').openModal();
            setTimeout($('#alarmmodal').closeModal, 1000);
        } else {
            console.log("thought I did, but I didnt find a alarm");
        }

}
}