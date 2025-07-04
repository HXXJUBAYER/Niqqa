const express = require('express');
const { addUser, createUser, deleteUser, rmStates } = require('./main/system/editconfig.js');
const logger = require("./main/utility/logs.js");
const axios = require("axios");
const chalk = require('chalk');
const { readdirSync } = require("fs-extra");
const { join } = require('path');
const login = require("./main/system/ws3-fca/index.js");
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const { sequelize, Sequelize } = require("./main/system/database/index.js");
const models = require('./main/system/database/model.js')({ Sequelize, sequelize });

const app = express();
const port = 8099;

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

global.config = require('./config.json');
global.envConfig = require('./main/config/envconfig.json');
global.utils = require('./main/utility/utils.js');
global.send = require("./main/utility/send.js");
global.editBots = require("./main/system/editconfig.js");

app.use(express.json());
app.use(express.static('public/main'));

async function logOut(res, botId) {
    try {
        await global.client.accounts.delete(botId);
        await deleteUser(botId);
        res.send({ data: `Logged out ${botId} successfully` });
    } catch (err) {
        res.status(400).send({ error: `Can't log out bot ${botId}, maybe the bot is not logged in.` });
    }
}

app.get('/commands', (req, res) => {
    const commands = Array.from(global.client.commands.values());
    res.json(commands);
});

app.post('/profile', async (req, res) => {
    try {
        const { botid } = req.body;
        const bot = await models.Bot.findOne({ where: { uid: botid } });
        if (!bot) {
            return res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
        }
        const { name, uid, thumbSrc, profileUrl, botname, prefix, admins } = bot;
        res.send({ name, uid, thumbSrc, profileUrl, botname, botprefix: prefix, admins: admins.length });
    } catch (err) {
        res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
    }
});

app.post('/logout', async (req, res) => {
    const { botid } = req.body;
    if (!botid) {
        return res.status(400).send({ error: 'botId is required' });
    }
    return await logOut(res, botid);
});

app.post('/configure', async (req, res) => {
    const { botId, content, type } = req.body;
    if (!botId || !content || !type) {
        return res.status(400).send({ error: 'botId, content, and type are required' });
    }
    try {
        const bot = await models.Bot.findOne({ where: { uid: botId } });
        if (!bot) {
            return res.status(400).send({ error: `Bot ${botId} not found` });
        }
        if (type === 'prefix' || type === 'botname' || type === 'token') {
            bot[type] = content;
        } else if (type === 'admin') {
            const admins = bot.admins || [];
            admins.push(content);
            bot.admins = admins;
        } else {
            return res.status(400).send({ error: `Invalid type: ${type}` });
        }
        await bot.save();
        res.send({ data: `Edited ${type} successfully` });
    } catch (err) {
        res.status(400).send({ error: `Failed to edit ${type}` });
    }
});

app.get('/profile', async (req, res) => {
    const { token, botid } = req.query;
    if (!token || !botid) {
        return res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
    }
    try {
        const bot = await models.Bot.findOne({ where: { uid: botid } });
        if (!bot || bot.token !== token) {
            return res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
        }
        jwt.verify(token, process.env.JWT_SECRET || botid, (err) => {
            if (err) {
                return res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
            }
            res.sendFile(join(__dirname, 'public/profile.html'));
        });
    } catch (err) {
        res.status(401).sendFile(join(__dirname, 'public/notFound.html'));
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send({ error: 'Username and password are required' });
    }
    try {
        const bot = await models.Bot.findOne({ where: { username, password } });
        if (!bot) {
            return res.status(400).send({ error: 'Wrong username or password' });
        }
        const token = jwt.sign({ username, password }, process.env.JWT_SECRET || bot.uid, { expiresIn: '1h' });
        bot.token = token;
        await bot.save();
        res.send({ token, botid: bot.uid });
    } catch (err) {
        res.status(400).send({ error: 'An error occurred during login' });
    }
});

app.post('/create', async (req, res) => {
    const { appstate, botname, botadmin, botprefix, username, password } = req.body;
    if (!appstate || !username || !password) {
        return res.status(400).send({ error: 'Appstate, username, and password are required' });
    }
    try {
        const appstateData = JSON.parse(appstate);
        const loginOptions = { appState: appstateData };
        logger.login(`Someone is logging in using website`);
        await webLogin(res, loginOptions, botname, botprefix, username, password, botadmin);
    } catch (err) {
        res.status(400).send({ error: 'The provided appstate is in the wrong format' });
    }
});

app.get('/info', async (req, res) => {
    const data = Array.from(global.client.accounts.values()).map(account => ({
        name: account.name,
        profileUrl: account.profileUrl,
        thumbSrc: account.thumbSrc,
        time: account.time
    }));
    res.json(data);
});

app.use((req, res) => {
    res.status(500).sendFile(join(__dirname, 'public/notFound.html'));
});

app.listen(port, () => {
    console.log(chalk.blue(`Server running on port ${port}`));
});

// Load configuration and language files (unchanged)
const configValue = require('./config.json');
for (const key in configValue) global.config[key] = configValue[key];

