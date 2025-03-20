const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const emailToSocketMap = new Map();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('register-email', (email) => {
    if (emailToSocketMap.has(email)) {
      socket.emit('registration-failed', { message: 'Email is already registered on another device.' });
      console.log(`Registration failed for ${email}: Email already registered.`);
    } else {
      emailToSocketMap.set(email, socket.id);
      socket.emit('registration-success', { message: 'Email registered successfully.' });
      console.log(`Registered email: ${email} with socket ID: ${socket.id}`);
    }
  });

  socket.on('initiate-call', ({ toEmail, offer }) => {
    const targetSocketId = emailToSocketMap.get(toEmail);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', { from: socket.id, offer });
    } else {
      socket.emit('user-not-found', { email: toEmail });
    }
  });
  socket.on('asl-prediction', ({ toSocketId, prediction }) => {
    console.log('Received asl-prediction:', { toSocketId, prediction });
  
    if (!toSocketId) {
      console.error("Error: toSocketId is undefined!");
      return;
    }
  
    io.to(toSocketId).emit('asl-prediction', { prediction });
    console.log(`Forwarded ASL prediction to ${toSocketId}`);
  });
  
  socket.on('accept-call', ({ to, answer }) => {
    console.log(`Call accepted by ${socket.id}, sending to ${to}`);
    socket.to(to).emit('call-accepted', answer);
  });

  socket.on('candidate', ({ to, candidate }) => {
    if (to) {
      console.log(`ICE candidate from ${socket.id} to ${to}`);
      socket.to(to).emit('candidate', candidate);
    }
  });

  socket.on('end-call', ({ to }) => {
    console.log(`Call ended by ${socket.id}`);
    socket.to(to).emit('call-ended');
  });

  socket.on('disconnect', () => {
    for (const [email, id] of emailToSocketMap.entries()) {
      if (id === socket.id) {
        emailToSocketMap.delete(email);
        console.log(`User with email ${email} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
