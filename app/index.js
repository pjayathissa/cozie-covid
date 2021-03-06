import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import { HeartRateSensor } from "heart-rate";
import { today } from "user-activity";
import * as util from "../common/utils";
import { user } from "user-profile";
import { goals } from "user-activity";
import { battery } from "power";
import * as messaging from "messaging";
import { vibration } from "haptics";
import * as fs from "fs";
import { geolocation } from "geolocation";

import { inbox } from "file-transfer";
import { outbox } from "file-transfer";
import * as cbor from "cbor";
import { memory } from "system";
import { BodyPresenceSensor } from "body-presence";

import covidFlow from "../resources/flows/covid-flow";

console.log(JSON.stringify(covidFlow));

const production = true; // false for dev / debug releases

//-------- CLOCK FACE DESIGN -----------

const months = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec",
};

const weekdays = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    0: "Sun",
};

// Update the clock every minute
clock.granularity = "seconds";

// read HR data
let hrLabel = document.getElementById("hrm");
hrLabel.text = "--";
let chargeLabel = document.getElementById("chargeLabel");

var hrm = new HeartRateSensor();
hrm.onreading = function() {
    // Peek the current sensor values
    // console.log("Current heart rate: " + hrm.heartRate);
    hrLabel.text = `${hrm.heartRate}`;
    if (user.heartRateZone(hrm.heartRate) === "fat-burn") {
        hrLabel.style.fill = "fb-peach"; //yelow
    } else if (user.heartRateZone(hrm.heartRate) === "cardio") {
        hrLabel.style.fill = "fb-orange"; //light red
    } else if (user.heartRateZone(hrm.heartRate) === "peak") {
        hrLabel.style.fill = "fb-red"; //pink
    } else if (user.heartRateZone(hrm.heartRate) === "out-of-range") {
        hrLabel.style.fill = "fb-green"; //blue
    }
};

// Begin monitoring the sensor
hrm.start();

// Get a handle on the <text> elements
const timeLabel = document.getElementById("timeLabel");
let steps = document.getElementById("steps");
let dateLabel = document.getElementById("dateLabel");
let secLabel = document.getElementById("secLabel");
let storageLabel = document.getElementById("storageLabel");
// Note that dev elements are hidden in production mode
let devMemoryLabel = document.getElementById("devMemoryLabel");
let devHeartStorageLabel = document.getElementById("devHeartStorageLabel");
let devErrorLabel = document.getElementById("devErrorLabel");
let devErrorMessageLabel = document.getElementById("devErrorMessageLabel");

// set the local_file which will be used to store data
let local_file;

// function that runs in the background and start vibration to remind the user to complete the survey
const buzzOptions = {
    0: [],
    1: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    2: [9, 11, 13, 15, 17, 19, 21],
    3: [9, 12, 15, 18, 21],
};

const bodyPresence = new BodyPresenceSensor();
if (BodyPresenceSensor) {
    console.log("This device has a BodyPresenceSensor!");
    bodyPresence.addEventListener("reading", () => {
        console.log(
            `The device is ${
                bodyPresence.present ? "" : "not"
            } on the user's body.`
        );
    });
    bodyPresence.start();
} else {
    console.log("This device does NOT have a BodyPresenceSensor!");
}

let buzzSelection = 2; // default value
let vibrationTimeArray = buzzOptions[buzzSelection];
let completedVibrationCycleDay = false; // keeps in memory weather the watch has vibrated at all hours
let startDay = new Date().getDay(); // get the day when the app started for the first time

