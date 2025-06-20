const { google } = require('googleapis');

const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
const decoded = Buffer.from(base64, 'base64').toString('utf-8');
const credentials = JSON.parse(decoded);

// 初始化 Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function writeLeaveData(name, leaveType, leaveDate) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: 'Carlo 員工請假紀錄',
    range: '工作表1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString(), name, leaveType, leaveDate]],
    },
  });
}

module.exports = { writeLeaveData };
