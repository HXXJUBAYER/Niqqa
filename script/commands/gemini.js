module.exports.config = {
  name: `gemini`,
  version: "1.1.0",
  permission: 0,
  credits: "ryuko",
  description: "",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: ``,
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};
const axios = require('axios');
module.exports.run = async function ({api, event, args}) {
    const ask = args.join(" ");
    
    if (!ask) {
        return api.sendMessage(`please provide a message`, event.threadID, event.messageID);
    }
    try {
        const res = await axios.get(`https://kaiz-apis.gleeze.com/api/gemini-pro?q=${ask}&uid=${event.senderID}`);
        const message = res.data.response;
        return api.sendMessage(message, event.threadID, event.messageID);
    } catch (err) {
        return api.sendMessage(`can't fetch api key.`, event.threadID, event.messageID);
    }
}