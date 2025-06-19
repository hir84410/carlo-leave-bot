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

const employees = {
  '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'],
  '南興店': ['Elma', 'Bella', 'Abby', '珮茹'],
  '漢口店': ['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'],
  '太平店': ['小麥', 'Erin', '小安', '雯怡', 'yuki'],
  '高雄店': ['mimi', 'jimmy'],
  '松安店': ['lina', 'shu']
};

const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const text = event.message.text;
  const storeNames = Object.keys(employees);
  const allEmployees = Object.values(employees).flat();

  if (storeNames.includes(text)) {
    const roles = ['設計師', '助理', '行政人員'];
    return client.replyMessage(event.replyToken, [
      {
        type: 'flex',
        altText: `請選擇職位`,
        contents: {
          type: 'carousel',
          contents: roles.map((role) => ({
            type: 'bubble',
            size: 'micro',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [{ type: 'text', text: role, size: 'sm', weight: 'bold' }]
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
                  text: role
                }
              }]
            }
          }))
        }
      }
    ]);
  }

  if (['設計師', '助理', '行政人員'].includes(text)) {
    const sampleStore = '松竹店'; // you can dynamically assign this if needed
    const replyFlex = getEmployeeFlex(sampleStore);
    return client.replyMessage(event.replyToken, [replyFlex]);
  }

  if (allEmployees.includes(text)) {
    return client.replyMessage(event.replyToken, [
      {
        type: 'flex',
        altText: '請選擇請假類別',
        contents: {
          type: 'carousel',
          contents: leaveTypes.map((type) => ({
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
      }
    ]);
  }

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