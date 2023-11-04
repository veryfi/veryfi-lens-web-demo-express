const GET_SESSION_URL = "http://localhost:5001/session";
const POST_DOCUMENT_URL = "http://localhost:5001/process";
// Make sure to keep credentials as a secret

import VeryfiLens from "./veryfi-lens-wasm/veryfi-lens.js";

let croppedImage = document.createElement("img");
let deviceData;
let externalId = "user_test@veryfi.com"
const init = async () => {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    };

    const data = await fetch(GET_SESSION_URL, requestOptions)
        .then((response) => response.json())
        .catch((error) => error);
    VeryfiLens.setLensSessionKey(data.session);
    deviceData = VeryfiLens.getDeviceData();
    await VeryfiLens.initWasm(data.session, data.client_id);
};

window.captureWasm = async () => {
    const image = await VeryfiLens.captureWasm();
//   You can run getIsDocument() and getIsBlurry() after capture function

    croppedImage.src = `data:image/jpeg;base64,${image}`;

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
    const processDocumentUrl = POST_DOCUMENT_URL;
    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            image: croppedImage.src,
            device_data: deviceData,
            external_id: externalId,
        }),
    };
    const response = await fetch(processDocumentUrl, requestOptions);
    const json_response = await response.json();
    if (response.ok) {
        console.log(json_response);
        statusMessage.innerText = json_response.status;
    } else {
        statusMessage.innerText = "Document processing failed";

    }
    return json_response;
};

init();
