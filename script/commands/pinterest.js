const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
  name: "pin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Jonell Magallanes",
  description: "Finding Image from Pinterest",
  premium: false,
  prefix: true,
  category: "media",
  usages: "[query]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, prefix}) {
  const { threadID, messageID } = event;

  try {
    const keySearch = args.join(" ");

    if (!keySearch.includes("-")) {
      return api.sendMessage(
        `please enter the search query and number of images (1-99). example : ${prefix}pin wallpaper -5`,
        threadID,
        messageID
      );
    }

    const lod = await api.sendMessage("please wait..", threadID, messageID);
    const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
    let numberSearch = parseInt(keySearch.split("-").pop().trim()) || 10;

    if (isNaN(numberSearch) || numberSearch < 1 || numberSearch > 10) {
      return api.sendMessage(
        "please enter a valid number of images (1-99). example: wallpaper -5",
        threadID,
        messageID
      );
    }

    const apiUrl = `https://ccprojectapis.ddns.net/api/pin?title=${keySearch}&count=${numberSearch}`;
    console.log(`Fetching data from API: ${apiUrl}`);

    const res = await axios.get(apiUrl);
    const data = res.data.data;

    if (!data || data.length === 0) {
      return api.sendMessage(
        `No results found for your query "${keySearchs}". Please try with a different query.`,
        threadID,
        messageID
      );
    }

    const imgData = [];

    for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
      console.log(`fetching image ${i + 1} from url : ${data[i]}`);
      const imgResponse = await axios.get(data[i], { responseType: "arraybuffer" });
      const imgPath = path.join(__dirname, "cache", `${i + 1}.jpg`);
      await fs.outputFile(imgPath, imgResponse.data);
      imgData.push(fs.createReadStream(imgPath));
    }

    await api.sendMessage({
      body: `here are the top ${numberSearch} results for your query "${keySearchs}"`,
      attachment: imgData,
    }, threadID, messageID);

    api.unsendMessage(lod.messageID);
    console.log(`images successfully sent to thread ${threadID}`);

    await fs.remove(path.join(__dirname, "cache"));
    console.log("cache directory cleaned up.");

  } catch (error) {
    console.error("error fetching images from pinterest : ", error);
    return api.sendMessage(
      `An error occurred while fetching images. Please try again later.`,
      threadID,
      messageID
    );
  }
};