setInterval(function() {
    const currentDate = new Date(); // get today's date
    const currentDay = currentDate.getDay(); // get today's day
    const currentHour = currentDate.getHours();

    try {
        const buzzSelection = parseInt(
            fs.readFileSync("buzzSelection.txt", "json").buzzSelection
        ); // read user selection
        vibrationTimeArray = buzzOptions[buzzSelection];
    } catch (err) {
        console.log(err);
    }

    if (currentDay !== startDay) {
        // if it is a new day check user
        startDay = currentDay;
        completedVibrationCycleDay = false;
    }

    const maxHour = vibrationTimeArray.reduce(function(a, b) {
        return Math.max(a, b);
    });

    if (!completedVibrationCycleDay) {
        if (
            vibrationTimeArray[0] === currentHour &&
            today.adjusted.steps > 300 &&
            bodyPresence.present
        ) {
            // vibrate only if the time is right and the user has walked at least 300 steps and the watch is worn
            // this ensures that the watch does not vibrate if the user is still sleeping
            vibrate();
            const firstElement = vibrationTimeArray.shift();
            vibrationTimeArray.push(firstElement);
            if (currentHour == maxHour) {
                completedVibrationCycleDay = true;
            }
        } else if (vibrationTimeArray[0] < currentHour) {
            // the vector is shifted by one since the that hour is already passed
            const firstElement = vibrationTimeArray.shift();
            vibrationTimeArray.push(firstElement);
        }
    }
}, 600000); // timeout for 10 minutes

clock.ontick = (evt) => {
    let today_dt = evt.date;
    let hours = today_dt.getHours();
    if (preferences.clockDisplay === "12h") {
        // 12h format
        hours = hours % 12 || 12;
    } else {
        // 24h format
        hours = util.monoDigits(util.zeroPad(hours));
    }
    let mins = util.monoDigits(util.zeroPad(today_dt.getMinutes()));
    let secs = util.monoDigits(util.zeroPad(today_dt.getSeconds()));

    timeLabel.text = `${hours}:${mins}`;
    secLabel.text = secs;

    let month = months[today_dt.getMonth()];
    let weekday = weekdays[today_dt.getDay()];
    let day = today_dt.getDate();

    dateLabel.text = `${weekday}, ${month} ${day}`;

    // Steps
    steps.text = `${Math.floor(today.adjusted.steps / 1000) || 0}k`;
    if (steps.text >= (goals.steps || 0)) {
        steps.style.fill = "fb-green"; //green
    } else if (steps.text >= (goals.steps || 0) / 2) {
        steps.style.fill = "fb-peach"; //yellow
    } else {
        steps.style.fill = "fb-orange"; //pink
    }

    //get screen width
    let charge = battery.chargeLevel / 100;
    chargeLabel.width = 300 * charge;
    if (charge < 0.15) {
        chargeLabel.style.fill = "fb-red";
    } else if (charge < 0.3) {
        chargeLabel.style.fill = "fb-peach";
    } else {
        chargeLabel.style.fill = "fb-light-gray";
    }
};

//-------- END (CLOCK FACE DESIGN) -----------

//-------- READING EXPERIMENT QUESTIONS FROM PHONE SETTINGS -----------

console.log("WARNING!! APP HAS RESET");

//Flow GUIs
const clockface = document.getElementById("clockface");
const indoorOutdoor = document.getElementById("indoor-outdoor");
const inOffice = document.getElementById("inoffice");
const warmCold = document.getElementById("warm-cold");
const brightDim = document.getElementById("bright-dim");
const loudQuiet = document.getElementById("loud-quiet");
const happySad = document.getElementById("happy-sad");
const clothing = document.getElementById("clothing");
const svg_air_vel = document.getElementById("svg_air_vel");
const svg_met = document.getElementById("metabolic_rate");
const svg_change = document.getElementById("any_change");
//Clock manipulation guis
const thankyou = document.getElementById("thankyou");
const svg_stop_survey = document.getElementById("stopSurvey");
const clockblock = document.getElementById("clockblock");

const jsonFlow = document.getElementById("json-flow");
const jsonFlowNumerical = document.getElementById("json-flow-numerical");

// Default shows only thank you screen in the flow
let flow_views = [jsonFlow, thankyou,jsonFlowNumerical];
// Used to set all views to none when switching between screens
const allViews = [clockface, thankyou, clockblock, svg_stop_survey, jsonFlow, jsonFlowNumerical];
let flowSelectorUpdateTime = 0;

// Flow may have been previously saved locally as flow.txt
let flowFileRead;
var flowFileWrite;
var buzzFileWrite;
let flowSelector;

