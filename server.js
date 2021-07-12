"use strict";
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
var io = require("socket.io")({
  path: "/webrtc",
});

const app = express();
const app2 = http.createServer(app);
const port = process.env.PORT || 8080;

const rooms = {}; //contains all peers in a particular room
const messages = {}; //contains all messages of a room
const IDtoUsers = {}; //maps socket.id to username for all participants in a meeting of a particular room
const IDtoUsersRoom = {}; //maps socket.id to username for all participants in chatroom of a particular room
const IDtoUsersHandRaise = {}; //maps socket.id to username for all participants with hand raised
app.use(compression()); //Compress all HTTP responses, Gzip
app.use(express.static(__dirname + "/build")); //once app is build, the react server which was originally at 3000 will now serve at 8080
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
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

peers.on("connection", (socket) => {
  const room = socket.handshake.query.room;
  rooms[room] =
    (rooms[room] && rooms[room].set(socket.id, socket)) ||
    new Map().set(socket.id, socket); //if a map exits for this room, then set the key, else create a new map and then set the key
  messages[room] = messages[room] || [];

  /**
   * emits connection-success with all the current messages of that room to the peer who just joined.
   */
  socket.emit("connection-success", {
    messages: messages[room],
  });
  /**
   * Called when a peer disconnects from the meeting,
   * Emits the disconnected peer to all the peers in that room
   * @param {socket.id} socketID  ID to the disconnected socket
   */
  const disconnectedPeer = (socketID) => {
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("peer-disconnected", {
        peerCount: IDtoUsers[room].size,
        socketID,
      });
    }
  };
  /**
   * Called when a peer disconnects from the chatroom
   * Emits the disconnected peer to all the peers in that room
   * @param {socket.id} socketID
   */
  const disconnectedPeerRoom = (socketID) => {
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("peer-disconnected-chatroom", {
        socketID,
      });
    }
  };
  /**
   * Called whenever a peers enters a new message,
   * Sends the new message to all the peers in the room
   */
  socket.on("new-message", (data) => {
    messages[room] = [...messages[room], JSON.parse(data.payload)];
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("add-new-message", data.payload);
    }
  });

  /**
   * Called when a peer disconnects
   * Checks whether the peer was disconnected from the meeting or from the chatroom
   * And finally calls their respective function.
   */
  socket.on("disconnect", () => {
    rooms[room].delete(socket.id);
    if (IDtoUsersHandRaise[room] && IDtoUsersHandRaise[room].has(socket.id)) {
      IDtoUsersHandRaise[room].delete(socket.id);
    }
    if (IDtoUsers[room] && IDtoUsers[room].has(socket.id)) {
      IDtoUsers[room].delete(socket.id);
      disconnectedPeer(socket.id);
    }
    if (IDtoUsersRoom[room] && IDtoUsersRoom[room].has(socket.id)) {
      IDtoUsersRoom[room].delete(socket.id);
      disconnectedPeerRoom(socket.id);
    }
  });
  /**
   * Called whenever a peer sends the data from the whiteboard.
   * Sends that data to all the peers in the room.
   */
  socket.on("canvas-data", (data) => {
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("canvas-data", data);
    }
  });
  /**
   * gets called whenever an new user joins a meeting
   * maps the username to the peer's socket.id in IDtoUsers of that room
   * emits the username, the new map (converted into an array), and the current Hand raise list (also converted to an array) to every peer.
   */
  socket.on("add-user", (username) => {
    IDtoUsers[room] =
      (IDtoUsers[room] && IDtoUsers[room].set(socket.id, username)) ||
      new Map().set(socket.id, username); //if a map exits for this room, then set the key, else create a new map and then set the key
    const _connectedPeers = rooms[room];
    let HandRaiseList = [];
    if (IDtoUsersHandRaise[room]) {
      HandRaiseList = Array.from(IDtoUsersHandRaise[room]);
    }
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit(
        "adduser",
        Array.from(IDtoUsers[room]),
        username,
        HandRaiseList
      );
    }
  });
  /**
   * gets called when a user in a meeting raises his or her hand
   * Maps the username to peer's socket.id in the IDtoUsersHandRaise map
   * Emits the map(converted into an array) to all the peers.
   */
  socket.on("hand-raise", (username) => {
    IDtoUsersHandRaise[room] =
      (IDtoUsersHandRaise[room] &&
        IDtoUsersHandRaise[room].set(socket.id, username)) ||
      new Map().set(socket.id, username); //if a map exits for this room, then set the key, else create a new map and then set the key
    const _connectedPeers = rooms[room];
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("handraise", Array.from(IDtoUsersHandRaise[room]));
    }
  });
  /**
   * gets called when a user in a meeting lower his or her hand
   * Delets the key with peer's socket.id in the IDtoUsersHandRaise map
   * Emits the new map(converted into an array) to all the peers.
   */
  socket.on("hand-lower", () => {
    if (IDtoUsersHandRaise[room] && IDtoUsersHandRaise[room].has(socket.id)) {
      IDtoUsersHandRaise[room].delete(socket.id);
      const _connectedPeers = rooms[room];
      for (const [_socketID, _socket] of _connectedPeers.entries()) {
        _socket.emit("handraise", Array.from(IDtoUsersHandRaise[room]));
      }
    }
  });
  /**
   * gets called whenever an new user joins a chatroom
   * maps the username to the peer's socket.id in IDtoUsersRoom of that room
   * emits the username, the new map (converted into an array), and the count of participants in the meeting to every peer in that room.
   */
  socket.on("add-user-chatroom", (username) => {
    IDtoUsersRoom[room] =
      (IDtoUsersRoom[room] && IDtoUsersRoom[room].set(socket.id, username)) ||
      new Map().set(socket.id, username);
    const _connectedPeers = rooms[room];
    const peerCount = IDtoUsers[room] ? IDtoUsers[room].size : 0;
    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit(
        "adduser-chatroom",
        Array.from(IDtoUsersRoom[room]),
        username,
        peerCount
      );
    }
  });
  /**
   * gets called whenever a peer emits "onlinePeer" event.
   * Sends the socket id of every peer in that room to this peer
   */
  socket.on("onlinePeers", (data) => {
    const _connectedPeers = rooms[room];
    for (const [socketID, _socket] of _connectedPeers.entries()) {
      if (socketID !== data.socketID.local) {
        socket.emit("online-peer", socketID);
      }
    }
  });
  /**
   * gets called whenever a peer emits "offer" event.
   * Emits the sdp and socket.id of this peer to the peer for which the offer was meant
   */
  socket.on("offer", (data) => {
    const socket = rooms[room].get(data.socketID.remote);
    socket.emit("offer", {
      sdp: data.payload,
      socketID: data.socketID.local,
    });
  });
  /**
   * gets called whenever a peer emits "answer" event.
   * Emits the sdp and socket.id of this peer to the peer for which the answer was meant
   */
  socket.on("answer", (data) => {
    const socket = rooms[room].get(data.socketID.remote);
    socket.emit("answer", {
      sdp: data.payload,
      socketID: data.socketID.local,
    });
  });
  /**
   * gets called whenever a peer emits "candidate" event.
   * Emits the candidate and socket.id of this peer to the peer for which this was meant
   */
  socket.on("candidate", (data) => {
    const socket = rooms[room].get(data.socketID.remote);
    socket.emit("candidate", {
      candidate: data.payload,
      socketID: data.socketID.local,
    });
  });
});
