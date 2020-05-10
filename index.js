require('dotenv').config();

if(JSON.parse(process.env.DISABLE_LOGS)){
    console.log = function(){};
}

// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

// run every day at 00:30 hours
cron.schedule("0 30 0 1/1 * ? *", () => {
  console.log(`Begin check to find schedulable indicator processes`);
  
  indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps();
});