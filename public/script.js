const socket = io("/");
const myPeer = new Peer();
const videoWrap = document.getElementById("video-wrap");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};
let myVideoStream;
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoWrap.append(video);
};

const connectToNewUser = (userId, stream) => {
  // 相手のユーザーに自分のビデオ情報を紐付け。
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  console.log(call);
  peers[userId] = call;
};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    console.log(stream);
    addVideoStream(myVideo, stream);

    // 送信された時の応答イベント。
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      const userId = call.peer;
      peers[userId] = call;
    });

    // 新しいユーザーが入ってきた時。
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  console.log("userId=", userId);
  if (peers[userId]) peers[userId].close();
});

// 初期化が完了すると、openイベントが発生。
myPeer.on("open", (userId) => {
  socket.emit("join-room", ROOM_ID, userId);
});

myPeer.on("disconnected", (userId) => {
  console.log("disconnected=", userId);
});

const muteUnmute = (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getAudioTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = (e) => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getVideoTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const leaveVideo = (e) => {
  socket.disconnect();
  myPeer.disconnect();
  const videos = document.getElementsByTagName("video");
  for (let i = videos.length - 1; i >= 0; --i) {
    videos[i].remove();
  }
};
