const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;

    if (!events || events.length === 0) {
      return res.status(200).send('OK');
    }

    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if (event.message.text === '我要請假') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '請問您的姓名是？（功能建置中）'
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動流程 ✅'
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Line Bot running on port ${PORT}`);
});