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

    const response = await axios.post('http://localhost:3002/auth/register', data);
    console.log(`User registered: ${response}`);

    if (response.data) {
      await ctx.reply('✅ Ro‘yxatdan muvaffaqiyatli o‘tdingiz!');

      const keyboard = Markup.keyboard([
        ['🧾 Mening buyurtmalarim', '☎️ Qo‘llab-quvvatlash'],
        ['🍽 Taom buyurtma qilish']
        // [Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')]
      ]).resize();

      await ctx.reply(
        `🚀 Endi siz xizmatimizdan to‘liq foydalanishingiz mumkin. Quyidagi menyudan tanlang:`,
        keyboard
      );

    } else {
      await ctx.reply('❌ Ro‘yxatdan o‘tishda noma’lum xatolik yuz berdi.');
    }

  } catch (error) {
    if (error.response?.data.message == 'User already exists') {
      await ctx.reply('ℹ️ Siz allaqachon ro‘yxatdan o‘tgansiz.');

      const keyboard = Markup.keyboard([
        ['🧾 Mening buyurtmalarim', '☎️ Qo‘llab-quvvatlash'],
        // ['🍽 Taom buyurtma qilish']
        [Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')]
      ]).resize();

      await ctx.reply(
        `👋 Yana bir bor xush kelibsiz! Quyidagi menyudan foydalanishingiz mumkin:`,
        keyboard
      );
    }
    else {
      await ctx.reply('❌ Server bilan bog‘lanishda muammo yuz berdi. Iltimos, birozdan so‘ng urinib ko‘ring.');
    }
  }
}

module.exports = contact;