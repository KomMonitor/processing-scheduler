const fs = require('fs');
const csv2geojson = require('csv2geojson');
const axios = require('axios').default;
const util = require('util');
const iconv = require('iconv-lite');


const targetURL_dataManagement = process.env.KOMMONITOR_DATA_MANAGEMENT_URL;
const targetURL_importer = process.env.KOMMONITOR_IMPORTER_URL;
// const targetURL_importer = "localhost:8087/importer";
const filePathToCSVFile = process.env.FILE_PATH_CORONA_IMPORT;
const delimiter=";";

const status_QUARANTAENE = "QUARANTAENE";
const status_NEGATIVE = "NEGATIVE";
const status_POSITIVE = "POSITIVE";
const status_ISOLATED = "ISOLATED";
const status_DIED = "DIED";

const propertyName_xCoord = "dbETRSRechts";
const propertyName_yCoord = "dbETRSHoch";
const propertyName_statusType = "dbPatStatus";
const propertyName_patientId = "dbPaID";
const propertyName_patientName = "dbPaID";
const propertyName_liveInterval_start = "dbDatumVon";
const propertyName_liveInterval_end = "dbDatumbis"; 
const propertyName_registerDate = "dbDatumEintrag";
const propertyName_eventDate = "dbZeitStempel";

const relevantTimestampFieldNames = [
    propertyName_eventDate, propertyName_liveInterval_end, propertyName_liveInterval_start, propertyName_registerDate
];

const propertyName_statusType_valueMapping = [{
    "statusValue": "1",
    "status": status_QUARANTAENE,
    "kommonitorGeoresourceId": "d52dddc9-8f56-420d-bf2f-ac3eef2b2d11"
},
{
    "statusValue": "2",
    "status": status_NEGATIVE,
    "kommonitorGeoresourceId": "c2ff4790-9c55-4efd-a13f-7741c11e4a83"
},
{
    "statusValue": "3",
    "status": status_POSITIVE,
    "kommonitorGeoresourceId": "fec61691-1269-4054-9cdf-871614b869d3"
},
{
    "statusValue": "4",
    "status": status_ISOLATED,
    "kommonitorGeoresourceId": "feac8d4c-d665-4b29-a699-4783c5057e50"
},
{
    "statusValue": "5",
    "status": status_DIED,
    "kommonitorGeoresourceId": "7dc5e9c2-58ce-4ecf-a0ba-0b543c506582"
}];

const converterDefinition = {
    "encoding": "UTF-8",
    "mimeType": "application/geo+json",
    "name": "org.n52.kommonitor.importer.converter.geojson",
    "parameters": [
      {
        "name": "CRS",
        "value": "EPSG:4647"
      }
    ]
  };

const datasourceDefinition = {
    "parameters": [
      {
        "name": "payload",
        "value": "tbd"
      }
    ],
    "type": "INLINE"
  };

const propertyMapping = {
    "arisenFromProperty": null,
    "attributes": [      
    ],
    "identifierProperty": propertyName_patientId,
    "keepAttributes": true,
    "keepMissingOrNullValueAttributes": true,
    "nameProperty": propertyName_patientName,
    "validEndDateProperty": propertyName_liveInterval_end,
    "validStartDateProperty": propertyName_liveInterval_start
}; 

const importerUpdateRequest_template = {
    "converter": converterDefinition,
    "dataSource": datasourceDefinition,
    "dryRun": false,
    "georesourceId": "d52dddc9-8f56-420d-bf2f-ac3eef2b2d11",
    "georesourcePutBody": {
      "geoJsonString": undefined,
      "periodOfValidity": {
        "endDate": null,
        "startDate": "2020-03-01"
      }
    },
    "propertyMapping": propertyMapping
};

const importCSVDataToKomMonitor = async function (){
    // parse file

    // cnvert whole CSV to GeoJSON

    // filter GeoJSON into 5 subsets according to Corona status

    // build and send 5 requests to first delete and then update KomMonitor resources
    
    console.log("Parse CSV data");    
    var csvString = await getCSVContentAsString();

    console.log("COnvert CSV to GeoJSON");
    var geoJSON_allData = await convertCSVToGeoJSON(csvString);

    console.log("reformat Timestamp values");
    geoJSON_allData = await reformatTimestamps(geoJSON_allData);    

    console.log("Begin update of COVID-quarantaene features");
    await updateFeatures_covidQuarantaene(geoJSON_allData);
    console.log("Begin update of COVID-negative features");
    await updateFeatures_covidNegative(geoJSON_allData);
    console.log("Begin update of COVID-positive features");
    await updateFeatures_covidPositive(geoJSON_allData);
    console.log("Begin update of COVID-isolated features");
    await updateFeatures_covidIsolated(geoJSON_allData);
    console.log("Begin update of COVID-died features");
    await updateFeatures_covidDied(geoJSON_allData);

    return true;
}

// function getFileEncoding( f ) {


//     var d = new Buffer.alloc(5, [0, 0, 0, 0, 0]);
//     var fd = fs.openSync(f, 'r');
//     fs.readSync(fd, d, 0, 5, 0);
//     fs.closeSync(fd);

