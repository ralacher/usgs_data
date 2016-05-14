// Function to retrieve URL parameters
// http://stackoverflow.com/a/8764051/3763071
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

// Function to add new site code input to DOM 
function add_site(value)
{
    // Get parent div element
    var parent_div = document.getElementById("site_codes");

    // Create new div for input, button
    var input_div = document.createElement("div");

    // Create new number input
    var input = document.createElement("input");
    input.type = 'number';
    if (value) { input.value = value; }

    // Create "remove" button for input
    var remove = document.createElement("button");
    remove.innerHTML = "Remove site";
    remove.addEventListener("click", function() {
        var parent = this.parentElement;
        parent.remove();
    });

    // Append new div to parent, and append new elements to new div
    parent_div.appendChild(input_div);
    input_div.appendChild(input);
    input_div.appendChild(remove);
}

// Function to populate inputs from URL parameters
(function() {
    var site_codes = JSON.parse(getURLParameter('site_codes'));
    var units = JSON.parse(getURLParameter('units'));

    // Add inputs for site codes
    for (var i = 0; i < site_codes.length; i++) {
        add_site(site_codes[i]);
    }

    // Check radio button for units
    if (units === 0) {
        document.getElementById("cels").checked = true;
    } else {
        document.getElementById("fahr").checked = true;
    }

    // Get a handle to the button's HTML element
    var submitButton = document.getElementById("submit_button");

    // Add a "click" listener
    submitButton.addEventListener("click", function() {
        // Get Fahrenheit or Celsius choice
        // 1 is Fahrenheit, 0 is Celsius 
        var unit = document.getElementById("cels").checked == 0 ? 1 : 0;

        // Get site code values from inputs
        var div = document.getElementById("site_codes");
        var children = div.getElementsByTagName("input");

        // Create array of values
        var arr = [];
        for (i = 0; i < children.length; i++) {
            arr[i] = children[i].value;
        }

        // Create JSON array containing options 
        var options = {
            "site_codes": arr,
            "units" : unit,
        };

        // Encode and send the data when the page closes
        document.location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(options));
    });
})();
