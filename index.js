const express = require('express');
const line = require('@line/bot-sdk');
const dayjs = require('dayjs');
const { checkLeaveConflict, writeLeaveData } = require('./google-sheets');
const app = express();

const config = {
  channelAccessToken: '你的LINE_ACCESS_TOKEN',
  channelSecret: '你的LINE_CHANNEL_SECRET'
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

async function handleEvent(event) {
  if (event.type === 'postback' && event.postback?.data === 'select-date') {
    const userId = event.source.userId;
    const selectedDate = event.postback.params.date;
    if (!userState[userId]) userState[userId] = {};
    userState[userId].leaveDate = selectedDate;
    const { name, role, store, leaveType, leaveDate } = userState[userId];
    const result = await checkLeaveConflict(name, role, store, leaveDate);
    if (result.error) {
      userState[userId] = {};
      return client.replyMessage(event.replyToken, [{ type: 'text', text: result.error }]);
    } else {
      await writeLeaveData(name, leaveType, leaveDate);
      userState[userId] = {};
      return client.replyMessage(event.replyToken, [{
        type: 'text',
        text: `已成功為 ${name} 記錄 ${leaveDate} 的 ${leaveType}`
      }]);
    }
  }

  if (event.type === 'postback' && event.postback.data === 'startDate') {
    const userId = event.source.userId;
    const startDate = event.postback.params.date;
    const { name, role, store, leaveType, leaveDays } = userState[userId];
    const leaveDates = [];

    for (let i = 0; i < Number(leaveDays); i++) {
      const date = dayjs(startDate).add(i, 'day').format('YYYY-MM-DD');
      leaveDates.push(date);
    }

    const results = await Promise.all(
      leaveDates.map(date =>
        checkLeaveConflict(name, role, store, date).then(res => ({ date, error: res.error }))
      )
    );

    const conflict = results.find(r => r.error);
    if (conflict) {
      userState[userId] = {};
      return client.replyMessage(event.replyToken, [{ type: 'text', text: `${conflict.date} ${conflict.error}` }]);
    } else {
      await Promise.all(leaveDates.map(date => writeLeaveData(name, leaveType, date)));
      userState[userId] = {};
      return client.replyMessage(event.replyToken, [{
        type: 'text',
        text: `已成功為 ${name} 記錄 ${leaveDates.join(', ')} 的 ${leaveType}`
      }]);
    }
  }

  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const text = event.message.text;

  if (!userState[userId]) userState[userId] = {};

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
    const days = ['1','2','3','4','5','6','7'];
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

// === Flex Message Functions ===

function getStoreFlex() {
  const stores = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
  return {
    type: 'flex',
    altText: '請選擇店家',
    contents: {
      type: 'carousel',
      contents: stores.map(store => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: store, weight: 'bold', size: 'sm' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: '選擇', text: store }
          }]
        }
      }))
    }
  };
}

function getRoleFlex() {
  return {
    type: 'flex',
    altText: '請選擇職位',
    contents: {
      type: 'carousel',
      contents: ['設計師', '助理', '行政人員'].map(role => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: role, weight: 'bold', size: 'sm' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: '選擇', text: role }
          }]
        }
      }))
    }
  };
}

function getEmployeeFlex(store, role) {
  const employees = getEmployeeListByStore();
  const names = employees[store]?.[role] || [];
  return {
    type: 'flex',
    altText: `請選擇 ${store} 的 ${role}`,
    contents: {
      type: 'carousel',
      contents: names.map(name => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: name, size: 'sm', weight: 'bold' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: '選擇', text: name }
          }]
        }
      }))
    }
  };
}

function getLeaveTypeFlex() {
  const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];
  return {
    type: 'flex',
    altText: '請選擇請假類型',
    contents: {
      type: 'carousel',
      contents: leaveTypes.map(type => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: type, weight: 'bold', size: 'sm' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: '選擇', text: type }
          }]
        }
      }))
    }
  };
}

function getLeaveDaysFlex() {
  const days = [1, 2, 3, 4, 5, 6, 7];
  return {
    type: 'flex',
    altText: '請選擇請假天數',
    contents: {
      type: 'carousel',
      contents: days.map(day => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: `${day} 天`, weight: 'bold', size: 'sm' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: `${day} 天`, text: `${day}` }
          }]
        }
      }))
    }
  };
}

function getDatePickerFlex() {
  const today = dayjs().format('YYYY-MM-DD');
  const max = dayjs().add(6, 'month').format('YYYY-MM-DD');
  return {
    type: 'flex',
    altText: '請選擇請假開始日期',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '請選擇請假開始日期',
            weight: 'bold',
            size: 'md'
          },
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'datetimepicker',
              label: '選擇日期',
              data: 'startDate',
              mode: 'date',
              initial: today,
              min: today,
              max: max
            }
          }
        ]
      }
    }
  };
}

function getEmployeeListByStore() {
  return {
    '松竹店': {
      '設計師': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'],
      '助理': ['Sandy', 'umi'],
      '行政人員': ['Masi']
    },
    '南興店': {
      '設計師': ['Elma', 'Bella', 'Abby'],
      '助理': ['珮茹'],
      '行政人員': ['Josie']
    },
    '漢口店': {
      '設計師': ['麗君', '巧巧', 'cherry', 'Judy'],
      '助理': ['Celine', '采妍'],
      '行政人員': ['力嫙', '嫚雅']
    },
    '太平店': {
      '設計師': ['小麥', 'Erin', '小安', '雯怡'],
      '助理': ['yuki'],
      '行政人員': ['小君']
    },
    '高雄店': {
      '設計師': ['mimi', 'jimmy'],
      '助理': [],
      '行政人員': []
    },
    '松安店': {
      '設計師': ['lina', 'shu'],
      '助理': [],
      '行政人員': []
    }
  };
}

function getEmployeeList(store, role) {
  const data = getEmployeeListByStore();
  return data[store]?.[role] || [];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Leave Bot running on port ${PORT}`);
});
