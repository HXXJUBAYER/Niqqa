const fs = require("fs");
const os = require("os");

module.exports.config = {
  name: "stats",
  version: "1.0.0",
  permission: 0,
  credits: "Jonell Magallanes",
  description: "Showing The Status of Bot",
  prefix: false,
  premium: false,
  category: "System",
  usages: "stats",
  cooldowns: 9
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const botID = await api.getCurrentUserID();
  const startTime = Date.now();

  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptime = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  const osDetails = `${os.type()} ${os.release()} (${os.arch()})`;

  const latencyMessage = await api.sendMessage("Loading Data.......", threadID, messageID);
  const latency = Date.now() - startTime;

  const data = `users : ${global.data.allUserID.length}\nthreads : ${global.data.allThreadID.get(botID).length}\nuptime : ${uptime}\nos : ${osDetails}\nlatency : ${latency}ms`;

  api.editMessage(`STATUS\n${global.line}\n${data}`, latencyMessage.messageID, threadID);
};