module.exports.config = {
	name: "pending",
	version: "1.0.5",
	credits: "ryuko",
	prefix: false,
  premium: false,
	permission: 2,
	description: "approve groups",
	category: "admin",
	cooldowns: 5
};

module.exports.languages = {
    "bangla": {
        "invaildNumber": "%1 is not an invalid number",
        "cancelSuccess": "refused %1 thread",
        "notiBox": "group has been approved, you can now use the bot",
        "approveSuccess": "approved successfully %1 threads",

        "cantGetPendingList": "can't get the pending list",
        "returnListPending": "the whole number of groups to approve is : %1 thread \n\n%2",
        "returnListClean": "there is no group in the pending list"
    },
    "english": {
        "invaildNumber": "%1 is not an invalid number",
        "cancelSuccess": "refused %1 thread",
        "notiBox": "group has been approved, you can now use the bot",
        "approveSuccess": "approved successfully %1 threads",

        "cantGetPendingList": "can't get the pending list",
        "returnListPending": "the whole number of groups to approve is : %1 thread \n\n%2",
        "returnListClean": "there is no group in the pending list"
    }
}

module.exports.handleReply = async function({ api, event, handleReply, getText }) {
    if (String(event.senderID) !== String(handleReply.author)) return;
    const { body, threadID, messageID } = event;
    var count = 0;

    if (isNaN(body) && body.indexOf("c") == 0 || body.indexOf("cancel") == 0) {
        const index = (body.slice(1, body.length)).split(/\s+/);
        for (const singleIndex of index) {
            console.log(singleIndex);
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length) return api.sendMessage(getText("invaildNumber", singleIndex), threadID, messageID);
            api.removeUserFromGroup(api.getCurrentUserID(), handleReply.pending[singleIndex - 1].threadID);
            count+=1;
        }
        return api.sendMessage(getText("cancelSuccess", count), threadID, messageID);
    }
    else {
        const index = body.split(/\s+/);
        for (const singleIndex of index) {
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length) return api.sendMessage(getText("invaildNumber", singleIndex), threadID, messageID);
            api.sendMessage(getText("notiBox"), handleReply.pending[singleIndex - 1].threadID);
            count+=1;
        }
        return api.sendMessage(getText("approveSuccess", count), threadID, messageID);
    }
}

module.exports.run = async function({ api, event, getText, botid }) {
	const { threadID, messageID } = event;
    const commandName = this.config.name;
    var msg = "", index = 1;

    try {
		var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
		var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
	} catch (e) { return api.sendMessage(getText("cantGetPendingList"), threadID, messageID) }

	const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    for (const single of list) msg += `${index++}. ${single.name}(${single.threadID})\n`;

    if (list.length != 0) return api.sendMessage(getText("returnListPending", list.length, msg), threadID, (error, info) => {
		global.client.handleReply.get(botid).push({
            name: commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
        })
	}, messageID);
    else return api.sendMessage(getText("returnListClean"), threadID, messageID);
}
