const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const app = express();
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    res.status(200).json(results);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if (event.message.text === '我要請假') {
    return client.replyMessage(event.replyToken, flexMessageChooseName);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `你輸入了：${event.message.text}`
  });
}

const flexMessageChooseName = {
  type: 'flex',
  altText: '請選擇您的姓名',
  contents: {
    type: 'carousel',
    contents: [
      {
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: 'Johnny（松竹店）',
              wrap: true,
              weight: 'bold',
              size: 'sm'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'message',
                label: '選擇',
                text: 'Johnny'
              }
            }
          ],
          flex: 0
        }
      }
    ]
  }
};

// 加入 health 檢查與 keepalive（避免 Render 睡眠）
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

setInterval(() => {
  fetch('https://carlo-leave-bot.onrender.com/health')
    .then(res => console.log('[KeepAlive] Ping success:', new Date()))
    .catch(err => console.error('[KeepAlive] Ping failed:', err));
}, 1000 * 60 * 4);

app.listen(3000, () => {
  console.log('Line Bot running on port 3000');
});
