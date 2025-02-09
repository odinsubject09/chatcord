const moment = require('moment');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatcord', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    }
});

const Message = mongoose.model('Message', messageSchema);

// In-memory cache for better performance
const messageHistory = new Map();

async function loadHistoryFromDB(room) {
    try {
        const messages = await Message.find({ room }).sort({ _id: -1 }).limit(100);
        messageHistory.set(room, messages.reverse());
        return messages;
    } catch (error) {
        console.error('Error loading history from DB:', error);
        return [];
    }
}

function formatMessage(username, text) {
    return {
        username,
        text,
        time: moment().format('h:mm a')
    };
}

async function addMessageToHistory(room, message) {
    try {
        // Save to database
        const dbMessage = new Message({
            room,
            ...message
        });
        await dbMessage.save();

        // Update in-memory cache
        if (!messageHistory.has(room)) {
            messageHistory.set(room, []);
        }
        messageHistory.get(room).push(message);

        // Limit in-memory cache size
        const maxHistorySize = 100;
        const roomHistory = messageHistory.get(room);
        if (roomHistory.length > maxHistorySize) {
            messageHistory.set(room, roomHistory.slice(roomHistory.length - maxHistorySize));
        }
    } catch (error) {
        console.error('Error saving message to DB:', error);
    }
}

async function getRoomHistory(room) {
    // Try to get from cache first
    if (messageHistory.has(room)) {
        return messageHistory.get(room);
    }

    // If not in cache, load from DB
    return await loadHistoryFromDB(room);
}

// Optional: Clean up old messages periodically
async function cleanupOldMessages() {
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    try {
        await Message.deleteMany({
            createdAt: { $lt: thirtyDaysAgo }
        });
    } catch (error) {
        console.error('Error cleaning up old messages:', error);
    }
}

// Run cleanup once a day
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);

module.exports = {
    formatMessage,
    addMessageToHistory,
    getRoomHistory
};