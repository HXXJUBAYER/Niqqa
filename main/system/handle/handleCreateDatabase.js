module.exports = function({
  api,
  Users,
  Threads,
  Currencies
}) {
  const logger = require("../../utility/logs.js");
  return async function({
    event
  }) {
    const {
      allUserID,
      allCurrenciesID,
      allThreadID,
      userName,
      threadInfo
    } = global.data;
    const {
      autocreatedb
    } = global.config;
    if (autocreatedb == ![]) return;
    var {
      senderID,
      threadID
    } = event;
    senderID = String(senderID);
    threadID = String(threadID);
    const userID = await api.getCurrentUserID();
    const setAllThread = allThreadID.get(userID);
    try {
      if (!allThreadID.get(userID).includes(threadID) && event.isGroup == !![]) {
          const chalk = require('chalk');
          const threadIn4 = await Threads.getInfo(threadID);
          const setting = {};
          setting.threadName = threadIn4.threadName || "name does not exist";
          setting.adminIDs = threadIn4.adminIDs;
          setting.nicknames = threadIn4.nicknames;
          setting.participantIDs = threadIn4.participantIDs;
          const dataThread = setting;
          setAllThread.push(String(threadID));
          threadInfo.set(threadID, dataThread);
          const setting2 = {};
          setting2.threadInfo = dataThread
          setting2.data = {}
          await Threads.setData(threadID, setting2);
          for (singleData of threadIn4.userInfo) {
            userName.set(String(singleData.id), singleData.name);
            try {
              global.data.allUserID.includes(String(singleData.id)) ? (await Users.setData(String(singleData.id), {
                'name': singleData.name
              }), global.data.allUserID.push(singleData.id)) : (await Users.createData(singleData.id, {
                'name': singleData.name,
                'data': {}
              }), global.data.allUserID.push(String(singleData.id)), global.data.allUserID.push(String(singleData.name)), console.log(global.getText('handleCreateDatabase', 'newUser', '\nname : ' + chalk.white(`${singleData.name}`) + "\nuser id :" + chalk.white(`${singleData.id}`))));
            } catch (e) {
              console.log(e)
            };
          }
          console.log(global.getText('handleCreateDatabase', 'newThread', '\ngroup id : ' + chalk.white(`${threadID}`) + "\ngroup name : " + chalk.white(`${threadIn4.threadName || `name doesn't exist`}`)));
      }
      if (!allUserID.includes(senderID) || !userName.has(senderID)) {
        const infoUsers = await Users.getInfo(senderID),
          setting3 = {};
        setting3.name = infoUsers.name
        await Users.createData(senderID, setting3)
        allUserID.push(senderID)
        userName.set(senderID, infoUsers.name)
        console.log(global.getText('handleCreateDatabase', 'newUser', '\nbot id : ' + userID + '\nname : ' + await Users.getNameUser(senderID) + "\nuser id : " + senderID));
      }
      if (!allCurrenciesID.includes(senderID)) {
        const setting4 = {};
        setting4.data = {}
        await Currencies.createData(senderID, setting4)
        allCurrenciesID.push(senderID);
      }
      return;
    } catch (err) {
      return console.log(err);
    }
  };
}