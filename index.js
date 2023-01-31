GET_SESSION_URL = 'http://localhost:5001/session';

const demoCampaignCtx = document.getElementById('demo-campaign-ctx');
const veryfiLensCtx = document.getElementById('veryfi-lens-ctx');
const croppedImage = document.getElementById('veryfi-lens-cropped-image');
const preview = document.getElementById('veryfi-preview');
veryfiLensCtx.style.display = 'none';

const init = async () => {
  const requestOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    },
  };

  const session = await fetch(GET_SESSION_URL, requestOptions)
    .then((response) => response.json())
    .then((data) => data.session)
    .catch((error) => error);
    VeryfiLens.setLensSessionKey(session);
    VeryfiLens.init();
};

const capture = () => {
  const image = VeryfiLens.capture();
  croppedImage.src = `data:image/png;base64,${image}`;
  preview.style.display = 'block';
  veryfiLensCtx.style.display = 'none';
  demoCampaignCtx.style.display = 'block';
  document.body.style = 'overflow: auto';
};

const startCamera = () => {
  VeryfiLens.startCamera();
  veryfiLensCtx.style.display = 'block';
  demoCampaignCtx.style.display = 'none';
  document.body.style = 'overflow: hidden';
};

const stopCamera = () => {
  VeryfiLens.stopCamera();
  veryfiLensCtx.style.display = 'none';
  demoCampaignCtx.style.display = 'block';
};

// Get session //
init();
