const express = require('express');
const { addUser, rmStates, createUser, deleteUser } = require('./main/system/editconfig.js');
const log = require("./main/utility/logs.js");
const logger = require("./main/utility/logs.js");
const axios = require("axios");
const chalk = require('chalk');
const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require('path')
const { execSync, exec } = require('child_process');
const configLog = require('./main/utility/config.json');
const login = require("./main/system/ws3-fca/index.js");
const listPackage = JSON.parse(readFileSync('package.json')).dependencies;
const packages = JSON.parse(readFileSync('package.json'));
const fs = require("fs-extra")
const process = require('process');
const moment = require("moment-timezone");
const app = express();
const port = 8099;
const cron = require('node-cron');
const path = require('path');
const jwt = require('jsonwebtoken');

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    accounts: new Map(),
    cooldowns: new Map(),
    mainPath: process.cwd(),
    eventRegistered: new Map(),
    configPath: new String(),
    envConfigPath: new String(),
    handleSchedule: new Array(),
    handleReaction: new Map(),
    handleReply: new Map(),
    onlines: new Array()
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Map()
});

global.config = new Object();
global.envConfig = new Object();
global.accounts = new Array();
global.nodemodule = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.utils = require('./main/utility/utils.js');
global.send = require("./main/utility/send.js");
global.editBots = require("./main/system/editconfig.js");


console.clear();
console.log(chalk.blue('LOADING MAIN SYSTEM'));
app.use(express.json());
app.use(express.static('public/main'));
async function logOut(res, botId) {;
    try {
        delete require.cache[require.resolve('./bots.json')];
        delete require.cache[require.resolve('./states/' + botId + '.json')];
        await global.client.accounts.delete(botId);
        await rmStates(botId);
        await deleteUser(botId);
        var data = `logged out ${botId} successfully`;
        res.send({data});
    } catch (err) {
        var error = `can't logged out bot ${botId}, maybe the bot is not logged in.`;
        return res.status(400).send(botId);
    }
}

app.get('/commands', (req, res) => {
    const commands = global.client.commands;
    const command = Array.from(commands.values());
    res.json(command);
})
app.post('/profile', async (req, res) => {
    try {
        delete require.cache[require.resolve('./bots.json')];
        const { botid } = req.body;
        const botPath = require('./bots.json');
        const data = botPath.find(data => data.uid === botid);
        const name = data.name || 'Unknown';
        const uid = botid;
        const thumbSrc = data.thumbSrc;
        const profileUrl = data.profileUrl;
        const botname = data.botname;
        const botprefix = data.prefix;
        const admins = data.admins.length;
        return res.send({name, uid, thumbSrc, profileUrl, botname, botprefix, admins});
    } catch (err) {
        return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
    }
})

app.post('/logout', async (req, res) => {
    const { botid } = req.body;
    return await logOut(res, botid);
});

app.post('/configure', async (req, res) => {
    const { botId, content, type } = req.body;
    const botPath = "bots.json";
    const botChanges = JSON.parse(fs.readFileSync(botPath, 'utf-8'));
    const pointDirect = botChanges.find(i => i.uid == botId);
    async function editDetails(where, value) {
        pointDirect[where] = value;
        try {
            await fs.writeFileSync(botPath, JSON.stringify(botChanges, null, 2));
            delete require.cache[require.resolve('./bots.json')];
            var data = `edited ${where} successfully.`;
            return res.send({data})
        } catch (err) {
            var error = `failed to edit ${where}`;
            return res.status(400).send({error});
        }
    }
    async function addAdmin(value) {
        const edit = pointDirect.admins;
        edit.push(value);
        try {
            await fs.writeFileSync(botPath, JSON.stringify(botChanges, null, 2));
            delete require.cache[require.resolve('./bots.json')];
            var data = `added admin ${value} successfully.`;
            return res.send({data})
        } catch (err) {
            var error = `failed to add admin.`;
            return res.status(400).send({error});
        }
    }
    switch (type) {
        case 'prefix':
            editDetails('prefix', content);
            break;
        case 'botname':
            editDetails('botname', content);
            break;
        case 'admin':
            addAdmin(content);
            break;
        case 'logout':
            editDetails('token', content);
            break;
    }
})
        
