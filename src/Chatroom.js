import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import List from "@material-ui/core/List";
import Chat from "./components/chat";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import Picture6 from "./images/Picture6.png";
import LinkIcon from "@material-ui/icons/Link";
import EmailIcon from "@material-ui/icons/Email";
import screenfull from "screenfull";
import Fullscreen from "@material-ui/icons/Fullscreen";
import VideocamIcon from "@material-ui/icons/Videocam";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import PeopleIcon from "@material-ui/icons/People";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Note from "@material-ui/icons/Note";

class Chatroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      activitypanel: false,
      activities: [],
      username: this.props.location.state
        ? this.props.location.state.user
        : "User_" + Math.random().toString(36).substring(2, 7),
      numberOfUsers: 0,
      IDtoUsers: new Map(),
      askForUsername: this.props.location.state
        ? this.props.location.state.askForUsername
        : true,
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
      console.log(JSON.parse(message));
      const parsedmessage = JSON.parse(message);
      this.setState((prevState) => {
        return {
          messages: [...prevState.messages, JSON.parse(message)],
          activities: this.state.activities.concat(
            `${parsedmessage.message.id} just sent a message`
          ),
        };
      });
    });
    this.socket.on("connection-success", (data) => {
      this.whoisOnline();
      this.setState({
        messages: data.messages,
      });
    });
    this.socket.on("adduser-chatroom", (IDtoUsersRoom, username, peerCount) => {
      if (username) {
        toast.info(`${username} joined the room`, {
          position: "bottom-left",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      }
      const receivedMap = new Map(IDtoUsersRoom);
      this.setState({
        activities: this.state.activities.concat(`${username} joined the room`),
        numberOfUsers: peerCount,
        IDtoUsers: receivedMap,
      });
    });
    this.socket.on("adduser", (IDtoUsersRoom, username) => {
      const peerCount = IDtoUsersRoom.length;
      if (peerCount === 1) {
        toast.info(`${username} just started a meeting`, {
          position: "bottom-left",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
        this.setState({
          activities: this.state.activities.concat(
            `${username} just started a meeting`
          ),
        });
      }
      this.setState({
        numberOfUsers: peerCount,
      });
    });
    this.socket.on("peer-disconnected", (data) => {
      this.setState({
        numberOfUsers: data.peerCount,
      });
    });
    this.socket.on("peer-disconnected-chatroom", (data) => {
      toast.info(`${data.username} has left the room`, {
        position: "bottom-left",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      const receivedMap = new Map(data.clientsideListchatroom);
      this.setState({
        activities: this.state.activities.concat(
          `${data.username} has left the room`
        ),
        IDtoUsers: receivedMap,
      });
    });
  };

  componentDidMount = () => {
    if (this.state.askForUsername === false) {
      this.connectToSocketServer();
    }
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

  sendEmail = () => {
    window.open(
      "mailto:email@example.com?subject=Meet%20Invite&body=" +
        window.location.href
    );
  };

  copyUrl = () => {
    let text = window.location.href;
    // this.setState({
    //   activities: this.state.activities.concat("Link Copied"),
    // });
    navigator.clipboard.writeText(text).then(
      function () {
        toast.success("Link copied to clipboard!", {
          position: "bottom-left",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      },
      () => {
        toast.error("Failed to copy!", {
          position: "bottom-left",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      }
    );
  };

  render() {
    const { messages } = this.state;
    return (
      <div>
        <ToastContainer transition={Slide} />
        {this.state.askForUsername === true ? (
          <div
            className="cssanimation sequence fadeInBottom"
            style={{ display: "flex", justifyContent: "center", padding: 50 }}
          >
            <div style={{ marginLeft: 50 }}>
              <div style={{ paddingTop: 0 }}>
                <h1
                  style={{
                    fontSize: "45px",
                    color: "white",
                    textAlign: "left",
                  }}
                >
                  Pick a Name. <br /> Create a room. <br /> Share the URL.
                </h1>
                <p
                  style={{
                    fontSize: "25px",
                    fontWeight: "200",
                    color: "white",
                    marginRight: "20px",
                    textAlign: "left",
                    maxWidth: 600,
                  }}
                >
                  Enter your username to join the room. Each room has its own
                  disposable URL. Just share your custom room URL, it's that
                  easy.
                </p>
              </div>
              <div
                className="border-radius"
                style={{
                  maxWidth: 700,
                  background: "white",
                  width: "80%",
                  height: "auto",
                  padding: "10px",
                  minWidth: "320px",
                  textAlign: "center",

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
                  Join room
                </Button>
              </div>
            </div>
            <img
              src={Picture6}
              alt="Picture6"
              style={{
                margin: 50,
                width: "40%",
              }}
            ></img>
          </div>
        ) : (
          <div>
            <div className="sidebar">
              <Button
                style={{
                  color: !this.state.activitypanel ? "#9ea2ff" : "#787878",
                  width: 50,
                  margin: 4,
                  marginBottom: 15,
                }}
                onClick={() => {
                  this.setState({
                    activitypanel: false,
                  });
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <PeopleIcon style={{ fontSize: "50px" }} />
                  <p
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      color: !this.state.activitypanel ? "#9ea2ff" : "#adad9e",
                    }}
                  >
                    People
                  </p>
                </div>
              </Button>
              <Button
                style={{
                  color: this.state.activitypanel ? "#9ea2ff" : "#787878",
                  width: 50,
                  margin: 4,
                  marginBottom: 15,
                }}
                onClick={() => {
                  this.setState({
                    activitypanel: true,
                  });
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <NotificationsIcon
                    style={{ fontSize: "50px", marginLeft: 4 }}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      color: this.state.activitypanel ? "#9ea2ff" : "#adad9e",
                    }}
                  >
                    Activity
                  </p>
                </div>
              </Button>
              <Button
                style={{
                  color: "#787878",
                  width: 50,
                  margin: 4,
                  marginBottom: 15,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Note style={{ fontSize: "50px", marginLeft: 4 }} />
                  <p
                    style={{
                      fontSize: "8px",
                      margin: 0,
                      color: "#adad9e",
                    }}
                  >
                    Whiteboard
                  </p>
                </div>
              </Button>
            </div>
            <div
              style={{
                position: "absolute",
                height: "100%",
                width: "40%",
                left: 0,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  margin: 30,
                  marginLeft: "calc(10% + 70px)",
                  marginRight: "10%",
                }}
              >
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
                    style={{
                      width: "100%",
                      height: "70px",
                      borderRadius: 10,
                    }}
                    startIcon={
                      <VideocamIcon
                        style={{ color: "white", fontSize: "30px" }}
                      />
                    }
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "20px",
                        color: "white",
                      }}
                    >
                      {this.state.numberOfUsers === 0
                        ? "Create a meeting"
                        : "Join the meeting"}
                    </p>
                  </Button>
                </Link>
              </div>
              <div
                style={{
                  backgroundColor: "black",
                  borderRadius: 10,
                  padding: 10,
                  height: "100%",
                  margin: 30,
                  marginLeft: "calc(10% + 70px)",
                  marginRight: "10%",
                }}
              >
                <div
                  style={{
                    margin: 10,
                    backgroundColor: "#545c84",
                    padding: 20,
                    borderRadius: 5,
                  }}
                >
                  <Input
                    value={window.location.href}
                    disable="true"
                    style={{
                      width: "100%",
                      backgroundColor: "#545c84",
                      color: "white",
                      borderRadius: 5,
                      padding: 5,
                      marginBottom: 5,
                      fontSize: 18,
                    }}
                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                  ></Input>
                  <Button
                    style={{
                      backgroundColor: "#33334b",
                      color: "white",
                      marginTop: 5,
                      marginBottom: 5,
                      width: "100%",
                      height: 50,
                      fontSize: 16,
                    }}
                    startIcon={
                      <LinkIcon
                        style={{ color: "#9ea2ff", fontSize: "30px" }}
                      />
                    }
                    onClick={this.copyUrl}
                  >
                    Copy invite link
                  </Button>
                  <Button
                    style={{
                      backgroundColor: "#33334b",
                      color: "white",
                      marginTop: 5,
                      marginBottom: 5,
                      width: "100%",
                      height: 50,
                      fontSize: 16,
                    }}
                    startIcon={
                      <EmailIcon
                        style={{ color: "#9ea2ff", fontSize: "25px" }}
                      />
                    }
                    onClick={this.sendEmail}
                  >
                    Invite via Email
                  </Button>
                </div>
                <div style={{ margin: 10 }}>
                  <Link
                    style={{
                      color: "white",
                      textDecoration: "none",
                      width: "100%",
                    }}
                    to={{
                      pathname: "/",
                    }}
                    onClick={() => {
                      this.socket.close();
                    }}
                  >
                    <Button
                      style={{
                        backgroundColor: "#bf3459",
                        color: "white",
                        width: "100%",
                        marginTop: 5,
                        marginBottom: 10,
                        height: 50,
                        fontSize: 16,
                      }}
                      startIcon={<ExitToAppIcon style={{ fontSize: "25px" }} />}
                    >
                      LEAVE ROOM
                    </Button>
                  </Link>
                  <Button
                    style={{
                      backgroundColor: "#424242",
                      color: "white",
                      width: "100%",
                      marginTop: 5,
                      marginBottom: 5,
                      height: 50,
                      fontSize: 16,
                    }}
                    onClick={() => {
                      if (screenfull.isEnabled) {
                        screenfull.toggle();
                      } else {
                        // Ignore or do something else
                      }
                    }}
                    className="side-panel-button"
                    startIcon={
                      <Fullscreen
                        style={{ color: "#9ea2ff", fontSize: "25px" }}
                      />
                    }
                  >
                    Full screen
                  </Button>
                </div>
                <div
                  style={{
                    margin: 10,
                    backgroundColor: "#545c84",
                    padding: 10,
                    borderRadius: 5,
                    textAlign: "center",
                  }}
                >
                  {this.state.activitypanel === false ? (
                    <div>
                      {[...this.state.IDtoUsers.keys()].map((k) => (
                        <div>
                          {this.state.IDtoUsers.get(k) ===
                          this.state.username ? (
                            <List>
                              <p
                                style={{
                                  color: "white",
                                  margin: 0,
                                  fontSize: 18,
                                }}
                              >
                                {this.state.IDtoUsers.get(k)} (You)
                              </p>
                            </List>
                          ) : (
                            <List>
                              <p
                                style={{
                                  color: "white",
                                  margin: 0,
                                  fontSize: 18,
                                }}
                              >
                                {this.state.IDtoUsers.get(k)}
                              </p>
                            </List>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {this.state.activities.map((data, i) => (
                        <div key={i}>
                          <List>
                            <p
                              style={{
                                color: "white",
                                margin: 0,
                                fontSize: 18,
                              }}
                            >
                              {data}
                            </p>
                          </List>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Chat
              chatstyle={{
                position: "absolute",
                height: "100%",
                width: "60%",
                right: 0,
                textAlign: "center",
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
