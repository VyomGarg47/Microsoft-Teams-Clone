import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Chat from "./components/chat";
import io from "socket.io-client";
class Chatroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      username: "User_" + Math.random().toString(36).substring(2, 7),
    };
    this.socket = null;
    //PRODUCTION
    this.serviceIP = "https://teams-clone-engage2k21.herokuapp.com/webrtcPeer";
    //this.serviceIP = "/webrtcPeer";
  }
  sendToPeer = (messageType, payload, socketID) => {
    console.log("sendToPeer");
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };
  whoisOnline = () => {
    // let all peers know I am joining
    this.socket.emit("add-user", this.state.username);
  };
  join = () => {
    window.location.href = `/Video${window.location.pathname}`;
  };
  componentDidMount = () => {
    this.socket = io.connect(this.serviceIP, {
      path: "/webrtc",
      query: {
        room: "/Video" + window.location.pathname,
      },
    });
    this.socket.on("connection-success", (data) => {
      this.whoisOnline();
    });
    this.socket.on("add-new-message", (message) => {
      this.setState((prevState) => {
        return { messages: [...prevState.messages, JSON.parse(message)] };
      });
    });
    this.socket.on("connection-success", (data) => {
      this.whoisOnline();
      //console.log(data.success)
      const status =
        data.peerCount > 1
          ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
          : "Waiting for other peers to connect";
      const numberOfUsers = data.peerCount;

      this.setState({
        status: status,
        messages: data.messages,
        numberOfUsers: numberOfUsers,
      });
    });
  };
  render() {
    const { messages } = this.state;
    return (
      <div>
        <p>Hello</p>
        <Button
          variant="contained"
          color="primary"
          onClick={this.join}
          style={{ margin: "20px" }}
        >
          GO TO VIDEOROOM
        </Button>
        <Chat
          user={{
            uid: this.state.username,
          }}
          messages={messages}
          sendMessage={(message) => {
            this.sendToPeer("new-message", JSON.stringify(message), {
              local: this.socket.id,
            });
          }}
        />
      </div>
    );
  }
}

export default Chatroom;
