import cron from "node-cron";
import indicatorProcessHelper from "./indicatorProcessHelper/indicatorProcessHelper";

require('dotenv').config();

// run every day at 23:00 hours
cron.schedule("0 23 * * *", () => {
  console.log(`Begin check to find schedulable indicator processes`);
  
  triggerIndicatorComputationForMissingTimestamps();
});