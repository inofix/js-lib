/**
 * Scripts required bak locations browser.
 * 
 * Created:  2016-02-16 21:39 by Christian Berndt
 * Modified:	2016-06-03 16:46 by Christian Berndt
 * Version:  1.0.2
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
  var table = $("#locations").DataTable({
    "language": {
      "url": "js/dataTables/German.json"
    }
    , "columnDefs": [{
        "targets": 1
        , "visible": false
      }

      
      , {
        "targets": 2
        , "visible": false
      }]
    , dom: 'ipt', // hide default filter and length config
    scrollY: wh - (bodyOffset + filterHeight + headHeight)
    , paging: false
  });

  loadData();

  function loadData() {

    var namesRequest = $.getJSON("data/cities.json", function (data) { /* debug messages */ });

    var cities = [];

    namesRequest.done(function () { // if "data/cities.json" were successfully loaded ...

      data = namesRequest.responseJSON;

      var locationRequests = [];

      for (var i = 0; i < data.length; i++) {

        var city = data[i];
        cities.push(city);

        locationRequests.push(

          $.getJSON(resolverURL + city.name, function (data) { /* debug messages */ })
        );
      }

      $.when.apply($, locationRequests).then(function () {

        var markers = [];

        for (var i = 0; i < locationRequests.length; i++) {
          var location = locationRequests[i].responseJSON[0];

          var marker = [location.display_name, location.lat, location.lon];

          var row = {
            "0": cities[i].name
            , "1": location.lat
            , "2": location.lon
            , "3": cities[i].country
          };

          table.row.add(row);
        }

        table.draw();

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
  $("#filter").submit(function (e) {
    return false;
  });

  // Search the datalist bey keyword
  $("#filter .keyword").bind("keyup", function () {

    // Ignore and reset the map bounds 
    // when the keyword field is used.
    considerBounds = false;

    minLat = parseFloat(-90);
    maxLat = parseFloat(90);
    minLong = parseFloat(-180);
    maxLong = parseFloat(180);

    table.search(this.value).draw();

  });

  // load countries and filter table by country
  $.ajax({
    url: "data/countries.json"
  }).done(function (data) {
    console.log(data);
    $("#country").autocomplete({
      autoFocus: true
      , minLength: 0
      , source: $.map(data, function (value, key) {
        return {
          label: value.name
          , value: value.id
        }
      })
      , select: function (event, ui) {
        event.preventDefault();
        $("#country").val(ui.item.label);
        $("#country").attr("data-value", ui.item.value);
        table.search(ui.item.label).draw();

      }
    });
  });

  // Redraw the map whenever the table is searched.
  table.on("search", function () {

    locations = table.rows({
      search: "applied"
    }).data();

    updateMarkers(locations);

    if (!considerBounds) {

      // when the search is initiated from the 
      // filter form, fit the map to found locations.
      map.fitBounds(locationLayer.getBounds());

    }

  });

  table.on("draw.dt", function () {
    $("td").css("padding-left", margin);
  });

  // Custom filter method which filters the 
  // locations by the map's boundaries.
  $.fn.dataTable.ext.search.push(

    function (settings, data, dataIndex) {

      // only consider the bounds, if the search was triggered by the map
      if (considerBounds) {

        minLat = parseFloat(map.getBounds().getSouth());
        maxLat = parseFloat(map.getBounds().getNorth());
        minLong = parseFloat(map.getBounds().getWest());
        maxLong = parseFloat(map.getBounds().getEast());

      }

      var latitude = parseFloat(data[1]) || 0; // use data for the lat column
      var longitude = parseFloat(data[2]) || 0; // use data for the long column

      if ((minLat <= latitude && latitude <= maxLat) && // north-south
        (minLong <= longitude && longitude <= maxLong)) { // east-west
        return true;
      }
      return false;
    }
  );

  // Map setup
  var locations = [];
  var locationLayer = L.featureGroup([]);
  var map = L.map("map", {
    center: [50, 13]
    , zoom: 8
  });

  // fit the map into the right half of the window
  $("#map").css("height", wh - bodyOffset);

  var margin = 0;
  if (ww >= 1200) {
    margin = (ww - 1170) / 2;
  }

  $("#filter, #locations_info, tbody h3").css("padding-left", margin);
  // $(".map-wrapper").css("margin-right", mapMargin);

  map.invalidateSize(true);

  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  map.on("drag", function () {
    filterByMap();
  });

  map.on("zoomend", function () {
    filterByMap();
  });

  /** redraw the table and filter by map bounds */
  function filterByMap() {
    considerBounds = true;
    table.draw();
  }

  /** update the location markers */
  function updateMarkers(locations) {

    var markers = [];

    for (var i = 0; i < locations.length; i++) {

      var lat = parseFloat(locations[i][1]);
      var lon = parseFloat(locations[i][2]);


      var marker = new L.marker([lat, lon])
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