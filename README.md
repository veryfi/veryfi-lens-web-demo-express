<img src="https://user-images.githubusercontent.com/30125790/212157461-58bdc714-2f89-44c2-8e4d-d42bee74854e.png#gh-dark-mode-only" width="200">
<img src="https://user-images.githubusercontent.com/30125790/212157486-bfd08c5d-9337-4b78-be6f-230dc63838ba.png#gh-light-mode-only" width="200">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

# Veryfi Lens for Web SDK Demo

Veryfi Lens for Web SDK is a framework for your web app to give it document capture superpowers in minutes.

This project is a demo to showcase how you can integrate Lens into your web app. It follows a client-server architecture where the server is for validating your client and getting session key and the client side is for displaying and showing Lens components for capturing documents.

<img src="flow.png">

The server side is a simple Node.js's Express server. To get started, first make sure you have a valid client ID in `server/index.js`:
```
const CLIENT_ID = "YOUR_CLIENT_ID_HERE"; // make sure to keep it as a secret
```

To start the server on port 5001:
```
cd server && npm install && node index.js
```

Now, simply open `index.html` and try it out!
