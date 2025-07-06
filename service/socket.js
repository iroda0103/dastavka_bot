const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend manzilingiz
        methods: ["GET", "POST"]
    }
});
// 🧠 Socket ma'lumotlarini saqlash
const drivers = new Map(); // socket.id => { cityId, userId }

// 🔌 Socket ulanish
io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('registerDriver', ({ cityId, userId }) => {
        console.log('Driver registered:', userId, 'in city:', cityId);
        drivers.set(socket.id, { cityId, userId });
    });

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id);
        drivers.delete(socket.id);
    });
});