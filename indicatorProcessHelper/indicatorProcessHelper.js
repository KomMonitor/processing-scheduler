const dataManagementHelper = require("../dataManagementHelper/dataManagementHelper");
const processingEngineHelper = require("../processingEngineHelper/processingEngineHelper");

const TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES = JSON.parse(process.env.TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES);

const triggerIndicatorComputationForMissingTimestamps = async function(){

    if(TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES){
        console.log("TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES is set to true. Thus, already existing timestamps will be overwritten.");
    }
    // simple approach

    // get all scripts metadata from data management API

    // for each script metadata
    // identify targetIndicator and fetch its metadata
    // identify necessary base indicators and georesources
    
    // fetch base indicator and georesource metadata 
    // compare timestamps and identify missing timestamps according to updateInterval of targetIndicator
    // trigger computation for each missing timestamp
    
    var allScriptsMetadata = await dataManagementHelper.fetchAllScriptsMetadata();
    var allIndicatorsMetadata = await dataManagementHelper.fetchAllIndicatorsMetadata();
    var allGeoresourcesMetadata = await dataManagementHelper.fetchAllGeoresourcesMetadata();


    for (const scriptMetadata of allScriptsMetadata) {
        try {
            console.log("Start process for script with id '" + scriptMetadata.scriptId + "' and targetIndicator with id '" + scriptMetadata.indicatorId + "'");
            var targetIndicatorMetadata = dataManagementHelper.getScriptTargetIndicatorMetadata(scriptMetadata, allIndicatorsMetadata);
            var baseIndicatorsMetadataArray = dataManagementHelper.getScriptBaseIndicatorMetadataArray(scriptMetadata, allIndicatorsMetadata);
            var georesourcesMetadataArray = dataManagementHelper.getScriptGeoresourceMetadataArray(scriptMetadata, allGeoresourcesMetadata);

            console.log("Found a total number of '" + baseIndicatorsMetadataArray.length + "' baseIndicators");
            console.log("Found a total number of '" + georesourcesMetadataArray.length + "' georesources");
            
            var missingTimestampsForTargetIndicator = identifyMissingTimestampsForTargetIndicator(targetIndicatorMetadata, baseIndicatorsMetadataArray, georesourcesMetadataArray);
    
            console.log("Found a total number of '" + missingTimestampsForTargetIndicator.length + "' missing timestamps");

            console.log("Missing timestamp values are:\n " + missingTimestampsForTargetIndicator + "");
        for (const targetTimestamp of missingTimestampsForTargetIndicator) { 
            try {
                console.log("Send indicator computation request for targetDate '" + targetTimestamp + "' and script with id '" + scriptMetadata.scriptId + "' and targetIndicator with id '" + scriptMetadata.indicatorId + "'");            
                processingEngineHelper.triggerDefaultComputationForTimestamp(scriptMetadata, targetTimestamp);    
            } catch (error) {
                // repeat request with a time delay?
                console.error(error);
            }           
            
        }   
        } catch (error) {
            console.error(error);
        } 
    }
};

function identifyMissingTimestampsForTargetIndicator(targetIndicatorMetadata, baseIndicatorsMetadataArray, georesourcesMetadataArray){
    var missingTimestampsArray = [];

    // inspect updateInterval and available timestamps of targetIndicator

    // compare availableTimestamps of targetIndicator to availableTimestamps of baseIndicators and availableTimePeriods of georesources
    // to find missing timestamps that can be computed on the basis of baseInicators and georesources

    // for baseIndicators the exact same timestamp must be present

    // for georesources there must be a 

    // as STOP goal simply use current date in order to prevent infinite loop for all future timestamps

    var existingTargetIndicatorTimestamps = targetIndicatorMetadata.applicableDates;

    // if any base indicator is present then we do not have to inspect georesource time periods
    if(baseIndicatorsMetadataArray != null && baseIndicatorsMetadataArray != undefined && baseIndicatorsMetadataArray.length > 0){
        console.log("Finding missing timestamps from base indicators");
        missingTimestampsArray = findMissingTargetTimestamps_fromBaseIndicators(targetIndicatorMetadata, existingTargetIndicatorTimestamps, baseIndicatorsMetadataArray);
    }    
    else{
        console.log("Finding missing timestamps from georesources time periods as there are no base indicators");
        missingTimestampsArray = findMissingTargetTimestamps_fromGeoresources(targetIndicatorMetadata, existingTargetIndicatorTimestamps, georesourcesMetadataArray);
    } 

    return missingTimestampsArray;
    
}