const langFile = readdirSync(`${__dirname}/main/utility/languages/${global.config.language}.lang`, { encoding: 'utf-8' })
    .split(/\r?\n|\r/)
    .filter(item => item.indexOf('#') !== 0 && item !== '');
for (const item of langFile) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    global.language[head] = global.language[head] || {};
    global.language[head][key] = itemValue.replace(/\\n/gi, '\n');
}

global.getText = function (...args) {
    const langText = global.language;
    if (!langText[args[0]]) throw new Error(`Not found key language: ${args[0]}`);
    let text = langText[args[0]][args[1]];
    if (!text) throw new Error(`Not found key text: ${args[1]}`);
    for (let i = args.length - 1; i > 0; i--) {
        text = text.replace(RegExp(`%${i}`, 'g'), args[i + 1]);
    }
    return text;
};

// Load commands and events (unchanged)
const commandsPath = "./script/commands";
const commandsList = readdirSync(commandsPath).filter(command => command.endsWith('.js') && !global.config.disabledcmds.includes(command));
console.log(chalk.blue(global.getText('main', 'startloadCmd')));
for (const command of commandsList) {
    try {
        const module = require(`${commandsPath}/${command}`);
        const { config } = module;
        if (!config?.name) throw new Error(global.getText("main", "cmdNameErr", chalk.red(command)));
        if (!config?.category) throw new Error(global.getText("main", "cmdCategoryErr", chalk.red(command)));
        if (global.config.premium && !config.hasOwnProperty('premium')) {
            throw new Error(global.getText("main", "premiumCmdErr", chalk.red(command)));
        }
        if (!config.hasOwnProperty('prefix')) {
            throw new Error(global.getText("main", "prefixCmdErr", chalk.red(command)));
        }
        global.client.commands.set(config.name, module);
        logger.commands(global.getText("main", "commands", chalk.blueBright(command)));
    } catch (err) {
        logger.commands(err.message);
    }
}

const evntsPath = "./script/events";
const evntsList = readdirSync(evntsPath).filter(events => events.endsWith('.js') && !global.config.disabledevnts.includes(events));
console.log(chalk.blue(global.getText("main", "startloadEvnt")));
for (const ev of evntsList) {
    try {
        const events = require(`${evntsPath}/${ev}`);
        const { config } = events;
        if (!config?.name) throw new Error(global.getText("main", "failedEvnt", chalk.red(ev)));
        if (global.client.events.has(config.name)) {
            throw new Error(global.getText("main", "evNameExist", chalk.red(ev)));
        }
        global.client.events.set(config.name, events);
        logger.events(global.getText("main", "events", chalk.blueBright(ev)));
    } catch (err) {
        logger.events(err.message);
    }
}

async function autoPost({ api }) {
    if (global.config.autopost) {
        const date = new Date().getDate();
        const response = await axios.get(`https://beta.ourmanna.com/api/v1/get/?format=text&order=random&order_by=verse&day=${date}`);
        const bible = String(response.data);
        try {
            await api.createPost({ body: bible, baseState: 1 });
            logger(`Posted: ${bible}`);
        } catch (err) {
            logger(`Failed to post: ${err.message}`);
        }
    } else {
        logger(`Auto post is turned off`);
    }
}

