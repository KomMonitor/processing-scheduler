require('dotenv').config();

// import cron from "node-cron";
const cron = require("node-cron");
const indicatorProcessHelper = require("./indicatorProcessHelper/indicatorProcessHelper");

// run every day at 23:00 hours
cron.schedule("*/10 * * * * *", () => {
  console.log(`Begin check to find schedulable indicator processes`);
  
  indicatorProcessHelper.triggerIndicatorComputationForMissingTimestamps();
});