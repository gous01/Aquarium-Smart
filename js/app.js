let mqttClient;
var topic = "esp32/DataSensor";
window.addEventListener("load", (event) => {
  connectToBroker();
  mqttClient.subscribe(topic, { qos: 0 });
});

function connectToBroker() {
  const clientId = "client" + Math.random().toString(36).substring(7);

  const host = "wss://broker.emqx.io:8883/mqtt";

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

  // Received
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
    nhietdo.innerHTML = info.tempC.toFixed(1); // Làm tròn nhiệt độ đến 1 chữ số sau dấu phẩy

    const doduc = document.getElementById("doduc");
    doduc.innerHTML = info.tempTS.toFixed(1); // Làm tròn nhiệt độ đến 1 chữ số sau dấu phẩy

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

    // Kiểm tra và hiển thị cảnh báo độ turbidity
    const turbidityStatus = document.getElementById("turbidityStatus");

    if (info.tempTS < 15) {
      turbidityStatus.innerHTML = "Độ đục của nước ở mức thấp.";
    } else if (info.tempTS >= 15 && info.tempTS <= 35) {
      turbidityStatus.innerHTML = "Độ đục của nước thích hợp.";
    } else if (info.tempTS > 35) {
      turbidityStatus.innerHTML = "Độ đục của nước ở mức cao.";
    } else {
      turbidityStatus.innerHTML = ""; // Nếu không nằm trong bất kỳ khoảng nào
    }

    // Kiểm tra và hiển thị trạng thái nhiệt độ
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
  const month = now.getMonth() + 1; // Tháng bắt đầu từ 0
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}`;
  clockElement.textContent = dateTimeString;
}

// Cập nhật đồng hồ mỗi phút (60.000 miligiây)
setInterval(updateClock, 60000);

// Đảm bảo đồng hồ được cập nhật ngay khi trang web được tải
updateClock();

function SaveData(str) {
  connection.invoke("SaveData", str).catch(function (err) {
    console.error(err);
  });
}

function toggleSwitch1() {
  const switchElement = document.querySelector(".switch1 input");
  const isChecked = switchElement.checked;
  // Tùy thuộc vào isChecked, gửi thông điệp ON hoặc OFF đến MQTT broker
  const topic = "esp32/statusOxygen"; // Chủ đề MQTT bạn muốn gửi đến
  const message = isChecked ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 }); // Gửi thông điệp đến MQTT broker
}

function toggleSwitch4() {
  const switchElement = document.querySelector(".switch4 input");
  const isChecked = switchElement.checked;
  // Tùy thuộc vào isChecked, gửi thông điệp ON hoặc OFF đến MQTT broker
  const topic = "esp32/statusFeeding"; // Chủ đề MQTT bạn muốn gửi đến
  const message = isChecked ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 }); // Gửi thông điệp đến MQTT broker
}

// Tạo biến để theo dõi trạng thái của switch
var isSwitch3On = false;
var highlightedLight = null;

// Khi người dùng nhấn vào switch
// Hàm xử lý khi nhấn vào switch
function toggleSwitch3() {
  var switchElement = document.querySelector(".switch3 input");
  isSwitch3On = switchElement.checked;

  // Gửi thông điệp MQTT với trạng thái "0" khi switch chuyển sang tắt
  const topic = "esp32/statusLed";
  const message = isSwitch3On ? "1" : "0";
  mqttClient.publish(topic, message, { qos: 0 });

  // Đặt lại trạng thái của các chữ cái khi switch chuyển sang off
  if (!isSwitch3On) {
    if (highlightedLight) {
      highlightedLight.classList.remove("highlighted");
      highlightedLight = null;
    }
  }
}

// Hàm xử lý khi nhấn vào chữ cái
function highlight(element, lightName) {
  if (isSwitch3On) {
    const lights = document.querySelectorAll(".light");

    lights.forEach((light) => {
      light.classList.remove("highlighted");
    });

    element.classList.add("highlighted");
    highlightedLight = element;

    // Gửi thông điệp MQTT với tên của chữ được sáng
    const topic = "esp32/statusLed";
    const message = isSwitch3On ? `1,${lightName}` : "0";
    mqttClient.publish(topic, message, { qos: 0 });
  }
}

var isSwitch2On = false;
var highpumpedPump = null;

// Hàm xử lý khi nhấn vào switch
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

    // Đặt lại trạng thái của các bơm ở đây
    // Ví dụ: Tắt tất cả các bơm
    const pumps = document.querySelectorAll(".pump");
    pumps.forEach((pump) => {
      pump.classList.remove("highpumped");
    });
  }

  updatePointer();
}

function updatePointer() {
  const pointer = document.getElementById("turbidity-pointer");
  const doducElement = document.getElementById("doduc");
  const switchElement = document.querySelector(".switch2 input");

  // Lấy giá trị của phần tử "doduc"
  const doducValue = parseFloat(doducElement.innerHTML); // Chuyển giá trị thành số

  if (!switchElement.checked) {
    // Kiểm tra trạng thái của switch2 (off)
    pointer.style.display = "block";
    if (doducValue < 30) {
      pointer.style.left = "1000px";
      pointer.style.top = "190px";
      pointer.style.filter = "brightness(1)";
    } else if (doducValue >= 30 && doducValue <= 50) {
      pointer.style.left = "1000px";
      pointer.style.top = "240px";
      pointer.style.filter = "brightness(1)";
    } else if (doducValue > 50 && doducValue <= 100) {
      pointer.style.left = "1000px";
      pointer.style.top = "310px";
      pointer.style.filter = "brightness(1)";
    }
  } else {
    pointer.style.display = "none";
  }
}

// Đảm bảo rằng trạng thái ban đầu của con trỏ phụ thuộc vào toggleSwitch2
updatePointer();
setInterval(updatePointer, 1000);
// Hàm xử lý khi nhấn vào chữ cái của bơm
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

let timer1Time = 10; // 10 seconds
let timerRunning1 = false;
let interval1;

const timer2Element = document.getElementById('timer2');
const toggle6 = document.querySelector('.switch6 input');

let timer2Time = 20; 
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
          toggle5.checked = false; // Tắt switch khi hết đếm ngược
          timerRunning1 = false;
          const topic = 'esp32/feedTimer';
          const message = 'timer1 done';
          mqttClient.publish(topic, message, { qos: 0 });
          timer1Time = 10;
          updateTimer();
        }
      }, 1000);
    }
  } else {
    clearInterval(interval1);
    timerRunning1 = false;
    // Reset thời gian khi công tắc được tắt
    timer1Time = 10; // Đặt lại thời gian
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
          update2Timer(); // Sửa đúng tại đây
        } else {
          clearInterval(interval2);
          toggle6.checked = false; // Tắt switch khi hết đếm ngược
          timerRunning2 = false;
          const topic = 'esp32/feedTimer';
          const message = 'timer2 done';
          mqttClient.publish(topic, message, { qos: 0 });
          timer2Time = 20; // Sửa lại tại đây
          update2Timer(); // Sửa đúng tại đây
        }
      }, 1000);
    }
  } else {
    clearInterval(interval2);
    timerRunning2 = false;
    // Reset thời gian khi công tắc được tắt
    timer2Time = 20; // Đặt lại thời gian
    update2Timer(); // Sửa đúng tại đây
  }
}