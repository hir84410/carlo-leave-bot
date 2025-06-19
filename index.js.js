
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
const client = new line.Client(config);

// 暫存用戶狀態
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

  if (text === '我要請假') {
    userState[userId] = { step: 'selectStore' };
    return client.replyMessage(event.replyToken, flexChooseStore);
  }

  const state = userState[userId];

  if (state?.step === 'selectStore') {
    if (flexEmployeeByStore[text]) {
      userState[userId] = { store: text, step: 'selectEmployee' };
      return client.replyMessage(event.replyToken, flexEmployeeByStore[text]);
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '⚠️ 店家名稱錯誤，請重新選擇。'
      });
    }
  }

  if (state?.step === 'selectEmployee') {
    userState[userId] = { ...state, name: text, step: 'selectType' };
    return client.replyMessage(event.replyToken, flexChooseLeaveType);
  }

  if (state?.step === 'selectType') {
    const leaveRecord = {
      name: state.name,
      store: state.store,
      type: text,
      date: new Date().toISOString().split('T')[0],
    };

    await axios.post('https://script.google.com/macros/s/AKfycbx2EaozKx0ii0LAUNw-Kt-ZFksBnvesqU0iVAtt6PRSMInWrP8ITdGcUKJXOPP4CdZS/exec', leaveRecord);
    userState[userId] = null;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ ${leaveRecord.store} ➝ ${leaveRecord.name} 請假成功：${leaveRecord.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動請假流程 ✅'
  });
}

const flexChooseStore = {
  type: 'flex',
  altText: '請選擇您的店家',
  contents: {
    type: 'carousel',
    contents: ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'].map(store => ({
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
        contents: [{ type: 'text', text: type, weight: 'bold', size: 'sm' }]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'primary',
          action: { type: 'message', label: '選擇', text: type }
        }]
      }
    }))
  }
};

const employeeMap = {
  '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'],
  '南興店': ['Elma', 'Bella', 'Abby', '珮茹'],
  '漢口店': ['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'],
  '太平店': ['小麥', 'Erin', '小安', '雯怡', 'yuki'],
  '高雄店': ['mimi', 'jimmy'],
  '松安店': ['lina', 'shu']
};

const flexEmployeeByStore = {};
for (const store in employeeMap) {
  flexEmployeeByStore[store] = {
    type: 'flex',
    altText: `請選擇 ${store} 的員工姓名`,
    contents: {
      type: 'carousel',
      contents: employeeMap[store].map(name => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: name, weight: 'bold', size: 'sm' }]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            style: 'primary',
            action: { type: 'message', label: '選擇', text: name }
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
