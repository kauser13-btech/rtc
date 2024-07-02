import { useRef, useEffect, useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
const turnServerConfig = {
    urls: 'turn:54.169.238.198:3478', // Example TURN server URL
    username: 'nilove', // Your TURN server username
    credential: 'test123' // Your TURN server password
};

const configuration = {
    iceServers: [
        turnServerConfig
    ],
    iceCandidatePoolSize: 10,
};



let localStream;
let startButton;
let hangupButton;
let muteAudButton;
let remoteVideo;
let localVideo;






const CallFunction = ({ callerId, socket }) => {
    const [pc, setPc] = useState(new RTCPeerConnection(configuration));
    const startButton = useRef(null);
    const hangupButton = useRef(null);
    const muteAudButton = useRef(null);
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const [audiostate, setAudio] = useState(false);

    const makeCall = async () => {
        try {
            pc.onicecandidate = (e) => {
                const message = {
                    type: "candidate",
                    candidate: null,
                };
                if (e.candidate) {
                    message.candidate = e.candidate.candidate;
                    message.sdpMid = e.candidate.sdpMid;
                    message.sdpMLineIndex = e.candidate.sdpMLineIndex;
                }
                socket.emit("message", message);
            };
            pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            const offer = await pc.createOffer();
            socket.emit("message", { type: "offer", sdp: offer.sdp });
            await pc.setLocalDescription(offer);
        } catch (e) {
            console.log(e);
        }
    }


    const handleOffer = async (offer) => {
        if (pc) {
            console.error("existing peerconnection");
            return;
        }
        try {
            pc.onicecandidate = (e) => {
                const message = {
                    type: "candidate",
                    candidate: null,
                };
                if (e.candidate) {
                    message.candidate = e.candidate.candidate;
                    message.sdpMid = e.candidate.sdpMid;
                    message.sdpMLineIndex = e.candidate.sdpMLineIndex;
                }
                socket.emit("message", message);
            };
            pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            await pc.setRemoteDescription(offer);

            const answer = await pc.createAnswer();
            socket.emit("message", { type: "answer", sdp: answer.sdp });
            await pc.setLocalDescription(answer);
        } catch (e) {
            console.log(e);
        }
    }


    const hangup = async () => {
        if (pc) {
            pc.close();
            pc = null;
        }
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
        startButton.current.disabled = false;
        hangupButton.current.disabled = true;
        muteAudButton.current.disabled = true;
    }


    const startB = async () => {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: { echoCancellation: true },
            });
            localVideo.current.srcObject = localStream;
        } catch (err) {
            console.log(err);
        }

        startButton.current.disabled = true;
        hangupButton.current.disabled = false;
        muteAudButton.current.disabled = false;

        socket.emit("message", { type: "ready" });
    };

    const hangB = async () => {
        hangup();
        socket.emit("message", { type: "bye" });
    };

    function muteAudio() {
        if (audiostate) {
            localVideo.current.muted = true;
            setAudio(false);
        } else {
            localVideo.current.muted = false;
            setAudio(true);
        }
    }


    return (
        <>
            <div className="video bg-main">
                <video
                    ref={localVideo}
                    className="video-item"
                    autoPlay
                    playsInline
                    src=" "
                ></video>
                <video
                    ref={remoteVideo}
                    className="video-item"
                    autoPlay
                    playsInline
                    src=" "
                ></video>
            </div>

            <div className="btn">
                <button
                    className="btn-item btn-start"
                    ref={startButton}
                    onClick={startB}
                >
                    <FiVideo />
                </button>
                <button
                    className="btn-item btn-end"
                    ref={hangupButton}
                    onClick={hangB}
                >
                    <FiVideoOff />
                </button>
                <button
                    className="btn-item btn-start"
                    ref={muteAudButton}
                    onClick={muteAudio}
                >
                    {audiostate ? <FiMic /> : <FiMicOff />}
                </button>
            </div>
        </>
    );

}



export default CallFunction;