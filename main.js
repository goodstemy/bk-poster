const Telegraf = require('telegraf');
const cron = require('node-cron');

const db = require('./db');
const utils = require('./utils');
const {MESSAGE_TYPE} = require('./constants');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN, {username: 'Автопостинг'});

const BK_ID_PRODUCTION = -1001136088389;
const BK_ID_TEST = -1001481857630;

let BK_ID = BK_ID_TEST;

if (process.env.NODE_ENV !== 'development') {
    BK_ID = BK_ID_PRODUCTION;
}

bot.on('message', processMessage);
cron.schedule('* */2 * * *', makePost);

async function processMessage(ctx) {
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

async function makePost() {
    const message = await db.getMessage();

    if (!message) {
        return;
    }

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

        default:
            console.warn(`Unsupported type ${post.type}. Cannot post`);
    }
}

bot.launch();

