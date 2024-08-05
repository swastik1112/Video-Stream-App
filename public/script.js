// Initialize socket.io connection
const socket = io("/");

// Get DOM elements for chat and video
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true; // Mute own video to avoid feedback

// Initialize PeerJS with custom server settings
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;

// GetUserMedia for different browsers
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

// Access user's video and audio
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream); // Add own video stream to the page

    // Answer incoming calls
    peer.on("call", (call) => {
      call.answer(stream); // Answer the call with own stream
      const video = document.createElement("video");

      // Add the caller's stream to the page
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // Handle new user connection
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    // Handle chat message submission
    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        // Enter key pressed
        socket.emit("message", chatInputBox.value); // Send message to server
        chatInputBox.value = ""; // Clear input box
      }
    });

    // Receive chat messages from the server
    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li"); // Add message to chat window
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight; // Scroll to the bottom
    });
  });

// Handle peer call events
peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer call with local stream
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream); // Add remote stream to the page
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

// Emit 'join-room' event when peer connection is established
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// Connect to new user
const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams); // Call new user
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream); // Add new user's stream to the page
  });
};

// Add video stream to the page
const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl); // Add video element to video grid
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    // Adjust video sizes if there are multiple users
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

// Play/stop video
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false; // Stop video
    setPlayVideo(); // Update UI
  } else {
    setStopVideo(); // Update UI
    myVideoStream.getVideoTracks()[0].enabled = true; // Start video
  }
};

// Mute/unmute audio
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false; // Mute audio
    setUnmuteButton(); // Update UI
  } else {
    setMuteButton(); // Update UI
    myVideoStream.getAudioTracks()[0].enabled = true; // Unmute audio
  }
};

// Set play video button UI
const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

// Set stop video button UI
const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

// Set unmute button UI
const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

// Set mute button UI
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
