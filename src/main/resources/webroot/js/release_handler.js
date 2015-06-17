/*

handles showing the cards, manages an materialize css style accordion

depends on:
	helpers.js

*/

// for the accordion
var active_item = 0;
var last_item = 0;

// store release data
var release_data = [];

// the filter to match and only show releases for
release_filter_string = "prod"
var release_filter = new RegExp(release_filter_string,"gi");
var expire_releases = 10800000; // 3 hours millis 

var set_release_filter = function(msg) {
	app_status("Changing release filter to " + msg);
	release_filter = new RegExp(msg,"gi");
}

// delets a object by its parent
function remove(id) {
    return (elem=document.getElementById(id)).parentNode.removeChild(elem);
}

// removes 'active' from all headers
var collapse_all = function() {
	var z = 0;

	try {
		while (z < document.getElementById("releases").children.length) {
			try {
				document.getElementById("releases").children[z].children[0].setAttribute('class', 'collapsible-header');
			} catch (err) {
				console.log("elent wont collapse");
				console.log(err);
			}
			z++;
		}
	} catch (err) {
		console.log("unable to nuke accordion");
	}


	// check dates in release_data and expire as needed
	for (release in release_data) {

		try {
			var d = release_data[release].date

			var then = new Date(d);
			var now = new Date();
			var timeDiff = Math.abs(now.getTime() - then.getTime());
			console.log("delta is: " + timeDiff);

			if (timeDiff > expire_releases) {
				console.log("expunging stale entry");
				remove(release_data[release].id+ '-main');
			}
		} catch (err) {
			console.log("unable to purge stale elements");
			console.log(err);
		}


	}
	
}



// moves the active card to display it round robin 
var accordion = function() {

	console.log("active_item: " + active_item);

	if (active_item >= document.getElementById("releases").children.length) {
		console.log("resetting active_item");
		active_item = 0;
	}

	var i = 0;
	while (i < document.getElementById("releases").children.length) {
		console.log("i: " + i);

		if (i >= active_item) {
			console.log("active item is " + active_item);

			collapse_all();
			
			document.getElementById("releases").children[i].children[0].setAttribute('class', 'collapsible-header active');
			last_item = active_item;
			active_item++;
			break;
		}

		i++;
	}

	$('.collapsible').collapsible({
		accordion : true
	});


}


// timer to show a card for 2 seconds
window.setInterval(accordion, 3000);


// create a new element in the list
var new_release_element = function(msg) {
	listitem = document.createElement('li')
	listitem.setAttribute('id', msg.id + '-main');

	header = document.createElement('div');
	
	icon = document.createElement('i');
	icon.setAttribute('class', 'mdi-av-new-releases');
	icon.setAttribute('id', msg.id + "-icon");

	header.appendChild(icon);

	var title = document.createElement('p');
	title.setAttribute('id', msg.id + "-title");
	title.innerHTML = msg.id;

	header.appendChild(title);

	card = document.createElement('div');
	card.setAttribute('class', 'collapsible-body');
	card.setAttribute('id', msg.id);
	card.innerHTML = "<p>" + msg.status + "</p>";

	listitem.appendChild(header);
	listitem.appendChild(card);

	return listitem;
}


// returns a materialize icon name based on a code
/*

http://materializecss.com/icons.html

100 release request prepared

200 release request verified
201 infrastructure tests passed
202 skipping infrastructure tests
203 db migration completed
204 closed release jira
205 deploy succeeded
206 loadbalander succeeded
207 release completed

300 migrating databses
301 verifying infrastructure
302 release in progress
303 not taking traffic
304 closing release jira

500 error verify release request
501 error verify infrastructure tests
502 deploy failed
503 error closing release jira
504 error calling RAT
505 error activating in loadbalander
506 error migrating database

*/
var get_icon_class = function(code) {
	if (code == 100) {
		return "mdi-action-assignment";
	}

	// releae complete
	if (code == 207) {
		return "mdi-action-done-all"
	}

	// diverting traffic
	if (code == 303) {
		return "mdi-communication-call-missed"
	}


	// error
	if (code >= 500 ) {
		return "mdi-alert-error"
	}

	// doing some process
	if (code >= 300) {
		return "mdi-av-loop"
	}


	// else new
	return "mdi-navigation-check"
	

}


