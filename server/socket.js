const { Server } = require("socket.io");
let IO;

module.exports.initIO = (httpServer) => {
  IO = new Server(httpServer);

  IO.use((socket, next) => {
    if (socket.handshake.query) {
      let callerId = socket.handshake.query.callerId;
      socket.user = callerId;
      next();
    }
  });

  IO.on("connection", (socket) => {
    console.log(socket.user, "Connected");
    socket.join(socket.user);



    socket.on("offerMake", (data) => {
      let user_id = data.user_id;
      socket.to(user_id).emit("offer", {
        user: socket.user,
        rtcMessage: data.rtcMessage,
      });
    });


    socket.on("answerMake", (data) => {
      let user_id = data.user_id;
      socket.to(user_id).emit("answer", {
        user: socket.user,
        rtcMessage: data.rtcMessage,
      });
    });

    socket.on("candidateMake", (data) => {
      let user_id = data.user_id;
      socket.to(user_id).emit("candidate", {
        user: socket.user,
        rtcMessage: data.rtcMessage,
      });
    });


    socket.on("call", (data) => {
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;
      socket.to(user_id).emit("newCall", {
        user_id: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("answerCall", (data) => {
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;

      socket.to(user_id).emit("callAnswered", {
        user_id: socket.user,
        rtcMessage: rtcMessage,
      });
    });


    socket.on("dismissCall", (data) => {
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;

      socket.to(user_id).emit("callDismiss", {
        user_id: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("offerCall", (data) => {
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;
      // console.log("offerCall",data);
      socket.to(user_id).emit("callOffer", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });
    });


    socket.on("answertriggerCall", (data) => {
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;

      socket.to(user_id).emit("callAnswertrigger", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });
    });


    

    socket.on("ICEcandidateCall", (data) => {
      console.log("ICEcandidate data.calleeId", data);
      let user_id = data.user_id;
      let rtcMessage = data.rtcMessage;

      socket.to(user_id).emit("callICEcandidate", {
        user_id: socket.user,
        rtcMessage: rtcMessage,
      });
    });
  });
};

module.exports.getIO = () => {
  if (!IO) {
    throw Error("IO not initilized.");
  } else {
    return IO;
  }
};
