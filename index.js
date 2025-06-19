
const express = require('express');
const line = require('@line/bot-sdk');
const app = express();

const config = {
  channelAccessToken: 'lN45j64UfrXt+wfFPfz/1kdaxFG08uRjp9iywWymNjHx1HrCSqsKZNM/4o7f4fUbFB3EtbeyB75vDhmUH7k3un/bV5x5v1Qxpr2xjRUmbYaL0K5U75U4O3+tVu+YBPFp0EduPBHTVelqRqPmtJzMYQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '604b7180cc7fcffeb543293853a0e11d'
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
  const roles = ['設計師', '助理', '行政人員'];

  if (storeNames.includes(text)) {
    return client.replyMessage(event.replyToken, [getRoleFlex(text)]);
  }

  if (roles.includes(text)) {
    return client.replyMessage(event.replyToken, [getEmployeeFlex(currentStore, text)]);
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

function getRoleFlex(store) {
  currentStore = store;
  const roles = ['設計師', '助理', '行政人員'];
  return {
    type: 'flex',
    altText: `請選擇${store}職位`,
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
  };
}

function getEmployeeFlex(store, role) {
  const employees = {
    '松竹店': {
      '設計師': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'],
      '助理': ['Sandy', 'umi'],
      '行政人員': ['Masi']
    },
    '南興店': {
      '設計師': ['Elma', 'Bella', 'Abby'],
      '助理': ['珮茹'],
      '行政人員': ['Josie']
    },
    '漢口店': {
      '設計師': ['麗君', '巧巧', 'cherry', 'Judy'],
      '助理': ['Celine', '采妍'],
      '行政人員': ['力嫙', '嫚雅']
    },
    '太平店': {
      '設計師': ['小麥', 'Erin', '小安', '雯怡'],
      '助理': ['yuki'],
      '行政人員': ['小君']
    },
    '高雄店': {
      '設計師': ['mimi', 'jimmy'],
      '助理': [],
      '行政人員': []
    },
    '松安店': {
      '設計師': ['lina', 'shu'],
      '助理': [],
      '行政人員': []
    }
  };

  const names = (employees[store] && employees[store][role]) || [];

  return {
    type: 'flex',
    altText: `請選擇 ${store} 的 ${role}`,
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