function findMissingTargetTimestamps_fromBaseIndicators(targetIndicatorMetadata, existingTargetIndicatorTimestamps, baseIndicatorsMetadataArray){
    var missingTimestampsArray = [];

    // CAN BE ARBITRARY|DAILY|WEEKLY|MONTHLY|HALF_YEARLY|YEARLY
    var updateInterval = targetIndicatorMetadata.metadata.updateInterval;

    // can be null/undefined or empty - otherwise sorted array of "YYYY-MM-DD"
    var existingTargetIndicatorTimestamps = targetIndicatorMetadata.applicableDates;

    // for base indicators only the exact dates and update interval are relevant
    if(existingTargetIndicatorTimestamps != undefined && existingTargetIndicatorTimestamps != null && existingTargetIndicatorTimestamps.length > 0){
        // take first timestamp and find any past and future date according to updateInterval

        var firstExistingTimestamp = existingTargetIndicatorTimestamps[0];

        missingTimestampsArray = appendMissingBaseIndicatorTimestamps_priorToReferenceTimestamp(missingTimestampsArray, firstExistingTimestamp, existingTargetIndicatorTimestamps, georesourcesMetadataArray, updateInterval);
    }

    return missingTimestampsArray;
    
}

function findMissingTargetTimestamps_fromGeoresources(targetIndicatorMetadata, existingTargetIndicatorTimestamps, georesourcesMetadataArray){
    var missingTimestampsArray = [];

    // CAN BE ARBITRARY|DAILY|WEEKLY|MONTHLY|HALF_YEARLY|YEARLY
    var updateInterval = targetIndicatorMetadata.metadata.updateInterval;

    // can be null/undefined or empty - otherwise array of "YYYY-MM-DD"
    var existingTargetIndicatorTimestamps = targetIndicatorMetadata.applicableDates;

    // for georesources we must align the updateInterval of targetIndicator and the availablePeriodsOfValidity for georesources
    if(existingTargetIndicatorTimestamps != undefined && existingTargetIndicatorTimestamps != null && existingTargetIndicatorTimestamps.length > 0){
        // take first timestamp and find any past and future date according to updateInterval

        missingTimestampsArray = appendMissingGeoresourceTimestamps(missingTimestampsArray, existingTargetIndicatorTimestamps, georesourcesMetadataArray, updateInterval);
        
    }
    else{
        missingTimestampsArray = appendMissingGeoresourceTimestamps(missingTimestampsArray, missingTimestampsArray, georesourcesMetadataArray, updateInterval);
    }

    return missingTimestampsArray;
}
        

