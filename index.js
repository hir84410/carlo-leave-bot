
// 修正：加入狀態檢查，避免跳過請假流程步驟
app.post('/webhook', line.middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

async function handleEvent(event) {
  const userId = event.source.userId;
  if (!userState[userId]) {
    userState[userId] = {};
  }

  const state = userState[userId];
  const text = event.message?.text;

  // 判斷是否已選擇請假天數，若未選擇則引導重新開始
  if (!state.store || !state.role || !state.name || !state.leaveType || !state.leaveDays) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '流程錯誤，請重新選擇店家開始請假流程。'
    });
    userState[userId] = {}; // 重置流程狀態
    return;
  }

  // 進入日期處理流程...
}
