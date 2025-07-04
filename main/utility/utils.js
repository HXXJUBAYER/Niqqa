const axios = require("axios");
const config = require('../../config.json');
const package = require('../../package.json');
const FormData = require('form-data');
const { resolve, basename } = require('path')
const { writeFileSync, createReadStream, unlinkSync } = require('fs-extra');

module.exports.throwError = async function (command, threadID, messageID) {
	const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const userid = await global.client.api.getCurrentUserID();
    const bots = require("../../bots.json");
    const prefix = bots.find(item => item.uid === userid)?.prefix;
	return global.client.api.sendMessage(global.getText("utils", "throwError", prefix, command), threadID, messageID);
  
}
module.exports.removeHomeDir = async function(fullPath) {
	if (!fullPath || typeof fullPath !== "string")
		throw new Error('The first argument (fullPath) must be a string');
	while (fullPath.includes(process.cwd()))
		fullPath = fullPath.replace(process.cwd(), "");
	return fullPath;
}

module.exports.getGUID = function() {
    var sectionLength = Date.now();
    var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.floor((sectionLength + Math.random() * 16) % 16);
        sectionLength = Math.floor(sectionLength / 16);
        var _guid = (c == "x" ? r : (r & 7) | 8).toString(16);
        return _guid;
    });
    return id;
}

module.exports.convertHMS = function(value) {
    const sec = parseInt(value, 10); 
    let hours   = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - (hours * 3600)) / 60); 
    let seconds = sec - (hours * 3600) - (minutes * 60); 
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return (hours != '00' ? hours +':': '') + minutes+':'+seconds;
}

module.exports.removeSpecialChar = async(str) => {
	if (str === null || str === '') return false;
	else str = str.toString();

	return str.replace(/[^\x20-\x7E]/g, '');
};

module.exports.cleanAnilistHTML = function (text) {
	text = text
		.replace('<br>', '\n')
		.replace(/<\/?(i|em)>/g, '*')
		.replace(/<\/?b>/g, '**')
		.replace(/~!|!~/g, '||')
		.replace("&amp;", "&")
		.replace("&lt;", "<")
		.replace("&gt;", ">")
		.replace("&quot;", '"')
		.replace("&#039;", "'");
	return text;
}

module.exports.downloadFile = async function (url, path) {
	const { createWriteStream } = require('fs');

	const response = await axios({
		method: 'GET',
		responseType: 'stream',
		url
	});

	const writer = createWriteStream(path);

	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
};

module.exports.getContent = async function(url) {
	try {
		const response = await axios({
			method: 'GET',
			url
		});

		const data = response;

		return data;
	} catch (e) { return console.log(e); };
}

module.exports.randomString = function (length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	var charactersLength = characters.length || 5;
	for ( var i = 0; i < length; i++ ) result += characters.charAt(Math.floor(Math.random() * charactersLength));
	return result;
}

module.exports.homeDir = function () {
	var returnHome, typeSystem;
	const home = process.env["HOME"];
	const user = process.env["LOGNAME"] || process.env["USER"] || process.env["LNAME"] || process.env["USERNAME"];

	switch (process.platform) {
		case "win32": {
			returnHome = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
			typeSystem = "win32"
			break;
		}
		case "darwin": {
			returnHome = home || (user ? '/Users/' + user : null);
			typeSystem = "darwin";
			break;
		}
		case "linux": {
			returnHome =  home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
			typeSystem = "linux"
			break;
		}
		default: {
			returnHome = home || null;
			typeSystem = "unknow"
			break;
		}
	}

	return [typeof os.homedir === 'function' ? os.homedir() : returnHome, typeSystem];
}

module.exports.removeBackground = async(image) => {
	if(!image) return console.log('RemoveBG : missing input');
	var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

	const path = resolve(__dirname, '../../script/commands/cache', `${Date.now()}.jpg`);
	const newPath = resolve(__dirname, '../../script/commands/cache', `${Date.now() + 1000}.jpg`);
	await global.utils.downloadFile(image, path);
	var formData = new FormData();
		formData.append('size', 'auto');
		formData.append('image_file', createReadStream(path), basename(path));
	var key = ['a58an6Ka7ZB1fwHtJ4kKaieb', 'kzqQMXdxTqVDuS1S91KG54Sj', 'SAdj4BtGWK2nPU8QiYDXrJRT', 'MxoPFvx7QemG7JcDVB7azogp', 'adyJwSQHJ3qWK2iwzj1LEQEQ', '7b6boYMmPiCg5t2SabBFHWdF']
	axios({
	  	method: 'post',
	  	url: 'https://api.remove.bg/v1.0/removebg',
	  	data: formData,
	  	responseType: 'arraybuffer',
	  	headers: {
	    	...formData.getHeaders(),
	    	'X-Api-Key': key[Math.floor(Math.random() * key.length)],
	  	},
	  	encoding: null
	})
	.then((response) => {
	  	if(response.status != 200) return rejectFunc()
	  	writeFileSync(newPath, response.data);
	  	unlinkSync(path)
			resolveFunc(newPath)
	})
	.catch((error) => {
		return rejectFunc(error)
	});
	return returnPromise;
		}