try {
    flowFileRead = fs.readFileSync("flow.txt", "json");
    console.log(JSON.stringify(flowFileRead));
    console.log(JSON.stringify(flowFileRead.flowSelector));
    flowSelector = flowFileRead.flowSelector;
    mapFlows(flowSelector);
    console.log("flows loaded via file sync");
} catch (err) {
    console.log(err);
    console.log("resetting flows");
    flowSelector = [];
}

//recieve message via peer socket
messaging.peerSocket.onmessage = function(evt) {
    console.log("settings received on device");
    console.log(JSON.stringify(evt));

    if (evt.data.key === "flow_index") {
        flowSelector = evt.data.data;
        flowSelectorUpdateTime = evt.data.time;
        console.log("flow selector from peer socket is", flowSelector);
        mapFlows(flowSelector);
        //save flows locally in event of app rest
        flowFileWrite = { flowSelector: flowSelector };
        console.log(JSON.stringify(flowFileWrite));
        fs.writeFileSync("flow.txt", flowFileWrite, "json");
        console.log("flowSelector, files saved locally");
    } else if (evt.data.key === "buzz_time") {
        buzzFileWrite = { buzzSelection: evt.data.data };
        console.log(evt.data.data);
        fs.writeFileSync("buzzSelection.txt", buzzFileWrite, "json");
        console.log("buzzSelection, files saved locally");
        buzzSelection = fs.readFileSync("buzzSelection.txt", "json")
            .buzzSelection;
        console.log("Buzz Selection is", buzzSelection);
    } else if (evt.data.key === "error") {
        console.log("error message called and displaying on watch");
        if (!production) {
            devErrorLabel.text = evt.data.data.type;
            devErrorMessageLabel.text = evt.data.data.message;
        }
    }

    console.log("end message socket");
};

// receive message via inbox
function processAllFiles() {
    let fileName;
    while ((fileName = inbox.nextFile())) {
        console.log(`/private/data/${fileName} is now available`);
        let fileData = fs.readFileSync(`${fileName}`, "cbor");
        console.log(JSON.stringify(fileData));
        console.log("settings received via file transfer");
        if (fileData.time > flowSelectorUpdateTime) {
            flowSelectorUpdateTime = fileData.time;
            if (fileData.key === "flow_index") {
                flowSelector = fileData.data;
                mapFlows(flowSelector);
                console.log("settings updated via file transfer");

                //save flows locally in event of app rest
                flowFileWrite = { flowSelector: flowSelector };
                console.log(JSON.stringify(flowFileWrite));
                fs.writeFileSync("flow.txt", flowFileWrite, "json");
                console.log("files saved locally");
            } else if (fileData.key === "buzz_time") {
                buzzSelection = fileData.data;
                console.log("buzz selection is", buzzSelection);
                buzzFileWrite = { buzzSelection: fileData.data };
                fs.writeFileSync("buzzSelection.txt", buzzFileWrite, "json");
            } else if (fileData.key === "error") {
                console.log("error message called and displaying on watch");
                if (!production) {
                    devErrorLabel.text =
                        fileData.data.type + " " + Date(fileData.time);
                    devErrorMessageLabel.text = fileData.data.message;
                }
            }
        } else {
            console.log("settings already updated via peer socket");
        }
    }
}

//TODO: check if this is needed still
function mapFlows(flowSelector) {
    flow_views = [];
    if (flowSelector) {
        flowSelector.map((index) => {
            flow_views.push(allViews[index]);
        });
    }
    flow_views.push(thankyou);
}

inbox.addEventListener("newfile", processAllFiles);
processAllFiles();

//-------- END (READING EXPERIMENT QUESTIONS FROM PHONE SETTINGS) -----------

//-------- DEFINE VIEWS AND DATA COLLECTION BASED ON FLOW SELECTOR -----------

let currentView = 0; //current view of flow

// home screen buttons
const comfy = document.getElementById("comfy");
const notComfy = document.getElementById("not-comfy");

