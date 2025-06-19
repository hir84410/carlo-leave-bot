
const express = require('express');
const line = require('@line/bot-sdk');
const app = express();

const config = {
  channelAccessToken: '你的 Channel Access Token',
  channelSecret: '你的 Channel Secret'
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
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
  if (storeNames.includes(text)) {
    const replyFlex = getEmployeeFlex(text);
    return client.replyMessage(event.replyToken, [replyFlex]);
  }

  const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];
  if (leaveTypes.includes(text)) {
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `你選擇的請假類型是：${text}`
    }]);
  }

  return client.replyMessage(event.replyToken, [{
    type: 'flex',
    altText: '請選擇店家',
    contents: {
      type: 'carousel',
      contents: storeNames.map((name) => ({
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
  }]);
}

function getEmployeeFlex(store) {
  const employees = {
    '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'],
    '南興店': ['Elma', 'Bella', 'Abby', '珮茹'],
    '漢口店': ['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'],
    '太平店': ['小麥', 'Erin', '小安', '雯怡', 'yuki'],
    '高雄店': ['mimi', 'jimmy'],
    '松安店': ['lina', 'shu']
  };

  const names = employees[store] || [];

  return {
    type: 'flex',
    altText: `請選擇 ${store} 員工`,
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
