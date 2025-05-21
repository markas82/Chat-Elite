const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {}; // socket.id -> username

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When user joins, set their username
  socket.on('join', (username) => {
    users[socket.id] = username;
    io.emit('userlist', Object.values(users));
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userlist', Object.values(users));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});