// ryuko

console.clear();
const { spawn } = require("child_process");
const chalk = require('chalk');
const fs = require('fs-extra')
const path = require('path');

function startBot(message) {
    (message) ? console.info(chalk.blue(message.toUpperCase())) : "";

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "--no-warnings", "main.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });
  child.on("close", (codeExit) => {
        if (codeExit != 0 || global.countRestart && global.countRestart < 5) {
            startBot("restarting server");
            global.countRestart += 1;
            return;
        } else return;
    });

  child.on("error", function(error) {
    console.error("an error occurred : " + JSON.stringify(error));
  });
};
startBot();