//     // https://en.wikipedia.org/wiki/Byte_order_mark
//     var e = false;
//     if ( !e && d[0] === 0xEF && d[1] === 0xBB && d[2] === 0xBF)
//         e = 'utf8';
//     if (!e && d[0] === 0xFE && d[1] === 0xFF)
//         e = 'utf16be';
//     if (!e && d[0] === 0xFF && d[1] === 0xFE)
//         e = 'utf16le';
//     if (!e)
//         e = 'ascii';

//     return e;
// }

function getCSVContentAsString(){
    // var encoding = getFileEncoding(filePathToCSVFile);
    var originalFile = fs.readFileSync(filePathToCSVFile, {encoding: 'binary'});
    // var decodedFile = decode(originalFile, 'iso88591');
    return originalFile;
}

function convertCSVToGeoJSON(csvString){
    const csv2geojson_promisified = util.promisify(csv2geojson.csv2geojson);

    return csv2geojson_promisified(csvString, {
        latfield: propertyName_yCoord,
        lonfield: propertyName_xCoord,
        delimiter: delimiter
    }).then(data => {

        if(data) {
            return data;
          }
          else {
            console.log("No data");
            process.exit(-1);
          }
        
     }).catch(err => {
        console.log("FATAL An error occurred trying to transform CSV content to GeoJSON in the file: " + err);
        process.exit(-2);
     });
}

function reformatTimestamps(geoJSON){
    //reformat from dd.mm.yyyy --> yyyy-mm-dd
    geoJSON.features.forEach(function(feature){
        for (const timePropertyName of relevantTimestampFieldNames) {
            if(feature.properties[timePropertyName]){
                var dateComps = feature.properties[timePropertyName].split(".");
                if(dateComps && (dateComps.length === 3)){
                    feature.properties[timePropertyName] = "" + dateComps[2] + "-" + dateComps[1] + "-" + dateComps[0];
                }   
            }               
        }
    });

    return geoJSON;
}

async function updateFeatures_covidQuarantaene(geoJSON_allData){    
    await clearAndUpdateFeaturesForStatus(status_QUARANTAENE, geoJSON_allData);

    return true;
}

async function updateFeatures_covidNegative(geoJSON_allData){    
    await clearAndUpdateFeaturesForStatus(status_NEGATIVE, geoJSON_allData);

    return true;
}

async function updateFeatures_covidPositive(geoJSON_allData){    
    await clearAndUpdateFeaturesForStatus(status_POSITIVE, geoJSON_allData);

    return true;
}

async function updateFeatures_covidIsolated(geoJSON_allData){    
    await clearAndUpdateFeaturesForStatus(status_ISOLATED, geoJSON_allData);

    return true;
}

async function updateFeatures_covidDied(geoJSON_allData){    
    await clearAndUpdateFeaturesForStatus(status_DIED, geoJSON_allData);

    return true;
}

async function clearAndUpdateFeaturesForStatus(status, geoJSON_allData){
    // first delete existing resources
    var resourceID = determineResourceIdFromStatus(status);
    var statusID = determineStatusIdFromStatus(status);
    console.log("Send request to delete features for resourceId: ", resourceID);
    await deleteFeatures(resourceID);

    // then create geoJSON clone and filter features to relevant state
    var geoJSON_clone = JSON.parse(JSON.stringify(geoJSON_allData));

    geoJSON_clone = await filterFeaturesByStatus(geoJSON_clone, statusID);

    // then execute update request    
    console.log("Send request to update features for resourceId: ", resourceID);
    await updateFeatures(resourceID, geoJSON_clone);

    return true;
}

function determineResourceIdFromStatus(status_type){
    for (const statusTypeMapping of propertyName_statusType_valueMapping) {
        if (String(statusTypeMapping.status) === String(status_type)){
            return statusTypeMapping.kommonitorGeoresourceId;
        }
    }
}

function determineStatusIdFromStatus(status_type){
    for (const statusTypeMapping of propertyName_statusType_valueMapping) {
        if (statusTypeMapping.status === status_type){
            return statusTypeMapping.statusValue;
        }
    }
}

function filterFeaturesByStatus(geoJSON, statusID){
    geoJSON.features = geoJSON.features.filter(feature => {
        return feature.properties[propertyName_statusType] === statusID;
    });

    return geoJSON;
}

function deleteFeatures(resourceID){
    return axios.delete(targetURL_dataManagement + "/georesources/" + resourceID + "/allFeatures")
      .then(function (response) {
          console.log("Deleted all features for resource with ID: " + resourceID);
        return true;
      })
      .catch(function (error) {
        console.log(error);
      });
}

function updateFeatures(resourceID, geoJSON){

    var geoJSONString = JSON.stringify(geoJSON);

    var postBody = JSON.parse(JSON.stringify(importerUpdateRequest_template));
    postBody.dataSource.parameters[0].value = geoJSONString;
    postBody.georesourceId = resourceID;    

    return axios.post(targetURL_importer + "/georesources/update", postBody, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    })
      .then(function (response) {
          console.log("Successfully updated features for resource with ID: " + resourceID);
        return true;
      })
      .catch(function (error) {
        console.log(error);
      });
}


// run script
exports.importCSVDataToKomMonitor = importCSVDataToKomMonitor;
