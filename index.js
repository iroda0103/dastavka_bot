const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const config = require("./config");
const router = require('./router');
const service = require('./service');
const axios = require('axios');

const app = express();
const bot = new Telegraf(config.tg.botToken);

app.use(express.json());
app.use(cors());
app.use(router);

bot.catch((err, ctx) => {
  console.error(`Error for user ${ctx.from?.id}:`, err);
});
console.log("Bot is starting...");

// Start command
bot.start((ctx) => service.botStart(ctx, bot));

bot.on('contact', (ctx) => service.contact(ctx, bot));

bot.command('all', (ctx) => {
  ctx.reply('Ovqat buyurtma qiladigan botga xush kelibsiz!', Markup.keyboard([
    [Markup.button.webApp('🛍 Buyurtma berish', 'https://eltuv.vercel.app/')],
    ['🧾 Mening buyurtmalarim']
  ]).resize());
});

bot.hears('🧾 Mening buyurtmalarim', (ctx) => service.myOrder(ctx));
bot.hears('☎️ Qo‘llab-quvvatlash', async (ctx) => {
  await ctx.reply('📞 Qoʻllab-quvvatlash xizmati: +998 88 111 38 21\n' +
    'Ish vaqti: 09:00 - 18:00');
});

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
});

// Improved order handling
bot.on('message', async (msg) => {
  if (msg.webAppData) {
    try {
      const data = JSON.parse(msg.webAppData.data.text());
      console.log("Web App'dan kelgan data:", data);

      // Validate required fields
      if (!data.items || data.items.length === 0) {
        return msg.reply('❌ Savatchangiz bo\'sh. Iltimos, avval mahsulot tanlang.');
      }

      if (data.isDelivery && !data.address) {
        return msg.reply('❌ Yetkazib berish uchun manzil kiritilmagan.');
      }

      // Prepare order data for API
      const orderData = {
        id: data.id,
        clientId: data.user?.id || msg.from.id,
        clientName: data.user?.name || `${msg.from.first_name} ${msg.from.last_name || ''}`.trim(),
        clientPhone: data.user?.phone || data.address?.phone,
        restaurantId: data.restaurantId || 1, // Default or from data
        items: data.items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        deliveryType: data.deliveryType,
        totalPrice: data.totalPrice,
        deliveryPrice: data.deliveryPrice || (data.isDelivery ? 10000 : 0),
        paymentMethod: data.paymentMethod || 'cash',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // 2. Notify user
      await msg.reply(`✅ Sizning #${orderData.id} raqamli buyurtmangiz qabul qilindi!\n` +
        (data.deliveryType == 'delivery' ? 'Haydovchilar qidirilyapti, iltimos kuting...' : 'Buyurtmangiz tayyor bo\'lganda olib ketishingiz mumkin.'));

      // 3. If delivery, find and notify drivers
      if (data.deliveryType == 'delivery') {
        try {
          const driversResponse = await axios.get('https://api.suvtekin.uz/users?role=driver');
          const drivers = driversResponse.data;

          if (!drivers || !Array.isArray(drivers)) {
            throw new Error('Haydovchilar ma\'lumoti topilmadi yoki array emas');
          }

          const orderDetails = data.items.map(item =>
            `- ${item.name} x ${item.quantity} (${item.price} so'm)`
          ).join('\n');

          const messageText = `📦 Yangi buyurtma #${orderData.id}:\n${orderDetails}\n\n` +
            `📍 Manzil: ${data.address.full}\n` +
            `📞 Telefon: ${orderData.clientPhone}\n` +
            `💵 Umumiy narx: ${orderData.totalPrice} so'm (yetkazish: ${orderData.deliveryPrice} so'm)`;

          for (const driver of drivers) {
            if (driver.telegramId) {
              try {
                await bot.telegram.sendMessage(
                  driver.telegramId,
                  messageText,
                  {
                    reply_markup: {
                      inline_keyboard: [
                        [{
                          text: "✅ Buyurtmani qabul qilish",
                          callback_data: `accept_${orderData.id}_${msg.chat.id}_${driver.id}`
                        }]
                      ]
                    }
                  }
                );
              } catch (err) {
                console.error(`Haydovchiga xabar yuborishda xato (ID: ${driver.telegramId}):`, err.message);
              }
            }
          }
        } catch (err) {
          console.error('Haydovchilarni topishda xato:', err);
          await msg.reply('⚠️ Haydovchilarni topishda muammo yuz berdi. Iltimos, birozdan keyin qayta urunib ko\'ring.');
        }
      }

    } catch (err) {
      console.error('Xatolik yuz berdi:', err);
      await msg.reply('❌ Buyurtmani qayta ishlashda xatolik yuz berdi. Iltimos, qayta urunib ko\'ring.');
    }
  }
});

// Improved order acceptance
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    console.log('Callback data:', callbackData);

    if (callbackData.startsWith('accept_')) {
      const [_, orderId, clientChatId, driverId] = callbackData.split('_');
      console.log('test', driverId, {
        driverId: +driverId,
        status: 'confirmed',
        // acceptedAt: new Date().toISOString()
      });

      // 1. Update order in database
      try {
        await axios.patch(`http://localhost:3002/orders/${orderId}`, {
          driverId: +driverId,
          status: 'confirmed',
          // acceptedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Order update error:', err.response?.data || err.message);
        return ctx.answerCbQuery('❌ Buyurtmani yangilashda xatolik');
      }

      // 2. Notify driver
      await ctx.telegram.sendMessage(
        ctx.from.id,
        `✅ Siz #${orderId} raqamli buyurtmani qabul qildingiz!\n` +
        `Mijoz: ${ctx.callbackQuery.message.text.split('\n')[2]?.replace('📞 Telefon: ', '') || 'Noma\'lum'}\n` +
        `Yetkazish manzili: ${ctx.callbackQuery.message.text.split('\n')[1]?.replace('📍 Manzil: ', '') || 'Noma\'lum'}`
      );

      // 3. Notify client
      await ctx.telegram.sendMessage(
        clientChatId,
        `🚗 Haydovchi ${ctx.callbackQuery.from.first_name} buyurtmangizni qabul qildi!\n` +
        `Buyurtma raqami: #${orderId}\n` +
        `Haydovchi siz bilan tez orada bog'lanadi.`
      );

      // 4. Remove inline keyboard
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

      await ctx.answerCbQuery();
    }
  } catch (err) {
    console.error('Callback queryda xato:', err);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi, qayta urinib ko\'ring');
  }
});

// Location handling
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

bot.on('location', (ctx) => {
  const location = ctx.message.location;
  // Here you would typically save the location to user's profile
  ctx.reply('✅ Manzilingiz saqlandi. Endi taom tanlang!', Markup.inlineKeyboard([
    Markup.button.webApp('🍽 Taom buyurtma qilish', 'https://eltuv.vercel.app/')
  ]));
});

// Start bot and server
service.startBot(bot).catch(console.error);

app.listen(config.port || 3030, () => {
  console.log(`🚀 Server running on http://localhost:${config.port || 3030}`);
});