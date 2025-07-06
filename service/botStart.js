const { Markup } = require('telegraf');
const axios = require('axios');

const botStart = async (ctx) => {
  const telegramUser = ctx.from;
  const response = await axios.get(`http://localhost:3002/users/tg?telegramId=${telegramUser.id}`)
  let message = `👋 Assalomu alaykum, hurmatli mijoz ${telegramUser.first_name}!

🍽 Bizning xizmat orqali shahar va tumanlardagi eng yaxshi restoranlardan tez va qulay tarzda ovqat buyurtma qilishingiz mumkin.`
  console.log(telegramUser.id, response.data.message);
  if (!response.data[0]) {
    message += `📲 Davom etish uchun, iltimos telefon raqamingizni yuboring:`;
    await ctx.reply(message,
      Markup.keyboard([
        Markup.button.contactRequest('📱 Telefon raqamni yuborish')
      ])
        .oneTime()
        .resize()
    );
    
  }
  else {
    await ctx.reply(message,
        Markup.keyboard([
        ['🧾 Mening buyurtmalarim', '☎️ Qo‘llab-quvvatlash'],
        // ['🍽 Taom buyurtma qilish']
        [Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')]
      ]).resize()
    );
  }




  // await ctx.reply(
  //   `Salom ${telegramUser.first_name}! 🍕\n\nOvqat yetkazib berish xizmatimizga xush kelibsiz!\n\nQuyidagi tugmalardan birini tanlang:`,
  //   keyboard
  // );
}

module.exports = botStart;