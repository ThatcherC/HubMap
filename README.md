# HubMap
Makes maps of how to get places using Hubway

###To Use:
1. Add a Google API Key with with the Distance Matrix service enabled to config.js
2. Change the variables in the "User Defined Information" section of mapper.js to fit your application
3. run `node mapper.js`
4. Wait a while (a few seconds to a few minutes)
5. Upload 'stations.json' and 'timeData.json' to CartoDB or another GIS program and map away!


###TODO:
- [x] Make a package.json
- [ ] Add user defined data to configs file
- [ ] Add a CLI for user defined data
- [ ] Add CartoDB/GIS integreation or output
