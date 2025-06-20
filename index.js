
const express = require('express');
const line = require('@line/bot-sdk');
const dayjs = require('dayjs');
const { checkLeaveConflict, writeLeaveData, getMonthlyLeaveCount } = require('./google-sheets');
const app = express();

const config = {
  channelAccessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
  channelSecret: 'YOUR_CHANNEL_SECRET'
};

const client = new line.Client(config);
let userState = {};

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const text = event.message.text;

  if (!userState[userId]) {
    userState[userId] = {};
  }

  if (!userState[userId].store) {
    const storeNames = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
    if (storeNames.includes(text)) {
      userState[userId].store = text;
      return client.replyMessage(event.replyToken, [getRoleFlex()]);
    }
  } else if (!userState[userId].role) {
    const roles = ['設計師', '助理', '行政人員'];
    if (roles.includes(text)) {
      userState[userId].role = text;
      return client.replyMessage(event.replyToken, [getEmployeeFlex(userState[userId].store, userState[userId].role)]);
    }
  } else if (!userState[userId].name) {
    userState[userId].name = text;
    return client.replyMessage(event.replyToken, [getLeaveTypeFlex()]);
  } else if (!userState[userId].leaveType) {
    userState[userId].leaveType = text;
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `請輸入請假日期（YYYY-MM-DD）`
    }]);
  } else if (!userState[userId].leaveDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(text)) {
      return client.replyMessage(event.replyToken, [{ type: 'text', text: '請輸入正確的日期格式：YYYY-MM-DD' }]);
    }

    const selectedDate = dayjs(text);
    const today = dayjs();
    if (selectedDate.isBefore(today, 'day')) {
      return client.replyMessage(event.replyToken, [{ type: 'text', text: '只能請未來的假期，請重新輸入日期' }]);
    }
    if (selectedDate.day() === 2) {
      return client.replyMessage(event.replyToken, [{ type: 'text', text: '每週二為固定公休，請選擇其他日期' }]);
    }

    userState[userId].leaveDate = text;
    const { name, role, store, leaveType, leaveDate } = userState[userId];

    if (leaveType === '排休') {
      return getMonthlyLeaveCount(name, leaveType, leaveDate).then(count => {
        if (count >= 4) {
          userState[userId] = {};
          return client.replyMessage(event.replyToken, [{ type: 'text', text: `您本月已排休 ${count} 天，已達上限` }]);
        }
        return proceedLeave(name, role, store, leaveType, leaveDate, event.replyToken);
      });
    }

    return proceedLeave(name, role, store, leaveType, leaveDate, event.replyToken);
  }

  return client.replyMessage(event.replyToken, [{ type: 'text', text: '請選擇店家開始請假流程' }]);
}

function proceedLeave(name, role, store, leaveType, leaveDate, replyToken) {
  return checkLeaveConflict(name, role, store, leaveDate).then(result => {
    if (result.error) {
      userState = {};
      return client.replyMessage(replyToken, [{ type: 'text', text: result.error }]);
    } else {
      return writeLeaveData(name, leaveType, leaveDate).then(() => {
        userState = {};
        return client.replyMessage(replyToken, [{ type: 'text', text: `已成功為 ${name} 記錄 ${leaveDate} 的 ${leaveType}` }]);
      });
    }
  });
}

// 保留原本的 getRoleFlex, getEmployeeFlex, getLeaveTypeFlex 不變
