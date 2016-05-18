/**
  * Scripts required bak locations browser.
  * 
  * Created:  2016-02-16 21:39 by Christian Berndt
  * Modified:	2016-05-18 00:02 by Christian Berndt
  * Version:  1.0.1
  */

/**
 * jQuery plugins
 */
$(document).ready(function () {
  
    var wh = $(window).height();
    var ww = $(window).width(); 
  
    var locations = []; 

    var bodyOffset = 40;
    var filterHeight = 90;
    var headHeight = 73;

    var resolverURL = "//nominatim.openstreetmap.org/search?format=json&q=";

    // setup the datatable 
    var table =  $("#locations").DataTable({
        dom: 'ipt',   // hide default filter and length config
        scrollY: wh - (bodyOffset + filterHeight + headHeight ),
        paging: false
    });
  
    main();

    function main(){

        var resolverURL = "//nominatim.openstreetmap.org/search?format=json&q=";

        var data = []; // the ids coming back from serviceA

        var deferredA = $.getJSON( "data/cities.json", function( data ) { }); 

        deferredA.done(function() { // if callToServiceA successful...

            data = deferredA.responseJSON; 

            var deferredBs = [];

            for(var i = 0; i < data.length; i++){

                var city = data[i]; 
                deferredBs.push(

                    $.getJSON( resolverURL + city.name,  function( data ) {

                    } )
                );
            }

            $.when.apply($, deferredBs).then(function() {

                var markers = []; 

                for (var i = 0; i < deferredBs.length; i++) {
                    var location = deferredBs[i].responseJSON[0]; 
                    console.log(location);
                    var marker = [location.display_name, location.lat, location.lon]; 
                    var row = {"0":location.display_name, "1":location.lat, "2": location.lon};
                    table.row.add(row);
                    // markers.push(marker); 
                }
              
                table.draw(); 

                // updateMarkers(markers); 
                // map.fitBounds(locationLayer.getBounds());

            }); 
        });
    }

    var considerBounds = false;

    var minLat = parseFloat(-90);
    var maxLat = parseFloat(90);
    var minLong = parseFloat(-180);
    var maxLong = parseFloat(180);

    // Disable the filter form's default 
    // submit behaviour.
    $("#filter").submit(function(e){
        return false;
    });
    
  
    $("#filter .keyword").bind("keyup", function() {

        // Ignore and reset the map bounds 
        // when the keyword field is used.
        considerBounds = false;

        minLat = parseFloat(-90);
        maxLat = parseFloat(90);
        minLong = parseFloat(-180);
        maxLong = parseFloat(180);

        table.search( this.value ).draw();

    });

    // Redraw the map whenever the table is searched.
    table.on("search", function () {

        console.log("search()");

        locations = table.rows({search: "applied"}).data();
      
        updateMarkers(locations);

        if (!considerBounds) {

            // when the search is initiated from the 
            // filter form, fit the map to found locations.
            map.fitBounds(locationLayer.getBounds());

        }

    });
  
    table.on("draw.dt", function() {
        $("td").css("padding-left", margin); 
    });
  
    // Custom filter method which filters the 
    // locations by the map's boundaries.
    $.fn.dataTable.ext.search.push(

        function( settings, data, dataIndex ) {

            // only consider the bounds, if the search was triggered by the map
            if (considerBounds) {

                minLat = parseFloat(map.getBounds().getSouth());
                maxLat = parseFloat(map.getBounds().getNorth());
                minLong = parseFloat(map.getBounds().getWest());
                maxLong = parseFloat(map.getBounds().getEast());

            }

            var latitude = parseFloat( data[1] ) || 0;  // use data for the lat column
            var longitude = parseFloat( data[2] ) || 0; // use data for the long column

            if (( minLat <= latitude && latitude <= maxLat ) &&       // north-south
                ( minLong <= longitude && longitude <= maxLong )) {   // east-west
                return true;
              }
            return false;
        }
    );
  
    // Map setup
    var locations = [];
    var locationLayer = L.featureGroup([]);
    var map = L.map("map", {
        // maxZoom: 15, 
        center: [0, 0],
        // maxZoom: 13,
        zoom: 8
    });
  
    // fit the map into the right half of the window
    $("#map").css("height", wh - bodyOffset);
  
    var margin = 0; 
    if (ww >= 1200) {
        margin = (ww - 1170)/2; 
    }
  
    $("#filter, #locations_info, tbody h3").css("padding-left", margin); 
  // $(".map-wrapper").css("margin-right", mapMargin);
  
    map.invalidateSize(true); 

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  
    map.on("drag", function() {
        filterByMap(); 
    });
  
    map.on("zoomend", function() {
        filterByMap(); 
    });
  
    /** redraw the table and filter by map bounds */
    function filterByMap() {
        considerBounds = true; 
        table.draw();
    }
  
    /** update the location markers */
    function updateMarkers(locations) {

        console.log("updateMarkers()");
        console.log(locations.length); 

        var markers = [];

        for (var i = 0; i < locations.length; i++) {

            var lat =  parseFloat(locations[i][1]);
            var lon =  parseFloat(locations[i][2]);


            var marker = new L.marker([lat,lon])
              .bindPopup(locations[i][0]);
            markers.push(marker); 
        }

        if (map.hasLayer(locationLayer)) {
            map.removeLayer(locationLayer); 
        }

        if (markers.length > 0) {
            locationLayer = L.featureGroup(markers);        
            locationLayer.addTo(map);
        }    
    }

});