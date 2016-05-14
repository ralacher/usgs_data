var UI = require('ui');
var ajax = require('ajax');

// Initialization function
var initialised = false;
Pebble.addEventListener("ready", function() {
    initialised = true;
});

// Loading screen to display while AJAX request is made
var loading_screen = new UI.Card({
	title: 'USGS Data',
	body: 'Downloading USGS data...',
});
loading_screen.show();

// Event listener to show webview configuration and send configuration options
Pebble.addEventListener("showConfiguration", function() {
		var uri = 'https://lacher.io/config.html';
    var options = JSON.parse(localStorage.getItem('options'));
    if (options !== null) {
        uri = uri + '?site_codes=' + encodeURIComponent(JSON.stringify(options.site_codes)) +
										'&units=' + encodeURIComponent(JSON.stringify(options.units));
    }
    Pebble.openURL(uri);
});

// Event listener to close webview and return configuration options
Pebble.addEventListener("webviewclosed", function(e) {
    if (e.response !== '') {
        var options = JSON.parse(decodeURIComponent(e.response));
        localStorage.setItem('options', JSON.stringify(options));
        Pebble.sendAppMessage(options,
															function(e) {
																console.log("SUCCESS: Sent options to Pebble.");
															},
															function(e) {
																console.log("ERROR: Failed to send options to Pebble.");
															});
    } else {
        console.log("no options received");
    }
});

// Helper function to create URL parameters for AJAX request
function create_params()  {
	// Retrieve configuration details from local storage
	var sites = JSON.parse(localStorage.getItem('options')).site_codes;
	// Create JSON object for AJAX query
	var params = {
		format: "json,1.1",
		sites: sites,
		parameterCd: "00010",
	};
	// Create params string
	var str = Object.keys(params).map(function(key) { 
		return encodeURIComponent(key) + '=' + params[key]; 
	}).join('&');
	return str;
}

// Helper function to create array of site numbers and descriptions
var site_codes = function(data) {
	var arr = [];
	for (var i = 0; i < data.value.timeSeries.length; i++) {
			var title = data.value.timeSeries[i].sourceInfo.siteName;
			var subtitle = data.value.timeSeries[i].variable.variableDescription;
			arr.push({
				title: title,
				subtitle: subtitle,
			});
	}
	return arr;
};

// Helper function to convert from Celsius to Fahrenheit
var c_to_f = function(data) {
	return (9/5) * data + 32;
};

/* Perform AJAX request
 * Data will be queried from USGS API using parameters received from configuration webview
 * Successful request will create a menu item for each site
 *     Select button will drilldown and show the value retrieved for that site
 * Failed request will log the failure and display an error
 */
ajax(
{
	url: 'http://waterservices.usgs.gov/nwis/iv/?' + create_params(),
	type: 'json',
},
	
	// Success callback
	function(data) {
		
		// Create menu UI element
		var menu_items = site_codes(data);
		var resultsMenu = new UI.Menu({
			sections: [{
				title: 'Sites',
				items: menu_items,
			}]
		});
		resultsMenu.show();
		
		// Create action for select button
		resultsMenu.on('select', function(e) {
			var time = new Date(data.value.timeSeries[e.itemIndex].values[0].value[0].dateTime);
			time = time.toLocaleDateString() + '\n' + time.toLocaleTimeString();
			var value = data.value.timeSeries[e.itemIndex].values[0].value[0].value;
			var units = JSON.parse(localStorage.getItem('options')).units;
			if (units === 1) {
				value = c_to_f(value);
				value += '°F';
			} else {
				value += '°C';
			}
			var content = time + '\n' + value;

			// Create Card to show detailed view
			var detailCard = new UI.Card({
				title: 'Details',
				subtitle: e.item.title,
				body: content,
				scrollable: true,
			});
			detailCard.show();
		});
		
	},
	
	// Failure callback
	function(error) {
		var error_card = new UI.Card({
			title: 'Error',
			body: error,
		});
		error_card.show();
	}
);