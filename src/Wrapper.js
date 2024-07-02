import { useEffect, useState, useRef } from "react";
import SocketIOClient from 'socket.io-client';


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
let pc;
let localStream;
let remoteVideo;
let localVideo;
const Wrapper = () => {
    const [callerId, setCallerId] = useState(Math.floor(1000 + Math.random() * 9000));
    const [calleeId, setcCalleeId] = useState("");
    const [req, setReq] = useState(false);
    const [stablished, setStablished] = useState(false);
    const [reqcaller, setReqCaller] = useState("");


    const [make_call, setMakeCall] = useState(false);

    const [offer, setOffer] = useState(null);
    const [answer, setAnswer] = useState(null);

    const [candidate, setCandidate] = useState(null);


    localVideo = useRef(null);
    remoteVideo = useRef(null);
    const [audiostate, setAudio] = useState(false);

    const socket = SocketIOClient('http://localhost:3500', {
        transports: ['websocket'],
        query: {
            callerId
        },
    });



    const handleAnswer = async (answer) => {
        if (!pc) {
            console.error("no peerconnection");
            return;
        }
        try {
            await pc.setRemoteDescription(answer);
        } catch (e) {
            console.log(e);
        }
    }


    const handleCandidate = async (candidate) => {
        try {
            if (!pc) {
                console.error("no peerconnection");
                return;
            }
            if (!candidate) {
                await pc.addIceCandidate(null);
            } else {
                await pc.addIceCandidate(candidate);
            }
        } catch (e) {
            console.log(e);
        }
    }



    const processOffer = async (offer) => {
        try {
            pc = new RTCPeerConnection(configuration);
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
                socket.emit("ICEcandidateCall", {
                    user_id: calleeId,
                    rtcMessage: message,
                });
            };
            pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            socket.emit("answertriggerCall", {
                user_id: calleeId,
                rtcMessage: { type: "answer", sdp: answer.sdp },
            });
            await pc.setLocalDescription(answer);
        } catch (e) {
            console.log(e);
        }
    }

    const handleOffer = async (offer) => {
        if (pc) {
            console.error("existing peerconnection");
            return;
        }

        await processOffer(offer);
    }


    const initiateLocalStream = async () => {
        console.log("Call Here");
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: { echoCancellation: true },
            });
            console.log("localStream", localVideo);
            localVideo.current.srcObject = localStream;
        } catch (err) {
            console.log(err);
        }
    }




    const makeCallOffer = async () => {
        pc = new RTCPeerConnection(configuration);
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

            socket.emit("ICEcandidateCall", {
                user_id: calleeId,
                rtcMessage: message,
            });

        };
        pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        const offer = await pc.createOffer();
        console.log("calleeIdcalleeId", calleeId)
        console.log("Obj", calleeId, {
            user_id: calleeId,
            rtcMessage: { type: "offer", sdp: offer.sdp },
        });
        socket.emit("offerCall", {
            user_id: calleeId,
            rtcMessage: { type: "offer", sdp: offer.sdp },
        });
        await pc.setLocalDescription(offer);
    }



    const processCall = async () => {
        await initiateLocalStream();
        socket.emit('call', {
            user_id: calleeId,
            rtcMessage: null,
        });
    }



    const processAccept = async () => {
        await initiateLocalStream();
        setReq(false);
        setStablished(true);
        setcCalleeId(reqcaller);



        socket.emit('answerCall', {
            user_id: reqcaller,
            rtcMessage: null,
        });
    }




    const processDismiss = (data) => {
        console.log("Dismissed", {
            user_id: calleeId,
            rtcMessage: null,
        });
        setReq(false);
        setStablished(false);
        
        if (pc) {
            pc.close();
            pc = null;
        }
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;

        socket.emit('dismissCall', {
            user_id: calleeId,
            rtcMessage: null,
        });
        setcCalleeId(null);
    }





    useEffect(() => {
        if (offer !== null) {
            handleOffer(offer);
        }

    }, [offer])


    useEffect(() => {
        if (answer !== null) {
            handleAnswer(answer);
        }

    }, [answer])


    useEffect(() => {
        if (candidate?.candidate) {
            if (candidate['candidate'])
                handleCandidate(candidate);
        }

    }, [candidate])


    useEffect(() => {
        if (make_call) {
            makeCallOffer();
        }

    }, [make_call])

    useEffect(() => {


        socket.on('newCall', data => {
            console.log(data);
            setReqCaller(data.user_id);
            setReq(true);
        });

        socket.on('callAnswered', async data => {
            setStablished(true);
            await initiateLocalStream();
            setMakeCall(true);
        });

        socket.on('callDismiss', data => {
            processDismiss(data);
        });

        socket.on('callICEcandidate', data => {
            setCandidate(data.rtcMessage);
        });

        socket.on('callOffer', data => {
            setOffer(data.rtcMessage);
        });

        socket.on('callAnswertrigger', data => {
            setAnswer(data.rtcMessage);
        });


    }, []);
    // console.log("calleeId", calleeId);
    return (
        <main className="form-signin w-50 m-auto">
            <form>
                <h1 className="h3 mb-3 fw-normal">Your ID {callerId}</h1>

                {
                    stablished && <><h1 className="h3 mb-3 fw-normal">Call between {callerId} and {calleeId}</h1></>
                }
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



                {
                    req && <div className="mx-auto mb-3">

                        <h3 className="h3 mb-3 fw-normal">Calling From {reqcaller}</h3>
                        <button onClick={e => {
                            processAccept();
                        }} type="button" className="btn btn-outline-success">Accept</button>
                        <button onClick={e => {
                            setReq(false);
                            setStablished(false);
                        }} type="button" className="btn btn-outline-danger ms-1">Reject</button>

                    </div>
                }
                {
                    !stablished && <>
                        <div className="form-floating mb-3">
                            <input onKeyUp={(e) => {
                                setcCalleeId(e.target.value);
                            }} type="text" className="form-control" id="floatingInput" placeholder="Enter ID" />
                            <label for="floatingInput">Enter ID</label>
                        </div>
                        <button onClick={async () => {
                            await processCall();
                        }} className="btn btn-primary" type="button">Call</button>
                    </>
                }


                {
                    stablished && <>

                        <button onClick={() => {
                            processDismiss();
                        }} className="btn btn-primary" type="button">End Call</button>
                    </>
                }
            </form>
        </main>
    );

}


export default Wrapper;