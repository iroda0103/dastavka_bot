const myOrder = async (ctx) => {
    console.log('Fetching user orders...');
    
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
}

module.exports = myOrder;