/* ryukov3 project */


const { Sequelize } = require("sequelize");

const { resolve } = require("path");
const { database } = global.config;

var dialect = Object.keys(database), storage;
dialect = dialect[0]; 
storage = resolve(__dirname, `${database[dialect].storage}`);

module.exports.sequelize = new Sequelize({

	dialect,
	storage,
	pool: {
		max: 90,
		min: 0,
		acquire: 90000,
		idle: 50000
	},
	retry: {
		match: [
    Sequelize.ConnectionError,
    Sequelize.ConnectionRefusedError,
    Sequelize.ConnectionTimedOutError,
    Sequelize.OptimisticLockError,
    Sequelize.TimeoutError,
    'SequelizeDatabaseError: Deadlock found when trying to get lock; try restarting transaction',
    /SQLITE_BUSY/,
    'SQLITE_BUSY',
    'ER_LOCK_DEADLOCK'
    ],
		name: 'query',
		max: 90
	},
	logging: false,
	transactionType: 'IMMEDIATE',
	define: {
		underscored: false,
		freezeTableName: true,
		charset: 'utf8',
		dialectOptions: {
			collate: 'utf8_general_ci'
		},
		timestamps: true
	},
	sync: {
		force: false
	}
});

module.exports.Sequelize = Sequelize;