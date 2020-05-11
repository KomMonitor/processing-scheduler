require('dotenv').config();

if(JSON.parse(process.env.DISABLE_LOGS)){
    console.log = function(){};
}

var cronPattern = process.env.CRON_PATTERN_FOR_SCHEDULING;

// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

console.log("Initialize with cron schedule '" + cronPattern + "'");

// run every day at 00:30 hours
cron.schedule(cronPattern, () => {
  console.log("Begin check to find schedulable indicator processes");
  
  indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps();
});