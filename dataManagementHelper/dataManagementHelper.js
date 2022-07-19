const axios = require("axios");

const encryptionHelper = require("./EncryptionHelperService");
const keycloakHelper = require("kommonitor-keycloak-helper");

const propertyName_targetIndicator = "indicatorId";
const propertyName_indicatorId = "indicatorId";
const propertyName_baseIndicators = "requiredIndicatorIds";
const propertyName_georesources = "requiredGeoresourceIds";
const propertyName_georesourceId = "georesourceId";

// aquire connection details to KomMonitor data management api instance from environment variables
// construct fixed starting URL to make requests against running KomMonitor data management api
const kommonitorDataManagementURL = process.env.KOMMONITOR_DATA_MANAGEMENT_URL_GET;

async function fetchAllScriptsMetadata (){
    console.log("fetching script metadata array from KomMonitor data management API");

    var config = await keycloakHelper.requestAccessToken();
  
    //GET
    return await axios.get(kommonitorDataManagementURL + "/process-scripts", config)
      .then(response => {
        response = encryptionHelper.decryptAPIResponseIfRequired(response);
        return response.data;
      })
      .catch(error => {
        console.log("Error when fetching script metadata. Error was: " + error);
        throw error;
      });
}

async function fetchAllIndicatorsMetadata (){
    console.log("fetching indicator metadata array from KomMonitor data management API");

    var config = await keycloakHelper.requestAccessToken();
  
    //GET
    return await axios.get(kommonitorDataManagementURL + "/indicators", config)
      .then(response => {
        // response.data should be the script as byte[]
        response = encryptionHelper.decryptAPIResponseIfRequired(response);
        return response.data;
      })
      .catch(error => {
        console.log("Error when fetching indicators metadata. Error was: " + error);
        throw error;
      });
}

async function fetchAllGeoresourcesMetadata (){
    console.log("fetching georesources metadata array from KomMonitor data management API");

    var config = await keycloakHelper.requestAccessToken();
  
    //GET
    return await axios.get(kommonitorDataManagementURL + "/georesources", config)
      .then(response => {
        response = encryptionHelper.decryptAPIResponseIfRequired(response);
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