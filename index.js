const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const fs = require('fs');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }));
const client = new line.Client(config);

const userState = {};

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');
    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;
  const userId = event.source.userId;
  const text = event.message.text;

  // 初始流程
  if (text === '我要請假') {
    userState[userId] = { step: 'selectStore' };
    return client.replyMessage(event.replyToken, flexChooseStore);
  }

  const state = userState[userId];

  // 選擇店家後
  if (state?.step === 'selectStore' && storeEmployeeMap[text]) {
    userState[userId] = { store: text, step: 'selectEmployee' };

    const flex = JSON.parse(fs.readFileSync(__dirname + '/flexChooseEmployee_' + text + '.json'));
    return client.replyMessage(event.replyToken, flex);
  }

  // 選擇員工
  if (state?.step === 'selectEmployee') {
    userState[userId] = { ...state, employee: text, step: 'selectType' };
    return client.replyMessage(event.replyToken, flexChooseLeaveType);
  }

  // 選擇假別
  if (state?.step === 'selectType') {
    const record = {
      name: state.employee,
      type: text,
      store: state.store,
      date: new Date().toISOString().split('T')[0],
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', record);

    userState[userId] = null;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${record.name} 已登記請假：${record.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動流程 ✅'
  });
}

const storeEmployeeMap = {
  "松竹店": true,
  "南興店": true,
  "漢口店": true,
  "太平店": true,
  "松安店": true,
  "高雄店": true
};

const flexChooseStore = {
  type: 'flex',
  altText: '請選擇店家',
  contents: {
    type: 'carousel',
    contents: Object.keys(storeEmployeeMap).map(store => ({
      type: 'bubble',
      size: 'micro',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'text', text: store, size: 'sm', weight: 'bold' }]
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

const flexChooseLeaveType = {
  type: 'flex',
  altText: '請選擇請假類別',
  contents: {
    type: 'carousel',
    contents: ['排休', '病假', '特休', '事假', '喪假', '產假'].map(type => ({
      type: 'bubble',
      size: 'micro',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'text', text: type, size: 'sm', weight: 'bold' }]
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Leave Bot running on port', PORT);
});
