const GET_SESSION_URL = "http://localhost:5001/session";
const PROCESS_URL = "https://lens.veryfi.com/rest/process";
const CLIENT_ID = "YOUR_CLIENT_ID";
const API_KEY = "YOUR_API_KEY";
const USERNAME = "YOUR_USERNAME";
// Make sure to keep credentials as a secret

import VeryfiLens from "./veryfi-lens-wasm/veryfi-lens.js";

let croppedImage = document.createElement("img");
let deviceData;
const init = async () => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };

  const session = await fetch(GET_SESSION_URL, requestOptions)
    .then((response) => response.json())
    .then((data) => data.session)
    .catch((error) => error);
  VeryfiLens.setLensSessionKey(session);
  deviceData = VeryfiLens.getDeviceData();
  console.log(deviceData);
  VeryfiLens.initWasm(session, CLIENT_ID);
};

window.captureWasm = async () => {
  const image = await VeryfiLens.captureWasm();
//   You can run getIsDocument() and getIsBlurry() after capture function

  croppedImage.src = `data:image/png;base64,${image}`;

  const container = document.getElementById("preview");
  container.appendChild(croppedImage);

  const submitButton = document.createElement("button");
  submitButton.innerText = "Submit";
  submitButton.type = "submit";
  submitButton.style.display = "block";
  submitButton.style.marginTop = "10px";
  submitButton.style.backgroundColor = "#4CAF50";

  const veryfiContainer = document.getElementById("veryfi-container")
  veryfiContainer.style.display = "none"

  container.appendChild(submitButton);
  submitButton.addEventListener("click", processImage);
};

const processImage = async () => {
    document.getElementById("preview").style.display = "none";
    const statusMessage = document.createElement("h1");
    statusMessage.innerText = "Loading...";
    document.getElementById("status").appendChild(statusMessage);
  const processDocumentUrl = PROCESS_URL;
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: croppedImage.src,
      username: USERNAME,
      api_key: API_KEY,
      client_id: CLIENT_ID,
      device_data: deviceData,
    }),
  };
  const response = await fetch(processDocumentUrl, requestOptions);
  console.log(response);
  if (response.ok) {
    statusMessage.innerText = "Document processed successfully";
  } else {
    statusMessage.innerText = "Document processing failed";
  
  }
  return response.json();
};

init();
