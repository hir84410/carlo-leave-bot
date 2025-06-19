
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const credentials = require('./carlo-leave-bot-8a5a3d63ad87.json');

const SPREADSHEET_ID = 'Carlo 員工請假紀錄'; // 實際需替換為 Spreadsheet ID
const SHEET_NAME = '工作表1'; // 實際需確認工作表名稱
const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function appendLeaveRecord({ name, leaveType, date }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const now = new Date();
  const formattedNow = now.toLocaleString('zh-TW', { hour12: false });

  const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[formattedNow, name, leaveType, date]]
    }
  };

  await sheets.spreadsheets.values.append(request);
}

module.exports = { appendLeaveRecord };