// flow buttons
const flow_back = document.getElementById("flow_back");
const flow_stop = document.getElementById("flow_stop");

// flow buttons json
const centerButton = document.getElementById("new-button-center");
const rightButton = document.getElementById("new-button-right");
const leftButton = document.getElementById("new-button-left");

function showThankYou() {
    allViews.map((v) => (v.style.display = "none"));
    if (flow_views.length >= 1) {
        flowSelector.map((index) => {});
    }
    clockface.style.display = "inline";
    thankyou.style.display = "inline";

    //Find out how many seconds has passed to give response
    const endFeedback = new Date();
    const startFeedback = new Date(feedbackData["startFeedback"]);
    feedbackData["responseSpeed"] = (endFeedback - startFeedback) / 1000.0;
    feedbackData["endFeedback"] = endFeedback.toISOString();
    if (BodyPresenceSensor) {
        feedbackData["bodyPresence"] = bodyPresence.present;
    }
    console.log(feedbackData["responseSpeed"]);

    //send feedback to companion
    sendEventIfReady(feedbackData);
    feedbackData = {};
    setTimeout(() => {
        showClock();
    }, 2000);
    currentView = 0;
}

function showMessageStopSurvey() {
    allViews.map((v) => (v.style.display = "none"));
    
    // highlight all the icons corresponding to the questions selected in the fitbit app
    flowSelector.map((index) => {});
    clockface.style.display = "inline";
    svg_stop_survey.style.display = "inline";

    //clear feedback data recorded
    feedbackData = {};
    setTimeout(() => {
        showClock();
    }, 2000);
}

function showClock() {
    allViews.map((v) => (v.style.display = "none"));
    clockface.style.display = "inline";
    currentView = 0;
}

var feedbackData; // Global variable for handling feedbackData
let votelog; // Global variable for handling votelogs

function initiateFeedbackData() {
    // Initiating feedback data
    const startFeedback = new Date().toISOString();
    // Initiate feedbackData object
    feedbackData = {
        startFeedback,
        heartRate: hrm.heartRate,
    };

    // reading log file for debuging purposes
    try {
        console.log("checking if local file exists");
        votelog = fs.readFileSync("votelog.txt", "json");
    } catch (err) {
        // if can't read set local file to empty
        console.log("creating empty votelog.txt file");
        votelog = [0];
    }
    // Incremement the vote log by one
    votelog[0]++;
    console.log(votelog[0]);
    // add the votelog to the feedback data json
    feedbackData["voteLog"] = votelog[0];
    // store the votelog on the device as votelog.txt
    fs.writeFileSync("votelog.txt", votelog, "json");
}

let buttons = [
    {
        value: 10,
        obj: comfy,
        attribute: "comfort",
    },
    {
        value: 9,
        obj: notComfy,
        attribute: "comfort",
    },
    {
        value: "flow_back",
        obj: flow_back,
        attribute: "flow_control",
    },
    {
        value: "flow_stop",
        obj: flow_stop,
        attribute: "flow_control",
    },
    {
        value: 9,
        obj: centerButton,
        attribute: "air-vel",
    },
    {
        value: 10,
        obj: rightButton,
        attribute: "air-vel",
    },
    {
        value: 11,
        obj: leftButton,
        attribute: "air-vel",
    },
];

for (const button of buttons) {
    button.obj.addEventListener("click", () => {
        /** Constantly monitors if any buttons have been pressed */
        // init data object on first view click
        if (button.attribute === "comfort") {
            // if any of the two buttons in the main view have been pressed initiate the loop through the selected

            initiateFeedbackData();
            feedbackData["ok"] = button.value;
        } else if (button.attribute === "flow_control") {
            // if any of the two buttons (back arrow or cross) have been selected
            if (button.value === "flow_back") {
                // decrease the value of currentView by 2 to go to previous view
                currentView--;
                currentView--;
                if (currentView < 0) {
                    // if user pressed back button in first question survey
                    showMessageStopSurvey();
                } else {
                    // show previous view with flowback set to true
                    let flowback;
                    showFace((flowback = true));
                }
            } else if (button.value === "flow_stop") {
                // stop_flow button was pressed
                showMessageStopSurvey();
            }
        }

        console.log(`${button.value} clicked`);

        if (button.attribute !== "flow_control") {
            if (button.attribute != "comfort" && covidFlow[currentView-1].name.indexOf("confirm") == -1) {
                console.log(currentView);
                //need to associate it to the prevous view
                feedbackData[covidFlow[currentView - 1].name] = button.value;
            }
            console.log(JSON.stringify(feedbackData));

            if (covidFlow.length == currentView) {
                console.log("all covid flow done, showing thankyou");
                // if all the views have already been shown
                showThankYou();
            } else {
                console.log("next question");

                showFace();
            }
        }
    });
}

