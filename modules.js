const path = require('path');

// Подключение системы логирования
const Logger = require('./logger');
const logger = new Logger(path.join(__dirname, './logger/logs'));
module.exports.logger = logger;
logger.start();
logger.log('info', 'Сервер запущен');

// Подключение системы API
const API = require('./api');
const api = new API();
module.exports.api = api;
api.start();

// Подключение менеджера команд
const Manager = require('./console_manager');
const manager = new Manager();
module.exports.manager = manager;
manager.exec('clear');
manager.start();