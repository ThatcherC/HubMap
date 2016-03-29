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
var initialWalking = getMatrix([nexthouse],[stations["Vassar"],stations["Mass Ave"]],"walking");
console.log(initialWalking);

function getMatrix(origins,destinations,mode){
  var origin = "enc:"+polyline.encode([nexthouse])+":";
  var destinations = "enc:"+polyline.encode([stations["Vassar"],stations["Mass Ave"]])+":";
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
      return JSON.parse(data).rows;
    });
  });
}
