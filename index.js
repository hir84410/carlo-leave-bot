
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const bodyParser = require('body-parser');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
const client = new line.Client(config);

// 加入 body-parser 並保留 raw body 給 LINE SDK 使用
app.post('/webhook', 
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }),
  line.middleware(config),
  async (req, res) => {
    try {
      const events = req.body.events;
      if (!events || events.length === 0) return res.status(200).send('OK');

      const results = await Promise.all(events.map(handleEvent));
      res.json(results);
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Internal Server Error');
    }
  }
);

// 用戶狀態暫存
const userState = {};

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text;

  if (text === '我要請假') {
    userState[userId] = { step: 'selectName' };
    return client.replyMessage(event.replyToken, flexChooseName);
  }

  const state = userState[userId];

  if (state?.step === 'selectName') {
    userState[userId] = { name: text, step: 'selectType' };
    return client.replyMessage(event.replyToken, flexChooseLeaveType);
  }

  if (state?.step === 'selectType') {
    const leaveRecord = {
      name: state.name,
      type: text,
      date: new Date().toISOString().split('T')[0],
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', leaveRecord);

    userState[userId] = null;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${leaveRecord.name} 請假成功：${leaveRecord.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動流程 ✅'
  });
}

// Flex：選擇姓名
const flexChooseName = {
  type: 'flex',
  altText: '請選擇您的姓名',
  contents: {
    type: 'carousel',
    contents: ['Johnny', 'Dora', 'Wendy', 'Erin'].map(name => ({
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

// Flex：選擇請假類別
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