var release_data_handler = function(msg) {
	for (r in msg.data) { 

		if (release_filter.test(msg.data[r].environment)) {
		// if (msg.data[r].environment.toUpperCase() ===  show_environment.toUpperCase()) {
			if (release_data[msg.data[r].id] == undefined) {
				console.log("new release event");
				release_data[msg.data[r].id] = msg.data[r];

				var new_record = release_data[msg.data[r].id];

				// append new release div
				document.getElementById("releases").appendChild(new_release_element(new_record));

			} else {
				var old_record = release_data[msg.data[r].id];
				var new_record = msg.data[r];
				release_data[msg.data[r].id] = new_record;

				document.getElementById(old_record.id).innerHTML = "<p>" + new_record.status + "</p>";
				document.getElementById(old_record.id + "-icon").setAttribute("class", get_icon_class(new_record.code));

			}
		} else {
			console.log("environment doesnt match, skipping this one");
		}

	}
}



var release_handler_v2 = function(msg) {

	var node = document.getElementById("releases");
	if (node == undefined){
  		console.log("creating releases node");
  		node = document.createElement('ul');
  		node.setAttribute('id', 'releases');
  		// node.id = 'releases';
  		node.setAttribute('class', 'collapsible popout');
  		node.setAttribute('data-collapsible', 'accordion');

  		document.getElementById('small').appendChild(node);
  	}

	release_data_handler(msg);
}


// // handler for releases
// var release_handler = function(msg) {

// 	console.log("release_handler: ");
// 	console.log(msg);

// 	release_data_handler(msg);

//   	var node = document.getElementById("releases");
// 	// remove children

// 	collapse_all();

// 	if (node != undefined) {
// 	  	if (node.hasChildNodes()) {
// 			node.removeChild(node.childNodes[0]);
// 		}
// 	}

//   	if (node == undefined){
//   		console.log("creating releases node");
//   		node = document.createElement('ul');
//   		node.setAttribute('id', 'releases');
//   		// node.id = 'releases';
//   		node.setAttribute('class', 'collapsible popout');
//   		node.setAttribute('data-collapsible', 'accordion');

//   		document.getElementById('small').appendChild(node);
//   	}


//   	for (r in msg.data) {

//   		var release = msg.data[r];
//   		console.log("release r: " + r);

// 	  	var existing = document.getElementById(release.id);

// 	  	if (existing == undefined) {
// 			listitem = document.createElement('li');
// 			// listitem.setAttribute('id', release.id + "-item");
			
// 			header = document.createElement('div');
// 			// set a id for the header

// 			if (r == last_item) {
// 				console.log("setting " + r + " to active ");
// 				header.setAttribute('class', 'collapsible-header active');
// 				$('.collapsible').collapsible({
// 					accordion : true
// 				});
// 			} else {
// 				header.setAttribute('class', 'collapsible-header');
// 			}
			
// 			icon = document.createElement('i');
// 			icon.setAttribute('class', 'mdi-social-whatshot');
// 			header.appendChild(icon);
// 			var title = document.createElement('p');
// 			title.innerHTML = release.id
// 			header.appendChild(title);

// 			card = document.createElement('div');
// 			card.setAttribute('class', 'collapsible-body');
// 			card.setAttribute('id', release.id);
// 			card.innerHTML = "<p>" + release.status + "</p>";

// 			listitem.appendChild(header);
// 			listitem.appendChild(card);

// 			node.appendChild(listitem);
// 	  	} else {
// 	  		existing.innerHTML="<p>" + release.status + "</p>";
// 	  	}

//   	}

//   	// sort the list
//   	sortUnorderedList('releases');


// }