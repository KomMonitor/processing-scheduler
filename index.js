require('dotenv').config();

if(JSON.parse(process.env.DISABLE_LOGS)){
    console.log = function(){};
}

// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

// run every day at 23:00 hours
cron.schedule(" 20 0 * * *", () => {
  console.log(`Begin check to find schedulable indicator processes`);
  
  indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps();
});