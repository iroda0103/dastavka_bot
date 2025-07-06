const dotenv = require('dotenv')

dotenv.config()

module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    tg:{
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    }
    // db: {
    //     host: process.env.DB_HOST,
    //     port: process.env.DB_PORT,
    //     user: process.env.DB_USER,
    //     password: process.env.DB_PASSWORD,
    //     name: process.env.DB_NAME,
    //     DATABASE_URL:process.env.DATABASE_URL
    // },
    // jwt: {
    //     secret: process.env.JWT_SECRET,
    // },
}