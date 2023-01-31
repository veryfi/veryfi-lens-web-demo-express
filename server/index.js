const express = require('express');
const axios = require('axios');
const cors = require('cors');

const PORT = 5001;
const VALIDATE_URL = 'https://lens-pwa-api.veryfi.com/rest/validate_partner';
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // make sure to keep it as a secret

const app = express();
app.use(cors());
app.use(express.json());

app.post('/session', getSession);

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log('Server listening on PORT', PORT);
});

async function getSession(request, response) {
  const session = await getVeryfiSession(CLIENT_ID);
  response.send(session);
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
