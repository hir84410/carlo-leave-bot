
const express = require('express');
const line = require('@line/bot-sdk');
const app = express();

const config = {
  channelAccessToken: '你的 Channel Access Token',
  channelSecret: '你的 Channel Secret'
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const text = event.message.text;
  const storeNames = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
  const employeeTypes = ['設計師', '助理', '行政人員'];
  const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];

  if (storeNames.includes(text)) {
    return client.replyMessage(event.replyToken, [getTypeFlex()]);
  }

  if (employeeTypes.includes(text)) {
    return client.replyMessage(event.replyToken, [getEmployeeFlex(text)]);
  }

  if (leaveTypes.includes(text)) {
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `你選擇的請假類型是：${text}`
    }]);
  }

  return client.replyMessage(event.replyToken, [getStoreFlex()]);
}

function getStoreFlex() {
  const stores = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
  return {
    type: 'flex',
    altText: '請選擇店家',
    contents: {
      type: 'carousel',
      contents: stores.map((name) => ({
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
            action: {
              type: 'message',
              label: '選擇',
              text: name
            }
          }]
        }
      }))
    }
  };
}

function getTypeFlex() {
  const types = ['設計師', '助理', '行政人員'];
  return {
    type: 'flex',
    altText: '請選擇職位',
    contents: {
      type: 'carousel',
      contents: types.map((type) => ({
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
            action: {
              type: 'message',
              label: '選擇',
              text: type
            }
          }]
        }
      }))
    }
  };
}

function getEmployeeFlex(type) {
  const employees = {
    '設計師': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy'],
    '助理': ['Sandy', 'umi'],
    '行政人員': ['Masi']
  };

  const names = employees[type] || [];

  return {
    type: 'flex',
    altText: `請選擇${type}`,
    contents: {
      type: 'carousel',
      contents: names.map((name) => ({
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
            action: {
              type: 'message',
              label: '選擇',
              text: name
            }
          }]
        }
      }))
    }
  };
}

app.listen(10000, () => {
  console.log('Leave Bot running on port 10000');
});