async function initializeBot({ api, userId, botModel, botName, botPrefix, username, password, botAdmin, res }) {
    try {
        const userInfo = await api.getUserInfo(userId);
        if (!userInfo || !userInfo[userId]?.name) {
            throw new Error('Unable to locate the account.');
        }
        const { name, profileUrl, thumbSrc } = userInfo[userId];

        if (res) {
            // Web login case
            const existingBot = await models.Bot.findOne({ where: { username } });
            if (existingBot) {
                throw new Error(`${name} is already logged in`);
            }
            const token = jwt.sign({ username, password }, process.env.JWT_SECRET || userId, { expiresIn: '1h' });
            await createUser(name, userId, botName, botPrefix, username, password, thumbSrc, profileUrl, token, botAdmin);
            await models.Bot.update({ appstate: await api.getAppState() }, { where: { uid: userId } });
            res.send({ data: `Logged in ${name} successfully`, token, botid: userId });
        } else {
            // Appstate login case
            await addUser(name, userId);
            await models.Bot.update({ appstate: await api.getAppState() }, { where: { uid: userId } });
        }

        const bot = await models.Bot.findOne({ where: { uid: userId } });
        const time = bot?.time || 0;
        const intervalId = setInterval(() => {
            const account = global.client.accounts.get(userId);
            if (!account) {
                clearInterval(intervalId);
                return;
            }
            global.client.accounts.set(userId, { ...account, time: account.time + 1 });
            models.Bot.update({ time: account.time + 1 }, { where: { uid: userId } });
        }, 1000);

        global.client.accounts.set(userId, { name, profileUrl, thumbSrc, botid: userId, time, intervalId });
        global.client.api = api;
        global.client.eventRegistered.set(userId, []);
        global.client.handleReply.set(userId, []);
        global.client.handleReaction.set(userId, []);
        global.data.allThreadID.set(userId, []);

        api.setOptions(global.config.loginoptions);

        const cmdsPath = "./script/commands";
        const cmdsList = readdirSync(cmdsPath).filter(cmd => cmd.endsWith('.js') && !global.config.disabledcmds.includes(cmd));
        for (const cmd of cmdsList) {
            const module = require(`${cmdsPath}/${cmd}`);
            const { config, onLoad } = module;
            if (onLoad) {
                await onLoad({ api, models: botModel });
            }
            if (module.handleEvent) global.client.eventRegistered.get(userId).push(config.name);
        }

        const eventsPath = "./script/events";
        const eventsList = readdirSync(eventsPath).filter(ev => ev.endsWith('.js') && !global.config.disabledevnts.includes(ev));
        for (const ev of eventsList) {
            const event = require(`${eventsPath}/${ev}`);
            const { config, onLoad } = event;
            if (onLoad) {
                await onLoad({ api, models: botModel });
            }
        }

        const listenerData = { api, models: botModel };
        global.custom = require('./custom.js')({ api });
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
                };
                api.httpPost(`https://www.facebook.com/api/graphql/`, data, async (err, index) => {
                    const response = JSON.parse(index);
                    if (err || response.errors) {
                        logger.error(`Error on bot ${userId}, removing data..`);
                        await deleteUser(userId);
                        global.client.accounts.delete(userId);
                        global.data.allThreadID.delete(userId);
                        return logger.error(`Removed the data of ${userId}`);
                    }
                    if (response.data.fb_scraping_warning_clear.success) {
                        global.handleListen = api.listenMqtt(listenCallback);
                        setTimeout(() => (api.mqttClient?.end(), connect()), 1000 * 60 * 60 * 6);
                    } else {
                        logger.error(`Error on bot ${userId}, removing data..`);
                        await deleteUser(userId);
                        global.client.accounts.delete(userId);
                        global.data.allThreadID.delete(userId);
                        return logger.error(`Removed the data of ${userId}`);
                    }
                });
            }
            if (["presence", "typ", "read_receipt"].some(data => data === event?.type)) return;
            return listener(event);
        }

        function connect() {
            global.handleListen = api.listenMqtt(listenCallback);
            setTimeout(connect, 1000 * 60 * 60 * 6);
        }
        connect();
    } catch (error) {
        logger.error(`Error initializing bot ${userId}: ${error.message}`);
        if (res) {
            res.status(400).send({ error: error.message });
        }
        await deleteUser(userId);
        global.client.accounts.delete(userId);
        global.data.allThreadID.delete(userId);
    }
}

async function startLogin(appstate, filename) {
    return new Promise(async (resolve, reject) => {
        login({ appState: appstate }, async (err, api) => {
            if (err) {
                logger.error(`Login failed for ${filename}: ${err.message}`);
                reject(err);
                return;
            }
            const userId = await api.getCurrentUserID();
            await initializeBot({ api, userId, botModel: models, filename });
            resolve(api);
        });
    });
}

async function webLogin(res, appState, botName, botPrefix, username, password, botAdmin) {
    return new Promise(async (resolve, reject) => {
        login(appState, async (err, api) => {
            if (err) {
                logger.error(`Web login failed: ${err.message}`);
                res.status(400).send({ error: 'Invalid appstate' });
                reject(err);
                return;
            }
            const userId = await api.getCurrentUserID();
            await initializeBot({ api, userId, botModel: models, botName, botPrefix, username, password, botAdmin, res });
            resolve();
        });
    });
}

async function loadBot() {
    console.log(chalk.blue('\n' + global.getText("main", "loadingLogin")));
    try {
        const bots = await models.Bot.findAll({ where: { appstate: { [Sequelize.Op.ne]: null } } });
        for (const bot of bots) {
            try {
                if (!bot.appstate) {
                    console.error(chalk.red(global.getText("main", "appstateEmpty", bot.uid)));
                    await deleteUser(bot.uid);
                    continue;
                }
                logger.login(global.getText("main", "loggingIn", chalk.blueBright(bot.uid)));
                await startLogin(bot.appstate, bot.uid);
            } catch (err) {
                logger.error(global.getText("main", "loginErrencounter"));
                await deleteUser(bot.uid);
                global.data.allThreadID.delete(bot.uid);
            }
        }
    } catch (err) {
        logger.error(`Error loading bots: ${err.message}`);
    }
}

loadBot();

function autoRestart(config) {
    if (config.status) {
        setInterval(() => process.exit(1), config.time * 60 * 1000);
    }
}

function autoDeleteCache(config) {
    if (config.status) {
        setInterval(() => {
            const { exec } = require('child_process');
            exec('rm -rf script/commands/cache && mkdir -p script/commands/cache && rm -rf script/events/cache && mkdir -p script/events/cache', (error, stdout, stderr) => {
                if (error) return logger(`Error: ${error}`, "cache");
                if (stderr) return logger(`Stderr: ${stderr}`, "cache");
                logger(`Successfully deleted caches`);
            });
        }, config.time * 60 * 1000);
    }
}

autoDeleteCache(global.config.autoDeleteCache);
autoRestart(global.config.autorestart);
