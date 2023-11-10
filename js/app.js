let mqttClient;
let modePump;
var topic = "esp32/DataSensor";
window.addEventListener("load", (event) => {
  connectToBroker();
  mqttClient.subscribe(topic, { qos: 0 });
});

function connectToBroker() {
  const clientId = "client" + Math.random().toString(36).substring(7);

  const host = "wss://broker.emqx.io:8084/mqtt";

  const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  };

  mqttClient = mqtt.connect(host, options);

  mqttClient.on("error", (err) => {
    console.log("Error: ", err);
    mqttClient.end();
  });

  mqttClient.on("reconnect", () => {
    console.log("Reconnecting...");
  });

  mqttClient.on("connect", () => {
    console.log("Client connected:" + clientId);
  });

  var info = {};
  mqttClient.on("message", (topic, message, packet) => {
    console.log("Client connected:" + clientId);
    console.log(message);

    info = JSON.parse(message.toString());

    const PumpInShow = document.getElementById("PumpInShow");
    if (info.statusPumpIn == 0) {
      PumpInShow.style.filter = "brightness(0.5)";
    } else if (info.statusPumpIn == 1) {
      PumpInShow.style.filter = "brightness(1)";
    }
    const fanShow = document.getElementById("fanShow");
    if (info.statusFan == 0) {
      fanShow.style.filter = "brightness(0.5)";
    } else if (info.statusFan == 1) {
      fanShow.style.filter = "brightness(1)";
    }

    const nhietdo = document.getElementById("nhietdo");
    nhietdo.innerHTML = info.tempC.toFixed(1); 

    const doduc = document.getElementById("doduc");
    doduc.innerHTML = info.tempTS.toFixed(1); 

    const hc1 = document.getElementById("hc1");
    hc1.innerHTML = info.hc1.toFixed(0) + "%";
    const hc1Value = parseFloat(hc1.innerHTML);

    const liquid1Svg = document.querySelector(".eat-tank .liquid1 svg");
    liquid1Svg.style.top = `calc(100% - ${hc1Value}%)`;
    const hc1Show = document.getElementById("hc1Show");
    hc1Show.textContent = `${info.hc1.toFixed(0)}%`;

    const hc1Element = document.querySelector("#hc1");
    hc1Element.style.bottom = hc1Value + "%";

    const hc2 = document.getElementById("hc2");
    hc2.innerHTML = info.hc2.toFixed(0) + "%";

    const hc2Value = parseFloat(hc2.innerHTML);

    const liquidSvg = document.querySelector(".water-tank .liquid svg");
    liquidSvg.style.top = `calc(100% - ${hc2Value}%)`;

    const hc2Element = document.querySelector("#hc2");
    hc2Element.style.bottom = hc2Value + "%";

    const modePump = document.getElementById("modePump");
    modePump.innerHTML = info.modePump;

    const turbidityStatus = document.getElementById("turbidityStatus");

    if (info.tempTS < 10) {
      turbidityStatus.innerHTML = "Nước đang có độ trong cao .";
    } else if (info.tempTS >= 10 && info.tempTS <= 20) {
      turbidityStatus.innerHTML = "Chất lượng nước tiêu chuẩn .";
    } else if (info.tempTS > 20) {
      turbidityStatus.innerHTML = "Độ đục của nước ở mức cao.";
    } else {
      turbidityStatus.innerHTML = ""; 
    }

    const temperatureStatus = document.getElementById("temperatureStatus");
    if (info.tempC < 24) {
      temperatureStatus.innerHTML = "Nhiệt độ của nước ở mức thấp.";
    } else if (info.tempC > 28) {
      temperatureStatus.innerHTML = "Nhiệt độ của nước ở mức cao.";
    } else {
      temperatureStatus.innerHTML = "Nhiệt độ của nước thích hợp.";
    }
  });
}

