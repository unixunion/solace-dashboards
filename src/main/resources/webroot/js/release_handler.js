/*

displays a accordion style list of releases with icons, colorization, environment name and status strings.

send in a array of releases with the following attributes each: 

	id: product-1.2.3-12 ( combination of component and version )
	component: product
	version: 1.2.3-12
	environment: string
	date: time of event, format: "yyyy-MM-dd HH:mm:ss"
	status: String of status
	code: one of the following:

		// process "document" icon, blue bg
		100 release request prepared

		// single check mark, green bg
		200 release request verified
		201 infrastructure tests passed
		202 skipping infrastructure tests
		203 db migration completed
		204 closed release jira
		205 deploy succeeded
		206 loadbalander succeeded
		207 release completed

		// process arrows, orange bg
		300 migrating databses
		301 verifying infrastructure
		302 release in progress
		303 not taking traffic
		304 closing release jira

		// esclamation, red bg
		500 error verify release request
		501 error verify infrastructure tests
		502 deploy failed
		503 error closing release jira
		504 error calling RAT
		505 error activating in loadbalander
		506 error migrating database


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
var expire_releases = 10800000*4; // 12 hours millis
var placementDiv = "small-3"; // the div to place in

var set_release_filter = function(msg) {
	app_status("Changing release filter to " + msg);
	release_filter = new RegExp(msg,"gi");

	for (release in release_data) {
		if (!release_filter.test(release_data[release].environment)) {
			try {
				remove(release_data[release].id + "-main");
			} catch (err) {
				console.log("unable to remove " + release_data[release].id);
			}
		}
	}

}

// delets a object by its parent
function remove(id) {
    return (elem=document.getElementById(id)).parentNode.removeChild(elem);
}

function hide(id) {
    return (elem=document.getElementById(id)).parentNode.setAttribute('class', 'hide');
}

function hasExpired(dateString) {
	var then = new Date(dateString);
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - then.getTime());
	console.log(timeDiff);
	if (timeDiff > expire_releases) {
		return true;
	}
	return false;
}

// removes 'active' from all headers
var collapse_all = function() {
	var z = 0;

	try {
		while (z < document.getElementById("releases").children.length) {
			try {
				document.getElementById("releases").children[z].children[0].setAttribute('class', 'collapsible-header');
			} catch (err) {
				console.log("element wont collapse");
				console.log(err);
			}
			z++;
		}
	} catch (err) {
		console.log("unable to nuke accordion");
	}


	// check dates in release_data and expire as needed
	for (release in release_data) {

		if (release_data[release] != undefined) {

			try {
				// var d = release_data[release].date

				if (hasExpired(release_data[release].date)) {
					console.log("expunging stale entry " + release_data[release].id+ '-main');
					var name = release_data[release].id + '-main';
					// release_data[release] = undefined;
					// document.getElementById(name).setAttribute('class', 'hide');
					remove(name);
				}

				
			} catch (err) {
				console.log("unable to purge stale elements " + release_data[release].id+ '-main');
				console.log(err);
			}

		} else {
			console.log("element " + release + " is undefined");
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
			// set on the li object
			// console.log(document.getElementById("releases").children[i].children[0]);
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
	header.setAttribute('id', msg.id + "-header");
	
	icon = document.createElement('i');
	icon.setAttribute('class', 'mdi-av-new-releases');
	icon.setAttribute('id', msg.id + "-icon");

	header.appendChild(icon);

	environment = document.createElement('span');
	environment.setAttribute('class', 'badge')
	environment.innerHTML = msg.environment.toUpperCase();
	header.appendChild(environment);

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

see the code list at the top of the file:

*/
var get_icon_class = function(code) {
	if (code == 100) {
		return "mdi-action-assignment";
	}

	// release complete OR closed release jira
	if (code == 207 || code == 204) {
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

var get_class = function(code) {

	// error
	if (code >= 500 ) {
		return "red lighten-1"
	}

	// doing some process
	if (code >= 300) {
		return "orange lighten-4"
	}

	if (code == 100) {
		return "blue lighten-2"
	}

	// else new
	return "green lighten-3"
	
}


var release_data_handler = function(msg) {
	for (r in msg.data) { 


		if (!hasExpired(msg.data[r].date))  {

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
					document.getElementById(old_record.id + "-main").setAttribute("class", get_class(new_record.code));
					// document.getElementById(old_record.id + "-header").setAttribute("class", get_class(new_record.code));

				}
			} else {
				console.log("environment doesnt match, skipping this one");
			}
		} else {
			console.log("ignoring expired data: " + msg.data[r].id);
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

  		document.getElementById(placementDiv).appendChild(node);
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