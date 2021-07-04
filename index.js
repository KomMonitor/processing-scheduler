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
if (! JSON.parse(process.env.KEYCLOAK_ENABLED)){
  process.env.KOMMONITOR_DATA_MANAGEMENT_URL_GET = process.env.KOMMONITOR_DATA_MANAGEMENT_URL + "/public";
}

var cronPattern = process.env.CRON_PATTERN_FOR_SCHEDULING;
var cronPattern_coronaImport = process.env.CRON_PATTERN_FOR_CORONA_IMPORT;
var cronPattern_recomputationAllTimestamps = process.env.CRON_PATTERN_FOR_RECOMPUTATION_ALL_TIMESTAMPS;

var triggerHabitantsImport = JSON.parse(process.env.TRIGGER_HABITANTS_IMPORT);


// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

const TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES = JSON.parse(process.env.TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES);
const NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES = process.env.NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES;
if (NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES == undefined || NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES == null || Number.isNaN(NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES)){
    NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES = 0;
}


console.log("Initialize with cron schedule '" + cronPattern + "'");

// console.log("Initialize complete recomputation with cron schedule '" + cronPattern_recomputationAllTimestamps + "'");

console.log("Initialize corona import with cron schedule '" + cronPattern_coronaImport + "'");

// COMPUTE MISSING INDICATOR TIMESTAMPS
cron.schedule(cronPattern, () => {
  console.log("Begin check to find schedulable indicator processes");
  
  try {
    
    indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps(TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES, NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES); 
  } catch (error) {
    console.error(error);
  }
});


// RECOMPUTE ALL CORONA INDICATORS
// cron.schedule(cronPattern_recomputationAllTimestamps, () => {
//   console.log("Retrigger indicator computation for all data (set number of days for past triggering to 1000 days)");
  
//   try {
    
//     indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps(true, 1000); 
//   } catch (error) {
//     console.error(error);
//   }
// });


const importCoronaPointsHelper = require("./dataIntegration_coronitor/import-corona-points");
const importHabitantsPointsHelper = require("./dataIntegration_coronitor/import-habitants-points");

// CORONA IMPORT
cron.schedule(cronPattern_coronaImport, () => {
  console.log("Trigger Import of Corona points");
  
  try {
    
    importCoronaPointsHelper.importCSVDataToKomMonitor(); 
  } catch (error) {
    console.error(error);
  }
});

if (triggerHabitantsImport){
  console.log("Trigger one time Import of Habitants points");

  importHabitantsPointsHelper.importCSVDataToKomMonitor();
}

