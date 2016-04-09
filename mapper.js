var https = require("https");
var polyline = require('polyline');
var configs = require('./config');
var GeoJSON = require('geojson');
var fs = require('fs');

//=========User defined information===============
//list of Hubway Stations
var stations = [{name:"Vassar",  location:[42.355701, -71.103954]},     //Vassar
                {name:"Mass Ave",location:[42.358090, -71.093176]},   //Mass Ave
                {name:"Stata",   location:[42.361989, -71.092061]},      //Stata
                {name:"Ames",    location:[42.362536, -71.088188]},       //Ames
                {name:"Kendall", location:[42.362482, -71.085124]}];   //Kendall

//Starting point
var origin = {name:"Next House",location:[42.355005, -71.101438]}
;
//Indices of origin states (could be computed)
var originStations = [0,1];

//boundary corners
var SW = [42.355119, -71.097454];
var NW = [42.361115, -71.100306];
var SE = [42.359972, -71.084041];

var stepsNorth = 3;
var stepsEast = 6;

//==========Computed arrays=======================
var bikingDestinations = stations.slice(0);   //locations to bike to
var bikingOrigins = [];        //locations to bike from
for(var o=0; o<originStations.length; o++){
  //add each origin station to bikingOrigins
  bikingOrigins.push(stations[o]);
  //remove each origin stations from bikingDestinations
  bikingDestinations.splice(bikingDestinations.indexOf(stations[originStations[o]]),1);
}

var walkingOrigins = bikingDestinations.slice(0);
walkingOrigins.unshift(origin);
//=================================================

var base_url = "https://maps.googleapis.com/maps/api/distancematrix/json?"
base_url+="key="+configs.api_key+"&";

var initialWalking = {};
var stationBiking = {};
var sumTimes = {};

//where to store all the information we gather
var data = [];
var errorFlag = false;

getMatrix(getLocationList(bikingOrigins),getLocationList([origin]),"walking",function(matrix,error){
  if(error){
    console.log(error);
    errorFlag = true;
  }else{
    initialWalking = matrix.slice(0);
    for(var row = 0; row<originStations.length;row++){
      initialWalking[row] = [];
      var time = matrix[row][0];
      for(var element = 0; element<bikingDestinations.length;element++){
          initialWalking[row].unshift(time);
      }
      initialWalking[row].unshift(0);
    }
  }
});

getMatrix(getLocationList(bikingOrigins),getLocationList(bikingDestinations),"biking",function(matrix,error){
  if(error){
    console.log(error);
    errorFlag = true;
  }else{
    stationBiking = matrix;
    for(var row = 0; row<stationBiking.length;row++){
      stationBiking[row].unshift(0);
    }
  }
});



var interval = setTimeout(endFunction,stepsEast*stepsNorth*1000+1000);

var deltaNorth = [(NW[0]-SW[0])/stepsNorth, (NW[1]-SW[1])/stepsNorth];
var deltaEast = [(SE[0]-SW[0])/stepsEast, (SE[1]-SW[1])/stepsEast];

setTimeout(function(){
  sumTimes = addMatrices(initialWalking,stationBiking);
  var count = 0;
  for(var x = 0; x < stepsEast; x++){
    for(var y = 0; y < stepsNorth; y++){
      var point = [SW[0]+x*deltaEast[0]+y*deltaNorth[0], SW[1]+x*deltaEast[1]+y*deltaNorth[1]]
      setTimeout(evaluatePoint,count*1000,point);
      count++;
    }
  }
  var locationdata = [];
  locationdata.push({'lat':origin.location[0],'lng':origin.location[1],'name':origin.name});
  for(var i =0; i < stations.length; i++){
    locationdata.push({'lat':stations[i].location[0],'lng':stations[i].location[1],'name':stations[i].name});
  }
  console.log("\nWriting locations file to 'stations.json'");
  fs.writeFile("stations.json",JSON.stringify(GeoJSON.parse(locationdata,{Point: ['lat', 'lng']}))),function(err){
    if (err) {
       return console.error("Error writing to file: "+err);
    }
  }
},2000);

function endFunction(){
  console.log("Writing GeoJSON file to 'timeData.json'\n");
  fs.writeFile("timeData.json",JSON.stringify(GeoJSON.parse(data,{Point: ['lat', 'lng']}))),function(err){
    if (err) {
       return console.error("Error writing to file: "+err);
    }
  }
}

function evaluatePoint(location){
  var l = getLocationList(bikingDestinations);
  l.unshift(origin.location);

  getMatrix([location],l,"walking",function(matrix,error){
    if(error){
      console.log(error);
    }else{
      var fullMatrix = [];
      //need to match dimensions
      for(var i = 0; i < originStations.length;i++){
        fullMatrix.push(matrix[0]);
      }

      var totalTimes = addMatrices(sumTimes,fullMatrix);

      //sort and evaluate times
      var minTime = 10000;
      var minRow = 0;
      var minCol = 0;
      for(var row = 0; row<totalTimes.length; row++){
        for(var el = 0; el<totalTimes[0].length; el++){
          if(totalTimes[row][el]<minTime){
            minTime = totalTimes[row][el];
            minRow = row;
            minCol = el;
          }
        }
      }
      //interpret min time
      var route = "";

      if(minCol==0){
        route = "Walk from "+origin.name;
      }else{
        route = "Walk to "+stations[originStations[minRow]].name+", then bike to "+bikingDestinations[minCol-1].name;
      }

      data.push({'lat':location[0],'lng':location[1],'time':minTime,'route':route});
    }
  });
}

function addMatrices(a,b){
  if(a.length!=b.length || a[0].length!=b[0].length){
    console.log("Matrix dimensions don't match!");
    return null;
  }
  var out = [];
  for(var row = 0; row<a.length; row++){
    out[row] = [];
    for(var el = 0; el<a[0].length; el++){
      out[row].push(a[row][el]+b[row][el]);
    }
  }
  return out;
}

function getLocationList(a){
  var out = [];
  for(var c=0;c<a.length;c++){
    out[out.length] = a[c].location;
  }
  return out;
}

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
      var matrix = [[]];

      if(obj.status!='OK'){
        callback(matrix,obj.error);
      }else{
        if(obj.rows[0].elements[0].status!="OK"){
          callback(matrix,"Error at "+obj.origin_addresses+": "+obj.rows[0].elements[0].status);
        }else{
          for(var row = 0; row < obj.rows.length; row++){
            matrix[row] = [];
            for(var element = 0; element < obj.rows[row].elements.length; element++){
              matrix[row][element] = obj.rows[row].elements[element].duration.value;
            }
          }
          callback(matrix,null);
        }
      }
    });
  });
}
