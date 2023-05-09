const fs = require('fs');
const Command = require('./command');
const { logger, api } = require('../modules');
const custom_interface = require('./custom_interface');
const path = require('path');
const chalk = require('@kitsune-labs/chalk-node');

const logger_config = path.join(__dirname, '../logger/config.json');
const api_config = path.join(__dirname, '../api/config.json');

const interface = {
    logger: {
        status_system: () => logger.get_loging(),
        on: new Command('on', 'Включить систему логирования', ({ manager }) => {
            if (!logger.get_loging()) {
                logger.start();
                manager.output('info', 'Система логирования включена');
            } else manager.output('warn', 'Система логирования уже включена');
        }),
        off: new Command('off', 'Отключить систему логирования', ({ manager }) => {
            if (logger.get_loging()) {
                logger.stop();
                manager.output('info', 'Система логирования отключена');
            } else manager.output('warn', 'Система логирования уже отключена');
        }),
        get: new Command('get', 'Возвращает логи за указанные дату и время', ({ parameters, manager }) => {
            const logs = logger.get(parameters.date, parameters.time_start, parameters.time_end);
            if (Array.isArray(logs) && 0 < logs.length) manager.output(null, logs.map(log => log.log));
            else manager.output('warn', 'Логи за указанный период не найдены');
        }, { parameters: [
            { name: 'date', description: 'Дата, за которую необходимо получить логи', required: true },
            { name: 'time_start', description: 'Время, начиная с которого необходимо вернуть логи', required: false },
            { name: 'time_end', description: 'Время, заканчивая которым необходимо вернуть логи', required: false }
        ] }),
        list: new Command('list', 'Список сохраненных логов', ({ manager }) => {
            const files = 
                fs.readdirSync(logger.get_path())
                .filter(file => path.extname(file) === '.log')
                .sort((a,b) => fs.statSync(path.join(logger.get_path(), a)).mtime.getTime() - fs.statSync(path.join(logger.get_path(), b)).mtime.getTime())
                .map(file => `${path.parse(file).name} ${!fs.existsSync(logger.conf_path(path.parse(file).name)) ? `(${chalk.yellow('.conf файл не найден')})` : ''}`)
            ;

            if (0 < files.length) manager.output(null, files);
            else manager.output('warn', 'Лог файлы не найдены');
        }),

        get_format: new Command('get_format', 'Получить текущий шаблон для логов', ({ flags, manager }) => manager.output(null, flags['-d'] ? JSON.parse(fs.readFileSync(logger_config, 'utf-8')).format : logger.config.format), { flags: [{ name: '-d', description: 'Получить текущий шаблон для логов из конфига' }] }),
        set_format: new Command('set_format', 'Установка нового шаблона для логов', ({ parameters, flags, manager }) => {
            logger.config.format = parameters.format;
            if (flags['-d']) fs.writeFileSync(logger_config, JSON.stringify(logger.config, null, 4));
            manager.output('info', 'Шаблон обновлен');
        }, {
            parameters: [{ name: 'format', description: 'Новый шаблон для логирования', required: true }],
            flags: [{ name: '-d', description: 'Также поменять значение шаблона по умолчанию, в конфиге' }]
        })
    },

    api: {
        status_system: () => api.is_listen(),
        ...require('../api/methods_interface'),
        on: new Command('on', 'Включить систему API', ({ manager }) => {
            if (!api.is_listen()) {
                api.start();
                manager.output('info', 'Система API запускается. Используйте "status" для проверки состояния.');
            } else manager.output('warn', 'Система API уже включена');
        }),
        off: new Command('off', 'Отключить систему API', ({ manager }) => {
            if (api.is_listen()) {
                api.stop();
                manager.output('info', 'Система API отключена');
            } else manager.output('warn', 'Система API уже отключена');
        }),

        get_mode: new Command('get_mode', 'Получить текущий режим сервера', ({ flags, manager }) => manager.output(null, flags['-d'] ? JSON.parse(fs.readFileSync(api_config, 'utf-8')).mode : api.config.mode), { flags: [{ name: '-d', description: 'Получить текущий режим сервера из конфига' }] }),
        set_mode: new Command('set_mode', 'Установка нового режима сервера', ({ parameters, flags, manager }) => {
            api.config.mode = parameters.mode;
            if (flags['-d']) fs.writeFileSync(api_config, JSON.stringify(api.config, null, 4));
            manager.output('info', 'Режим обновлен');
        }, {
            parameters: [{ name: 'mode', description: 'Новый режим запуска сервера (https/http/localhost)', required: true }],
            flags: [{ name: '-d', description: 'Также поменять значение режима по умолчанию, в конфиге' }]
        }),

        get_port: new Command('get_port', 'Получить текущий порт сервера', ({ flags, manager }) => manager.output(null, flags['-d'] ? JSON.parse(fs.readFileSync(api_config, 'utf-8')).port : api.config.port), { flags: [{ name: '-d', description: 'Получить текущий порт из конфига' }] }),
        set_port: new Command('set_port', 'Установка нового порта сервера', ({ parameters, flags, manager }) => {
            api.config.port = parameters.port;
            if (flags['-d']) fs.writeFileSync(api_config, JSON.stringify(api.config, null, 4));
            manager.output('info', 'Порт обновлен');
        }, {
            parameters: [{ name: 'port', description: 'Новый порт запуска сервера', required: true }],
            flags: [{ name: '-d', description: 'Также поменять значение порта по умолчанию, в конфиге' }]
        })
    },
    shutdown: new Command('shutdown', 'Отключить сервер', ({ manager }) => {
        manager.output('info', 'Выключение');
        process.exit();
    }),

    ...custom_interface
}

module.exports = interface;