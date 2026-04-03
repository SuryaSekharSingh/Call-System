const socket = io();

let localStream;
let peerConnection;
let room;

const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

async function joinRoom() {
    room = document.getElementById("roomInput").value;

    socket.emit("join-room", room);

    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    localVideo.srcObject = localStream;
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                room,
                candidate: event.candidate
            });
        }
    };
}

socket.on("user-joined", async () => {
    console.log("Another user joined. Starting call...");
    await startCall();
});

async function startCall() {
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { room, offer });
}

socket.on("offer", async (offer) => {
    createPeerConnection();

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", { room, answer });
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", async (candidate) => {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (err) {
        console.error(err);
    }
});

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    remoteVideo.srcObject = null;

    socket.emit("end-call", room);
}

socket.on("end-call", () => {
    alert("Call ended by other user");

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    remoteVideo.srcObject = null;
});