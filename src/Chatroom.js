import React, { Component } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import screenfull from "screenfull";

import Chat from "./components/chat";
import Board from "./components/Board";
import Picture6 from "./images/Picture6.png";
import connectSound from "./sounds/connect.mp3";
import notificationSound from "./sounds/notification.mp3";

import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import List from "@material-ui/core/List";

import LinkIcon from "@material-ui/icons/Link";
import EmailIcon from "@material-ui/icons/Email";
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
      messages: [], //contains all messages
      activitypanel: false, //show activity panel or not, false by default
      activities: [], //contains all activities
      //use a random username, or the same username from the chatroom
      username:
        this.props.location && this.props.location.state
          ? this.props.location.state.user
          : "User_" + Math.random().toString(36).substring(2, 7),
      numberOfUsers: 0, //number of participants in the meeting
      openCanvas: false,
      IDtoUsers: new Map(),
      color: "#000000", //default color for the whiteboard
      size: "5", //default size for the whiteboard
      //whether to ask for username or not
      askForUsername:
        this.props.location && this.props.location.state
          ? this.props.location.state.askForUsername
          : true,
    };
    this.socket = null;
    //PRODUCTION
    this.serviceIP = "https://teams-clone-engage2k21.herokuapp.com/webrtcPeer"; //comment this code if testing on localhost
    //this.serviceIP = "/webrtcPeer"; //uncomment this code if testing on localhost
  }
  /**
   * Emit events to the server
   * @param {string} messageType The event to emit
   * @param {object} payload The data to send
   * @param {socket.id} socketID The socketID
   */
  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };
  /**
   * Called when the peer successully establish a connection
   * Emits "add-user-chatroom" event
   */
  whoisOnline = () => {
    this.socket.emit("add-user-chatroom", this.state.username);
  };
  /**
   * Connects to the socket server once the username is entered
   */
  connectToSocketServer = () => {
    const sound = new Audio(connectSound);
    sound.play();
    this.socket = io.connect(this.serviceIP, {
      path: "/webrtc",
      query: {
        room: "/Video" + window.location.pathname,
      },
    });
    /**
     * Listens for "add-new-message" event
     * Plays an audio sound and updates the current list of messages
     * @param {object} message Contains the newly delievered message
     */
    this.socket.on("add-new-message", (message) => {
      const notisound = new Audio(notificationSound);
      notisound.play();
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
    /**
     * Listens for "connection-success" event
     * @param {object} data all the messages
     */
    this.socket.on("connection-success", (data) => {
      this.whoisOnline();
      this.setState({
        messages: data.messages,
      });
    });
    /**
     * Listens for "adduser-chatroom" event
     * Sends a toast notification
     * Updates the current peerCount, Users map and activites
     * @param {array} IDtoUsersRoom Array containing list of all the users currently in the chatroom.
     * @param {string} username Username of the newly joined participant
     * @param {int} peerCount Count of participants in the meeting
     */
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
    /**
     * Listens for "adduser" event
     * Sends a toast notification if a meeting was started
     * updates the number of users in the meeting
     * @param {array} IDtoUsersRoom Array containing list of all the users currently in the meeting.
     * @param {string} username Username of the newly joined participant
     */
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
          numberOfUsers: peerCount,
        });
      } else {
        this.setState({
          numberOfUsers: peerCount,
        });
      }
    });
    /**
     * Updates number of participants in the meeting
     * @param {object} data contains the count of participants in the meeting
     */
    this.socket.on("peer-disconnected", (data) => {
      this.setState({
        numberOfUsers: data.peerCount,
      });
    });
    /**
     * Sends a notification
     * updates the IDtoUsers map
     * updates activities
     * @param {object} data contains the socketID of the user who disconnected the chatroom
     */
    this.socket.on("peer-disconnected-chatroom", (data) => {
      const username = this.state.IDtoUsers.get(data.socketID);
      toast.info(`${username} has left the room`, {
        position: "bottom-left",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      this.state.IDtoUsers.delete(data.socketID);
      this.setState({
        activities: this.state.activities.concat(
          `${username} has left the room`
        ),
        IDtoUsers: this.state.IDtoUsers,
      });
    });
  };
  /**
   * Called immediately once the component is mounted
   * calls the connectToSocketServer is username is already present
   */
  componentDidMount = () => {
    if (this.state.askForUsername === false) {
      this.connectToSocketServer();
    }
  };
  /**
   * Starts connection once the user enters the username.
   */
  startconnection = (e) => {
    this.setState({ askForUsername: false });
    this.connectToSocketServer();
  };
  /**
   * Updates the username
   */
  handleUsername = (e) => {
    this.setState({
      username: e.target.value,
    });
  };
  /**
   * To open any mail app with the room's invite link
   */
  sendEmail = () => {
    window.open(
      "mailto:email@example.com?subject=Meet%20Invite&body=" +
        window.location.href
    );
  };
  /**
   * To copy invite link
   * Sends notification when link is copied
   */
  copyUrl = () => {
    let text = window.location.href;
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
  /**
   * Change pen's color in canvas
   */
  changeColor(params) {
    this.setState({
      color: params.target.value,
    });
  }
  /**
   * Change pen's size in canvas
   */
  changeSize(params) {
    this.setState({
      size: params.target.value,
    });
  }
  /**
   * Updates the canvas state and closes the canvas
   */
  closeCanvas = () => {
    this.setState({
      openCanvas: false,
    });
  };

  render() {
    const showCanvas = () => {
      return (
        <div className="container-canvas">
          <div className="tools-section">
            <div className="color-picker-container">
              Select Brush Color : &nbsp;
              <input
                type="color"
                value={this.state.color}
                onChange={this.changeColor.bind(this)}
              />
            </div>

            <div className="brushsize-container">
              Select Brush Size : &nbsp;
              <select
                value={this.state.size}
                onChange={this.changeSize.bind(this)}
              >
                <option> 5 </option>
                <option> 10 </option>
                <option> 15 </option>
                <option> 20 </option>
                <option> 25 </option>
                <option> 30 </option>
              </select>
            </div>
            <div className="close-canvas-container">
              <Button
                style={{
                  backgroundColor: "#bf3459",
                  color: "white",

                  fontSize: 14,
                }}
                onClick={() => this.closeCanvas()}
              >
                Close whiteboard
              </Button>
            </div>
          </div>
          <div className="board-container">
            <Board
              color={this.state.color}
              size={this.state.size}
              socket={this.socket}
            ></Board>
          </div>
        </div>
      );
    };
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
                  paddingBottom: "30px",
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
            <div style={{ zIndex: 150, position: "relative" }}>
              {this.state.openCanvas && showCanvas()}
            </div>
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
                onClick={() => {
                  this.setState({
                    openCanvas: true,
                  });
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
                  className="scroll-panel"
                  style={{
                    margin: 10,
                    backgroundColor: "#545c84",
                    padding: 10,
                    borderRadius: 5,
                    textAlign: "center",
                    maxHeight: "calc(100% - 550px)",
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
                      {this.state.activities
                        .slice(0)
                        .reverse()
                        .map((data, i) => (
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
