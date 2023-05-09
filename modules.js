const path = require('path');

// Подключение системы логирования
const Logger = require('./logger');
const logger = new Logger(path.join(__dirname, './logger/logs'));
module.exports.logger = logger;
logger.start();
logger.log('info', 'Сервер запущен');

// Подключение системы API
const API = require('./api');
module.exports.api = new API();
module.exports.api.start();

// Подключение менеджера команд
const Manager = require('./console_manager');
module.exports.manager = new Manager();
module.exports.manager.exec('clear');
module.exports.manager.start();