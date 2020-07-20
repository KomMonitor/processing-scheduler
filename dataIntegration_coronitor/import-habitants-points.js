const fs = require('fs');
const csv2geojson = require('csv2geojson');
const axios = require('axios').default;
const util = require('util');
const FormData = require('form-data');


const targetURL_dataManagement = process.env.KOMMONITOR_DATA_MANAGEMENT_URL;
const targetURL_importer = process.env.KOMMONITOR_IMPORTER_URL;
// const targetURL_importer = "localhost:8087/importer";
const filePathToCSVFile = process.env.FILE_PATH_HABITANTS_IMPORT;
const delimiter=";";

const propertyName_xCoord = "X";
const propertyName_yCoord = "Y";
const propertyName_Id = "FID";
const propertyName_Name = "Addressen";

const validStartDate = process.env.START_DATE_HABITANTS_IMPORT;
const validEndDate = process.env.END_DATE_HABITANTS_IMPORT;

const fileName = "HabitantsImportFile.csv";

const deleteFeaturesFirst = JSON.parse(process.env.DELETE_ALL_FEATURES_HABITANTS_IMPORT);

const resourceMappingArray = [{
    "propertyName": "ANZAHL",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "eda92055-2ec3-470c-ab5a-dc07a655fd96"
},
{
    "propertyName": "DEUTSCH",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "d290a7f1-9c6c-43d2-aa82-b97dcc2678b5"
},
{
    "propertyName": "NICHTDEUTSCH",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "2560295e-28ca-439c-999d-fc2f9adafc67"
},
{
    "propertyName": "DOPPELSTAALER",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "7d7a21e0-7119-46ba-944e-384b08bfb6b3"
},
{
    "propertyName": "AKLASSE0BIS9",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "5a0b5884-0a5c-494e-9bd8-ad643666df99"
},
{
    "propertyName": "AKLASSE10BIS19",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "811295cd-7393-42d0-b18d-486e4b57218b"
},
{
    "propertyName": "AKLASSE20BIS29",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "ba110f5f-2cab-44e3-94de-e3f6e283e452"
},
{
    "propertyName": "AKLASSE30BIS39",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "426f992b-1111-48d8-b6d7-7cb0baa2e12f"
},
{
    "propertyName": "AKLASSE40BIS49",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "bb032791-d5b7-48e5-952f-e12bc6c6783d"
},
{
    "propertyName": "AKLASSE50BIS59",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "d22ed904-210a-4a19-b77c-b8ed7afca9b2"
},
{
    "propertyName": "AKLASSE60BIS69",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "a01d0cee-9e3e-4a0a-baea-80445c42dee6"
},
{
    "propertyName": "AKLASSE70BIS79",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "3c44b986-7ab6-4509-b5e8-ebccc59b77a3"
},
{
    "propertyName": "AKLASSE80UNDMEHR",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "cd1a158a-f266-406c-9721-ac36438128d7"
},
{
    "propertyName": "MAENNLICH",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "9697d63b-f06c-4be0-b2f7-92a9dc851ba4"
},
{
    "propertyName": "WEIBLICH",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "53cf0e8a-746c-44d4-86e0-ff0ed2b53fda"
},
{
    "propertyName": "DIVERS",
    "targetPropertyName": "ANZAHL",
    "kommonitorGeoresourceId": "5fe1a935-da3e-4d23-89d8-3379a0f159af"
},
];

const converterDefinition = {
    "encoding": "UTF-8",
    "mimeType": "text/csv",
    "name": "org.n52.kommonitor.importer.converter.csvLatLon",
    "parameters": [
        {
            "name": "yCoordColumn",
            "value": propertyName_yCoord
          },
          {
            "name": "CRS",
            "value": "EPSG:4647"
          },
          {
            "name": "xCoordColumn",
            "value": propertyName_xCoord
          },
          {
            "name": "separator",
            "value": delimiter
          }
    ]
  };

