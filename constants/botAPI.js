require('dotenv').config();
const token = process.env.BOT_TOKEN;
const bot_url = 'https://api.telegram.org/';

module.exports = { token, bot_url };
