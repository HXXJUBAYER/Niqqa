module.exports.config = {
	name: "up",
	version: "1.0.1",
	permssion: 0,
	prefix: true,
	premium: false,
	credits: "Mirai Team",
	description: "Xem thông tin phần cứng mà bot đang sử dụng",
	category: "system",
	cooldowns: 5,
	dependencies: {
		"systeminformation": "",
		"pidusage": ""
	}
};

function byte2mb(bytes) {
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let l = 0, n = parseInt(bytes, 10) || 0;
	while (n >= 1024 && ++l) n = n / 1024;
	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)}${units[l]}`;
}

module.exports.run = async function ({ api, event }) {
	const { cpu, time, cpuTemperature, currentLoad, memLayout, diskLayout, mem, osInfo } = global.nodemodule["systeminformation"];
	const timeStart = Date.now();

	try {
		const pidusage = await global.nodemodule["pidusage"](process.pid)
		var { manufacturer, brand, speedMax, physicalCores, cores } = await cpu();
		var { main: mainTemp } = await cpuTemperature();
		var { currentLoad: load } = await currentLoad();
		var { uptime } = await time();
		var diskInfo = await diskLayout();
		var memInfo = await memLayout();
		var { total: totalMem, available: availableMem } = await mem();
		var { platform: OSPlatform, build: OSBuild } = await osInfo();;
		var disk = [], i = 1;

		var hours = Math.floor(uptime / (60 * 60));
		var minutes = Math.floor((uptime % (60 * 60)) / 60);
		var seconds = Math.floor(uptime % 60);
		if (hours < 10) hours = "0" + hours;
		if (minutes < 10) minutes = "0" + minutes;
		if (seconds < 10) seconds = "0" + seconds;

		for (const singleDisk of diskInfo) {
			disk.push(
				`disk ${i++}\n` +
				"name: " + singleDisk.name + "\n" +
				"type: " + singleDisk.interfaceType + "\n" + 
				"size: " + byte2mb(singleDisk.size) + "\n" +
				"temperature: " + singleDisk.temperature + "°C"
			)
		}

		return api.sendMessage(
			"SYSTEM INFORMATION\n\n" +
			"CPU\n" +
			"cpu model : " + manufacturer + " " + brand + " " + speedMax + "GHz\n" +
			"cores : " + cores + "\n" +
			"threads : " + physicalCores + "\n" +
			"temperature : " + mainTemp + "°C\n" +
			"load : " + load.toFixed(1) + "%\n" +
			"node usage : " + pidusage.cpu.toFixed(1) + "%\n\n" +
			"MEMORY\n" +
			"size : " + byte2mb(memInfo[0].size) +
			"\ntype : " + memInfo[0].type +
			"\ntotal : " + byte2mb(totalMem) +
			"\navailable : " + byte2mb(availableMem) +
			"\nnode usage : " + byte2mb(pidusage.memory) + "\n" +
			disk.join("\n") + "\n\n" +
			"OPERATING SYSTEM\n" +
			"platform : " + OSPlatform +
			"\nbuild : " + OSBuild +
			"\nuptime : " + hours + ":" + minutes + ":" + seconds +
			"\nping : " + (Date.now() - timeStart) + "ms",
			event.threadID, event.messageID
		)
	}
	catch (e) {
		console.log(e)
	}
}