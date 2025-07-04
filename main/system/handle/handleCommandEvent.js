module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utility/logs.js")
    return async function ({ event }) {
        const { allowinbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;
        var { senderID, threadID } = event;
        var senderID = String(senderID);
        var threadID = String(threadID);
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
        if (userBanned.has(senderID) || threadBanned.has(threadID) || allowinbox == !![] && senderID == threadID) return;
        const listsEventRegistered = eventRegistered.get(userId);
        for (const eventReg of listsEventRegistered) {
            const cmd = commands.get(eventReg);
            var getText2;

            if (cmd.languages && typeof cmd.languages == 'object') 
                getText2 = (...values) => {
                const commandModule = cmd.languages || {};
                if (!commandModule.hasOwnProperty(global.config.language)) 
                    return api.sendMessage(global.getText('handleCommand','notFoundLanguage', cmd.config.name), threadID, messengeID); 
                var lang = cmd.languages[global.config.language][values[0]] || '';
                for (var i = values.length; i > 0x16c0 + -0x303 + -0x1f * 0xa3; i--) {
                    const expReg = RegExp('%' + i, 'g');
                    lang = lang.replace(expReg, values[i]);
                }
                return lang;
            };
            else getText2 = () => {};
            try {
                const Obj = {};
                Obj.event = event 
                Obj.api = api
                Obj.models = models
                Obj.Users = Users
                Obj.Threads = Threads 
                Obj.Currencies = Currencies 
                Obj.prefix = prefix
                Obj.botname = botname
                Obj.getText = getText2;
                if (cmd) cmd.handleEvent(Obj);
            } catch (error) {
                logger(global.getText('handleCommandEvent', 'moduleError', cmd.config.name), 'error');
            }
        }
    };
};