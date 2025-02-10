const path=require('path')
const express=require('express')
const http = require("http")
const socketio = require("socket.io");
const botName = "ChatCord Bot";
const cors = require('cors');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require("./utils/users");

const {
    formatMessage,
    addMessageToHistory,
    getRoomHistory
} = require("./utils/messages");


const app=express()
app.use(cors());
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
      origin: ["https://chatcord-ten.vercel.app", "http://localhost:3000"],  // In production, replace with your specific frontend URL
      methods: ["GET", "POST"],
      credentials: true
  },
  transports: ['websocket']
});


//Set static folder(public)
app.use(express.static(path.join(__dirname,'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:chatRoomName', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Run when client connects

io.on('connection',socket=>{
  socket.on('joinRoom', async ({username, room}) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Send chat history to the new user
    const history = await getRoomHistory(room);
    socket.emit('chatHistory', history);

    // Welcome message
    const welcomeMsg = formatMessage(botName, "Welcome to ChatCord!");
    socket.emit('message', welcomeMsg);
    await addMessageToHistory(room, welcomeMsg);

    // Broadcast user joined message
    const userJoinedMsg = formatMessage(botName, `${user.username} has joined the chat`);
    socket.broadcast.to(user.room).emit('message', userJoinedMsg);
    await addMessageToHistory(room, userJoinedMsg);

    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
    });
});

socket.on("chatMessage", async (msg) => {
  const user = getCurrentUser(socket.id);
  const formattedMessage = formatMessage(user.username, msg);
  io.to(user.room).emit("message", formattedMessage);
  await addMessageToHistory(user.room, formattedMessage);
});

    //runs when client disconnects
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id)
        if(user)
        {
            io.to(user.room).emit('message',formatMessage(botName, `${user.username} has left the chat`))
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
              });
        }

    })

})

const PORT = process.env.PORT || 8000

server.listen(PORT,()=>console.log(`Server running on ${PORT}`))