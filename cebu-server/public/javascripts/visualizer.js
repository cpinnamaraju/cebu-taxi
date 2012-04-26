/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

var dataUrl = "/api/traces?vehicleId=861785000290977";

var startLatLng = new L.LatLng(10.3181373, 123.8956844); // Portland OR

var map;

var vertexLayer = null, edgeLayer = null;

var group = new L.LayerGroup();
var overlay = new L.LayerGroup();

var lines = null;

var i = 0;

var marker1 = null;
var marker1 = null;

var interval = null

var MAX_SPEED = 600; // in m/min



$(document).ready(function() {

    map = new L.Map('map');

    var cloudmadeUrl = 'http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
        cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
        cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 17, attribution: cloudmadeAttrib});
        
    map.setView(startLatLng, 15, true).addLayer(cloudmade);
       
   $("#controls").hide();
	$("#pause").hide();
   
    $("#loadData").click(loadData);
    $("#next").click(nextPoint);
    $("#prev").click(prevPoint);
    $("#play").click(playData);
    $("#pause").click(pauseData);
    $("#showData").click(showData);
    $("#playData").click(playData);
    
    

	map.addLayer(group);
	map.addLayer(overlay);
   
	
});

function loadData()
{ 

    $.get(dataUrl, function(data){
	
	$("#loadData").hide();

	lines = data;
	$("#controls").show();

	initSlider();

	map.invalidateSize();
   });

}

function initSlider()
{
	$("#slider").slider({min: 0, max: lines.length});

	$( "#slider" ).bind( "slidechange", function(){ 
		i = $("#slider").slider( "option", "value" ); 
		moveMarker(); 	
	});

	$( "#slider" ).bind( "slide", function(event, ui) {
		pauseData();
	});

}

function playData()
{
	$("#play").hide();
	$("#pause").show();

	interval = setInterval(moveMarker, 50);
}

function pauseData()
{
	$("#play").show();
	$("#pause").hide();

	clearInterval(interval);
}


function nextPoint()
{
	pauseData();

	$("#slider").slider( "option", "value", i);
}

function prevPoint()
{
	pauseData();

	i = i - 2;

	$("#slider").slider( "option", "value", i);
}

function showData()
{
	group.clearLayers();

	for(line_id in lines)
	{
		if(line_id >0)
		{

			
			var new_marker = new L.Circle(new L.LatLng(parseFloat(lines[line_id].originalLat), parseFloat(lines[line_id].originalLon)), 10, {color: '#00c', lat: parseFloat(lines[line_id].kfMeanLat), lon: parseFloat(lines[line_id].kfMeanLon)});
			group.addLayer(new_marker);

			new_marker.on('click', function(e){
					
				overlay.clearLayers();

				var overlay_marker = new L.Circle(new L.LatLng(e.target.options.lat, e.target.options.lon), 10, {color: '#0c0'});
				overlay.addLayer(overlay_marker);
				
			});
		}	
	}
}

function moveMarker()
{
	if(i != $("#slider").slider( "option", "value"))
		$("#slider").slider( "option", "value", i);

	renderMarker();

	i++;
}

function renderMarker()
{
	if(i>0)
	{	
		group.clearLayers();
		//overlay.clearLayers();

		

		var marker2 = new L.Circle(new L.LatLng(parseFloat(lines[i].kfMeanLat), parseFloat(lines[i].kfMeanLon)), 10, {fill: true, color: '#0c0'});
		group.addLayer(marker2);

		var majorAxis = new L.Polyline([new L.LatLng(parseFloat(lines[i].kfMeanLat), parseFloat(lines[i].kfMeanLon)),new L.LatLng(parseFloat(lines[i].kfMajorLat), parseFloat(lines[i].kfMajorLon))], {fill: true, color: '#c00'})
		
		group.addLayer(majorAxis);


		var minorAxis = new L.Polyline([new L.LatLng(parseFloat(lines[i].kfMeanLat), parseFloat(lines[i].kfMeanLon)),new L.LatLng(parseFloat(lines[i].kfMinorLat), parseFloat(lines[i].kfMinorLon))], {fill: true, color: '#c0c'});

		group.addLayer(minorAxis);

		var marker1 = new L.Circle(new L.LatLng(parseFloat(lines[i].originalLat), parseFloat(lines[i].originalLon)), 10, {fill: true, color: '#00c'});
		group.addLayer(marker1);


		map.panTo(new L.LatLng(parseFloat(lines[i].originalLat), parseFloat(lines[i].originalLon)));

		renderGraph();

		$("#count_display").html(lines[i].time + ' (' + i + ')');
	}
}


function renderGraph()
{
	for(var j in lines[i].graphSegmentIds)
	{
		var segment = lines[i].graphSegmentIds[j];
		
		if(segment.length == 2)
		{

			$.get('/api/segment', {segmentId: segment[0]}, function(data) {

				var color;

				var avg_velocity = Math.abs(segment[1]);

				if(avg_velocity < MAX_SPEED)
					color =  '#' + getColor(avg_velocity / MAX_SPEED);
				else
					color = 'purple';

				var geojson = new L.GeoJSON();

				geojson.on('featureparse', function (e) {
		                        e.layer.setStyle({color: e.properties.color,    weight: 7, opacity: 0.3});
				});
			
				data.geom.properties = {color: color};

				geojson.addGeoJSON(data.geom);
				overlay.addLayer(geojson);

			});	
		}
	}

}



function getColor(f)
{
	var n = Math.round(100 * f);

	var red =(255*n)/100
	var green =(255*(100-n))/100; 
	var blue =0

	var rgb = blue | (green << 8) | (red << 16);

	return rgb.toString(16);
}





