require('dotenv').config();

if(JSON.parse(process.env.DISABLE_LOGS)){
    console.log = function(){};
}

/*
* initialise keycloak dependant URLs to management endpoints
*/
process.env.KOMMONITOR_DATA_MANAGEMENT_URL_CRUD = process.env.KOMMONITOR_DATA_MANAGEMENT_URL;
process.env.KOMMONITOR_DATA_MANAGEMENT_URL_GET = process.env.KOMMONITOR_DATA_MANAGEMENT_URL;
// if keycloak is not enabled we must use the public endpoints of management component for GET requests.
if (! process.env.KEYCLOAK_ENABLED){
  process.env.KOMMONITOR_DATA_MANAGEMENT_URL_GET = process.env.KOMMONITOR_DATA_MANAGEMENT_URL + "/public";
}

var cronPattern = process.env.CRON_PATTERN_FOR_SCHEDULING;

// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

const TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES = JSON.parse(process.env.TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES);
const NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES = process.env.NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES;
if (NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES == undefined || NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES == null || Number.isNaN(NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES)){
    NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES = 0;
}


console.log("Initialize with cron schedule '" + cronPattern + "'");

// run every day at 00:30 hours
cron.schedule(cronPattern, () => {
  console.log("Begin check to find schedulable indicator processes");
  
  try {
    
  indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps(TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES, NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES); 
  } catch (error) {
    console.error(error);
  }
});