module.exports.config = {
	name: "language",
	version: "1.0.0",
	permission: 2,
	prefix: true,
	credits: "ryuko",
	description: "change the bot language",
  premium: false,
	category: "admin",
	usages: "[bangla] [english]",
	cooldowns: 5
};

module.exports.run = async ({ api, event, args, getText }) => {
  let operator = global.config.operators;
            if (!operator.includes(event.senderID)) return api.sendMessage(`only bot operators can use this command.`, event.threadID, event.messageID);
    const { threadID, messageID } = event;

    switch (args[0]) {
        case "bangla":
        case "bangla":
            {
                return api.sendMessage(`ngôn ngữ đã được chuyển sang tiếng việt`, threadID, () => global.config.language = "bangla"); 
            }
            break;
        
        case "english":
        case "english":
            {
                return api.sendMessage(`language has been converted to english`, threadID, () => global.config.language = "english"); 
            }
            break;
    
        default:
            {
                return api.sendMessage("syntax error, use : language bangla/english", threadID, messageID);
            }   
            break; 
            
    }	
}