module.exports.config = {
  name: "tempmail",
  version: "1.0.",
  permission: 0,
  credits: "James, CREDITS SENSUI FOR THE API ←(*꒪ヮ꒪*)",
  prefix: true,
  premium: false,
  description: "Generate free temporary email",
  category: "generate",
  usages: `tempmain [create/inbox]`,
  cooldowns: 5,
};
module.exports.run = async ({ api, event, prefix, args }) => {
    const axios = require('axios');
    let { threadID, messageID } = event;
    
   
    if (!args[0]) {
        api.sendMessage(`usage: ${prefix}tempmail gen\n\nTo get the messages:\n\nuse ${global.config.PREFIX}tempmail inbox [token]\nexample: ${prefix}tempmail inbox [token]`, threadID, messageID);
    }
    else if (args[0] == "create") {
        const url1 = await axios.get(`https://kaiz-apis.gleeze.com/api/tempmail-create`);
        const email = url1.data.address;
        const token = url1.data.token;
  return api.sendMessage(`here's your temporary email :\n${email}\nyour token: ${token}\n\ntype '${prefix}${this.config.name} inbox [token]' to check the inbox.`, threadID, messageID);
    }
    else if (args[0] == "inbox") {
    const text = args[1];
      const url2 = await axios.get(`https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${text}`);
        const mess = url2.data.message;
      
           return api.sendMessage(`here's the inbox of ${text}\n\nmessage : ${mess}`, threadID, messageID);
    }
    
};