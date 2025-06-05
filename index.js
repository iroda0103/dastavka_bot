const { Telegraf, Markup } = require('telegraf');
// const config = require("./config");
const axios = require('axios');

const bot = new Telegraf('8191500231:AAG8IxtNqCtUyDeb1PEBinO6_fBz2E22JE8');

bot.catch((err, ctx) => {
  console.error(`Error for user ${ctx.from?.id}:`, err);
});
console.log("Bot is starting...");


//start komandasi
bot.start(async (ctx) => {
  const telegramUser = ctx.from;
  // ctx.reply(
  //   'Ro‘yxatdan o‘tish uchun telefon raqamingizni yuboring:',
  //   Markup.keyboard([
  //     Markup.button.contactRequest('📱 Telefon raqamni yuborish')
  //   ])
  //     .oneTime()
  //     .resize()
  // );
  const keyboard = Markup.keyboard([
    [Markup.button.callback("📋 Buyurtmalarim", "orders"), Markup.button.callback("📞 Aloqa", "aloqa")],
    // [Markup.button.callback("📋 ⚙️ Sozlamalar", "orders")],
    [Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')]
  ]).resize();

  await ctx.reply(
    `Salom ${telegramUser.first_name}! 🍕\n\nOvqat yetkazib berish xizmatimizga xush kelibsiz!\n\nQuyidagi tugmalardan birini tanlang:`,
    keyboard
  );
});

// // Telefon raqam qabul qilish
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

bot.command('all', (ctx) => {

  Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')
  ctx.reply('Ovqat buyurtma qiladigan botga cush kelibsiz!', Markup.keyboard([
    [Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')]
  ]).resize());
});

bot.hears('📋 Buyurtmalarim', async (ctx) => {
  const orders = [
    {
      orderId: 'A1234',
      status: 'confirmed',
      restaurantName: 'Pishloqli Pizza',
      totalAmount: 85000,
      orderDate: new Date('2025-06-01'),
      items: [
        { name: 'Pishloqli pizza', quantity: 1, price: 50000 },
        { name: 'Coca-Cola 1.5L', quantity: 2, price: 17500 }
      ]
    },
    {
      orderId: 'B5678',
      status: 'delivering',
      restaurantName: 'Shashlik House',
      totalAmount: 120000,
      orderDate: new Date('2025-05-28'),
      items: [
        { name: 'Mol go‘shti shashlik', quantity: 2, price: 40000 },
        { name: 'Non', quantity: 2, price: 10000 },
        { name: 'Choy', quantity: 1, price: 20000 }
      ]
    }
  ];

  const statusEmoji = {
    'pending': '⏳',
    'confirmed': '✅',
    'preparing': '👨‍🍳',
    'ready': '🍽',
    'delivering': '🚚',
    'delivered': '✅',
    'cancelled': '❌'
  };

  let message = '📋 Sizning buyurtmalaringiz:\n\n';

  orders.forEach((order, index) => {
    message += `${index + 1}. Buyurtma #${order.orderId}\n`;
    message += `${statusEmoji[order.status]} Status: ${order.status}\n`;
    message += `🏪 Restoran: ${order.restaurantName}\n`;
    message += `📅 Sana: ${order.orderDate.toLocaleDateString()}\n`;
    message += `🍽 Taomlar:\n`;

    order.items.forEach((item) => {
      message += `  • ${item.quantity} ta ${item.name}  — ${(item.price * item.quantity).toLocaleString()} so'm\n`;
    });

    message += `💰 Umumiy: ${order.totalAmount.toLocaleString()} so'm\n\n`;
  });

  await ctx.reply(message);
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

