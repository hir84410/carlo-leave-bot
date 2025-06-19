const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
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

const storeList = ['松竹店', '南興店', '漢口店', '太平店', '松安店', '高雄店'];

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text;
  const state = userState[userId];

  if (text === '我要請假') {
    userState[userId] = { step: 'selectStore' };
    return client.replyMessage(event.replyToken, flexChooseStore);
  }

  if (state?.step === 'selectStore' && storeList.includes(text)) {
    userState[userId] = { step: 'selectName', store: text };

    const filename = `flexChooseEmployee_${text}.json`;
    const filepath = path.join(__dirname, filename);
    const flex = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    return client.replyMessage(event.replyToken, flex);
  }

  if (state?.step === 'selectName') {
    userState[userId] = {
      step: 'selectType',
      store: state.store,
      name: text
    };
    return client.replyMessage(event.replyToken, flexChooseLeaveType);
  }

  if (state?.step === 'selectType') {
    const leaveRecord = {
      name: state.name,
      store: state.store,
      type: text,
      date: new Date().toISOString().split('T')[0]
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', leaveRecord);

    userState[userId] = null;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${leaveRecord.name} 請假成功（${leaveRecord.store}）：${leaveRecord.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來開始流程 ✅'
  });
}

const flexChooseStore = {
  type: 'flex',
  altText: '請選擇店別',
  contents: {
    type: 'carousel',
    contents: ['松竹店', '南興店', '漢口店', '太平店', '松安店', '高雄店'].map(store => ({
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