var https = require("https");
var polyline = require('polyline');
var configs = require('./config');

var stations =
 [[42.355701, -71.103954],     //Vassar
  [42.358090, -71.093176],   //Mass Ave
  [42.361989, -71.092061],      //Stata
  [42.362536, -71.088188],       //Ames
  [42.362482, -71.085124]];   //Kendall

var nexthouse = [42.355005, -71.101438];

var base_url = "https://maps.googleapis.com/maps/api/distancematrix/json?"
base_url+="key="+configs.api_key+"&";

//Precomputed distances request:
//Next to Vassar and Mass Ave, walking
//Vassar and Mass Ave to other stations (including Mass Ave)
var initialWalking = {};
var stationBiking = {};

getMatrix([nexthouse],[stations[0],stations[1]],"walking",function(matrix){
  initialWalking = matrix;
});

getMatrix([stations[0],stations[1]],
          [stations[1],stations[2],stations[3],stations[4]],
          "biking",
          function(matrix){
            stationBiking = matrix;
          });

setTimeout(function(){
  console.log("Waling to stations: "+JSON.stringify(initialWalking));
  console.log("Biking between stations: "+JSON.stringify(stationBiking));
},1000);
/*
for(p in points){
  //get walking
  getMatrix([p],[stations[0],stations[1]],"walking",function(matrix){
    //add time to database
    matrix.rows[0].elements[0].duration.value;
  });

  //get biking
  getMatrix([p],[stations[1],stations[2],stations[3],stations[4]],"biking",function(matrix){

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
