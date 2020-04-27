const axios = require("axios");

// aquire connection details to KomMonitor data management api instance from environment variables
const kommonitorDataManagementHost = process.env.KOMMONITOR_DATA_MANAGEMENT_HOST;
const kommonitorDataManagementPort = process.env.KOMMONITOR_DATA_MANAGEMENT_PORT;
const kommonitorDataManagementBasepath = process.env.KOMMONITOR_DATA_MANAGEMENT_BASEPATH;

const propertyName_targetIndicator = "indicatorId";
const propertyName_indicatorId = "indicatorId";
const propertyName_baseIndicators = "requiredIndicatorIds";
const propertyName_georesources = "requiredGeoresourceIds";
const propertyName_georesourceId = "georesourceId";

// construct fixed starting URL to make requests against running KomMonitor data management api
const kommonitorDataManagementURL = "http://" + kommonitorDataManagementHost + ":" + kommonitorDataManagementPort + kommonitorDataManagementBasepath;

function fetchAllScriptsMetadata (){
    console.log("fetching script metadata array from KomMonitor data management API");
  
    //GET
    return axios.get(kommonitorDataManagementURL + "/process-scripts")
      .then(response => {
        // response.data should be the script as byte[]
        return response.data;
      })
      .catch(error => {
        console.log("Error when fetching script metadata. Error was: " + error);
        throw error;
      });
}

function fetchAllIndicatorsMetadata (){
    console.log("fetching indicator metadata array from KomMonitor data management API");
  
    //GET
    return axios.get(kommonitorDataManagementURL + "/indicators")
      .then(response => {
        // response.data should be the script as byte[]
        return response.data;
      })
      .catch(error => {
        console.log("Error when fetching indicators metadata. Error was: " + error);
        throw error;
      });
}

function fetchAllGeoresourcesMetadata (){
    console.log("fetching georesources metadata array from KomMonitor data management API");
  
    //GET
    return axios.get(kommonitorDataManagementURL + "/georesources")
      .then(response => {
        // response.data should be the script as byte[]
        return response.data;
      })
      .catch(error => {
        console.log("Error when fetching georesources metadata. Error was: " + error);
        throw error;
      });
}

function getIndicatorMetadata(indicatorId, allIndicatorsMetadataArray){
    for (const indicatorMetadata of allIndicatorsMetadataArray) {
        if(indicatorMetadata[propertyName_indicatorId] === indicatorId){
            return indicatorMetadata;
        }
    }

    throw Error("No metadata entry found for indicator with id '" + indicatorId + "'");
}

function getGeoresourceMetadata(georesourceId, allGeoresourcesMetadataArray){
    for (const georesourceMetadata of allGeoresourcesMetadataArray) {
        if(georesourceMetadata[propertyName_georesourceId] === georesourceId){
            return georesourceMetadata;
        }
    }

    throw Error("No metadata entry found for georesource with id '" + georesourceId + "'");
}

function getScriptTargetIndicatorMetadata(scriptMetadata, allIndicatorsMetadata){
    var targetIndicatorId = scriptMetadata[propertyName_targetIndicator];

    return getIndicatorMetadata(targetIndicatorId, allIndicatorsMetadata);
}

function getScriptBaseIndicatorMetadataArray(scriptMetadata, allIndicatorsMetadata){
    var baseIndicatorIds = scriptMetadata[propertyName_baseIndicators];
    var baseIndicatorsMetadataArray = [];

    for (const baseIndicatorId of baseIndicatorIds) {
        baseIndicatorsMetadataArray.push(getIndicatorMetadata(baseIndicatorId, allIndicatorsMetadata));
    }

    return baseIndicatorsMetadataArray;
}

function getScriptGeoresourceMetadataArray(scriptMetadata, allGeoresourcesMetadata){
    var georesourceIds = scriptMetadata[propertyName_georesources];
    var georesourcesMetadataArray = [];

    for (const georesourceId of georesourceIds) {
        georesourcesMetadataArray.push(getGeoresourceMetadata(georesourceId, allGeoresourcesMetadata));
    }

    return georesourcesMetadataArray;
}

exports.fetchAllScriptsMetadata = fetchAllScriptsMetadata;
exports.fetchAllIndicatorsMetadata = fetchAllIndicatorsMetadata;
exports.fetchAllGeoresourcesMetadata = fetchAllGeoresourcesMetadata;

exports.getScriptTargetIndicatorMetadata = getScriptTargetIndicatorMetadata;
exports.getScriptBaseIndicatorMetadataArray = getScriptBaseIndicatorMetadataArray;
exports.getScriptGeoresourceMetadataArray = getScriptGeoresourceMetadataArray;