function showFace(flowback = false) {
    let skipQuestion = false;

    // go through all views and set to none
    allViews.map((v) => {
        v.style.display = "none";
    });
    
    // check if numerical input is required and set Flow
    if (covidFlow[currentView].type === "numerical") {
        jsonFlowNumerical.style.display = "inline";
    } else {
        jsonFlow.style.display = "inline";
    }
        
    
    //Does current flow have any requirements?
    if (covidFlow[currentView].requiresAnswer.length !== 0) {
        //if so, see if the current feedback meets throse requirements
        covidFlow[currentView].requiresAnswer.map((req) => {
            if (feedbackData[req.question] != req.value) {
                //requirements not met, skipping question
                skipQuestion = true;
            }
        });
    }

    if (skipQuestion === false) {
        // Set title of question
        

        if (covidFlow[currentView].type === "numerical") {
            document.getElementById("question-text-numerical").text = covidFlow[currentView].questionText;
            document.getElementById("question-second-text-numerical").text = covidFlow[currentView].questionSecondText;
            
            let list = document.getElementById("tile-list");
            let items = list.getElementsByClassName("tile-list-item");

            items.forEach((element, index) => {
                element.text = covidFlow[currentView].iconText[index];
                let touch = element.getElementById("tile-list-item-hitbox");
                touch.onclick = (evt) => {
                    console.log(`${index} clicked`);
                    feedbackData[covidFlow[currentView-1].name] = covidFlow[currentView-1].iconText[index];
                    // make sure confirm loads correctly
                    covidFlow[currentView].requiresAnswer[0].value = covidFlow[currentView-1].iconText[index];
                    console.log(JSON.stringify(feedbackData));
                    showFace()
                }
            });
            
        } else {
            document.getElementById("question-text").text = covidFlow[currentView].questionText;
            document.getElementById("question-second-text").text = covidFlow[currentView].questionSecondText;
            if(covidFlow[currentView].name.indexOf("confirm")!=-1) {
                document.getElementById("question-text").text = covidFlow[currentView].questionText.replace("xxxx",feedbackData[covidFlow[currentView-1].name]);
            }
            // set buttons
            const buttonLocations = ["left", "right", "center"];
            // hide all buttons
            buttonLocations.forEach((location) => {
                document.getElementById("new-button-" + location).style.display =
                    "none";
            });

            // map through each text element in flow and map to button
            covidFlow[currentView].iconText.forEach((text, ii) => {
                // first show the button
                document.getElementById(
                    "new-button-" + buttonLocations[ii]
                ).style.display = "inline";

                // then map the circle color, image, and text
                document.getElementById(
                    "circle-" + buttonLocations[ii]
                ).style.fill = covidFlow[currentView].iconColors[ii];
                document.getElementById("image-" + buttonLocations[ii]).href =
                    covidFlow[currentView].iconImages[ii];
                document.getElementById("button-text-" + buttonLocations[ii]).text =
                    covidFlow[currentView].iconText[ii];
            });
        }
        // move onto next flow
        currentView++;
    }

    // skipping question
    else if (skipQuestion == true) {
        // if we arrived here through the back button, then skip backwards
        if (flowback === true) {
            currentView--;
            showFace((flowback = true));
            // if we arrived here through the normal flow, skip forwards
        } else {
            currentView++;
            showFace();
        }
    }

    vibration.start("bump");
}

