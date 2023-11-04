const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path')
const {DateTime} = require('luxon');
const Client = require('@veryfi/veryfi-sdk');
const validateBusinessRules = require("./business-rules");
require('dotenv').config();

const PORT = 5001;
const VALIDATE_URL = 'https://lens.veryfi.com/rest/validate_partner';
const CLIENT_ID = process.env.VERYFI_CLIENT_ID;
const CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET;
const USERNAME = process.env.VERYFI_USERNAME;
const API_KEY = process.env.VERYFI_API_KEY;
const BASE_URL = process.env.VERYFI_URL;
const API_VERSION = "v8";
const veryfi_client = new Client(CLIENT_ID, CLIENT_SECRET, USERNAME, API_KEY, BASE_URL, API_VERSION, 120);


const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// This is required for the wasm to work
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

app.post('/session', getSession);
app.post('/process', processDocument);


app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log('Server listening on PORT', PORT);
});

async function getSession(request, response) {
    const session = await getVeryfiSession(CLIENT_ID);
    session.client_id = CLIENT_ID;
    response.send(session);
}

async function processDocument(request, response) {
    const ip_address = request.connection.remoteAddress;
    const [json_response] = await Promise.all([veryfi_client.process_document_base64string(request.body.image, null, null, false, {
        tags: [ip_address],
        external_id: request.body.external_id,
        device_data: request.body.device_data,
    })]);
    response.setHeader('Content-Type', 'application/json');
    const response_json = validateBusinessRules(veryfi_client, json_response, ip_address)
    response.send(response_json);
}

async function getVeryfiSession(clientId) {
    return await axios.post(
        VALIDATE_URL,
        {},
        {
            headers: {
                'CLIENT-ID': clientId,
            },
        }).then((response) => {
        return {
            session: response.data.session
        }
    }).catch((error) => error);
}


app.use('/veryfi-lens-wasm', express.static(path.join(__dirname, '/src/veryfi-lens-wasm')));
app.use(express.static(path.join(__dirname, '/src')));
