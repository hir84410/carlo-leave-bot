
// Carlo Leave Bot - 修正版本（已整合 Render 支援 + datetimepicker 請假日選擇 + 多日請假）
// 更新說明：
// 1. ✅ 移除重複定義的 getDatePickerFlex()
// 2. ✅ 保留支援 postback.data === 'startDate' 的日期選擇邏輯
// 3. ✅ 保持 process.env.PORT 以支援 Render 自動分配 port

const express = require('express');
const line = require('@line/bot-sdk');
const dayjs = require('dayjs');
const { checkLeaveConflict, writeLeaveData } = require('./google-sheets');
const app = express();

const config = {
  channelAccessToken: 'lN45j64UfrXt+wfFPfz/1kdaxFG08uRjp9iywWymNjHx1HrCSqsKZNM/4o7f4fUbFB3EtbeyB75vDhmUH7k3un/bV5x5v1Qxpr2xjRUmbYaL0K5U75U4O3+tVu+YBPFp0EduPBHTVelqRqPmtJzMYQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '604b7180cc7fcffeb543293853a0e11d'
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
  // ✅ 處理日期 postback：datetimepicker 傳回 startDate
  if (event.type === 'postback' && event.postback?.data === 'startDate') {
    const userId = event.source.userId;
    const startDate = event.postback.params.date;
    const { name, role, store, leaveType, leaveDays } = userState[userId];
    const leaveDates = [];

    for (let i = 0; i < Number(leaveDays); i++) {
      const date = dayjs(startDate).add(i, 'day').format('YYYY-MM-DD');
      leaveDates.push(date);
    }

    const checkAll = leaveDates.map(date =>
      checkLeaveConflict(name, role, store, date).then(res => ({ date, error: res.error }))
    );

    return Promise.all(checkAll).then(results => {
      const conflict = results.find(r => r.error);
      if (conflict) {
        userState[userId] = {};
        return client.replyMessage(event.replyToken, [{ type: 'text', text: `${conflict.date} ${conflict.error}` }]);
      } else {
        const writeAll = leaveDates.map(date => writeLeaveData(name, leaveType, date));
        return Promise.all(writeAll).then(() => {
          userState[userId] = {};
          return client.replyMessage(event.replyToken, [
            { type: 'text', text: `已成功為 ${name} 記錄 ${leaveDates.join(', ')} 的 ${leaveType}` }
          ]);
        });
      }
    });
  }

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
    } else {
      return client.replyMessage(event.replyToken, [
        { type: 'text', text: '請從選單中點選店名，不要手動輸入哦～' },
        getStoreFlex()
      ]);
    }
  } else if (!userState[userId].role) {
    const roles = ['設計師', '助理', '行政人員'];
    if (roles.includes(text)) {
      userState[userId].role = text;
      return client.replyMessage(event.replyToken, [getEmployeeFlex(userState[userId].store, userState[userId].role)]);
    } else {
      return client.replyMessage(event.replyToken, [
        { type: 'text', text: '請從選單中點選職位～' },
        getRoleFlex()
      ]);
    }
  } else if (!userState[userId].name) {
    const validNames = getEmployeeList(userState[userId].store, userState[userId].role);
    if (validNames.includes(text)) {
      userState[userId].name = text;
      return client.replyMessage(event.replyToken, [getLeaveTypeFlex()]);
    } else {
      return client.replyMessage(event.replyToken, [
        { type: 'text', text: '請從選單中選擇您的名字喔～' },
        getEmployeeFlex(userState[userId].store, userState[userId].role)
      ]);
    }
  } else if (!userState[userId].leaveType) {
    const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];
    if (leaveTypes.includes(text)) {
      userState[userId].leaveType = text;
      return client.replyMessage(event.replyToken, [getLeaveDaysFlex()]);
    } else {
      return client.replyMessage(event.replyToken, [
        { type: 'text', text: '請從選單中選擇請假類型喔～' },
        getLeaveTypeFlex()
      ]);
    }
  } else if (!userState[userId].leaveDays) {
    const days = ['1', '2', '3', '4', '5', '6', '7'];
    if (days.includes(text)) {
      userState[userId].leaveDays = text;
      return client.replyMessage(event.replyToken, [getDatePickerFlex()]);
    } else {
      return client.replyMessage(event.replyToken, [
        { type: 'text', text: '請從選單中選擇請假天數（1～7 天）' },
        getLeaveDaysFlex()
      ]);
    }
  }

  return client.replyMessage(event.replyToken, [
    { type: 'text', text: '請從選單中選擇店家以開始請假流程' },
    getStoreFlex()
  ]);
}

// ✅ 正確版 datetimepicker Flex（只保留這一個）
function getDatePickerFlex() {
  const today = dayjs().format('YYYY-MM-DD');
  const max = dayjs().add(6, 'month').format('YYYY-MM-DD');
  return {
    type: 'flex',
    altText: '請選擇請假開始日期',
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '請選擇請假開始日期',
            weight: 'bold',
            size: 'md',
            margin: 'none'
          },
          {
            type: 'button',
            action: {
              type: 'datetimepicker',
              label: '選擇日期',
              data: 'startDate',
              mode: 'date',
              initial: today,
              min: today,
              max: max
            },
            style: 'primary',
            height: 'sm',
            margin: 'md'
          }
        ]
      }
    }
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Leave Bot running on port ${PORT}`);
});
