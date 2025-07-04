const axios = require('axios');
module.exports.config = {
  name: "imgur",
  version: "1.0.0",
  permission: 0,
  credits: "ryuko",
  description: "upload image in imgur",
  prefix: false,
  premium: false,
  category: "no prefix",
  usages: "[prompt]",
  cooldowns: 9
};

module.exports.run = async function({ api, event }) {
    try {
        if (!event.messageReply || !event.messageReply.attachments[0]) {
            return api.sendMessage(`please reply to image that you want to upload in imgur`, event.threadID, event.messageID);
        }
        const attachment = event.messageReply.attachments[0].url;
        const res = await axios.get(`https://kaiz-apis.gleeze.com/api/imgur?url=${encodeURIComponent(attachment)}`);
        const uploaded = res.data.uploaded.image;
        return api.sendMessage(uploaded, event.threadID, event.messageID);
        
    } catch (error) {
        return api.sendMessage(`having some unexpected error while fetching the api`, event.threadID, event.messageID)
    }
}