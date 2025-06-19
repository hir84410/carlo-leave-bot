const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(express.json({ verify: (req, res, buf) => (req.rawBody = buf) }));
const client = new line.Client(config);

// 暫存使用者狀態
const userState = {};

const stores = {
  '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'],
  '南興店': ['Elma', 'Bella', 'Abby'],
  '漢口店': ['麗君', '巧巧', 'cherry', 'Judy'],
  '太平店': ['小麥', 'Erin', '小安', '雯怡'],
  '松安店': ['lina', 'shu'],
  '高雄店': ['mimi', 'jimmy']
};

const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];

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

  const state = userState[userId];

  // 進入流程
  if (text === '我要請假') {
    userState[userId] = { step: 'selectStore' };
    return client.replyMessage(event.replyToken, flexChooseStore());
  }

  // 選擇店家
  if (state?.step === 'selectStore' && stores[text]) {
    userState[userId] = { step: 'selectName', store: text };
    return client.replyMessage(event.replyToken, flexChooseEmployee(text));
  }

  // 選擇員工姓名
  if (state?.step === 'selectName' && stores[state.store]?.includes(text)) {
    userState[userId] = { ...state, step: 'selectType', name: text };
    return client.replyMessage(event.replyToken, flexChooseLeaveType());
  }

  // 選擇請假類型
  if (state?.step === 'selectType' && leaveTypes.includes(text)) {
    const leaveRecord = {
      store: state.store,
      name: state.name,
      type: text,
      date: new Date().toISOString().split('T')[0]
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', leaveRecord);
    userState[userId] = null;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${leaveRecord.name}（${leaveRecord.store}）請假成功：${leaveRecord.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」開始流程 ✅'
  });
}

// Flex 選單：店家
function flexChooseStore() {
  return {
    type: 'flex',
    altText: '請選擇店家',
    contents: {
      type: 'carousel',
      contents: Object.keys(stores).map(store => ({
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
}

// Flex 選單：員工（依據店家）
function flexChooseEmployee(store) {
  const employees = stores[store] || [];
  return {
    type: 'flex',
    altText: `請選擇 ${store} 員工`,
    contents: {
      type: 'carousel',
      contents: employees.map(name => ({
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

// Flex 選單：請假類型
function flexChooseLeaveType() {
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
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Leave Bot running on port', PORT);
});