//-------- END (DEFINE VIEWS BASED ON FLOW SELECTOR) -----------

// vibrate for 3 sec and change screen to reponse
function vibrate() {
    /**
     * It causes the watch to vibrate, and forces the start of the feedback.
     *
     * If there are no questions selected then it blocks the time until a response is given.
     * If there are questions in the flow, then it starts the flow
     */

    vibration.start("alert");

    //Change main clock face to response screen
    if (flow_views.length === 1) {
        clockblock.style.display = "inline";
    } else {
        initiateFeedbackData();
        // Reset currentView to prevent an unattended fitbit from moving through the flow
        currentView = 0;
        // go to first item in the flow
        showFace();
    }
    //Stop vibration after 5 seconds
    setTimeout(function() {
        vibration.stop();
    }, 2000);
}

//-------- COMPILE DATA AND SEND TO COMPANION  -----------
function sendEventIfReady(feedbackData) {
    console.log("sending feedbackData");
    console.log(JSON.stringify(feedbackData));

    console.log("JS memory: " + memory.js.used + "/" + memory.js.total);
    // set timeout of gps aquisition to 5 seconds and allow cached geo locations up to 1min to be allowed
    geolocation.getCurrentPosition(locationSuccess, locationError, {
        timeout: 20000,
        maximumAge: 60000,
    });

    function locationSuccess(position) {
        console.log("location success");
        feedbackData.lat = position.coords.latitude;
        feedbackData.lon = position.coords.longitude;
        sendDataToCompanion(feedbackData);
    }

    function locationError() {
        console.log("location fail");
        feedbackData.lat = null;
        feedbackData.lon = null;
        sendDataToCompanion(feedbackData);
    }
}

function sendDataToCompanion(data) {
    if (
        messaging.peerSocket.readyState === messaging.peerSocket.OPEN &&
        JSON.stringify(data).length < messaging.peerSocket.MAX_MESSAGE_SIZE
    ) {
        console.log(
            "Max message size=" + messaging.peerSocket.MAX_MESSAGE_SIZE
        );
        console.log("data sizealert", JSON.stringify(data).length);
        messaging.peerSocket.send(data);
        console.log("data sent directly to companion");

        //remove data to prevent it beint sent twice
        data = null;
    } else {
        console.log(
            "No peerSocket connection OR data too large. Attempting to send via file transfer"
        );

        // try to read file with local data
        try {
            console.log("checking if local file exists");
            local_file = fs.readFileSync("local.txt", "json");
        } catch (err) {
            // if can't read set local file to empty
            console.log("creating empty local.txt file");
            local_file = [];
        }

        // push new reponce and save
        console.log("pushing new data to local file");
        local_file.push(data);

        fs.writeFileSync("local.txt", local_file, "json");
        // Note on device how many locally stored files are present
        storageLabel.text = `${local_file.length}`;

        // Prepare outbox for file transfer
        outbox
            .enqueueFile("local.txt")
            .then((ft) => {
                console.log(`Transfer of ${ft.name} successfully queued.`);

                // Let user know that data is in queue
                storageLabel.text = `please sync fitbit ${local_file.length}`;
                // On change of ft, launch file transfer event
                ft.onchange = onFileTransferEvent;
            })
            .catch((error) => {
                console.log(`Failed to schedule transfer: ${error}`);
                storageLabel.text = `${local_file.length}`;
            });
    }
}

// function to determine changes in the status of the file transfer
function onFileTransferEvent() {
    console.log(this.readyState);
    if (this.readyState === "transferred") {
        console.log("transferred successfully");
        // delete local.txt file as data is now trasnferred
        fs.unlinkSync("local.txt");
        storageLabel.text = ``;
    }
    if (this.readyState === "error") {
        console.log("WARNING: ERROR IN FILE TRANSFER");
        storageLabel.text = `Error`;
    }
    //console.log(`onFileTransferEvent(): name=${this.name} readyState=${this.readyState};${Date.now()};`);
}