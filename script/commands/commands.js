module.exports.config = {
    name: "command",
    version: "1.0.0",
    permission: 3,
    credits: "ryuko",
    description: "manage/control all bot modules",
    prefix: true,
    premium: false,
    category: "operator",
    usages: "[load/unload/loadAll/unloadAll/info] [command name]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const loadCommand = function ({ moduleList, threadID, messageID, getText, botid }) {
    
    const { execSync } = global.nodemodule['child_process'];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule['fs-extra'];
    const { join } = global.nodemodule['path'];
    const { mainPath, api } = global.client;
    const configPath = "../../config.json"
    const logger = require('../../main/utility/logs.js');

    var errorList = [];
    delete require['resolve'][require['resolve'](configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + '.temp', JSON.stringify(configValue, null, 2), 'utf8');
    for (const nameModule of moduleList) {
        try {
            const dirModule = __dirname + '/' + nameModule + '.js';
            delete require['cache'][require['resolve'](dirModule)];
            const command = require(dirModule);
            global.client.commands.delete(nameModule);
            if (!command.config || !command.run || !command.config.category) 
                throw new Error('Module is malformed!');
            
            if (command.config.dependencies && typeof command.config.dependencies == 'object') {
                const listPackage = JSON.parse(readFileSync('./package.json')).dependencies,
                    listbuiltinModules = require('module')['builtinModules'];
                for (const packageName in command.config.dependencies) {
                    var tryLoadCount = 0,
                        loadSuccess = ![],
                        error;
                    const moduleDir = join(global.client.mainPath, 'nodemodules', 'node_modules', packageName);
                    try {
                        if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                        else global.nodemodule[packageName] = require(moduleDir);
                    } catch {
                        logger.commands('not found package ' + packageName + ' support for module ' + command.config.name+ 'installing.', 'warn');
                        const insPack = {};
                        insPack.stdio = 'inherit';
                        insPack.env = process.env ;
                        insPack.shell = !![];
                        insPack.cwd = join(global.client.mainPath,'nodemodules')
                        execSync('npm --package-lock false --save install ' + packageName + (command.config.dependencies[packageName] == '*' || command.config.dependencies[packageName] == '' ? '' : '@' + command.config.dependencies[packageName]), insPack);
                        for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                            require['cache'] = {};
                            try {
                                if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                                else global.nodemodule[packageName] = require(moduleDir);
                                loadSuccess = !![];
                                break;
                            } catch (erorr) {
                                error = erorr;
                            }
                            if (loadSuccess || !error) break;
                        }
                        if (!loadSuccess || error) throw 'unable to load package ' + packageName + (' for module ') + command.config.name +', error : ' + error + ' ' + error['stack'];
                    }
                }
                logger.commands('successfully downloaded the entire package for the module' + command.config.name);
            }
            if (command.config.envConfig && typeof command.config.envConfig == 'Object') try {
                for (const [key, value] of Object['entries'](command.config.envConfig)) {
                    if (typeof global.configModule[command.config.name] == undefined) 
                        global.configModule[command.config.name] = {};
                    if (typeof configValue[command.config.name] == undefined) 
                        configValue[command.config.name] = {};
                    if (typeof configValue[command.config.name][key] !== undefined) 
                        global.configModule[command.config.name][key] = configValue[command.config.name][key];
                    else global.configModule[command.config.name][key] = value || '';
                    if (typeof configValue[command.config.name][key] == undefined) 
                        configValue[command.config.name][key] = value || '';
                }
                logger.commands('loaded config' + ' ' + command.config.name);
            } catch (error) {
                throw new Error('failed to load config module, error : ' + JSON.stringify(error));
            }
            if (command['onLoad']) try {
                const onLoads = {};
                onLoads['configValue'] = configValue;
                command['onLoad'](onLoads);
            } catch (error) {
                throw new Error('unable to onLoad module, error : ' + JSON.stringify(error), 'error');
            }
            (global.config.disabledcmds.includes(nameModule + '.js') || configValue.disabledcmds.includes(nameModule + '.js')) 
            && (configValue.disabledcmds.splice(configValue.disabledcmds.indexOf(nameModule + '.js'), 1),
            global.config.disabledcmds.splice(global.config.disabledcmds.indexOf(nameModule + '.js'), 1))
            global.client.commands.set(command.config.name, command)
            logger.commands('loaded command ' + command.config.name + '.');
        } catch (error) {
            errorList.push('' + nameModule + ' reason : ' + error + ' at ' + error['stack']);
        };
    }
    if (errorList.length != 0) api.sendMessage('modules that had problems loading : ' + errorList.join(' '), threadID, messageID);
    api.sendMessage('loaded ' + (moduleList.length - errorList.length) + ' module.', threadID, messageID) 
    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8')
    unlinkSync(configPath + '.temp');
    return;
}

const unloadModule = function ({ moduleList, threadID, messageID, botid}) {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { mainPath, api } = global.client;
    const configPath = "../../config.json"
    const logger = require('../../main/utility/logs.js').commands;

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

    for (const nameModule of moduleList) {
        global.client.commands.delete(nameModule);
        configValue["disabledcmds"].push(`${nameModule}.js`);
        global.config["disabledcmds"].push(`${nameModule}.js`);
        logger(`unloaded command ${nameModule}.`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    unlinkSync(configPath + ".temp");

    return api.sendMessage(`unloaded ${moduleList.length} module`, threadID, messageID);
}

module.exports.run = function ({ event, args, api, botid }) {
    
    const { readdirSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;

    var moduleList = args.splice(1, args.length);
    let operator = global.config.operators;
            if (!operator.includes(event.senderID)) return api.sendMessage(`only bot operators can use this command.`, event.threadID, event.messageID);

    switch (args[0]) {
        case "load": {
            if (moduleList.length == 0) return api.sendMessage("module name cannot be empty.", threadID, messageID);
            else return loadCommand({ moduleList, threadID, messageID, botid });
        }
        case "unload": {
            if (moduleList.length == 0) return api.sendMessage("module name cannot be empty.", threadID, messageID);
            else return unloadModule({ moduleList, threadID, messageID, botid });
        }
        case "loadAll": {
            moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example'));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return loadCommand({ moduleList, threadID, messageID, botid });
        }
        case "unloadAll": {
            moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example') && !file.includes("command"));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return unloadModule({ moduleList, threadID, messageID, botid });
        }
        case "info": {
            const command = global.client.commands.get(moduleList.join("") || "");

            if (!command) return api.sendMessage("the module you entered does not exist.", threadID, messageID);

            const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;

            return api.sendMessage(
                "" + name.toUpperCase() + "\n" +
                 "coded by : " + credits + "\n" +
                 "version : " + version + "\n" +
                 "request permission : " + ((hasPermssion == 0) ? "user" : (hasPermssion == 1) ? "admin" : "bot operator" ) + "\n" +
                 "timeout : " + cooldowns + " seconds\n" +
                 `required packages : ${(Object.keys(dependencies || {})).join(", ") || "none"}`,
                threadID, messageID
            );
        }
        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    }
}