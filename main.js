const { Telegraf, Markup } = require('telegraf');
// const config = require("./config");
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const bot = new Telegraf('8191500231:AAG8IxtNqCtUyDeb1PEBinO6_fBz2E22JE8');

bot.catch((err, ctx) => {
  console.error(`Error for user ${ctx.from?.id}:`, err);
});
console.log("Bot is starting...");

// Boshlang'ich (start) komandasi
bot.start((ctx) => {
  // Rasm fayl manzili
  const photoPath = path.join(__dirname, 'logo.png');
  console.log("Photo path:", photoPath);
  
  // Rasm bilan birga yuboriladigan matn
  const caption = `
🍔 *What can this bot do?*
Use this bot to order fictional fast food – the only fast food that is good for your health!
  `;

  // Rasmni yuborish
  ctx.replyWithPhoto({ source: fs.createReadStream(photoPath) }, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'START', callback_data: 'start_order' }]
      ]
    }
  });
});

// Callback tugmasi bosilganda javob
bot.action('start_order', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("Let's start your fictional fast food order! 🍟🍔");
});

// Telefon raqam qabul qilish
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  const phone = contact.phone_number;
  const firstName = contact.first_name || 'Foydalanuvchi';

  try {
    const response = await axios.post('http://localhost:3002/auth/register', {
      phone: phone,
      password: phone,
      name: firstName,
      role: 'client'
    });

    console.log('API Response:', response.data);

    if (response.data.success) {
      ctx.reply('✅ Ro‘yxatdan muvaffaqiyatli o‘tdingiz!');
    } else if (typeof response.data === 'string' && response.data.includes('User already exists')) {
      ctx.reply('ℹ️ Siz allaqachon ro‘yxatdan o‘tgansiz.');
    } else if (Array.isArray(response.data)) {
      ctx.reply('ℹ️ Siz allaqachon ro‘yxatdan o‘tgansiz.');
    } else {
      ctx.reply('❌ Ro‘yxatdan o‘tishda noma’lum xatolik yuz berdi.');
    }

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    ctx.reply('❌ Server bilan bog‘lanishda muammo yuz berdi.');
  }
});

bot.command('all', async (ctx) => {
  try {
    
  }
  catch (error) {
    console.error('Xatolik:', error);
    ctx.reply('❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
  }
});

// Foydalanuvchi yuborgan xabarlarni qayta ishlash
async function startBot() {
  try {
    await bot.launch();
    console.log("🤖 Bot ishga tushdi");

    // Setup graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error("❌ Bot ishga tushirishda xatolik:", error);
    process.exit(1);
  }
}

// Botni ishga tushirish
startBot().catch(console.error);