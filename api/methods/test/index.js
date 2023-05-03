module.exports.config = require('./config.json');
module.exports.router = (path, app) => app[this.config.method](path, (req, res) => {
    res.status(200).send('OK');
});