app.get('/profile', (req, res) => {
    const token = req.query.token;
    const botid = req.query.botid;
    const botinfo = require('./bots.json');
    if (!token) {
        return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
    }
    if (!botid) {
        return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
    }
    try {
        const verifyToken = botinfo.find(i => i.uid == botid).token;
        if (verifyToken != token) {
            return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
        }
        jwt.verify(token, botid , (err, decoded) => {
        if (err) {
            return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
        }
        res.sendFile(path.join(__dirname, 'public/profile.html'));
    }); 
    } catch (err) {
        return res.status(401).sendFile(path.join(__dirname, 'public/notFound.html'));
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const botFile = require("./bots.json");
    const botPath = 'bots.json';
    const botChanges = JSON.parse(fs.readFileSync(botPath, 'utf-8'));
    const botConfig = botChanges.find(i => i.username == username && i.password == password);
    const isExist = botFile.find(i => i.username == username && i.password == password);
    if (isExist) {
        const token = jwt.sign({username: username, password: password}, isExist.uid, {expiresIn: '1h'});
        botConfig.token = token;
        await fs.writeFileSync(botPath, JSON.stringify(botChanges, null, 2));
        delete require.cache[require.resolve('./bots.json')];
        return res.send({token, botid: isExist.uid});
    } else {
        var error = `wrong username or password, try again.`
        return res.status(400).send({error});
    }
});

app.post('/create', async (req, res) => {
    const { appstate, botname, botadmin, botprefix, username, password } = req.body;
    try {
        const appcontent = appstate;
        const appstateData = JSON.parse(appcontent);
        const loginOptions = {};
        const botFile = require('./bots.json');
        const isExist = botFile.find(i => i.username == username);
        if (isExist) {
            var error = `username is already exist, try another one`;
            return res.status(400).send({error});
        }
        loginOptions.appState = appstateData;
        logger.login(`someone is logging in using website`);
        await webLogin(res, loginOptions, botname, botprefix, username, password, botadmin);
    } catch (err) {
        var error = `the provided appstate is wrong format.`
        res.status(400).send({error});
    }
})
app.get('/info', (req, res) => {
    const data = Array.from(global.client.accounts.values()).map(account => ({
        name: account.name,
        profileUrl: account.profileUrl,
        thumbSrc: account.thumbSrc,
        time: account.time
    }));
    res.json(JSON.parse(JSON.stringify(data, null, 2)));
});


app.use((req, res) => {
    res.status(500).sendFile(path.join(__dirname, 'public/notFound.html'));
});
app.listen(port);
var configValue;
try {
    const configPath = "./config.json";
    global.client.configPath = configPath;
    configValue = require(global.client.configPath);
    log(`loading ${chalk.blueBright(`config`)} file.`, "load");
} catch (err) {
    return log(`cant load ${chalk.blueBright(`configPath`)} in client.`, "error");
    process.exit(0);
}
try {
    for (const Keys in configValue) global.config[Keys] = configValue[Keys];
    log(`loaded ${chalk.blueBright(`config`)} file.`, "load");
} catch (err) {
    return log(`can't load ${chalk.blueBright(`config`)} file.`, "error");
    process.exit(0)
}

const langFile = (readFileSync(`${__dirname}/main/utility/languages/${global.config.language}.lang`, {
    encoding: 'utf-8'
})).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}
global.getText = function(...args) {
    const langText = global.language;
    if (!langText.hasOwnProperty(args[0])) {
        throw new Error(`${__filename} - not found key language : ${args[0]}`);
    }
    var text = langText[args[0]][args[1]];
    if (typeof text === 'undefined') {
        throw new Error(`${__filename} - not found key text : ${args[1]}`);
    }
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1]);
    }
    return text;
};


