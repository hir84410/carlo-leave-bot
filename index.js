const express = require('express');
const line = require('@line/bot-sdk');
const dayjs = require('dayjs');
const { checkLeaveConflict, writeLeaveData } = require('./google-sheets');
const app = express();

const config = {
  channelAccessToken: 'lN45j64UfrXt+wfFPfz/1kdaxFG08uRjp9iywWymNjHx1HrCSqsKZNM/4o7f4fUbFB3EtbeyB75vDhmUH7k3un/bV5x5v1Qxpr2xjRUmbYaL0K5U75U4O3+tVu+YBPFp0EduPBHTVelqRqPmtJzMYQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '604b7180cc7fcffeb543293853a0e11d'
};

const client = new line.Client(config);

let userState = {};

// ...中略，請參見完整對話輸入內容...

// Force deploy: 2025-06-21 16:04:45

// Force deploy: 2025-06-21 16:27:53
