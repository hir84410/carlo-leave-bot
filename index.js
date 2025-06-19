
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '你的_ACCESS_TOKEN',
  channelSecret: process.env.CHANNEL_SECRET || '你的_CHANNEL_SECRET'
};

const app = express();
app.use(express.json());
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

  if (text === '我要請假') {
    userState[userId] = { step: 'selectStore' };
    return client.replyMessage(event.replyToken, flexChooseStore);
  }

  const state = userState[userId];

  if (state?.step === 'selectStore') {
    userState[userId] = { store: text, step: 'selectName' };

    switch (text) {
      case '松竹店': return client.replyMessage(event.replyToken, flexChooseEmployee_松竹店);
      case '南興店': return client.replyMessage(event.replyToken, flexChooseEmployee_南興店);
      case '漢口店': return client.replyMessage(event.replyToken, flexChooseEmployee_漢口店);
      case '太平店': return client.replyMessage(event.replyToken, flexChooseEmployee_太平店);
      case '松安店': return client.replyMessage(event.replyToken, flexChooseEmployee_松安店);
      case '高雄店': return client.replyMessage(event.replyToken, flexChooseEmployee_高雄店);
      default:
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '⚠️ 找不到該店家，請重新輸入'
        });
    }
  }

  if (state?.step === 'selectName') {
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
      text: `✅ ${leaveRecord.store} ${leaveRecord.name} 請假成功：${leaveRecord.type}`
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '請輸入「我要請假」來啟動流程 ✅'
  });
}

const flexChooseStore = {
  type: 'flex',
  altText: '請選擇店家',
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

function makeFlexEmployee(names, store) {
  return {
    type: 'flex',
    altText: `請選擇${store}員工`,
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

const flexChooseEmployee_松竹店 = makeFlexEmployee(['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'], '松竹店');
const flexChooseEmployee_南興店 = makeFlexEmployee(['Elma', 'Bella', 'Abby', '珮茹'], '南興店');
const flexChooseEmployee_漢口店 = makeFlexEmployee(['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'], '漢口店');
const flexChooseEmployee_太平店 = makeFlexEmployee(['小麥', 'Erin', '小安', '雯怡', 'yuki'], '太平店');
const flexChooseEmployee_松安店 = makeFlexEmployee(['lina', 'shu'], '松安店');
const flexChooseEmployee_高雄店 = makeFlexEmployee(['mimi', 'jimmy'], '高雄店');

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
