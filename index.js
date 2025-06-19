const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const bodyParser = require('body-parser');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(line.middleware(config));

const client = new line.Client(config);
const userState = {};

app.post('/webhook', async (req, res) => {
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

  const state = userState[userId];

  if (text === '我要請假') {
    userState[userId] = { step: 'store' };
    return client.replyMessage(event.replyToken, flexChooseStore);
  }

  if (state?.step === 'store' && storeEmployees[text]) {
    userState[userId] = { store: text, step: 'name' };
    return client.replyMessage(event.replyToken, flexChooseEmployee[text]);
  }

  if (state?.step === 'name') {
    userState[userId].name = text;
    userState[userId].step = 'type';
    return client.replyMessage(event.replyToken, flexChooseLeaveType);
  }

  if (state?.step === 'type') {
    const record = {
      name: userState[userId].name,
      store: userState[userId].store,
      type: text,
      date: new Date().toISOString().split('T')[0]
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', record);
    userState[userId] = null;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${record.name} 請假成功：${record.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動請假流程 ✅'
  });
}

const storeEmployees = {
  "松竹店": ["琴", "菲菲", "Johnny", "keke", "Wendy", "tom", "Dora", "Sandy", "umi"],
  "南興店": ["Elma", "Bella", "Abby", "珮茹"],
  "漢口店": ["麗君", "巧巧", "cherry", "Judy", "Celine", "采妍"],
  "太平店": ["小麥", "Erin", "小安", "雯怡", "yuki"],
  "高雄店": ["mimi", "jimmy"],
  "松安店": ["lina", "shu"]
};

const flexChooseStore = {
  type: 'flex',
  altText: '請選擇店別',
  contents: {
    type: 'carousel',
    contents: Object.keys(storeEmployees).map(store => ({
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

const flexChooseEmployee = {};
for (const store in storeEmployees) {
  flexChooseEmployee[store] = {
    type: 'flex',
    altText: `請選擇 ${store} 員工姓名`,
    contents: {
      type: 'carousel',
      contents: storeEmployees[store].map(name => ({
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
      })).slice(0, 10)
    }
  };
}

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