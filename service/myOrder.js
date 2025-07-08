const axios = require('axios');

const myOrder = async (ctx) => {
    try {
        console.log('Fetching user orders from API...');    
        
        // Foydalanuvchi ID sini olish (telegram chat ID yoki tizimdagi user ID)
        const userId = ctx.from.id; // yoki ctx.session.userId agar autentifikatsiya bo'lsa
        
        // API dan buyurtmalarni olish
        // const response = await axios.get(`http://localhost:3002/orders/my-orders/${userId}`);
        const response = await axios.get(`https://dastavka.onrender.com/orders/my-orders/${userId}`);
        const orders = response.data;

        if (!orders || orders.length === 0) {
            return await ctx.reply('📭 Sizda hozircha buyurtmalar mavjud emas.');
        }

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
            message += `${index + 1}. Buyurtma #${order.id || order.orderId}\n`;
            message += `${statusEmoji[order.status] || '📌'} Status: ${order.status}\n`;
            message += `🏪 Restoran: ${order.restaurant?.name || 'Noma\'lum'}\n`;
            message += `📅 Sana: ${new Date(order.createdAt || order.orderDate).toLocaleDateString()}\n`;
            message += `🍽 Taomlar:\n`;

            order.items?.forEach((item) => {
                message += `  • ${item.quantity} ta ${item.product?.name || item.name} — ${(item.price * item.quantity).toLocaleString()} so'm\n`;
            });

            message += `💰 Umumiy: ${order.totalPrice?.toLocaleString() || order.totalAmount?.toLocaleString()} so'm\n\n`;
            
            // Agar buyurtma yetkazilayotgan bo'lsa, haydovchi haqida ma'lumot
            if (order.status === 'delivering' && order.driver) {
                message += `🚗 Haydovchi: ${order.driver.name}\n`;
                message += `📞 Telefon: ${order.driver.phone}\n\n`;
            }
        });

        await ctx.reply(message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔄 Yangilash', callback_data: 'refresh_orders' },
                        { text: '❌ Bekor qilish', callback_data: 'cancel_order' }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error('API request error:', error);
        await ctx.reply('⚠️ Buyurtmalarni yuklashda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
    }
}

// Callback query uchun handler
const handleOrderCallbacks = async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    if (callbackData === 'refresh_orders') {
        await ctx.answerCbQuery('Buyurtmalar yangilanmoqda...');
        return myOrder(ctx);
    }
    else if (callbackData === 'cancel_order') {
        // Bu yerda bekor qilish logikasi
        await ctx.answerCbQuery('Bekor qilish funksiyasi ishga tushirildi');
    }
}

module.exports = { myOrder, handleOrderCallbacks };