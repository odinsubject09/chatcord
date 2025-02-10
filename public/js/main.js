const socket=io()
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages')
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
  });
socket.emit('joinRoom',{username,room})

//get room and users
socket.on('roomUsers', ({ room, users }) => {
  console.log('Username:', username);
  console.log('Room:', room);
    outputRoomName(room);
    outputUsers(users);
  });

//msg from server
socket.on('message',msg=>{
    console.log(msg)
    outputMessage(msg)

    chatMessages.scrollTop = chatMessages.scrollHeight;
})

socket.on('chatHistory', (history) => {
  // Clear existing messages
  chatMessages.innerHTML = '';
  
  // Output each message from history
  history.forEach(message => {
      outputMessage(message);
  });
  
  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
});


chatForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    let msg = e.target.elements.msg.value;
    socket.emit('chatMessage',msg)
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
}
)

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username+' ';
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector('.chat-messages').appendChild(div);
  }

  // Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
  }
  
  // Add users to DOM
  function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach((user) => {
      const li = document.createElement('li');
      li.innerText = user.username;
      userList.appendChild(li);
    });
  }

  document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (leaveRoom) {
      window.location = '../index.html';
    } else {
    }
  });
  