const express = require("express");
const path = require("path");
const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3030; // Set the port to 3030 or use the one provided in the environment variables

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time communication
const io = socketio(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Data structures to manage rooms, sockets, and their states
let rooms = {}; // Maps room IDs to arrays of socket IDs
let socketroom = {}; // Maps socket IDs to room IDs
let socketname = {}; // Maps socket IDs to usernames
let micSocket = {}; // Maps socket IDs to their microphone status
let videoSocket = {}; // Maps socket IDs to their video status
let roomBoard = {}; // Maps room IDs to the current state of their shared whiteboard

// Handle new socket connections
io.on("connect", (socket) => {
  // Event: A user joins a room
  socket.on("join room", (roomid, username) => {
    socket.join(roomid); // Join the specified room
    socketroom[socket.id] = roomid; // Store the room ID for this socket
    socketname[socket.id] = username; // Store the username for this socket
    micSocket[socket.id] = "on"; // Default microphone status is 'on'
    videoSocket[socket.id] = "on"; // Default video status is 'on'

    if (rooms[roomid] && rooms[roomid].length > 0) {
      // If the room already exists
      rooms[roomid].push(socket.id); // Add the socket to the room
      socket.to(roomid).emit(
        "message",
        `${username} joined the room.`,
        "System",
        moment().format("h:mm a") // Notify others in the room
      );
      io.to(socket.id).emit(
        "join room",
        rooms[roomid].filter((pid) => pid != socket.id),
        socketname,
        micSocket,
        videoSocket
      ); // Send room details to the new user
    } else {
      // If the room does not exist
      rooms[roomid] = [socket.id]; // Create the room with this socket
      io.to(socket.id).emit("join room", null, null, null, null); // Send empty room details to the new user
    }

    io.to(roomid).emit("user count", rooms[roomid].length); // Update user count for the room
  });

  // Event: User performs an action (mute, unmute, video on/off)
  socket.on("action", (msg) => {
    if (msg == "mute") micSocket[socket.id] = "off"; // Mute microphone
    else if (msg == "unmute") micSocket[socket.id] = "on"; // Unmute microphone
    else if (msg == "videoon") videoSocket[socket.id] = "on"; // Turn on video
    else if (msg == "videooff") videoSocket[socket.id] = "off"; // Turn off video

    socket.to(socketroom[socket.id]).emit("action", msg, socket.id); // Notify others in the room
  });

  // Event: User sends a video offer (WebRTC signaling)
  socket.on("video-offer", (offer, sid) => {
    socket
      .to(sid)
      .emit(
        "video-offer",
        offer,
        socket.id,
        socketname[socket.id],
        micSocket[socket.id],
        videoSocket[socket.id]
      ); // Forward the offer to the specified socket
  });

  // Event: User sends a video answer (WebRTC signaling)
  socket.on("video-answer", (answer, sid) => {
    socket.to(sid).emit("video-answer", answer, socket.id);
  }); // Forward the answer to the specified socket

  // Event: User sends a new ICE candidate (WebRTC signaling)
  socket.on("new icecandidate", (candidate, sid) => {
    socket.to(sid).emit("new icecandidate", candidate, socket.id);
  }); // Forward the ICE candidate to the specified socket

  // Event: User sends a chat message
  socket.on("message", (msg, username, roomid) => {
    io.to(roomid).emit("message", msg, username, moment().format("h:mm a"));
  }); // Broadcast the message to the room

  // Event: User requests the current state of the canvas
  socket.on("getCanvas", () => {
    if (roomBoard[socketroom[socket.id]])
      // If there is a saved canvas state
      socket.emit("getCanvas", roomBoard[socketroom[socket.id]]); // Send the canvas state to the user
  });

  // Event: User draws on the canvas
  socket.on("draw", (newx, newy, prevx, prevy, color, size) => {
    socket
      .to(socketroom[socket.id])
      .emit("draw", newx, newy, prevx, prevy, color, size); // Broadcast the drawing to others in the room
  });

  // Event: User clears the canvas
  socket.on("clearBoard", () => {
    socket.to(socketroom[socket.id]).emit("clearBoard"); // Notify others in the room to clear the canvas
  });

  // Event: User saves the canvas state
  socket.on("store canvas", (url) => {
    roomBoard[socketroom[socket.id]] = url; // Store the canvas state for the room
  });

  // Event: User disconnects
  socket.on("disconnect", () => {
    if (!socketroom[socket.id]) return; // If the socket is not associated with a room, do nothing
    socket.to(socketroom[socket.id]).emit(
      "message",
      `${socketname[socket.id]} left the chat.`,
      `System`,
      moment().format("h:mm a") // Notify others in the room
    );
    socket.to(socketroom[socket.id]).emit("remove peer", socket.id); // Notify others to remove the peer
    var index = rooms[socketroom[socket.id]].indexOf(socket.id); // Find the socket in the room array
    rooms[socketroom[socket.id]].splice(index, 1); // Remove the socket from the room array
    io.to(socketroom[socket.id]).emit(
      "user count",
      rooms[socketroom[socket.id]].length
    ); // Update user count for the room
    delete socketroom[socket.id]; // Remove the socket from the room mapping
    console.log("--------------------");
    console.log(rooms[socketroom[socket.id]]);
  });
});

// Start the server and listen on the specified port
server.listen(PORT, () =>
  console.log(`Server is up and running on port ${PORT}`)
);
