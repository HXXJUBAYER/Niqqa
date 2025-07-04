const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: `faceswap`,
  version: "1.1.0",
  permission: 0,
  credits: "churchill",
  description: "Swap Faces of two picture",
  prefix: false,
  premium: false,
  category: "without prefix",
  usages: ``,
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event }) {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length < 2) {
        return api.sendMessage('Please reply to two image attachments with "faceswap".', event.threadID, event.messageID);
    }

    const attachments = event.messageReply.attachments;
    if (!attachments.every(att => att.type === 'photo')) {
        return api.sendMessage('Both attachments must be images.', event.threadID, event.messageID);
    }

    const img1 = attachments[0].url;
    const img2 = attachments[1].url;

    const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap?swapUrl=${encodeURIComponent(img1)}&baseUrl=${encodeURIComponent(img2)}`;

    api.sendMessage('Swapping faces... Please wait.', event.threadID, event.messageID);

    try {
        const response = await axios({
            method: 'GET',
            url: apiUrl,
            responseType: 'arraybuffer',
        });

        const filePath = path.join(__dirname, 'cache', `faceswap_${Date.now()}.jpg`);
        fs.writeFileSync(filePath, response.data);

        await api.sendMessage({
            body: 'Here is the face-swapped image:',
            attachment: fs.createReadStream(filePath),
        }, event.threadID, event.messageID);

        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error during faceswap:', error.message);
        api.sendMessage('An error occurred while swapping faces. Please try again later.', event.threadID, event.messageID);
    }
};