function updateClock() {
  const clockElement = document.getElementById("clock");
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; 
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}`;
  clockElement.textContent = dateTimeString;
}

setInterval(updateClock, 60000);
updateClock();

function toggleSwitch1() {
  const switchElement = document.querySelector(".switch1 input");
  const isChecked = switchElement.checked;
  const topic = "esp32/statusOxygen"; 
  const message = isChecked ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 });
}

function toggleSwitch4() {
  const switchElement = document.querySelector(".switch4 input");
  const isChecked = switchElement.checked;
  const topic = "esp32/statusFeeding";
  const message = isChecked ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 }); 
}

var isSwitch3On = false;
var highlightedLight = null;

function toggleSwitch3() {
  var switchElement = document.querySelector(".switch3 input");
  isSwitch3On = switchElement.checked;

  const topic = "esp32/statusLed";
  const message = isSwitch3On ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 });

  if (!isSwitch3On) {
    if (highlightedLight) {
      highlightedLight.classList.remove("highlighted");
      highlightedLight = null;
    }
  }
}

function highlight(element, lightName) {
  if (isSwitch3On) {
    const lights = document.querySelectorAll(".light");

    lights.forEach((light) => {
      light.classList.remove("highlighted");
    });

    element.classList.add("highlighted");
    highlightedLight = element;

    const topic = "esp32/statusLed";
    const message = isSwitch3On ? `1,${lightName}` : "0";
    mqttClient.publish(topic, message, { qos: 0 });
  }
}

var isSwitch2On = false;
var highpumpedPump = null;

function toggleSwitch2() {
  var switchElement = document.querySelector(".switch2 input");
  isSwitch2On = switchElement.checked;
  const topic = "esp32/statusPump";
  const message = isSwitch2On ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 });
  if (!isSwitch2On) {
    if (highpumpedPump) {
      highpumpedPump.classList.remove("highpumped");
      highpumpedPump = null;
    }

    const pumps = document.querySelectorAll(".pump");
    pumps.forEach((pump) => {
      pump.classList.remove("highpumped");
    });
  }

  updatePointer();
}

function updatePointer() {
  const pointer = document.getElementById("turbidity-pointer");
  const switchElement = document.querySelector(".switch2 input");

  if (!switchElement.checked) {
    pointer.style.display = "block";
    if (modePump  == 1) {
      pointer.style.left = "1000px";
      pointer.style.top = "190px";
      pointer.style.filter = "brightness(1)";
    } else if (modePump == 2) {
      pointer.style.left = "1000px";
      pointer.style.top = "240px";
      pointer.style.filter = "brightness(1)";
    } else if (modePump  == 3) {
      pointer.style.left = "1000px";
      pointer.style.top = "310px";
      pointer.style.filter = "brightness(1)";
    }
  } else {
    pointer.style.display = "none";
  }
}

updatePointer();
setInterval(updatePointer, 1000);
function highpump(element, pumpName) {
  if (isSwitch2On) {
    const pumps = document.querySelectorAll(".pump");
    pumps.forEach((pump) => {
      pump.classList.remove("highpumped");
    });
    element.classList.add("highpumped");
    highpumpedPump = element;
    const topic = "esp32/statusPump";
    const message = isSwitch2On ? `1,${pumpName}` : "0";
    mqttClient.publish(topic, message, { qos: 0 });
  }
}

window.addEventListener("load", (event) => {
  const topicPump = "esp32/statusPump";
  const messagePump = "0";
  mqttClient.publish(topicPump, messagePump, { qos: 0 });

  const topicLed = "esp32/statusLed";
  const messageLed = "0";
  mqttClient.publish(topicLed, messageLed, { qos: 0 });

  const topicOxygen = "esp32/statusOxygen";
  const messageOxygen = "0";
  mqttClient.publish(topicOxygen, messageOxygen, { qos: 0 });

  const topicFeeding = "esp32/statusFeeding";
  const messageFeeding = "0";
  mqttClient.publish(topicFeeding, messageFeeding, { qos: 0 });
});


const timer1Element = document.getElementById('timer1');
const toggle5 = document.querySelector('.switch5 input');

let timer1Time = 60; 
let timerRunning1 = false;
let interval1;

const timer2Element = document.getElementById('timer2');
const toggle6 = document.querySelector('.switch6 input');

let timer2Time = 300; 
let timerRunning2 = false;
let interval2;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
  timer1Element.textContent = formatTime(timer1Time);
}

function update2Timer() {
  timer2Element.textContent = formatTime(timer2Time);
}

function toggleSwitch5() {
  if (toggle5.checked) {
    if (!timerRunning1) {
      timerRunning1 = true;
      interval1 = setInterval(function () {
        if (timer1Time > 0) {
          timer1Time--;
          updateTimer();
        } else {
          clearInterval(interval1);
          toggle5.checked = false;
          timerRunning1 = false;
          const topic = 'esp32/feedTimer';
          const message = 'timer1 done';
          mqttClient.publish(topic, message, { qos: 0 });
          timer1Time = 60;
          updateTimer();
        }
      }, 1000);
    }
  } else {
    clearInterval(interval1);
    timerRunning1 = false;
    timer1Time = 60;
    updateTimer();
  }
}

function toggleSwitch6() {
  if (toggle6.checked) {
    if (!timerRunning2) {
      timerRunning2 = true;
      interval2 = setInterval(function () {
        if (timer2Time > 0) {
          timer2Time--;
          update2Timer();
        } else {
          clearInterval(interval2);
          toggle6.checked = false;
          timerRunning2 = false;
          const topic = 'esp32/feedTimer';
          const message = 'timer2 done';
          mqttClient.publish(topic, message, { qos: 0 });
          timer2Time = 300;
          update2Timer(); 
        }
      }, 1000);
    }
  } else {
    clearInterval(interval2);
    timerRunning2 = false;
    timer2Time = 300; 
    update2Timer(); 
  }
}