const datasourceDefinition = {
    "parameters": [
      {
        "name": "NAME",
        "value": fileName
      }
    ],
    "type": "FILE"
  };

const propertyMapping_template = {
    "arisenFromProperty": null,
    "attributes": [  
        {
            "mappingName": "ANZAHL",
            "name": "string",
            "type": "integer"
        }    
    ],
    "identifierProperty": propertyName_Id,
    "keepAttributes": false,
    "keepMissingOrNullValueAttributes": true,
    "nameProperty": propertyName_Name,
    "validEndDateProperty": null,
    "validStartDateProperty": null
}; 

const importerUpdateRequest_template = {
    "converter": converterDefinition,
    "dataSource": datasourceDefinition,
    "dryRun": false,
    "georesourceId": "d52dddc9-8f56-420d-bf2f-ac3eef2b2d11",
    "georesourcePutBody": {
      "geoJsonString": undefined,
      "periodOfValidity": {
        "endDate": validEndDate,
        "startDate": validStartDate
      }
    },
    "propertyMapping": null
};

const importCSVDataToKomMonitor = async function (){
    // parse file

    // cnvert whole CSV to GeoJSON

    // filter GeoJSON into 5 subsets according to Corona status

    // build and send 5 requests to first delete and then update KomMonitor resources
    
    console.log("Upload CSV data");    
    await uploadCSVContent();

    // console.log("COnvert CSV to GeoJSON");
    // var geoJSON_allData = await convertCSVToGeoJSON(csvString);   
    
    console.log("Begin update of all habitants features");

    for (const resourceMapping of resourceMappingArray) {
        console.log("Begin update of habitants features for resourceId " + resourceMapping.kommonitorGeoresourceId);
        await updateFeatures_habitants(resourceMapping);
    }

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

async function uploadCSVContent(){
    // var encoding = getFileEncoding(filePathToCSVFile);
    // var originalFile = fs.readFileSync(filePathToCSVFile, {encoding: 'binary'});
    var file = fs.createReadStream(filePathToCSVFile);
    // var decodedFile = decode(originalFile, 'iso88591');

    await uploadNewFile(file, fileName);
}

function uploadNewFile (fileData, fileName){
    console.log("Trying to POST to importer service to upload a new file.");

    var formdata = new FormData();
    formdata.append("filename", fileName); 
    formdata.append("file", fileData);       

    return axios({
        method: 'post',
        url: targetURL_importer + "/upload",
        data: formdata,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: formdata.getHeaders()
        })
        .then(function (response) {
            console.log("Successfully uploaded CSV file to importer");
            return response.data;
        })
        .catch(function (response) {
            //handle error
            console.log(response);
        });
  
  }; 

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

async function updateFeatures_habitants(resourceMapping){   
    var resourceID = resourceMapping.kommonitorGeoresourceId;
    var propertyName = resourceMapping.propertyName;
    var targetPropertyName = resourceMapping.targetPropertyName;

    // var geoJSONString = JSON.stringify(geoJSON_allData);

    if(deleteFeaturesFirst){
        console.log("Send request to delete features for resourceId: ", resourceID);
        await deleteFeatures(resourceID);
    }     

    // then execute update request    
    console.log("Send request to update features for resourceId: ", resourceID);
    await updateFeatures(resourceID, propertyName, targetPropertyName);

    return true;
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

function updateFeatures(resourceID, propertyName, targetPropertyName){

    var propertyMapping = JSON.parse(JSON.stringify(propertyMapping_template));
    propertyMapping.attributes = [];
    propertyMapping.attributes.push({
        
            "mappingName": targetPropertyName,
            "name": propertyName,
            "type": "integer"
        
    });
    importerUpdateRequest_template.propertyMapping = propertyMapping;

    var postBody = JSON.parse(JSON.stringify(importerUpdateRequest_template));
    // postBody.dataSource.parameters[0].value = geoJSONString;
    postBody.georesourceId = resourceID;    

    return axios.post(targetURL_importer + "/georesources/update", postBody)
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
