var https = require("https");
var polyline = require('polyline');
var configs = require('./config');

var stations = [];
stations["Vassar"] = [42.355701, -71.103954];
stations["Mass Ave"] = [42.358090, -71.093176];
stations["Stata"] = [42.361989, -71.092061];
stations["Ames"] = [42.362536, -71.088188];
stations["Kendall"] = [42.362482, -71.085124];

var nexthouse = [42.355005, -71.101438];

var base_url = "https://maps.googleapis.com/maps/api/distancematrix/json?"
base_url+="key="+configs.api_key+"&";

//Precomputed distances request:
//Next to Vassar and Mass Ave, walking
//Vassar and Mass Ave to other stations (including Mass Ave)
var initialWalking = {};
var stationBiking = {};

getMatrix([nexthouse],[stations["Vassar"],stations["Mass Ave"]],"walking",function(matrix){
  initialWalking = matrix;
});

getMatrix([stations["Vassar"],stations["Mass Ave"]],
          [stations["Mass Ave"],stations["Stata"],stations["Ames"],stations["Kendall"]],
          "biking",
          function(matrix){
            stationBiking = matrix;
          });

setTimeout(function(){
  console.log(initialWalking);
  console.log(stationBiking);
},1000);

function getMatrix(origins,destinations,mode,callback){
  var origin = "enc:"+polyline.encode(origins)+":";
  var destinations = "enc:"+polyline.encode(destinations)+":";
  var req_url = base_url;
  req_url += "origins="+origin+"&";
  req_url += "destinations="+destinations+"&";
  req_url += "mode=walking"

  https.get(req_url,function(res){
    var data = "";
    res.on('data', function(chunk){
      data+=chunk;
    });
    res.on('end',function(){
      callback(JSON.parse(data).rows);
    });
  });
}
