const express = require("express");
const http = require("http");
var io = require("socket.io")({
  path: "/webrtc",
});
const app = express();
const app2 = http.createServer(app);
const port = process.env.PORT || 8080;

const rooms = {};
const messages = {};
const IDtoUsers = {};

app.use(express.static(__dirname + "/build")); //once app is build, the react server which was originally at 3000 will now serve at 8080
app.get("/", (req, res, next) => {
  //default room, if room is not specified
  res.sendFile(__dirname + "/build/index.html");
});
app.get("/:room", (req, res, next) => {
  res.sendFile(__dirname + "/build/index.html");
});

app.post("/:room", (req, res, next) => {
  // res.sendFile(__dirname + '/build/index.html')
  console.log(req.body);
  res.status(200).json({ data: req.body });
});

//listens for any request to our port
const server = app2.listen(port, () =>
  console.log(`server running on port ${port}`)
);

io.listen(server);
io.on("connection", (socket) => {
  console.log("connected");
});
const peers = io.of("/webrtcPeer");
// keep a reference of all socket connections

peers.on("connection", (socket) => {
  const room = socket.handshake.query.room;

  rooms[room] =
    (rooms[room] && rooms[room].set(socket.id, socket)) ||
    new Map().set(socket.id, socket); //if room is already in map, do nothing else create a new room

  messages[room] = messages[room] || [];
  // connectedPeers.set(socket.id, socket)

  console.log(socket.id);
  socket.emit("connection-success", {
    success: socket.id,
    peerCount: rooms[room].size,
    messages: messages[room],
  });

  const broadcast = () => {
    const _connectedPeers = rooms[room];

    for (const [socketID, _socket] of _connectedPeers.entries()) {
      // if (socketID !== socket.id) {
      _socket.emit("joined-peers", {
        peerCount: rooms[room].size, //connectedPeers.size,
      });
      // }
    }
  };
  broadcast();

  // const disconnectedPeer = (socketID) => socket.broadcast.emit('peer-disconnected', {
  //   peerCount: connectedPeers.size,
  //   socketID: socketID
  // })
  const disconnectedPeer = (socketID, username) => {
    const _connectedPeers = rooms[room];
    const clientsideList = Array.from(IDtoUsers[room]);
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("peer-disconnected", {
        peerCount: rooms[room].size,
        socketID,
        clientsideList,
        username,
      });
    }
  };

  socket.on("new-message", (data) => {
    console.log("new-message", JSON.parse(data.payload));
    messages[room] = [...messages[room], JSON.parse(data.payload)];
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
    rooms[room].delete(socket.id);
    messages[room] = rooms[room].size === 0 ? null : messages[room];
    const username = IDtoUsers[room].get(socket.id);
    IDtoUsers[room].delete(socket.id);
    disconnectedPeer(socket.id, username);
  });
  socket.on("canvas-data", (data) => {
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("canvas-data", data);
    }
  });
  socket.on("add-user", (username) => {
    IDtoUsers[room] =
      (IDtoUsers[room] && IDtoUsers[room].set(socket.id, username)) ||
      new Map().set(socket.id, username);
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("adduser", Array.from(IDtoUsers[room]), username);
    }
  });

  socket.on("onlinePeers", (data) => {
    const _connectedPeers = rooms[room];
    for (const [socketID, _socket] of _connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID.local) {
        console.log("online-peer", data.socketID, socketID);
        socket.emit("online-peer", socketID);
      }
    }
  });

  socket.on("offer", (data) => {
    const _connectedPeers = rooms[room];
    for (const [socketID, socket] of _connectedPeers.entries()) {
      // don't send to self
      if (socketID === data.socketID.remote) {
        // console.log('Offer', socketID, data.socketID, data.payload.type)
        socket.emit("offer", {
          sdp: data.payload,
          socketID: data.socketID.local,
        });
      }
    }
  });

  socket.on("answer", (data) => {
    console.log(data);
    const _connectedPeers = rooms[room];
    for (const [socketID, socket] of _connectedPeers.entries()) {
      if (socketID === data.socketID.remote) {
        console.log("Answer", socketID, data.socketID, data.payload.type);
        socket.emit("answer", {
          sdp: data.payload,
          socketID: data.socketID.local,
        });
      }
    }
  });

  socket.on("candidate", (data) => {
    console.log(data);
    const _connectedPeers = rooms[room];
    // send candidate to the other peer(s) if any
    for (const [socketID, socket] of _connectedPeers.entries()) {
      if (socketID === data.socketID.remote) {
        socket.emit("candidate", {
          candidate: data.payload,
          socketID: data.socketID.local,
        });
      }
    }
  });
});
