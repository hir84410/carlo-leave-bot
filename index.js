const express = require('express');
const line = require('@line/bot-sdk');
const app = express();

const config = {
  channelAccessToken: 'lN45j64UfrXt+wfFPfz/1kdaxFG08uRjp9iywWymNjHx1HrCSqsKZNM/4o7f4fUbFB3EtbeyB75vDhmUH7k3un/bV5x5v1Qxpr2xjRUmbYaL0K5U75U4O3+tVu+YBPFp0EduPBHTVelqRqPmtJzMYQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '604b7180cc7fcffeb543293853a0e11d'
};

const client = new line.Client(config);

// 儲存請假流程的暫存狀態
const userState = {};

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const text = event.message.text;

  if (!userState[userId]) {
    userState[userId] = { step: 1 };
  }

  const state = userState[userId];

  // Step 1：選擇店名
  if (state.step === 1) {
    const stores = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
    if (stores.includes(text)) {
      state.store = text;
      state.step = 2;
      return client.replyMessage(event.replyToken, [getRoleFlex()]);
    } else {
      return client.replyMessage(event.replyToken, [getStoreFlex()]);
    }
  }

  // Step 2：選擇職位
  if (state.step === 2) {
    const roles = ['設計師', '助理', '行政人員'];
    if (roles.includes(text)) {
      state.role = text;
      state.step = 3;
      return client.replyMessage(event.replyToken, [getEmployeeFlex(state.store, state.role)]);
    } else {
      return client.replyMessage(event.replyToken, [getRoleFlex()]);
    }
  }

  // Step 3：選擇員工名稱
  if (state.step === 3) {
    state.name = text;
    state.step = 4;
    return client.replyMessage(event.replyToken, [getLeaveTypeFlex()]);
  }

  // Step 4：選擇請假類別
  if (state.step === 4) {
    const leaveTypes = ['排休', '病假', '特休', '事假', '喪假', '產假'];
    if (leaveTypes.includes(text)) {
      const { store, role, name } = state;
      delete userState[userId]; // 重設流程
      return client.replyMessage(event.replyToken, [{
        type: 'text',
        text: `✅ 完成請假流程\n🏠 店名：${store}\n👤 職位：${role}\n🧑‍💼 員工：${name}\n📌 請假類別：${text}`
      }]);
    } else {
      return client.replyMessage(event.replyToken, [getLeaveTypeFlex()]);
    }
  }

  return Promise.resolve(null);
}

// Step 1：選店名
function getStoreFlex() {
  const stores = ['松竹店', '南興店', '漢口店', '太平店', '高雄店', '松安店'];
  return {
    type: 'flex',
    altText: '請選擇店名',
    contents: {
      type: 'carousel',
      contents: stores.map(name => ({
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

// Step 2：選職位
function getRoleFlex() {
  const roles = ['設計師', '助理', '行政人員'];
  return {
    type: 'flex',
    altText: '請選擇職位',
    contents: {
      type: 'carousel',
      contents: roles.map(role => ({
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
            action: { type: 'message', label: '選擇', text: role }
          }]
        }
      }))
    }
  };
}

// Step 3：選人名
function getEmployeeFlex(store, role) {
  const data = {
    '松竹店': {
      設計師: ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora'],
      助理: ['Sandy', 'umi'],
      行政人員: ['Masi']
    },
    '南興店': {
      設計師: ['Elma', 'Bella', 'Abby'],
      助理: ['珮茹'],
      行政人員: ['Josie']
    },
    '漢口店': {
      設計師: ['麗君', '巧巧', 'cherry', 'Judy'],
      助理: ['Celine', '采妍'],
      行政人員: ['力嫙', '嫚雅']
    },
    '太平店': {
      設計師: ['小麥', 'Erin', '小安', '雯怡'],
      助理: ['yuki'],
      行政人員: ['小君']
    },
    '高雄店': {
      設計師: ['mimi', 'jimmy'],
      助理: [],
      行政人員: []
    },
    '松安店': {
      設計師: ['lina', 'shu'],
      助理: [],
      行政人員: []
    }
  };

  const names = data[store]?.[role] || [];
  return {
    type: 'flex',
    altText: `請選擇 ${store} 的 ${role}`,
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

// Step 4：請假類別
function getLeaveTypeFlex() {
  const types = ['排休', '病假', '特休', '事假', '喪假', '產假'];
  return {
    type: 'flex',
    altText: '請選擇請假類別',
    contents: {
      type: 'carousel',
      contents: types.map(type => ({
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

app.listen(10000, () => {
  console.log('Leave Bot running on port 10000');
});
