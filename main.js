const Telegraf = require('telegraf');
const cron = require('node-cron');

const db = require('./db');
const utils = require('./utils');
const {MESSAGE_TYPE} = require('./constants');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN, {username: 'Автопостинг'});

const BK_ID_PRODUCTION = -1001136088389;
const BK_ID_TEST = -1001481857630;
const SUGGEST_BK_PRODUCTION = -1001450845044;
const SUGGEST_BK_TEST = -393958223;
const CRON_CONFIG_DEVELOPMENT = '*/10 * * * * *';
const CRON_CONFIG_PRODUCTION = '0 0 */2 * * *';


let BK_ID = BK_ID_TEST;
let CRON_CONFIG = CRON_CONFIG_DEVELOPMENT;
let SUGGEST_BK = SUGGEST_BK_TEST;

if (process.env.NODE_ENV !== 'development') {
    CRON_CONFIG = CRON_CONFIG_PRODUCTION;
    BK_ID = BK_ID_PRODUCTION;
    SUGGEST_BK = SUGGEST_BK_PRODUCTION;
}

bot.on('message', processMessage);
cron.schedule(CRON_CONFIG, makePost);

async function processMessage(ctx) {
    console.log('Got message: ');
    console.log(ctx.message);

    const {message} = ctx;

    if (message.photo) {
        return processPhoto(ctx, message.photo);
    }

    if (message.document) {
        return processDocument(ctx, message.document);
    }

    if (message.text) {
        return processText(ctx, message.text);
    }

    if (message.video) {
        return processVideo(ctx, message.video);
    }

    ctx.reply('Тип сообщения не поддерживается');
}

async function processPhoto(ctx, photo) {
    db.pushMessage({
        id: utils.getImageId(photo),
        type: MESSAGE_TYPE.photo,
    });

    ctx.deleteMessage();
}

async function processDocument(ctx, document) {
    db.pushMessage({
        id: utils.getDocumentId(document),
        type: MESSAGE_TYPE.document,
    });

    ctx.deleteMessage();
}

async function processText(ctx, text) {
    db.pushMessage({
        text,
        type: MESSAGE_TYPE.text,
    });

    ctx.deleteMessage();
}

async function processVideo(ctx, video) {
    db.pushMessage({
        id: utils.getVideoId(video),
        type: MESSAGE_TYPE.video,
    });

    ctx.deleteMessage();
}

async function makePost() {
    const message = await db.getMessage();
    console.log('Making post:', new Date());

    if (!message) {
        return;
    }

    const count = await db.getCountOfScheduledPosts();

    bot.telegram.sendMessage(SUGGEST_BK, `Постов в очереди: ${count}`);

    const {type, id, text} = message;

    switch (type) {
        case MESSAGE_TYPE.photo:
            await bot.telegram
                .sendPhoto(BK_ID, id)
                .catch(err => console.error(`Error when send scheduled post. Reason: ${err.message}`));

            break;

        case MESSAGE_TYPE.document:
            await bot.telegram
                .sendDocument(BK_ID, id)
                .catch(err => console.error(`Error when send scheduled post. Reason: ${err.message}`));

            break;

        case MESSAGE_TYPE.text:
            await bot.telegram
                .sendMessage(BK_ID, text)
                .catch(err => console.error(`Error when send scheduled post. Reason: ${err.message}`));

            break;

        case MESSAGE_TYPE.video:
            await bot.telegram
                .sendVideo(BK_ID, id)
                .catch(err => console.error(`Error when send scheduled post. Reason: ${err.message}`));

            break;

        default:
            console.warn(`Unsupported type ${post.type}. Cannot post`);
    }
}

bot.launch();

