const { google } = require('googleapis');

const base64 = `ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY2FybG8tbGVhdmUtYm90IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiN2FiMTFmNWNkYzNlNzJiOTcwZmIyMmFlOTI5NGNhYTllOTgwZjUzNyIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXVnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS1F3Z2dTZ0FnRUFBb0lCQVFEUUpHYS9XN1dqSUJaNFxuU1hKc2NjUzBoSTJBN1YvYStpdWJZOGJuNEw4WmxNSVBNVU83YmczY05OMjlEQllJNkswTU56V1BvUkhjRTJkZFxuTHVuM1RwTE11b1M1cWpzNGhtQy9VQXZuM2VVQkNsRmIvZk1MbUdrQjF0ekErNTBxOHZUS2owMHBNWFkxTTdMWlxuWWNlMy9EQllZZ1dMSVV4Z2EvamUxZmMyY2N0NHNLV2phWWhOcUFualRpalQyVFZPZVZLUmRmMndqNVNVaDgySVxuY2huNVI5dWZXNWxVdjl2V1hiQnprcjdtb3N6WFhkSmdWZEVRMFdzTVpvQ1ZVTFpIMnFPc255TzI2RnBVK0tva1xueWNzRzJ3aFBuYjFSSzdBRzJhZW1SaDB4d2V3dGIwZzZsQ2RGV0FNWTVuVWszVGNtR1VoMXNFUjJvZnl3Y0hLaVxuQVFEOWdHRVBBZ01CQUFFQ2dmOGZKaWc2UmRXM0g0ZEFwNi9zY0NyWUN2ZWduTytUaktzSFNiOXdzYk5pckU0MlxuaWg3bFI2QmcvYW1sNEQwY0tOUDR4Qy9MZHNjVU5iSHZQTCtzU2JqbThUNjlJMVdsa1BVRU1YdUNzclhJQkZ3MVxuODh0SEhDNDNGTzFVOE5mTkNnTmpLSEt6Z2trUWlKN1VVOVJ4enU3aG5sVmtsNE10RENiRXlBNjhFSG9uQXlFZ1xuYURZbGppdUhVMzJHbFBtdTFkZTQwUjNCWWt6OFZEbElzeHV5VXdRMjVYUTVQUUJoREduUVc3WFEzMnowcDM4VlxuSmlUakJ1cGlKVlR1eWpqZjNyVCtLYmY4MER5OW01OXp3Znd1VzkxUjYwbithaFQzaGFTZENKcjhTYW1xZ3dIL1xuYTN4dEIzSVNRMGR1VEx3YTdtZkFJUXZ3SFF5NU1vTGxUNWk2MHFFQ2dZRUEvdE5Yc3JQdU5LNklaMHA5ZzNuM1xuK3hOcnZyNlZ1dUlLQkVqQkE4VTFYQ3llajF3WXNtVm1XN1dZSVp5c01TdG1xNkxzakFaWGVxRSsycm5uUkZRMVxudHhoenlrTU1MUy9kZlV6c1RRVjdKSS9aSHkxZktCUURHRWdKTTJ0ZjZCVFBVbmZpNFYyVjlaNGlLS3F6SnpaOVxublhzNTB4RUNkWHlHdkdBaHE1RjZrTmNDZ1lFQTBSbjZxVW1KakxSb1YxcUk4WDN6RWFTQWtRaCthL2V5K0p6NFxuazNnVTJXV2NNZ3NjU1NmcEx6ZmVZVW5pMjNrWmNoWk14REd2Z0Q5RW9HS3JVU0tWZnpMajhyMjJPZ1I0WUppcFxudHFXeGdUc05iMWNTVVJLa2ZjMGlNcmMzVStVZ1oxWEtQbTU0RzNscTZ1YXROU1lVc3V0RGVHbC83Nld0Nmd6b1xuNHg4Y1Vva0NnWUJUdStDaVlRdVNGaFBPVlNUZk1oSHhWOVZjelVWb0xtUjZPZW5xc2oreGRSdjVJWnNmNjcveFxudkw4cnRFN0VyVzFFVXZvRm5RUGIwT1pWZXlicVJmMk1sNlZjdmlGZks4NU5JUnk0eG1kTGdWVW9NSUdIS3VSRlxuYzA1S3JpckttU1B6Qmwvd0RBOTlzU09xVjBVZFNvT0dYdnFHUjUyV080QU9vRXdRRTNMQjZ3S0JnRGxUUlB3S1xuTkJLR0Z5RHpxaDJDcVJQS0pKRWVZZ0paaXhCTGdINTFha25iYUlIenQ5SjZoWnd6VmQwWU00QjE1N3IyVUI5dFxuZTY3T0taTksyYXJKcjNDSzFDRmxUME1DbkxubXdJaFpUcHVlUStXbFdsa3RvamoyOXd3dVhKVzhlREM4UFZEMlxuV2lrMkZWREc0dTl5UERSOCtTZFd6UU0zU2NHanZta2R5MWI1QW9HQWN6MWhSMG5iWnRVL1NNcVJyOG5QVHR0QVxuWHRpS2RWSVZXSnliQ3BxRzBRU2J2bnhWdWova00xeTQ1OUt2L0lZYVJHS3dkVzA5eGtkN1BFc3pzdzFpNXJKblxubE9LVXk1aHJDNXN2ZWI1Z3QzVVlBTkNPSDUranI2UWJvM01CUGlIejZ1U2RNU2FGdjU3MGUrWFZBbU9tdk1kVlxuK0dzQXF6aGJBRVFNMGpHSXlyRT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiI=`;

const credentials = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '19Nt-N2RR76ojr7wOVrvSPLus1VK3HGHI6VVYbfoLDpc';

async function writeLeaveData(name, leaveType, leaveDate) {
  const row = [new Date().toISOString(), name, leaveType, leaveDate];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: '工作表1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

async function checkLeaveConflict(name, role, store, date) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: '工作表1!A:D',
  });

  const records = res.data.values || [];
  const dateOnly = date.trim();
  const sameStore = records.filter(row => row[3] === dateOnly && row[1] !== name);

  const sameRoleOnSameDay = sameStore.filter(row => {
    const otherName = row[1];
    const otherRole = getRoleByName(otherName, store);
    return otherRole === role;
  });

  if (sameRoleOnSameDay.length > 0) {
    return { error: `${dateOnly} 已有同間店的 ${role} 請假，請選擇其他日期。` };
  }

  return { ok: true };
}

function getRoleByName(name, store) {
  const employees = {
    '松竹店': { '設計師': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'], '助理': ['Sandy', 'umi'] },
    '南興店': { '設計師': ['Elma', 'Bella', 'Abby'], '助理': ['珮茹'] },
    '漢口店': { '設計師': ['麗君', '巧巧', 'cherry', 'Judy'], '助理': ['Celine', '采妍'] },
    '太平店': { '設計師': ['小麥', 'Erin', '小安', '雯怡'], '助理': ['yuki'] },
    '高雄店': { '設計師': ['mimi', 'jimmy'], '助理': [] },
    '松安店': { '設計師': ['lina', 'shu'], '助理': [] }
  };

  const roleMap = employees[store];
  for (const role in roleMap) {
    if (roleMap[role].includes(name)) return role;
  }
  return '';
}

module.exports = { writeLeaveData, checkLeaveConflict };