var envconfigValue;
try {
    const envconfigPath = "./main/config/envconfig.json";
    global.client.envConfigPath = envconfigPath;
    envconfigValue = require(global.client.envConfigPath);
} catch (err) {
    process.exit(0);
}
try {
    for (const envKeys in envconfigValue) global.envConfig[envKeys] = envconfigValue[envKeys];
} catch (err) {
    process.exit(0)
}

const{ Sequelize, sequelize } = require("./main/system/database/index.js");
const { kStringMaxLength } = require('buffer');
const { error } = require('console');
for (const property in listPackage) {
    try {
        global.nodemodule[property] = require(property)
    } catch (e) { }
}



if (!global.config.email) {
    logger(global.getText('main', 'emailNotfound', chalk.blueBright('config.json')), 'err');
    process.exit(0);
}

const commandsPath = "./script/commands";
const commandsList = readdirSync(commandsPath).filter(command => command.endsWith('.js') && !global.config.disabledcmds.includes(command));

console.log(chalk.blue(global.getText('main', 'startloadCmd')));
for (const command of commandsList) {
    try {
        const module = require(`${commandsPath}/${command}`);
        const { config} = module;
        if (!config?.name) {
            try {
                throw new Error(global.getText("main", "cmdNameErr", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        if (!config?.category) {
            try {
                throw new Error(global.getText("main", "cmdCategoryErr", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        if (global.config.premium) {
            if (!config?.hasOwnProperty('premium')) {
                try {
                    throw new Error(global.getText("main", "premiumCmdErr", chalk.red(command)));
                } catch (err) {
                    logger.commands(err.message);
                    continue;
                }
            }
        }
        if (!config?.hasOwnProperty('prefix')) {
            try {
                throw new Error(global.getText("main", "prefixCmdErr", chalk.red(command)), "error");
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        const { dependencies, envConfig } = config;
        if (dependencies) {
            Object.entries(dependencies).forEach(([reqDependency, dependencyVersion]) => {
                if (listPackage[reqDependency]) return;
                try {
                    execSync(`npm install --save ${reqDependency}${dependencyVersion ? `@${dependencyVersion}` : ''}`, {
                        stdio: 'inherit',
                        env: process.env,
                        shell: true,
                        cwd: join('./node_modules')
                    });
                    require.cache = {};
                } catch (error) {
                    const errorMessage = `failed to install package ${reqDependency}\n`;
                    logger.error(errorMessage);
                }
            });
        }
        if (envConfig) {
            const moduleName = config.name;
            global.configModule[moduleName] = global.configModule[moduleName] || {};
            global.envConfig[moduleName] = global.envConfig[moduleName] || {};
            for (const envConfigKey in envConfig) {
                global.configModule[moduleName][envConfigKey] = global.envConfig[moduleName][envConfigKey] ?? envConfig[envConfigKey];
                global.envConfig[moduleName][envConfigKey] = global.envConfig[moduleName][envConfigKey] ?? envConfig[envConfigKey];
            }
            var envConfigPath = require("./main/config/envconfig.json");
            var configPah = "./main/config/envconfig.json";
            envConfigPath[moduleName] = config.envConfig;
            fs.writeFileSync(configPah, JSON.stringify(envConfigPath, null, 4), 'utf-8');
        }
        if (global.client.commands.has(config.name || "")) {
            try {
                throw new Error(global.getText("main", "commandNameExist", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        
        global.client.commands.set(config.name, module);
        logger.commands(global.getText("main", "commands", chalk.blueBright(command)));
    } catch (err) {
        logger.commands(global.getText("main", "cmderr", chalk.red(command), err));
        continue;
    }
}

const evntsPath = "./script/events";
const evntsList = readdirSync(evntsPath).filter(events => events.endsWith('.js') && !global.config.disabledevnts.includes(events));
console.log(`${chalk.blue(`\n${global.getText("main", "startloadEvnt")}`)}`)
for (const ev of evntsList) {
    try {
        const events = require(`${evntsPath}/${ev}`);
        const { config, onLoad, run } = events;
        if (!config || !config?.name ) {
            try {
                throw new Error(global.getText("main", "failedEvnt", chalk.red(ev)));
            } catch (err) {
                logger.events(err.message);
                continue;
            }
        }
        if (global.client.events.has(config.name || "")) {
            try {
                throw new Error(global.getText("main", "evNameExist", chalk.red(ev)));
            } catch (err) {
                logger.events(err.message);
                continue;
            }
        }
        global.client.events.set(config.name, events);
        logger.events(global.getText("main", "events", chalk.blueBright(ev)));
    } catch (err) {
        logger.events(global.getText("main", "evnterr", chalk.red(ev)));
        continue;
    }
}

process.on('unhandledRejection', (reason) => {
    console.error(reason);
});


(async() => {
    await sequelize.authenticate();
})()
const authentication = {};
authentication.Sequelize = Sequelize;
authentication.sequelize = sequelize;
const models = require('./main/system/database/model.js')(authentication);

async function autoPost({api}) {
    if (global.config.autopost) {
        const date = new Date().getDate();
        const response = await axios.get(`https://beta.ourmanna.com/api/v1/get/?format=text&order=random&order_by=verse&day=${date}`);
        const bible = String(response.data);
        try {
            await api.createPost({
                body: bible,
                baseState: 1
            })
                .then(() => {
                    logger(`posted : ${bible}`);
                });
        } catch (err) {}
    } else {
        logger(`auto post is turned off.`);
    }
}
async function startLogin(appstate, filename, callback) {
    return new Promise(async (resolve, reject) => {
        login(appstate, async (err, api) => {
            if (err) {
                reject(err);
                delete require.cache[require.resolve(`./states/${filename}.json`)];
                rmStates(filename);
                return;
            }
            const botModel = models;
            const userId = await api.getCurrentUserID();
            try {
                const userInfo = await api.getUserInfo(userId);
                if (!userInfo || !userInfo[userId]?.name || !userInfo[userId]?.profileUrl || !userInfo[userId]?.thumbSrc) throw new Error('unable to locate the account; it appears to be in a suspended or locked state.');
                const {
                    name,
                    profileUrl,
                    thumbSrc
                } = userInfo[userId];
                delete require.cache[require.resolve('./bots.json')];
                addUser(name, userId);
                let time = (JSON.parse(fs.readFileSync('./bots.json', 'utf-8')).find(user => user.uid === userId) || {}).time || 0;
                global.client.accounts.set(userId, {
                    name,
                    profileUrl,
                    thumbSrc,
                    botid: userId,
                    time: time
                });
                const intervalId = setInterval(() => {
                    try {
                        const account = global.client.accounts.get(userId);
                        if (!account) throw new Error('Account not found');
                        global.client.accounts.set(userId, {
                            ...account,
                            time: account.time + 1
                        });
                    } catch (error) {
                        clearInterval(intervalId);
                        return;
                    }
                }, 1000);
            } catch (error) {
                reject(error);
                return;
            }
            log.login(global.getText("main", "successLogin", chalk.blueBright(filename)));
            delete require.cache[require.resolve('./bots.json')];
            global.client.api = api;
            global.client.eventRegistered.set(userId, new Array());
            api.setOptions(global.config.loginoptions);
            const Datahandle = new Array();
            global.client.handleReply.set(userId, new Array());
            global.client.handleReaction.set(userId, new Array());
            global.data.allThreadID.set(userId, new Array());
            cron.schedule(`*/30 * * * *`, async() => {
                await autoPost({api});
            }, {
                scheduled: true,
                timezone: 'Asia/Manila'
            });
            const cmdsPath = "./script/commands";
            const cmdsList = readdirSync(cmdsPath).filter(command => command.endsWith('.js') && !global.config.disabledcmds.includes(command));
            for (const cmds of cmdsList) {
                try {
                    const module = require(`${cmdsPath}/${cmds}`);
                    const { config, onLoad} = module;
                    if (onLoad) {
                        const moduleData = {};
                        moduleData.api = api;
                        moduleData.models = botModel;
                        module.onLoad(moduleData);
                    }
                    if (module.handleEvent) global.client.eventRegistered.get(userId).push(config.name);
                    try {
                        fs.writeFileSync(jdididid)
                    } catch(err) {
                        resolve(err)
                    }
                } catch (err) {
                    reject(err);
                }
            }
            const eventsPath = "./script/events";
            const eventsList = readdirSync(eventsPath).filter(events => events.endsWith('.js') && !global.config.disabledevnts.includes(events));
            for (const ev of eventsList) {
                try {
                    const events = require(`${eventsPath}/${ev}`);
                    const { config, onLoad, run } = events;
                    if (onLoad) {
                        const eventData = {};
                        eventData.api = api,
                        eventData.models = botModel;
                        onLoad(eventData);
                    }
                    try {
                        fs.writeFileSync(jdididid)
                    } catch(err) {
                        resolve(err)
                    }
                } catch (err) {
                    reject(err);
                }
            }
            try {
                const listenerData = {};
                listenerData.api = api;
                listenerData.models = botModel;
                global.custom = require('./custom.js')({ api: api });
                const listener = require('./main/system/listen.js')(listenerData);
                async function listenCallback(error, event) {
                    if (JSON.stringify(error).includes('601051028565049')) {
                        const data = {
                            av: api.getCurrentUserID(),
                            fb_api_caller_class: "RelayModern",
                            fb_api_req_modern_name: "FBScrapingWarningMutation",
                            variables: "{}",
                            server_timestamps: "true",
                            doc_id: "6339492849481770",
                        }
                        api.httpPost(`https://www.facebook.com/api/graphql/`, data, (err, index) => {
                            const response = JSON.parse(index);
                            if (err || response.errors) {
                                logger.error(`error on bot ${userId}, removing data..`);
                                deleteUser(userId);
                                rmStates(filename);
                                global.client.accounts.delete(userId);
                                global.data.allThreadID.delete(userId);
                                return logger.error(`removed the data of ${userId}`);
                            }
                            if (response.data.fb_scraping_warning_clear.success) {
                                global.handleListen = api.listenMqtt(listenCallback);
                                setTimeout(() => (mqttClient.end(), connect()), 1000 * 60 * 60 * 6);
                            } else {
                                logger.error(`error on bot ${userId}, removing data..`);
                                deleteUser(userId);
                                rmStates(filename);
                                global.client.accounts.delete(userId);
                                global.data.allThreadID.delete(userId);
                                return logger.error(`removed the data of ${userId}`);
                            }
                        })
                    }
                    if (["presence", "typ", "read_receipt"].some((data) => data === event?.type)) return;
                    return listener(event)
                }
                function connect() {
                    global.handleListen = api.listenMqtt(listenCallback)
                    setTimeout(connect, 1000 * 60 * 60 * 6);
                }
                connect();
            } catch (error) {
                logger.error(`error on bot ${userId}, removing data..`);
                deleteUser(userId);
                rmStates(filename);
                global.client.accounts.delete(userId);
                global.data.allThreadID.delete(userId);
                return logger.error(`removed the data of ${userId}`);
            }
            callback(null, api);
        });
    });
}

async function webLogin(res, appState, botName, botPrefix, username, password, botAdmin) {
    return new Promise(async (resolve, reject) => {
        login(appState, async (err, api) => {
            if (err) {
                reject(err);
                var error = `an error occurred when logging in, maybe your appstate is invalid`
                res.status(400).send({error});
                return;
            }
            const botModel = models;
            const userId = await api.getCurrentUserID();
            const botFile = require('./bots.json');
            const token = jwt.sign({username: username, password: password}, userId, {expiresIn: '1h'});
            
            try {
                const userInfo = await api.getUserInfo(userId);
                if (!userInfo || !userInfo[userId]?.name || !userInfo[userId]?.profileUrl || !userInfo[userId]?.thumbSrc) throw new Error('unable to locate the account; it appears to be in a suspended or locked state.');
                const {
                    name,
                    profileUrl,
                    thumbSrc
                } = userInfo[userId];
                const isExists = global.client.accounts.get(userId);
                if (isExists) {
                    var error = `${name} is already logged in`;
                    logger.error(`can't logged in, ${name} is already logged in`);
                    return res.status(400).send({error});
                }
                delete require.cache[require.resolve('./bots.json')];
                createUser(name, userId, botName, botPrefix, username, password, thumbSrc, profileUrl, token, botAdmin);
                
                let time = (JSON.parse(fs.readFileSync('./bots.json', 'utf-8')).find(user => user.uid === userId) || {}).time || 0;
                global.client.accounts.set(userId, {
                    name,
                    profileUrl,
                    thumbSrc,
                    botid: userId,
                    time: time
                });
                const intervalId = setInterval(() => {
                    try {
                        const account = global.client.accounts.get(userId);
                        if (!account) throw new Error('Account not found');
                        global.client.accounts.set(userId, {
                            ...account,
                            time: account.time + 1
                        });
                    } catch (error) {
                        clearInterval(intervalId);
                        return;
                    }
                }, 1000);
            } catch (error) {
                reject(error);
                return;
            }
            const userInfo = await api.getUserInfo(userId);
            const {
                    name,
                    profileUrl,
                    thumbSrc
                } = userInfo[userId];
            const appstateData = await api.getAppState();
            await fs.writeFile(`states/${userId}.json`, JSON.stringify(appstateData, null, 2))
            var data = `logged in ${name} successfully.`
            res.send({data, token, botid: userId});
            log.login(global.getText("main", "successLogin", chalk.blueBright(name)));
            delete require.cache[require.resolve('./bots.json')];
            global.client.api = api;
            global.client.eventRegistered.set(userId, new Array());
            api.setOptions(global.config.loginoptions);
            global.client.handleReply.set(userId, new Array());
            global.client.handleReaction.set(userId, new Array());
            global.data.allThreadID.set(userId, new Array());
            cron.schedule(`*/30 * * * *`, async() => {
                await autoPost({api});
            }, {
                scheduled: true,
                timezone: 'Asia/Manila'
            });
            const cmdsPath = "./script/commands";
            const cmdsList = readdirSync(cmdsPath).filter(command => command.endsWith('.js') && !global.config.disabledcmds.includes(command));
            for (const cmds of cmdsList) {
                try {
                    const module = require(`${cmdsPath}/${cmds}`);
                    const { config, onLoad} = module;
                    if (onLoad) {
                        const moduleData = {};
                        moduleData.api = api;
                        moduleData.models = botModel;
                        module.onLoad(moduleData);
                    }
                    if (module.handleEvent) global.client.eventRegistered.get(userId).push(config.name);
                    try {
                        fs.writeFileSync(jdididid)
                    } catch(err) {
                        resolve(err)
                    }
                } catch (err) {
                    reject(err);
                }
            }
            const eventsPath = "./script/events";
            const eventsList = readdirSync(eventsPath).filter(events => events.endsWith('.js') && !global.config.disabledevnts.includes(events));
            for (const ev of eventsList) {
                try {
                    const events = require(`${eventsPath}/${ev}`);
                    const { config, onLoad, run } = events;
                    if (onLoad) {
                        const eventData = {};
                        eventData.api = api,
                            eventData.models = botModel;
                        onLoad(eventData);
                    }
                    try {
                        fs.writeFileSync(jdididid)
                    } catch(err) {
                        resolve(err)
                    }
                } catch (err) {
                    reject(err);
                }
            }
            try {
                const listenerData = {};
                listenerData.api = api;
                listenerData.models = botModel;
                global.custom = require('./custom.js')({ api: api });
                const listener = require('./main/system/listen.js')(listenerData);
                async function listenCallback(error, event) {
                    if (JSON.stringify(error).includes('601051028565049')) {
                        const data = {
                            av: api.getCurrentUserID(),
                            fb_api_caller_class: "RelayModern",
                            fb_api_req_modern_name: "FBScrapingWarningMutation",
                            variables: "{}",
                            server_timestamps: "true",
                            doc_id: "6339492849481770",
                        }
                        api.httpPost(`https://www.facebook.com/api/graphql/`, data, (err, index) => {
                            const response = JSON.parse(index);
                            if (err || response.errors) {
                                logger.error(`error on bot ${userId}, removing data..`);
                                deleteUser(userId);
                                rmStates(filename);
                                global.client.accounts.delete(userId);
                                global.data.allThreadID.delete(userId);
                                return logger.error(`removed the data of ${userId}`);
                            }
                            if (response.data.fb_scraping_warning_clear.success) {
                                global.handleListen = api.listenMqtt(listenCallback);
                                setTimeout(() => (mqttClient.end(), connect()), 1000 * 60 * 60 * 6);
                            } else {
                                logger.error(`error on bot ${userId}, removing data..`);
                                deleteUser(userId);
                                rmStates(filename);
                                global.client.accounts.delete(userId);
                                global.data.allThreadID.delete(userId);
                                return logger.error(`removed the data of ${userId}`);
                            }
                        })
                    }
                    if (["presence", "typ", "read_receipt"].some((data) => data === event?.type)) return;
                    return listener(event)
                }
                function connect() {
                    global.handleListen = api.listenMqtt(listenCallback)
                    setTimeout(connect, 1000 * 60 * 60 * 6);
                }
                connect();
            } catch (error) {
                logger.error(`error on bot ${userId}, removing data..`);
                deleteUser(userId);
                rmStates(userId);
                global.client.accounts.delete(userId);
                global.data.allThreadID.delete(userId);
                return logger.error(`removed the data of ${userId}`);
            }
        });
    });
}

// PROCESS ALL APPSTATE
async function loadBot() {
    const appstatePath = './states';
    const listsAppstates = readdirSync(appstatePath).filter(Appstate => Appstate.endsWith('.json'));
    console.log(chalk.blue('\n'+global.getText("main", "loadingLogin")));
    let hasErrors = {
        status: false
    };
    let userID = "";
    try {
        for (const states of listsAppstates) {
            try {

                if (fs.readFileSync(`${appstatePath}/${states}`, 'utf8').trim() === '') {
                    console.error(chalk.red(global.getText("main", "appstateEmpty", states)));
                    rmStates(path.parse(states).name);
                    continue;
                }

                let data = `${appstatePath}/${states}`;

                const appstateData = JSON.parse(fs.readFileSync(data, "utf8"));


                const loginDatas = {};
                loginDatas.appState = appstateData;
                try {
                    log.login(global.getText("main", "loggingIn", chalk.blueBright(path.parse(states).name)));
                    await startLogin(loginDatas, path.parse(states).name, async (err, api) => {
                        userID = await api.getCurrentUserID();
                    });
                } catch (err) { 
                    hasErrors.status = true;
                    hasErrors.states = states;
                }
            } catch (err) {
                hasErrors.status = true;
                hasErrors.states = states;
            }
        }

        if (hasErrors.status) {
            logger.error(global.getText("main", "loginErrencounter"));
            delete require.cache[require.resolve(`./states/${hasErrors.states}`)];
            rmStates(path.parse(hasErrors.states).name);
            deleteUser(userID);
            global.data.allThreadID.delete(userID);
        }
    } catch (err) {
    }
}
loadBot();

function autoRestart(config) {
    if(config.status) {
        setInterval(async () => {
            process.exit(1)
        }, config.time * 60 * 1000)
    }
}
function autoDeleteCache(config) {
    if(config.status) {
        setInterval(async () => {
            const { exec } = require('child_process');
            exec('rm -rf script/commands/cache && mkdir -p script/commands/cache && rm -rf script/events/cache && mkdir -p script/events/cache', (error, stdout, stderr) => {
                if (error) {
                    logger(`error : ${error}`, "cache")
                    return;
                }
                if (stderr) {
                    logger(`stderr : ${stderr}`, "cache")
                    return;
                }
                return logger(`successfully deleted caches`)
            })
        }, config.time * 60 * 1000)
    }
}
autoDeleteCache(global.config.autoDeleteCache)
autoRestart(global.config.autorestart)