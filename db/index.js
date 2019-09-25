const {promisify} = require('util');
const redis = require('redis');

const client = redis.createClient();

client.on('error', error => { throw new Error(error) });

const rpushAsync = promisify(client.rpush).bind(client);
const lpopAsync = promisify(client.lpop).bind(client);

module.exports = {
    pushMessage: async message => rpushAsync('scheduled', JSON.stringify(message)),
    getMessage: async () => JSON.parse(await lpopAsync('scheduled')),
};
