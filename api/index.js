const fs = require('fs');
const express = require('express');
const path = require('path');
const body_parser = require('body-parser');
const http = require('http');
const https = require('https');

const { logger } = require('../modules');

class API {
    config = require('./config.json');

    /**
     * 
     * @param {*} res res
     * @param {Object|String} data Ответ, который необхоимо вывести
     * @param {Number} code Код ответа
     * @description Возвращает ответ пользователю на API запрос
     */
    static send(res, data, code=200) {
        res.status(code).send(code === 200 ? { response: data } : { error: data });
    }

    /** Главный обработчки */
    #express;

    /** Инициализация главного обработчика */
    #init_express() {
        this.#express = express();

        this.#express.use((req, res, next) => this.customize(req, res, next, this));
        this.#express.use(this.headers);
        this.#express.use(express.static(path.join(__dirname, 'public')));
        this.#express.use(body_parser.json());
        this.#express.use(body_parser.urlencoded({ extended: false }));
        this.#express.use(this.checker_request);
        this.#express.use(this.log);

        this.#init_methods();
    }

    #init_methods() {
        const inside = (file_path, api_path) => {
            const is_method = fs.existsSync(path.join(file_path, 'index.js'));
            if (is_method) require(file_path)?.router(api_path, this.#express);
            else fs.readdirSync(file_path, { withFileTypes: true }).filter(item => item.isDirectory()).map(dir => inside(path.join(file_path, dir.name), path.join(api_path, dir.name)));
        }
        inside(path.join(__dirname, 'methods'), `/${this.config.sub_url ? `${this.config.sub_url}/` : ''}`);
    }

    /** Данные для связи с SSL */
    #options;

    /** Получение данных для связи с SSL */
    #init_options() {
        const SSL_PATH = path.join(__dirname, 'SSL-certification');
        this.#options = {
            key: fs.readFileSync(path.join(SSL_PATH, 'key.key')), 
            cert: fs.readFileSync(path.join(SSL_PATH, 'certificate.crt')), 
            ca: fs.readFileSync(path.join(SSL_PATH, 'domain.cabundle'))
        }
    }

    constructor () {
        this.#init_options();
        this.#init_express();
    }

    /* Добавление полей в res и req */
    customize(req, res, next, module) {
        // res
        res.module = module;

        // req
        req.user = {};
        req.user.ip = req.ip.substr(0, 7) === '::ffff:' ? req.ip.substr(7) : req.ip;
        
        next();
    }

    /** Отправка заголовков клиенту */
    headers(req, res, next) {
        for (let i=0; i < res.module.config.headers.length; i++) {
            const header = res.module.config.headers.length[i];
            res.setHeader(header.name, header.value);
        }
        next();
    }

    /** Проверка запроса */
    checker_request(req, res, next) {
        // console.log(req, res);
        next();
    }

    /** Логирование запросов */
    log(req, res, next) {
        if (res.module.config.logging) {
            logger.log('info', `API | ${req.originalUrl} | ${req.user.ip}`);
            try {
                next();
            } catch (e) {
                logger.log('error', e);
                API.send(res, { code: 0, message: 'Unknow error' }, 500);
            }
        } else next();
    }
 
    #server;
    /** Запуск сервера */
    start() {
        let server;
        const mode = this.config.mode;
        if (mode === 'https') server = https.createServer(this.#options, this.#express);
        else if (mode === 'http') server = http.createServer(this.#options, this.#express);
        else if (mode === 'localhost') server = this.#express;

        if (server) {
            server.timeout = 1000;
            const port = this.config.port;
            const start = async () => server.listen(port, () => {
                this.#server = server;
                logger.log('info', `Система API запущена: режим ${mode}, порт ${port}`);
            });
            
            if (mode === 'localhost') server = start();
            else start();
        }
    }

    /** Остановка сервера */
    stop() {
        if (this.#server) {
            this.#server.close();
            this.#server = undefined;
            logger.log('info', 'Система API отключена');
        }
    }

    is_listen() { return Boolean(this.#server) }

}

module.exports = API;