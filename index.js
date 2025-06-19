const express = require('express');
const line = require('@line/bot-sdk');
const { appendLeaveRecord } = require('./google-sheets');
const app = express();

const config = {
  channelAccessToken: '你的 Channel Access Token',
  channelSecret: '你的 Channel Secret'
};

const client = new line.Client(config);
const storeEmployees = {
  '松竹店': {
    designers: ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'],
    assistants: ['Sandy', 'umi'],
    admins: ['Masi']
  },
  '南興店': {
    designers: ['Elma', 'Bella', 'Abby'],
    assistants: ['珮茹'],
    admins: ['Josie']
  },
  '漢口店': {
    designers: ['麗君', '巧巧', 'cherry', 'Judy'],
    assistants: ['Celine', '采妍'],
    admins: ['力嫙', '嫚雅']
  },
  '太平店': {
    designers: ['小麥', 'Erin', '小安', '雯怡'],
    assistants: ['yuki'],
    admins: ['小君']
  },
  '高雄店': {
    designers: ['mimi', 'jimmy'],
    assistants: [],
    admins: []
  },
  '松安店': {
    designers: ['lina', 'shu'],
    assistants: [],
    admins: []
  }
};

const userStates = {};

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function createButtonFlex(title, options) {
  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'carousel',
      contents: options.map(option => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: option, size: 'sm', weight: 'bold' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: { type: 'message', label: '選擇', text: option }
          }]
        }
      }))
    }
  };
}

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text;
  const state = userStates[userId] || {};

  const storeNames = Object.keys(storeEmployees);
  const roles = ['設計師', '助理', '行政人員'];
  const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];

  if (!state.step) {
    userStates[userId] = { step: 1 };
    return client.replyMessage(event.replyToken, [createButtonFlex('請選擇店名', storeNames)]);
  }

  if (state.step === 1 && storeNames.includes(text)) {
    userStates[userId] = { step: 2, store: text };
    return client.replyMessage(event.replyToken, [createButtonFlex('請選擇類別', roles)]);
  }

  if (state.step === 2 && roles.includes(text)) {
    const store = userStates[userId].store;
    const members = storeEmployees[store][
      text === '設計師' ? 'designers' :
      text === '助理' ? 'assistants' : 'admins'
    ];
    userStates[userId].step = 3;
    userStates[userId].role = text;
    return client.replyMessage(event.replyToken, [createButtonFlex(`請選擇 ${text}`, members)]);
  }

  if (state.step === 3) {
    userStates[userId].name = text;
    userStates[userId].step = 4;
    return client.replyMessage(event.replyToken, [createButtonFlex('請選擇請假類別', leaveTypes)]);
  }

  if (state.step === 4 && leaveTypes.includes(text)) {
    const { name } = userStates[userId];
    const date = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
    await appendLeaveRecord({ name, leaveType: text, date });
    userStates[userId] = null;
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `✅ 已完成請假登記：${name} - ${text}`
    }]);
  }

  return client.replyMessage(event.replyToken, [{
    type: 'text',
    text: '請依照步驟操作，請從選擇店名開始。'
  }]);
}

app.listen(10000, () => {
  console.log('Leave Bot running on port 10000');
});