function appendMissingGeoresourceTimestamps(missingTimestampsArray, existingTargetIndicatorTimestamps, georesourcesMetadataArray, updateInterval){

    for (const georesourceMetadata of georesourcesMetadataArray) {

        // sorted array of 
        /*
            {
                "startDate": "2018-03-01",
                "endDate": "2018-03-06" // may be null
            }
        */
        var georesource_timePeriods = georesourceMetadata.availablePeriodsOfValidity;

        var earliestGeoresourceStartDate = getEarliestGeoresourceStartDate(georesource_timePeriods);
        // may be null to indicate that there is no actual end date, but the feature is valid forever
        var latestGeoresourceEndDate = getLatestGeoresourceEndDate(georesource_timePeriods);

            if (missingTimestampsArray.length == 0){
                missingTimestampsArray.push(earliestGeoresourceStartDate);
            }
            
            if (latestGeoresourceEndDate != null){
                // compute timestamps based on updateInterval until latestEndDate is reached
                var nextCandidateTimestamp = getNextFutureTimestampCandidate(earliestGeoresourceStartDate, updateInterval);

                while((new Date(nextCandidateTimestamp) < (new Date(latestGeoresourceEndDate)))){
                    if (TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES || !existingTargetIndicatorTimestamps.includes(nextCandidateTimestamp)){
                        missingTimestampsArray.push(nextCandidateTimestamp);
                    }
                    
                    nextCandidateTimestamp = getNextFutureTimestampCandidate(nextCandidateTimestamp, updateInterval);
                }
                
            }
            else{
                // compute timestamps based on updateInterval until current day is reached
                var nextCandidateTimestamp = getNextFutureTimestampCandidate(earliestGeoresourceStartDate, updateInterval);

                var today = new Date(Date.now());

                while((new Date(nextCandidateTimestamp) < today)){
                    if (TRIGGER_COMPUTATION_OF_ALL_VALID_TIMESTAMPS_OVERWRITING_EXISTING_VALUES || !existingTargetIndicatorTimestamps.includes(nextCandidateTimestamp)){
                        missingTimestampsArray.push(nextCandidateTimestamp);
                    }

                    nextCandidateTimestamp = getNextFutureTimestampCandidate(nextCandidateTimestamp, updateInterval);
                }

            }
    }

    return missingTimestampsArray;
}

function getEarliestGeoresourceStartDate(georesource_timePeriods){
    var earliestStartDate;
    for (const timePeriod of georesource_timePeriods) {
        if(! earliestStartDate){
            earliestStartDate = new Date(timePeriod.startDate);
        }
        else{
            var startDateCandidate = new Date (timePeriod.startDate);
            if(startDateCandidate < earliestStartDate){
                earliestStartDate = startDateCandidate;
            } 
        }
    }

    return formatDateAsString(earliestStartDate);
}

function getLatestGeoresourceEndDate(georesource_timePeriods){
    var latestEndDate;
    for (const timePeriod of georesource_timePeriods) {
        if(! latestEndDate){
            latestEndDate = new Date(timePeriod.endDate);
        }
        else{
            var endDateCandidate = new Date (timePeriod.endDate);
            if(endDateCandidate > latestEndDate){
                latestEndDate = endDateCandidate;
            } 
        }

        if (latestEndDate === null){
            break;
        }
    }

    if (latestEndDate != null){
        latestEndDate = formatDateAsString(latestEndDate);
    }

    return latestEndDate;
}

// function isValidDate(candidateTimestamp){
//     try {
//         var date = Date.parse(candidateTimestamp);
//         var now = Date.now();

//         // for now simply check if candidate is not in the future of current execution
//         if(date > now){
//             return false;
//         }
//         return true;
//     } catch (error) {
//         console.error("candidateTimestamp value cannot be parsed as Date. Value was: '" + candidateTimestamp + "'");
//         return false;
//     }    
// }

function getNextFutureTimestampCandidate(referenceTimestamp, updateInterval){
    // var date = Date.parse(referenceTimestamp);
    var date = new Date(referenceTimestamp);

    switch (updateInterval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;   
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;  
        case "QUARTERLY":
            date.setMonth(date.getMonth() + 3);
            break;     
        case "HALF_YEARLY":
            date.setMonth(date.getMonth() + 6);
        break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;   
        case "ARBITRARY":
            console.log("Update interval is set to arbitrary. It is impossible to determine the next indicatorTimestamp");
            break;     
    
        default:
            console.log("Update interval is set to arbitrary. It is impossible to determine the next indicatorTimestamp");
            break;
    }

    return  formatDateAsString(date);
}

function formatDateAsString(date){
    var dateString = "";
    dateString += date.getFullYear() + "-";

    var month = date.getMonth() + 1;
    if(month < 10){
        month = "0" + month;
    }

    var day = date.getDate();
    if(day < 10){
        day = "0" + day;
    }

    dateString += month + "-" + day;

    return dateString;
}

exports.triggerIndicatorComputationForMissingTimestamps = triggerIndicatorComputationForMissingTimestamps;