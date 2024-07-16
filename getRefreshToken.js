const { google } = require('googleapis');
const readline = require('readline');

// Define the credentials object
const credentials = {
  web: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    project_id: process.env.GOOGLE_PROJECT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ["http://localhost:3000/auth/google/callback"],
    javascript_origins: ["http://localhost:3000"]
  }
};

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Generate the URL for authorization
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline', // Ensure we get a refresh token
  prompt: 'consent',      // Force the consent screen to ensure a refresh token
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);

rl.question('Plak de volledige redirect URL hier: ', (url) => {
  console.log('Gekregen URL:', url);
  const urlObj = new URL(url);
  const code = urlObj.searchParams.get('code');
  console.log('Geëxtraheerde code:', code);

  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Error retrieving access token', err);
      return;
    }
    console.log('Gekregen token:', token);
    if (!token.refresh_token) {
      console.error('No refresh token received. Ensure you requested offline access.');
      return;
    }
    console.log('Refresh token:', token.refresh_token);
    rl.close();
  });
});