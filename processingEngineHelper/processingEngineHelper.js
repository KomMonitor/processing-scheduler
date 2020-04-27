const axios = require("axios");

// aquire connection details to KomMonitor data management api instance from environment variables
const kommonitorProcessingEngineHost = process.env.KOMMONITOR_PROCESSING_ENGINE_HOST;
const kommonitorProcessingEnginePort = process.env.KOMMONITOR_PROCESSING_ENGINE_PORT;
const kommonitorProcessingEngineBasepath = process.env.KOMMONITOR_PROCESSING_ENGINE_BASEPATH;

// construct fixed starting URL to make requests against running KomMonitor data management api
const kommonitorProcessingEngineURL = "http://" + kommonitorProcessingEngineHost + ":" + kommonitorProcessingEnginePort + kommonitorProcessingEngineBasepath;

function buildPostBody(scriptMetadata, targetTimestamp){
    /*
        TEMPLATE

        {
            "georesourceIds": [
                "georesourceIds",
                "georesourceIds"
            ],
            "scriptId": "scriptId",
            "targetDate": "2000-01-23",
            "targetIndicatorId": "targetIndicatorId",
            "baseIndicatorIds": [
                "baseIndicatorIds",
                "baseIndicatorIds"
            ],
            "defaultProcessProperties": [
                {
                "dataType": "string",
                "name": "name",
                "value": "value"
                },
                {
                "dataType": "string",
                "name": "name",
                "value": "value"
                }
            ],
            "useAggregationForHigherSpatialUnits": true
        }
    */

    var postBody = {
        "georesourceIds": scriptMetadata.requiredIndicatorIds,
        "scriptId": scriptMetadata.scriptId,
        "targetDate": targetTimestamp,
        "targetIndicatorId": scriptMetadata.indicatorId,
        "baseIndicatorIds": scriptMetadata.requiredIndicatorIds,
        "defaultProcessProperties": [
        ],
        "useAggregationForHigherSpatialUnits": process.env.SETTING_AGGREGATE_SPATIAL_UNITS ? process.env.SETTING_AGGREGATE_SPATIAL_UNITS : false
      }

      for (const parameter of scriptMetadata.variableProcessParameters) {
          postBody.defaultProcessProperties.push({
            "dataType": parameter.dataType,
            "name": parameter.name,
            "value": parameter.defaultValue
          });
      }

      return postBody;
}

function triggerDefaultComputationForTimestamp(scriptMetadata, targetTimestamp){
    // send request to KomMonitor processing engine

    var postBody = buildPostBody(scriptMetadata, targetTimestamp);

    return axios.post(kommonitorDataManagementURL + "/process-scripts", postBody)
      .then(response => {
        console.log("Triggered job for script with id '" + scriptMetadata.scriptId + "' and timestamp '" + targetTimestamp + "'");
      })
      .catch(error => {
        console.error("Error while triggering job for script with id '" + scriptMetadata.scriptId + "' and timestamp '" + targetTimestamp + "'. Error is:\n" + error);
        throw error;
      });
}

exports.triggerDefaultComputationForTimestamp = triggerDefaultComputationForTimestamp;