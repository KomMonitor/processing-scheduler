const dataManagementHelper = require("../dataManagementHelper/dataManagementHelper");
const processingEngineHelper = require("../processingEngineHelper/processingEngineHelper");

var TRIGGER_PAST_VALUES;
var NUMBER_OF_DAYS_FOR_PAST_TRIGGERING;

const triggerIndicatorComputationForMissingTimestamps = async function(TRIGGER_DATES_FROM_THE_PAST, NUMBER_OF_DAYS){

    TRIGGER_PAST_VALUES = TRIGGER_DATES_FROM_THE_PAST;
    NUMBER_OF_DAYS_FOR_PAST_TRIGGERING = NUMBER_OF_DAYS;

    if(TRIGGER_PAST_VALUES){
        console.log("TRIGGER_PAST_VALUES is set to true. Thus, already existing timestamps will be overwritten for past time period of '" + NUMBER_OF_DAYS_FOR_PAST_TRIGGERING + "' days.");
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

    // first trigger scripts that only require georesources or baseIndicators that are not computed as well
    var scripts_independentFromOtherScriptIndicators = findScripts_independentFromOtherScriptIndicators(allScriptsMetadata);

    // trigger other scripts (such scripts, that require an indicator that is also computed)
    var scripts_dependingOnOtherScriptIndicators = allScriptsMetadata.filter(scriptMetadata => {
        if (scripts_independentFromOtherScriptIndicators.includes(scriptMetadata)){
            return false;
        }
        return true;
    });

    await triggerScriptExecution(scripts_independentFromOtherScriptIndicators, allIndicatorsMetadata, allGeoresourcesMetadata);
    await triggerScriptExecution(scripts_dependingOnOtherScriptIndicators, allIndicatorsMetadata, allGeoresourcesMetadata);

    console.log("All scripts have been triggered.");
};

function findScripts_independentFromOtherScriptIndicators(allScriptsMetadata){
    var independantScripts = [];

    var computableIndicatorIdMap = new Map();
    
    for (const scriptMetadata of allScriptsMetadata) {
        computableIndicatorIdMap.set(scriptMetadata.indicatorId, scriptMetadata);   
    }

    for (const scriptMetadata of allScriptsMetadata) {
        var requiredIndicatorIds = scriptMetadata.requiredIndicatorIds;
        var isIndependentIndicator = true;
        
        for (const requiredIndicatorId of requiredIndicatorIds) {
            if(computableIndicatorIdMap.has(requiredIndicatorId)){
                isIndependentIndicator = false;
                break;
            }   
        }
        
        if(isIndependentIndicator){
            independantScripts.push(scriptMetadata);
        }
    }

    return independantScripts;
}

async function triggerScriptExecution(scriptsArray, allIndicatorsMetadata, allGeoresourcesMetadata){
    for (const scriptMetadata of scriptsArray) {
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

            try {
                if(missingTimestampsForTargetIndicator.length > 0){
                    console.log("Send indicator computation request for previously logged targetDates and script with id '" + scriptMetadata.scriptId + "' and targetIndicator with id '" + scriptMetadata.indicatorId + "'");            
                    await processingEngineHelper.triggerDefaultComputationForTimestamps(scriptMetadata, missingTimestampsForTargetIndicator);    
                } 
                else{
                    console.log("No time series elements have to be computed for script with id '" + scriptMetadata.scriptId + "' and targetIndicator with id '" + scriptMetadata.indicatorId + "'");
                }               
            } catch (error) {
                // repeat request with a time delay?
                console.error(error);
            }    
        } catch (error) {
            console.error(error);
        } 
    }
}

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

        missingTimestampsArray = appendMissingBaseIndicatorTimestamps(missingTimestampsArray, existingTargetIndicatorTimestamps, baseIndicatorsMetadataArray, updateInterval);
        
    }
    else{
        missingTimestampsArray = appendMissingBaseIndicatorTimestamps(missingTimestampsArray, missingTimestampsArray, baseIndicatorsMetadataArray, updateInterval);
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

function findEarliestCommonDate(baseIndicatorsMetadataArray){
    var earliestCommonDate;
    for (const baseIndicatorMetadata of baseIndicatorsMetadataArray) {
        if(baseIndicatorMetadata.applicableDates && baseIndicatorMetadata.applicableDates.length > 0){
            if (! earliestCommonDate){
                // the first value is the earliest as it comes sorted from Management API
                earliestCommonDate = baseIndicatorMetadata.applicableDates[0];
            }
            else{
                if((new Date(earliestCommonDate) < new Date(baseIndicatorMetadata.applicableDates[0]))){
                    earliestCommonDate = baseIndicatorMetadata.applicableDates[0];
                }
            }
        }
    }

    return earliestCommonDate;
}

function findLatestCommonDate(baseIndicatorsMetadataArray){
    var latestCommonDate;
    var USE_LATEST_POSSIBLE_BASE_INDICATOR_DATE_INSTEAD_OF_COMMON_DATE = JSON.parse(process.env.USE_LATEST_POSSIBLE_BASE_INDICATOR_DATE_INSTEAD_OF_COMMON_DATE);
    for (const baseIndicatorMetadata of baseIndicatorsMetadataArray) {
        if(baseIndicatorMetadata.applicableDates && baseIndicatorMetadata.applicableDates.length > 0){
            if (! latestCommonDate){
                // the last value is the latest as it comes sorted from Management API
                latestCommonDate = baseIndicatorMetadata.applicableDates[baseIndicatorMetadata.applicableDates.length - 1];
            }
            else{
                if(USE_LATEST_POSSIBLE_BASE_INDICATOR_DATE_INSTEAD_OF_COMMON_DATE){
                    if((new Date(latestCommonDate) < new Date(baseIndicatorMetadata.applicableDates[baseIndicatorMetadata.applicableDates.length - 1]))){
                        latestCommonDate = baseIndicatorMetadata.applicableDates[baseIndicatorMetadata.applicableDates.length - 1];
                    }
                }
                else{
                    if((new Date(latestCommonDate) > new Date(baseIndicatorMetadata.applicableDates[baseIndicatorMetadata.applicableDates.length - 1]))){
                        latestCommonDate = baseIndicatorMetadata.applicableDates[baseIndicatorMetadata.applicableDates.length - 1];
                    }
                }                
            }
        }
    }

    return latestCommonDate;
}

function anyBaseIndicatorHasNoApplicableDates(baseIndicatorsMetadataArray){
    for (const indicatorMetadata of baseIndicatorsMetadataArray) {
        if (! indicatorMetadata.applicableDates || indicatorMetadata.applicableDates.length == 0){
            return true;
        }
    }

    return false;
}

function appendMissingBaseIndicatorTimestamps(missingTimestampsArray, existingTargetIndicatorTimestamps, baseIndicatorsMetadataArray, updateInterval){

    if(anyBaseIndicatorHasNoApplicableDates(baseIndicatorsMetadataArray)){
        console.log("At least one baseIndicator has no applicableDates. Hence no indicaor computation can be triggered.");
        return [];
    }

    var earliestCommonDate = findEarliestCommonDate(baseIndicatorsMetadataArray);
    var latestCommonDate = findLatestCommonDate(baseIndicatorsMetadataArray);

    var overwritingBeginDate = getOverwritingBeginDate(existingTargetIndicatorTimestamps);

    if(! earliestCommonDate || earliestCommonDate == null || !latestCommonDate || latestCommonDate == null){
        return [];
    }

    if (!existingTargetIndicatorTimestamps.includes(earliestCommonDate) || (TRIGGER_PAST_VALUES && new Date(earliestCommonDate) >= overwritingBeginDate)){
        missingTimestampsArray.push(earliestCommonDate);
    }

    var nextCandidateTimestamp = getNextFutureTimestampCandidate(earliestCommonDate, updateInterval);

     while((new Date(nextCandidateTimestamp) <= (new Date(latestCommonDate)))){
        if (!existingTargetIndicatorTimestamps.includes(nextCandidateTimestamp) || (TRIGGER_PAST_VALUES && (new Date(nextCandidateTimestamp) >= overwritingBeginDate ) )){
          missingTimestampsArray.push(nextCandidateTimestamp);
        }
                   
        nextCandidateTimestamp = getNextFutureTimestampCandidate(nextCandidateTimestamp, updateInterval);
     } 

    return missingTimestampsArray;
}

function getOverwritingBeginDate(existingTargetIndicatorTimestamps) {
    var overwritingBeginDate;
    if (existingTargetIndicatorTimestamps && existingTargetIndicatorTimestamps.length > 0) {
        overwritingBeginDate = new Date(existingTargetIndicatorTimestamps[existingTargetIndicatorTimestamps.length - 1]);
    }
    else {
        overwritingBeginDate = new Date();
    }
    overwritingBeginDate.setDate(overwritingBeginDate.getDate() - NUMBER_OF_DAYS_FOR_PAST_TRIGGERING);
    return overwritingBeginDate;
}

function appendMissingGeoresourceTimestamps(missingTimestampsArray, existingTargetIndicatorTimestamps, georesourcesMetadataArray, updateInterval){

    var overwritingBeginDate = getOverwritingBeginDate(existingTargetIndicatorTimestamps);

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

            if (!existingTargetIndicatorTimestamps.includes(earliestGeoresourceStartDate) || (TRIGGER_PAST_VALUES && new Date(earliestGeoresourceStartDate) >= overwritingBeginDate)){
                missingTimestampsArray.push(earliestGeoresourceStartDate);
            }
            
            if (latestGeoresourceEndDate != null){
                // compute timestamps based on updateInterval until latestEndDate is reached
                var nextCandidateTimestamp = getNextFutureTimestampCandidate(earliestGeoresourceStartDate, updateInterval);

                while((new Date(nextCandidateTimestamp) < (new Date(latestGeoresourceEndDate)))){
                    if (!existingTargetIndicatorTimestamps.includes(nextCandidateTimestamp) || (TRIGGER_PAST_VALUES && new Date(nextCandidateTimestamp) >= overwritingBeginDate) ){
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
                    if (!existingTargetIndicatorTimestamps.includes(nextCandidateTimestamp) || (TRIGGER_PAST_VALUES && new Date(nextCandidateTimestamp) >= overwritingBeginDate)){
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
            throw Error("Update interval is set to arbitrary. It is impossible to determine the next indicatorTimestamp");  
    
        default:
            console.log("Update interval is set to arbitrary. It is impossible to determine the next indicatorTimestamp");            
            throw Error("Update interval is set to arbitrary. It is impossible to determine the next indicatorTimestamp");
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