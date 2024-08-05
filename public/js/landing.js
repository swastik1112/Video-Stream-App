const createButton = document.querySelector("#createroom");
const videoCont = document.querySelector(".video-self");
const codeCont = document.querySelector("#roomcode");
const joinBut = document.querySelector("#joinroom");
const mic = document.querySelector("#mic");
const cam = document.querySelector("#webcam");

let micAllowed = 1; // Flag to check if microphone is allowed
let camAllowed = 1; // Flag to check if camera is allowed

// Define media constraints for accessing video and audio
let mediaConstraints = { video: true, audio: true };

// Access the user's camera and microphone and set the stream to video element
navigator.mediaDevices.getUserMedia(mediaConstraints).then((localstream) => {
  videoCont.srcObject = localstream;
});

// Function to generate a unique room ID
function uuidv4() {
  return "xxyxyxxyx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Text to display when creating a room
const createroomtext = "Creating Room...";

// Event listener for the create room button
createButton.addEventListener("click", (e) => {
  e.preventDefault();
  createButton.disabled = true; // Disable button to prevent multiple clicks
  createButton.innerHTML = "Creating Room";
  createButton.classList = "createroom-clicked";

  // Animate the button text to indicate room creation in progress
  setInterval(() => {
    if (createButton.innerHTML < createroomtext) {
      createButton.innerHTML = createroomtext.substring(
        0,
        createButton.innerHTML.length + 1
      );
    } else {
      createButton.innerHTML = createroomtext.substring(
        0,
        createButton.innerHTML.length - 3
      );
    }
  }, 500);

  // Redirect to the new room
  location.href = `/room.html?room=${uuidv4()}`;
});

// Event listener for the join room button
joinBut.addEventListener("click", (e) => {
  e.preventDefault();
  if (codeCont.value.trim() == "") {
    // Check if the room code is empty
    codeCont.classList.add("roomcode-error"); // Indicate error
    return;
  }
  const code = codeCont.value;
  location.href = `/room.html?room=${code}`; // Redirect to the room
});

// Event listener for changes in the room code input
codeCont.addEventListener("change", (e) => {
  e.preventDefault();
  if (codeCont.value.trim() !== "") {
    codeCont.classList.remove("roomcode-error"); // Remove error indication if not empty
    return;
  }
});

// Event listener for the camera toggle button
cam.addEventListener("click", () => {
  if (camAllowed) {
    // Disable camera
    mediaConstraints = { video: false, audio: micAllowed ? true : false };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((localstream) => {
        videoCont.srcObject = localstream;
      });

    cam.classList = "nodevice"; // Update button style
    cam.innerHTML = `<i class="fas fa-video-slash"></i>`; // Update button icon
    camAllowed = 0; // Update flag
  } else {
    // Enable camera
    mediaConstraints = { video: true, audio: micAllowed ? true : false };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((localstream) => {
        videoCont.srcObject = localstream;
      });

    cam.classList = "device"; // Update button style
    cam.innerHTML = `<i class="fas fa-video"></i>`; // Update button icon
    camAllowed = 1; // Update flag
  }
});

// Event listener for the microphone toggle button
mic.addEventListener("click", () => {
  if (micAllowed) {
    // Disable microphone
    mediaConstraints = { video: camAllowed ? true : false, audio: false };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((localstream) => {
        videoCont.srcObject = localstream;
      });

    mic.classList = "nodevice"; // Update button style
    mic.innerHTML = `<i class="fas fa-microphone-slash"></i>`; // Update button icon
    micAllowed = 0; // Update flag
  } else {
    // Enable microphone
    mediaConstraints = { video: camAllowed ? true : false, audio: true };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((localstream) => {
        videoCont.srcObject = localstream;
      });

    mic.innerHTML = `<i class="fas fa-microphone"></i>`; // Update button icon
    mic.classList = "device"; // Update button style
    micAllowed = 1; // Update flag
  }
});
