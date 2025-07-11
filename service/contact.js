const axios = require('axios');
const { Markup } = require('telegraf');

const contact = async (ctx) => {
  try {
    const contact = ctx.message.contact;
    const phone = contact.phone_number;
    const firstName = contact.first_name || 'Foydalanuvchi';
    const data = {
      "phone": phone.slice(4),
      "password": phone.slice(4), // vaqtincha, foydalanuvchi keyin o‘zgartiradi
      "name": firstName,
      "role": "client",
      "telegramId": String(ctx.from.id),
    }

    // const response = await axios.post('http://localhost:3002/auth/register', data);
    const response = await axios.post('https://api.suvtekin.uz/auth/register', data);
    console.log(`User registered: ${response}`);

    if (response.data) {
      await ctx.reply('✅ Ro‘yxatdan muvaffaqiyatli o‘tdingiz!');
      const keyboard = Markup.keyboard([
        ['🧾 Mening buyurtmalarim', '☎️ Qo‘llab-quvvatlash'],
        [Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')]
      ]).resize();

      await ctx.reply(
        `🚀 Endi siz xizmatimizdan to‘liq foydalanishingiz mumkin. Quyidagi menyudan tanlang:`,
        keyboard
      );

    } else {
      await ctx.reply('❌ Ro‘yxatdan o‘tishda noma’lum xatolik yuz berdi.');
    }

  } catch (error) {
    console.error('❌ Error in contact:', error.message);
    await ctx.reply('❌ Server bilan bog‘lanishda muammo yuz berdi. Iltimos, birozdan so‘ng urinib ko‘ring.');

  }
}

module.exports = contact;