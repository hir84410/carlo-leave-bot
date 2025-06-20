const { google } = require('googleapis');

// ✅ 將下方這一大串換成你轉換好的 Base64 字串
const base64Credentials = `ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY2FybG8tbGVhdmUtYm90IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiN2FiMTFmNWNkYzNlNzJiOTcwZmIyMmFlOTI5NGNhYTllOTgwZjUzNyIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXVnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS1F3Z2dTZ0FnRUFBb0lCQVFEUUpHYS9XN1dqSUJaNFxu...[省略其餘文字]...Cg==`;

const credentials = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function appendToSheet(data) {
  const spreadsheetId = '19Nt-N2RR76ojr7wOVrvSPLus1VK3HGHI6VVYbfoLDpc';
  const range = '工作表1!A:D';

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [data],
    },
  });
}

module.exports = { appendToSheet };
