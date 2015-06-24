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
var hour_millis = 3600000;
var expire_releases = (hour_millis * 12); // 12 hours millis
var placementDiv = "small-3"; // the div to place in


// list of environments supported in "environment" key of release
var release_environments = [
	"prod",
	"pt1",
	"qa1",
	"ci1",
	"si1",
	"dev",
	".*"
];


// changes the regex used to control what is displayed
var set_release_filter = function(msg) {
	app_status("Changing release filter to " + msg);
	release_filter = new RegExp(msg,"gi");

	for (release in release_data) {
		console.log("matching: " + release_data[release].environment);
		if (release_filter.test(release_data[release].environment) == true ) {

			try {
				console.log("match removing " + release_data[release].id + " regex " + release_filter.test(release_data[release].environment));
				remove(release_data[release].id + "-main");
			} catch(err) {
				console.log("nothing to remove");
			}

			console.log("adding " + release_data[release].id);
			document.getElementById("releases").appendChild(new_release_element(release_data[release]));


		} else {
			try {
				console.log("nonmatch removing " + release_data[release].id + " regex " + release_filter.test(release_data[release].environment));
				remove(release_data[release].id + "-main");
			} catch (err) {
				console.log("unable to remove " + release_data[release].id);
			}
		}
	}

}

function release_dialog(release_dialog, title, text, callback, id) {
	// create a re-usable modal for dismissing the release events

	console.log("release_dialog " + id);
	var mainbody = document.getElementById("maindiv");

	var modal = document.createElement("div");
	modal.setAttribute("class", "modal");
	modal.setAttribute("id", release_dialog);

	var modal_content = document.createElement("div")
	modal_content.setAttribute("class", "modal-content");
	modal_content.innerHTML = "<h4>" + title + "</h4><p>" + text + "</p>" ;


	var modal_footer = document.createElement("div");
	var modal_button = document.createElement("a");
	modal_button.setAttribute("class", "modal-action modal-close waves-effect waves-green btn-flat");
	modal_button.setAttribute("href", "#!");
	//modal_button.setAttribute("onclick", callback + "('" + arguments[4] + "')");
	modal_button.addEventListener("click", callback(id));
	modal_button.innerHTML="Confirm";
	modal_footer.appendChild(modal_button);

	modal.appendChild(modal_content);
	modal.appendChild(modal_footer);

	mainbody.appendChild(modal);

	$("#" + release_dialog).openModal();

}


var dismiss_release = function(msg) {
	console.log("setting dismiss with " + "expire_release" + " " + msg);
	release_dialog('dismiss_release_modal', 'Dismiss Event', 'You will dismiss this event for EVERYONE, are you sure?', expire_release, msg);

}

// deletes a object by its parent
function remove(id) {
    return (elem=document.getElementById(id)).parentNode.removeChild(elem);
}

// changes the parent element to "hide"
function hide(id) {
    return (elem=document.getElementById(id)).parentNode.setAttribute('class', 'hide');
}

