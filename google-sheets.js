const { google } = require('googleapis');
const fs = require('fs');

// 使用你的 Service Account 憑證（Base64 格式解碼後的 JSON）
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, 'base64').toString()
);

// 建立 Google Sheets API 客戶端
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = '19Nt-N2RR76ojr7wOVrvSPLus1VK3HGHI6VVYbfoLDpc';

async function appendLeaveRecord(row) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const resource = {
    values: [row],
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '工作表1!A:D',
    valueInputOption: 'USER_ENTERED',
    resource,
  });
}

module.exports = {
  appendLeaveRecord,
};
