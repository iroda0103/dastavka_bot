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

//start komandasi
bot.start((ctx) => service.botStart(ctx, bot));


bot.on('contact', (ctx) => service.contact(ctx, bot));

bot.command('all', (ctx) => {
  console.log(ctx.from.id);

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

bot.on('message', async (msg) => {
  console.log("TESTT", msg.webAppData);

  if (msg.webAppData) {
    try {
      const data = await msg.webAppData.data.json();
      console.log("Web App'dan kelgan data:", data);

      // Haydovchilarni olish
      const response = await axios.get('https://dastavka.onrender.com/users?role=driver');
      const drivers = response.data;

      if (!drivers || !Array.isArray(drivers)) {
        throw new Error('Haydovchilar ma\'lumoti topilmadi yoki array emas');
      }

      // Buyurtma ma'lumotlarini formatlash
      const orderDetails = data.items.map(item =>
        `- ${item.name} x ${item.quantity}`
      ).join('\n');

      const messageText = `📦 Yangi buyurtma:\n${orderDetails}\n\n📍 Manzil: ${data.address?.full}\n💵 Umumiy narx: ${data.totalPrice}`;

      for (const driver of drivers) {
        if (driver.telegramId) {
          try {
            // Buyurtma ma'lumotlarini soddalashtirish va kerakli maydonlarni tanlash
            const simplifiedOrderData = {
              items: data.items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                name: item.name
              })),
              address: data.address,
              totalPrice: data.totalPrice,
              paymentMethod: data.paymentMethod
            };

            // callback_data uchun max 64 bayt chegarasi bor, shuning uchun minimal ma'lumot yuboramiz
            const callbackPayload = {
              orderId: Date.now(), // yoki serverdan kelgan unique ID
              clientTelegramId: msg.chat.id,
              driverId: driver.telegramId,
              clientId: data.user.id
            };

            await bot.telegram.sendMessage(
              driver.telegramId,
              messageText,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{
                      text: "✅ Buyurtmani qabul qilish",
                      callback_data: `accept_${callbackPayload.orderId}_${callbackPayload.clientTelegramId}_${callbackPayload.driverId}_${callbackPayload.clientId}`
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

      await bot.telegram.sendMessage(msg.chat.id, 'Buyurtmangiz qabul qilindi.Haydovchilar qidirilyapti, iltimos kuting...');

    } catch (err) {
      console.error('Xatolik yuz berdi:', err.message);
      await bot.telegram.sendMessage(msg.chat.id, 'Buyurtmani qayta ishlashda xatolik yuz berdi');
    }
  }
});

bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    console.log('BUYURTMA QABUL QILISH:', callbackData);

    if (callbackData.startsWith('accept_')) {
      const parts = callbackData.split('_');
      const orderId = parts[1];
      const clientTelegramId = parts[2];
      const driverId = parts[3];
      const clientId = parts[4];
//  "address": "Arabon",
//     "clientId": 3,
//     "driverId": 9,
//     "restaurantId": 2,
//     "items": [
//         {
//             "menuId": 2,
//             "quantity": 1
//             // "notes": "Tokmasdan op kelin pls"
//         }
//     ]
      // API dan to'liq buyurtma ma'lumotlarini olish
      // const orderResponse = await axios.post(`https://dastavka.onrender.com/orders`,{
      //   address:orderId.
      // });

      // Buyurtmani yangilash
      // const updateResponse = await axios.patch(
      //   `https://dastavka.onrender.com/orders/${orderId}`,
      //   {
      //     deliveryId: driverId,  
      //     status: 'accepted'
      //   }
      // );

      // Haydovchiga tasdiq
      await ctx.telegram.sendMessage(
        driverId,
        `✅ Siz buyurtmani qabul qildingiz! Buyurtma raqami: ${orderId}`
      );

      // Mijozga xabar
      await ctx.telegram.sendMessage(
        clientId,
        `🚗 Haydovchi ${ctx.callbackQuery.from.first_name} buyurtmangizni qabul qildi!\n Haydovchilar siz bilan tez orada bog\'lanadi.`
      );

      await ctx.answerCbQuery();
    }
  } catch (err) {
    console.error('Callback queryda xato:', err);
    await ctx.answerCbQuery('Xatolik yuz berdi, qayta urinib ko\'ring');
  }
});

// bot.on('message', async (msg) => {
//   console.log("TESTT",msg.webAppData);

//   if (msg.webAppData) {
//     try {
//       const data = msg.webAppData.data.json();
//       // const parse=data.json()
//       console.log("Web App'dan kelgan data:", data);

//       const response = await axios.get('https://dastavka.onrender.com/users?role=driver');
//       const drivers = response.data; // Axios response ma'lumoti data property ichida

//       if (!drivers || !Array.isArray(drivers)) {
//         throw new Error('Haydovchilar ma\'lumoti topilmadi yoki array emas');
//       }

//       // Buyurtma ma'lumotlarini chiroyli qilib formatlash
//       const orderDetails = data.items.map(item => 
//         `- ${item.name} x ${item.quantity}`
//       ).join('\n');

//       const messageText = `📦 Yangi buyurtma:\n${orderDetails}\n\n📍 Manzil: ${data.address}`;

//       // Har bir haydovchiga xabar yuborish
//       for (const driver of drivers) {
//         if (driver.telegramId) {
//           try {
//             await bot.telegram.sendMessage(driver.telegramId, messageText)
//           } catch (err) {
//             console.error(`Haydovchiga xabar yuborishda xato (ID: ${driver.telegramId}):`, err.message);
//           }
//         }
//       }
//       await msg.sendMessage('Buyurtmangiz qabul qilind:)!')

//     } catch (err) {
//       console.error('Xatolik yuz berdi:', err.message);
//       // Agar kerak bo'lsa, foydalanuvchiga xabar yuborish
//       // bot.sendMessage(msg.chat.id, 'Buyurtmani qayta ishlashda xatolik yuz berdi');
//     }
//   }
// });


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