// checks a now - date(from string) > expire_release, returns true / false
// note expire_releases if in millis!
function hasExpired(dateString) {
	var then = new Date(dateString);
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - then.getTime());
	if (timeDiff > expire_releases) {
		console.log("EXPIRED");
		return true;
	}
	console.log("NOT EXPIRED");
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

	if (active_item >= document.getElementById("releases").children.length) {
		active_item = 0;
	}

	var i = 0;
	while (i < document.getElementById("releases").children.length) {

		if (i >= active_item) {

			collapse_all(); // remove "active" from all elements

			document.getElementById("releases").children[i].children[0].setAttribute('class', 'collapsible-header active');
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


var expire_release = function(msg) {
	console.log("expire_release " + msg);

	var req = {
		"id": msg
	}

	eb.send("expire-release-event", req, function(msg) {
		Materialize.toast("Cluster Response: " + msg.result, 2000);
	});
	// release_data[msg].expired = true;
	// remove(msg + "-main");
}


// create a new element in the list
var new_release_element = function(msg) {

	listitem = document.createElement('li')
	listitem.setAttribute('id', msg.id + '-main');
	// listitem.setAttribute("class", "section scrollspy");

	header = document.createElement('div');
	header.setAttribute('id', msg.id + "-header");

	icon = document.createElement('i');
	icon.setAttribute('class', 'material-icons left');
	icon.setAttribute('id', msg.id + "-icon");
	icon.innerHTML="star";

	header.appendChild(icon);

	environment = document.createElement('span');
	environment.setAttribute('class', 'badge')
	environment.innerHTML = msg.environment.toUpperCase();
	header.appendChild(environment);

	// close button
	var cls_btn = document.createElement('a');
	cls_btn.setAttribute("onclick", "Materialize.toast('<span>Clusterwide Dismiss " + msg.id + "?</span><a class=\x22btn-flat yellow-text\x22 href=\x22#!\x22 onclick=expire_release(\x22"+msg.id+"\x22)>CONFIRM</a>', 3000)");

	cls_btn.innerHTML = "<i class='material-icons left'>delete</i>";
	header.appendChild(cls_btn);


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
		return "assignment"
	}

	// release complete OR closed release jira
	if (code == 207 || code == 204) {
		return "done all"
	}

	// diverting traffic
	if (code == 303) {
		return "call missed"
	}

	// error
	if (code >= 500 ) {
		return "error outline"
	}

	// doing some process
	if (code >= 300) {
		return "loop"
	}

	// else done
	return "done"

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



// expire items in release_data
var expire_release_data_handler = function(msg) {
	console.log("expire_release_data_handler ");
	console.log(msg);
	for (id in msg.data) {
		try {
			release_data[msg.data[id]].expired = true;
			console.log("expired id " + release_data[msg.data[id]].id );
			remove(msg.data[id] + "-main");
		} catch(err) {
			console.log("unable to expire " + msg.data[id]);
		}

	}
}


// runs through the data and creates new items as needed. checks expiry before adding!
var release_data_handler = function(msg) {
	for (r in msg.data) {

//		var logging = chance_of_logging();
		var logging = true;

		if (logging) {
			console.log("release_data_handler: ");
			console.log(msg);
		}

		if (!hasExpired(msg.data[r].date) || msg.data[r].expired)  {

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

					try {
						document.getElementById(old_record.id).innerHTML = "<p>" + new_record.status + "</p>";
						document.getElementById(old_record.id + "-icon").innerHTML=get_icon_class(new_record.code);
						document.getElementById(old_record.id + "-main").setAttribute("class", get_class(new_record.code));
					} catch (err) {
						console.log("error setting classes for: " + old_record.id);
					}

				}
			} else {
				console.log("environment doesnt match, skipping this one");
			}
		} else {
			console.log("ignoring expired data: " + msg.data[r].id);
		}


	}
}



// the main entry point for the releae handler, this will also place the initial ul if its not present
var release_handler_v2 = function(msg) {

	var node = document.getElementById("releases");
	if (node == undefined){

  		console.log("creating releases node");
  		node = document.createElement('ul');
  		node.setAttribute('id', 'releases');
  		node.setAttribute('class', 'collapsible'); // popout
  		node.setAttribute('data-collapsible', 'accordion');

  		document.getElementById(placementDiv).appendChild(node);
  	}

  	// routing based on action
  	if (msg.action == "default") {
  		release_data_handler(msg);
  	} else if (msg.action == "expire") {
  		expire_release_data_handler(msg);
  	}

}


// when the DOM is ready, register the navigation for THIS plugin!
$(document).ready(function(){
	// Create the navigationals
	var menu = document.createElement('li');

	var btn = document.createElement('a');
	btn.setAttribute("class", "dropdown-button");
	btn.setAttribute("data-constrainwidth", "false");
	btn.setAttribute("data-beloworigin", "true");
	btn.setAttribute("href", "#!");
	btn.setAttribute("data-activates", "release-filter-dropdown");
	btn.innerHTML = '<i class="mdi-content-filter-list"></i>';
	menu.appendChild(btn);

	var nav = document.getElementById('nav-fixed').appendChild(menu);
	nav.appendChild(btn);

	var btn_data = document.createElement('ul');
	btn_data.setAttribute("id", "release-filter-dropdown");
	btn_data.setAttribute("class", "dropdown-content z-depth-2");

	// create the elements in the dropdown
	for (e in release_environments) {
		var list_item = document.createElement("li");
		var list_link = document.createElement("a");
		list_link.setAttribute("href", "#!");
		list_link.setAttribute("class", "waves-effect waves-teal");
		list_link.setAttribute("onclick", "set_release_filter('" + release_environments[e] + "')");
		list_link.innerHTML = release_environments[e];
		list_item.appendChild(list_link);
		btn_data.appendChild(list_item);
	}

	nav.appendChild(btn_data);





});
