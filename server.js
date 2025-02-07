const path=require('path')
const express=require('express')
const http = require("http")
const socketio = require("socket.io");
const formatMessage = require("./utils/messages")
const botName = "ChatCord Bot";
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require("./utils/users");
  


const app=express()
const server = http.createServer(app);
const io = socketio(server);


//Set static folder(public)
app.use(express.static(path.join(__dirname,'public')))

//Run when client connects

io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user=userJoin(socket.id,username,room)
        socket.join(user.room)

        socket.emit('message',formatMessage(botName, "Welcome to ChatCord!"))

    //broadcast when a user enters
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

    })

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
    
        io.to(user.room).emit("message", formatMessage(user.username, msg));
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

const PORT = process.env.PORT || 3000

server.listen(PORT,()=>console.log(`Server running on ${PORT}`))