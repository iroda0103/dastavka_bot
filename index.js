const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const config = require("./config");
const router = require('./router');
const service = require('./service');

const app = express();
const bot = new Telegraf(config.tg.botToken);

app.use(express.json());
app.use(cors());
app.use(router);

bot.catch((err, ctx) => {
  console.error(`Error for user ${ctx.from?.id}:`, err);
});
console.log("Bot is starting...");

//start komandasi
bot.start((ctx) => service.botStart(ctx, bot));


bot.on('contact', (ctx) => service.contact(ctx, bot));

bot.command('all', (ctx) => {

  Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')
  ctx.reply('Ovqat buyurtma qiladigan botga cush kelibsiz!', Markup.keyboard([
    [Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')]
  ]).resize());
});

bot.hears('🧾 Mening buyurtmalarim', (ctx) => service.myOrder(ctx));

bot.command('address', async (ctx) => {
  ctx.reply('🍽 Taom buyurtma qilish uchun manzilingizni yuboring:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Lokatsiyani yuborish', request_location: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
})

// 1. Boshlanish
bot.command('location', (ctx) => {
  ctx.reply('📍 Manzilingizni yuboring:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Lokatsiyani yuborish', request_location: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// 2. Lokatsiyani qabul qilish
bot.on('location', (ctx) => {
  const location = ctx.message.location;
  // Lokatsiyani saqlab qo‘yish
  ctx.reply('✅ Manzilingiz saqlandi. Endi taom tanlang!', Markup.inlineKeyboard([
    Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')
  ]));
  // Davom ettirish: menyuni ko‘rsatish
});

// Botni ishga tushirish
service.startBot(bot).catch(console.error);


app.listen(config.port || 3030, () => {
  console.log(`🚀 Server running on http://localhost:${config.port || 3030}`);
});
