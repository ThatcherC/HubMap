var http = require("http");
var polyline = require('polyline');
var configs = require('./config');

var stations = [];
stations["Vassar"] = [42.355701, -71.103954];
stations["Mass Ave"] = [42.358090, -71.093176];
stations["Stata"] = [42.361989, -71.092061];
stations["Ames"] = [42.362536, -71.088188];
stations["Kendall"] = [42.362482, -71.085124];

var base_url = "https://maps.googleapis.com/maps/api/distancematrix/json?"
base_url+="key="+configs.api_key;
console.log(base_url);

//Precomputed distances request:
