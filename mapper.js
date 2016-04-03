var https = require("https");
var polyline = require('polyline');
var configs = require('./config');

//=========User defined information===============
//list of Hubway Stations
var stations =
 [[42.355701, -71.103954],     //Vassar
  [42.358090, -71.093176],   //Mass Ave
  [42.361989, -71.092061],      //Stata
  [42.362536, -71.088188],       //Ames
  [42.362482, -71.085124]];   //Kendall
//Starting point
var origin = [42.355005, -71.101438];
//Indices of origin states (could be computed)
var originStations = [0];

//==========Computed arrays=======================
var bikingDestinations = stations;   //locations to bike to
var bikingOrigins = [];        //locations to bike from
for(var o=0; o<originStations.length; o++){
  //add each origin station to bikingOrigins
  bikingOrigins.push(stations[o]);
  //remove each origin stations from bikingDestinations
  bikingDestinations.splice(bikingDestinations.indexOf(stations[originStations[o]]),1);
}
var walkingOrigins = bikingDestinations.unshift(origin);
//=================================================

var base_url = "https://maps.googleapis.com/maps/api/distancematrix/json?"
base_url+="key="+configs.api_key+"&";

//Precomputed distances request:
//Next to Vassar and Mass Ave, walking
//Vassar and Mass Ave to other stations (including Mass Ave)
var initialWalking = {};
var stationBiking = {};

getMatrix([origin],bikingOrigins,"walking",function(matrix){
  initialWalking = matrix;
});

getMatrix(bikingOrigins,bikingDestinations,"biking",function(matrix){
  stationBiking = matrix;
});

setTimeout(function(){
  console.log("Walking to stations: "+JSON.stringify(initialWalking));
  console.log("Biking between stations: "+JSON.stringify(stationBiking));
},1000);
/*
for(p in points){
  //get walking
  getMatrix([p],walkingOrigins,"walking",function(matrix){
    var tmp = addMatrices(stationBiking,matrix);
    var times = addMatrices(tmp,initialWalking);
  });
}
*/
function getMatrix(origins,destinations,mode,callback){
  var origin = "enc:"+polyline.encode(origins)+":";
  var destinations = "enc:"+polyline.encode(destinations)+":";
  var req_url = base_url;
  req_url += "origins="+origin+"&";
  req_url += "destinations="+destinations+"&";
  req_url += "mode="+mode;
  //console.log(req_url);

  https.get(req_url,function(res){
    var data = "";
    res.on('data', function(chunk){
      data+=chunk;
    });
    res.on('end',function(){
      var obj = JSON.parse(data);
      console.log(obj.status);
      obj = obj.rows;
      var matrix = [[]];
      for(var row = 0; row < obj.length; row++){
        matrix[row] = [];
        for(var element = 0; element < obj[row].elements.length; element++){
          matrix[row][element] = obj[row].elements[element].duration.value;
        }
      }
      callback(matrix);
    });
  });
}
