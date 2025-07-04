module.exports = function ({api ,models, Users, Threads, Currencies }) {
    const logger = require("../../utility/logs.js");
   	const moment = require("moment");
    return async function ({ event }) {
        const timeStart = Date.now()
        const time = moment.tz("Asia/Manila").format("HH:MM:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { developermode, approval, allowinbox, approvedgroups} = global.config;
        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        const bots = require("../../../bots.json");
        const userId = await api.getCurrentUserID();
        var prefix;
        var admins;
        var botname;
        try {
            prefix = bots.find(item => item.uid === userId).prefix;
            admins = bots.find(item => item.uid === userId).admins;
            botname = bots.find(item => item.uid === userId).botname;
        } catch (error) {
            return api.logout();
        }
          
        const notApproved = `this box is not approved.\nuse "${prefix}request" to send a approval request from bot operators`;
        if (!approvedgroups.includes(threadID) && approval) {
          return api.sendMessage(notApproved, threadID, async (err, info) => {
            if (err) {
              return logger(`can't send the message`, "error")
            }
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID); 
          });
        }
        if (userBanned.has(senderID)|| threadBanned.has(threadID) || allowinbox == ![] && senderID == threadID) return;
        for (const [key, value] of events.entries()) {
            if (value.config.eventType.indexOf(event.logMessageType) !== -1) {
                const eventRun = events.get(key);
                try {
                    const Obj = {};
                    Obj.api = api
                    Obj.event = event
                    Obj.models= models 
                    Obj.Users= Users 
                    Obj.Threads = Threads
                    Obj.Currencies = Currencies
                    Obj.prefix = prefix
                    Obj.botname = botname
                    eventRun.run(Obj);
                    if (developermode == !![]) 
                    	logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart) + '\n', 'evnt');
                } catch (error) {
                    logger(global.getText('handleEvent', 'eventError', eventRun.config.name, JSON.stringify(error)), "error");
                }
            }
        }
        return;
    };
}