import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import List from "@material-ui/core/List";
import Chat from "./components/chat";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import Picture1 from "./images/Picture1.png";
import Picture6 from "./images/Picture6.png";
class Chatroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      username: "User_" + Math.random().toString(36).substring(2, 7),
      numberOfUsers: 0,
      IDtoUsers: new Map(),
      askForUsername: true,
    };
    this.socket = null;
    //PRODUCTION
    //this.serviceIP = "https://teams-clone-engage2k21.herokuapp.com/webrtcPeer";
    this.serviceIP = "/webrtcPeer";
  }
  sendToPeer = (messageType, payload, socketID) => {
    console.log("sendToPeer");
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };
  whoisOnline = () => {
    this.socket.emit("add-user-chatroom", this.state.username);
  };

  connectToSocketServer = () => {
    this.socket = io.connect(this.serviceIP, {
      path: "/webrtc",
      query: {
        room: "/Video" + window.location.pathname,
      },
    });
    this.socket.on("add-new-message", (message) => {
      this.setState((prevState) => {
        return { messages: [...prevState.messages, JSON.parse(message)] };
      });
    });
    this.socket.on("connection-success", (data) => {
      this.whoisOnline();
      const numberOfUsers = data.peerCount;
      this.setState({
        messages: data.messages,
        numberOfUsers: numberOfUsers,
      });
    });
    this.socket.on("adduser-chatroom", (IDtoUsersRoom, username) => {
      if (username) {
        toast.info(`${username} joined`, {
          position: "bottom-left",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      }
      const peerCount = IDtoUsersRoom.length;
      const receivedMap = new Map(IDtoUsersRoom);
      this.setState({
        IDtoUsers: receivedMap,
        numberOfUsers: peerCount,
      });
    });
    this.socket.on("peer-disconnected-chatroom", (data) => {
      toast.info(`${data.username} has left the meeting`, {
        position: "bottom-left",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      const peerCount = data.clientsideListchatroom.length;
      const receivedMap = new Map(data.clientsideListchatroom);
      this.setState({
        IDtoUsers: receivedMap,
        numberOfUsers: peerCount,
      });
    });
  };

  startconnection = (e) => {
    this.setState({ askForUsername: false });
    this.connectToSocketServer();
  };

  handleUsername = (e) => {
    this.setState({
      username: e.target.value,
    });
  };
  render() {
    const { messages } = this.state;
    return (
      <div>
        <ToastContainer transition={Slide} />
        {this.state.askForUsername === true ? (
          <div className="cssanimation sequence fadeInBottom">
            <div
              className="border-radius"
              style={{
                maxWidth: 700,
                background: "white",
                width: "50%",
                height: "auto",
                padding: "10px",
                minWidth: "320px",
                textAlign: "center",
                margin: "auto",
                marginTop: "100px",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  marginTop: 10,
                  fontWeight: "bold",
                  fontSize: "20px",
                  marginBottom: 10,
                }}
              >
                What should we call you ?
              </p>
              <Input
                placeholder="Username"
                value={this.state.username}
                onChange={(e) => this.handleUsername(e)}
                inputProps={{ min: 0, style: { textAlign: "center" } }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={this.startconnection}
                style={{ margin: "5px" }}
              >
                Join meeting
              </Button>
              <img
                src={Picture6}
                alt="Picture6"
                style={{
                  margin: 10,
                  width: "90%",
                }}
              ></img>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                position: "absolute",
                height: "100%",
                width: "30%",
                left: 0,
              }}
            >
              {[...this.state.IDtoUsers.keys()].map((k) => (
                <div>
                  {this.state.IDtoUsers.get(k) === this.state.username ? (
                    <List>
                      <p style={{ color: "white", margin: 0 }}>
                        {this.state.IDtoUsers.get(k)} (You)
                      </p>
                    </List>
                  ) : (
                    <List>
                      <p style={{ color: "white", margin: 0 }}>
                        {this.state.IDtoUsers.get(k)}
                      </p>
                    </List>
                  )}
                </div>
              ))}
              <Input
                placeholder="Username"
                value={this.state.username}
                //onChange={(e) => this.handleUsername(e)}
                disable="true"
                inputProps={{
                  min: 0,
                  style: { textAlign: "center", width: "100%" },
                }}
              />
              <Link
                style={{
                  color: "white",
                  textDecoration: "none",
                  width: "100%",
                }}
                to={{
                  pathname: `/Video${window.location.pathname}`,
                  state: {
                    user: this.state.username,
                  },
                }}
                onClick={() => {
                  this.socket.close();
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  style={{ margin: "20px" }}
                >
                  Create a meeting
                </Button>
              </Link>
              <img
                src={Picture1}
                alt="Picture1"
                style={{
                  position: "absolute",
                  left: 10,
                  width: "90%",
                  bottom: 0,
                }}
              ></img>
            </div>
            <Chat
              chatstyle={{
                position: "absolute",
                height: "100%",
                width: "70%",
                right: 0,
              }}
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
        )}
      </div>
    );
  }
}

export default Chatroom;
