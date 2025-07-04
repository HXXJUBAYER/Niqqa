module.exports.config = {
  name: "premium",
  version: "2.0.0",
  permission: 0,
  credits: "ryuko",
  description: "premium commands configure",
  prefix: false,
  category: "admin",
  premium: false,
  usages: "premium [group/remove] [threadid]",
  cooldowns: 5,
};

module.exports.languages = {
    "bangla": {
        "listAdmin": 'approved list : \n\n%1',
        "notHavePermssion": 'you have no permission to use "%1"',
        "addedNewAdmin": 'added new premium user :\n\n%2',
        "removedAdmin": 'removed %1 user in premium lists :\n\n%2'
    },
    "english": {
        "listAdmin": 'approved list : \n\n%1',
        "notHavePermssion": 'you have no permission to use "%1"',
        "addedNewAdmin": 'added new premium user :\n\n%2',
        "removedAdmin": 'removed %1 user in premium lists :\n\n%2'
    }
}

module.exports.run = async function ({ api, event, args, Threads, Users, permssion, getText }) {
    const content = args.slice(1, args.length);
    const { threadID, messageID, mentions } = event;
    const haspremiumcmd = global.config.haspremiumcmd

    const configPath = '../../config.json'
    const { admins } = global.config;
    const { userName } = global.data;
    const { writeFileSync } = global.nodemodule["fs-extra"];
    const mention = Object.keys(mentions);
    delete require.cache[require.resolve('../../config.json')];
    var config = require('../../config.json');
    


    switch (args[0]) {
        case "list":
        case "all":
        case "-a": {
            const listAdmin = haspremiumcmd || config.haspremiumcmd || [];
            var msg = [];

            for (const idAdmin of listAdmin) {
                if (parseInt(idAdmin)) {
                  let boxname;
                  try {
        const groupName = await global.data.threadInfo.get(idAdmin).threadName || "name does not exist"
        boxname = `group name : ${groupName}\ngroup id : ${idAdmin}`;
      } catch (error) {
        const userName = await Users.getNameUser(idAdmin);
        boxname = `user name : ${userName}\nuser id : ${idAdmin}`;
      }
                  msg.push(`\n${boxname}`);
                }
            };

            return api.sendMessage(`premium users lists :\n${msg.join('\n')}`, threadID, messageID);
        }

        case "add": {
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);



            if (mention.length != 0 && isNaN(content[0])) {

                var listAdd = [];

                for (const id of mention) {

                    APPROVED.push(id);
                    config.haspremiumcmd.push(id);
                    listAdd.push(`${id} - ${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                APPROVED.push(content[0]);
                config.PREMIUMUSERS.push(content[0]);

                  let boxname;
                  try {
        const groupname = await global.data.threadInfo.get(content[0]).threadName || "name does not exist";
        boxname = `group name : ${groupname}\ngroup id : ${content[0]}`;
      } catch (error) {
        const username = await Users.getNameUser(content[0]);
        boxname = `user name : ${username}\nuser id : ${content[0]}`;
      }
                writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                return api.sendMessage('you have been added to premium lists, you are allowed to use premium commands.', content[0], () => {
                return api.sendMessage(getText("addedNewAdmin", 1, `${boxname}`), threadID, messageID);
                });
            }
            else return global.utils.throwError(this.config.name, threadID, messageID);
        }


        case "remove":
        case "rm":
        case "delete": {
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
            if (mentions.length != 0 && isNaN(content[0])) {
                const mention = Object.keys(mentions);
                var listAdd = [];

                for (const id of mention) {
                    const index = config.haspremiumcmd.findIndex(item => item == id);
                    haspremiumcmd.splice(index, 1);
                    config.haspremiumcmd.splice(index, 1);
                    listAdd.push(`${id} - ${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                return api.sendMessage(getText("removedAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                const index = config.haspremiumcmd.findIndex(item => item.toString() == content[0]);
                haspremiumcmd.splice(index, 1);
                config.haspremiumcmd.splice(index, 1);

                  let boxname;
                  try {
        const groupname = await global.data.threadInfo.get(content[0]).threadName || "name does not exist";
        boxname = `group name : ${groupname}\ngroup id : ${content[0]}`;
      } catch (error) {
        const username = await Users.getNameUser(content[0]);
        boxname = `user name : ${username}\nuser id : ${content[0]}`
      }
                writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                return api.sendMessage('you have been removed from premium lists', content[0], () => {
                return api.sendMessage(getText("removedAdmin", 1, `${boxname}`), threadID, messageID);
                });
            }
            else global.utils.throwError(this.config.name, threadID, messageID);
        }

        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    };
}
