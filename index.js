const express = require('express');
const line = require('@line/bot-sdk');
const bodyParser = require('body-parser');

const config = {
  channelAccessToken: '你的 LINE Channel Access Token',
  channelSecret: '你的 LINE Channel Secret',
};

const app = express();
const client = new line.Client(config);
app.use(bodyParser.json());

const employeeList = {
  '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'],
  '南興店': ['Elma', 'Bella', 'Abby', '珮茹'],
  '漢口店': ['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'],
  '太平店': ['小麥', 'Erin', '小安', '雯怡', 'yuki'],
  '松安店': ['lina', 'shu'],
  '高雄店': ['mimi', 'jimmy'],
};

function getEmployeeFlex(storeName) {
  const names = employeeList[storeName] || [];
  return {
    type: 'flex',
    altText: '請選擇員工',
    contents: {
      type: 'carousel',
      contents: names.map(name => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: name, size: 'sm', weight: 'bold' }],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'message',
                label: '選擇',
                text: name,
              },
            },
          ],
        },
      })),
    },
  };
}

app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  await Promise.all(
    events.map(async (event) => {
      const msg = event.message?.text;
      if (event.type === 'message' && msg === '我要請假') {
        const reply = {
          type: 'flex',
          altText: '請選擇店家',
          contents: {
            type: 'carousel',
            contents: Object.keys(employeeList).map(store => ({
              type: 'bubble',
              size: 'micro',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [{ type: 'text', text: store, size: 'sm', weight: 'bold' }],
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    height: 'sm',
                    action: {
                      type: 'message',
                      label: '選擇',
                      text: store,
                    },
                  },
                ],
              },
            })),
          },
        };
        await client.replyMessage(event.replyToken, [reply]);
      } else if (event.type === 'message' && employeeList[msg]) {
        const replyFlex = getEmployeeFlex(msg);
        await client.replyMessage(event.replyToken, [replyFlex]);
      }
    })
  );
  res.status(200).end();
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Leave Bot running on port ${port}`);
});
