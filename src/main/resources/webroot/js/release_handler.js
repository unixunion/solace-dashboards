/*

handles showing the cards, manages an materialize css style accordion

depends on:
	helpers.js

*/

var active_item = 0;
var last_item = 0;


var collapse_all = function() {

	var z = 0;
	
	try {

		while (z < document.getElementById("releases").children.length) {
			try {
				document.getElementById("releases").children[z].children[0].setAttribute('class', 'collapsible-header');
			} catch (err) {
				console.log(err);
			}
			z++;
		}
	} catch (err) {
		console.log("unable to nuke accordion");
	}
	
}



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
window.setInterval(accordion, 2000);


// handler for releases
var release_handler = function(msg) {

	console.log("release_handler: ");
	console.log(msg);

  	var node = document.getElementById("releases");
	// remove children

	collapse_all();

	if (node != undefined) {
	  	if (node.hasChildNodes()) {
			node.removeChild(node.childNodes[0]);
		}
	}

  	if (node == undefined){
  		console.log("creating releases node");
  		node = document.createElement('ul');
  		node.setAttribute('id', 'releases');
  		// node.id = 'releases';
  		node.setAttribute('class', 'collapsible popout');
  		node.setAttribute('data-collapsible', 'accordion');

  		document.getElementById('small').appendChild(node);
  	}


  	for (r in msg.data) {

  		var release = msg.data[r];
  		console.log("release r: " + r);

	  	var existing = document.getElementById(release.id);

	  	if (existing == undefined) {
			listitem = document.createElement('li');
			// listitem.setAttribute('id', release.id + "-item");
			
			header = document.createElement('div');
			// set a id for the header

			if (r == last_item) {
				console.log("setting " + r + " to active ");
				header.setAttribute('class', 'collapsible-header active');
				$('.collapsible').collapsible({
					accordion : true
				});
			} else {
				header.setAttribute('class', 'collapsible-header');
			}
			
			icon = document.createElement('i');
			icon.setAttribute('class', 'mdi-social-whatshot');
			header.appendChild(icon);
			var title = document.createElement('p');
			title.innerHTML = release.id
			header.appendChild(title);

			card = document.createElement('div');
			card.setAttribute('class', 'collapsible-body');
			card.setAttribute('id', release.id);
			card.innerHTML = "<p>" + release.status + "</p>";

			listitem.appendChild(header);
			listitem.appendChild(card);

			node.appendChild(listitem);
	  	} else {
	  		existing.innerHTML="<p>" + release.status + "</p>";
	  	}

  	}

  	// sort the list
  	sortUnorderedList('releases');


}