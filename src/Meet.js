import React, { Component } from "react";
import io from "socket.io-client";
import Video from "./components/Video";
import Videos from "./components/Videos";
import Chat from "./components/chat";
import Board from "./components/Board";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import { ToastContainer, toast, Slide } from "react-toastify";
import connectSound from "./sounds/connect.mp3";
import disconnectSound from "./sounds/disconnect.mp3";
import "react-toastify/dist/ReactToastify.min.css";
import screenfull from "screenfull";
import RecordRTC from "recordrtc/RecordRTC";
import ScreenShareIcon from "@material-ui/icons/ScreenShare";
import Fullscreen from "@material-ui/icons/Fullscreen";
import RadioButtonChecked from "@material-ui/icons/RadioButtonChecked";
import Note from "@material-ui/icons/Note";

class Meet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localStream: null, //used to hold local stream objects to avoid recreating the stream whenever new offer comes
      remoteStream: null, //used to hold remote stream objects to avoid recreating the stream whenever new offer comes
      remoteStreams: [], //holds all Video Streams (all remote streams), empty array
      peerConnections: {}, //holds all peer Connections
      selectedVideo: null,
      status: "Please wait...",
      pc_config: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },
      sdpConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
        },
      },
      messages: [],
      sendChannels: [],
      disconnected: false,
      askForUsername: true,
      username: "User_" + Math.random().toString(36).substring(2, 7),
      numberOfUsers: 1,
      IDtoUsers: new Map(),
      micstart: true,
      vidstart: true,
      sharingScreen: false,
      color: "#000000",
      size: "5",
      recordingVideo: false,
    };
    this.socket = null;
    this.recordVideo = null;
    //PRODUCTION
    //this.serviceIP = "https://webrtc-video-call-test.herokuapp.com/webrtcPeer";
    this.serviceIP = "/webrtcPeer";
  }
  getLocalStream = () => {
    // called when getUserMedia() successfully returns
    const success = (stream) => {
      window.localStream = stream; //this is a global variable available through the app, attacking stream to this local variable
      this.setState({
        localStream: stream, //updates the localstream
      });
      //this.connectToSocketServer();
    };
    // called when getUserMedia() fails
    const failure = (e) => {
      console.log("getUserMedia Error: ", e);
    };
    const constraints = {
      audio: true,
      video: true,
      options: {
        mirror: true,
      },
    };
    navigator.mediaDevices
      .getUserMedia(constraints) //capture audio and video
      .then(success)
      .catch(failure);
  };

  whoisOnline = () => {
    // let all peers know I am joining
    this.socket.emit("add-user", this.state.username);
    this.sendToPeer("onlinePeers", null, { local: this.socket.id });
  };

  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };

  createPeerConnection = (socketID, callback) => {
    try {
      let pc = new RTCPeerConnection(this.state.pc_config);

      // add pc to peerConnections object
      const peerConnections = { ...this.state.peerConnections, [socketID]: pc };
      this.setState({
        peerConnections,
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendToPeer("candidate", e.candidate, {
            local: this.socket.id,
            remote: socketID,
          });
        }
      };

      pc.oniceconnectionstatechange = (e) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)
        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }
      };

      pc.ontrack = (e) => {
        let _remoteStream = null;
        let remoteStreams = this.state.remoteStreams;
        let remoteVideo = {};

        // 1. check if stream already exists in remoteStreams
        const rVideos = this.state.remoteStreams.filter(
          (stream) => stream.id === socketID
        );

        // 2. if it does exist then add track
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream;
          _remoteStream.addTrack(e.track, _remoteStream);
          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream,
          };
          remoteStreams = this.state.remoteStreams.map((_remoteVideo) => {
            return (
              (_remoteVideo.id === remoteVideo.id && remoteVideo) ||
              _remoteVideo
            );
          });
        } else {
          // 3. if not, then create new stream and add track
          _remoteStream = new MediaStream();
          _remoteStream.addTrack(e.track, _remoteStream);

          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream,
          };
          remoteStreams = [...this.state.remoteStreams, remoteVideo];
        }

        this.setState((prevState) => {
          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
          const remoteStream =
            prevState.remoteStreams.length > 0
              ? {}
              : { remoteStream: _remoteStream };

          // get currently selected video
          let selectedVideo = prevState.remoteStreams.filter(
            (stream) => stream.id === prevState.selectedVideo.id
          );
          // if the video is still in the list, then do nothing, otherwise set to new video stream
          selectedVideo = selectedVideo.length
            ? {}
            : { selectedVideo: remoteVideo };

          return {
            // selectedVideo: remoteVideo,
            ...selectedVideo,
            // remoteStream: e.streams[0],
            ...remoteStream,
            remoteStreams, //: [...prevState.remoteStreams, remoteVideo]
          };
        });
      };

      pc.close = () => {
        // alert('GONE')
        console.log("pc closed");
      };

      if (this.state.localStream)
        // pc.addStream(this.state.localStream)

        this.state.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.state.localStream);
        });

      // return pc
      callback(pc);
    } catch (e) {
      console.log("Something went wrong! pc not created!!", e);
      // return;
      callback(null);
    }
  };
  componentDidMount = () => {
    this.getLocalStream();
  };
  connectToSocketServer = () => {
    console.log("CONNECT TO SOCKET SERVER");
    this.socket = io.connect(this.serviceIP, {
      path: "/webrtc",
      query: {
        room: window.location.pathname,
      },
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
    this.socket.on("joined-peers", (data) => {
      this.setState({
        status:
          data.peerCount > 1
            ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
            : "Waiting for other peers to connect",
        numberOfUsers: data.peerCount,
      });
    });

    this.socket.on("peer-disconnected", (data) => {
      // close peer-connection with this peer
      toast.info(`${data.username} has left the meeting`, {
        position: "bottom-left",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      const receivedMap = new Map(data.clientsideList);
      // this.setState({
      //   IDtoUsers: receivedMap,
      // });
      if (this.state.peerConnections[data.socketID]) {
        this.state.peerConnections[data.socketID].close();
        // get and stop remote audio and video tracks of the disconnected peer
        const rVideo = this.state.remoteStreams.filter(
          (stream) => stream.id === data.socketID
        );
        rVideo && this.stopTracks(rVideo[0].stream);

        // filter out the disconnected peer stream
        const remoteStreams = this.state.remoteStreams.filter(
          (stream) => stream.id !== data.socketID
        );

        this.setState((prevState) => {
          // check if disconnected peer is the selected video and if there still connected peers, then select the first
          const selectedVideo =
            prevState.selectedVideo.id === data.socketID && remoteStreams.length
              ? { selectedVideo: remoteStreams[0] }
              : null;

          return {
            // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
            remoteStreams,
            ...selectedVideo,
            status:
              data.peerCount > 1
                ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
                : "Waiting for other peers to connect",
            numberOfUsers: data.peerCount,
            IDtoUsers: receivedMap,
          };
        });
      }
    });
    this.socket.on("adduser", (IDtoUsersList, username) => {
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
      const peerCount = IDtoUsersList.length;
      const receivedMap = new Map(IDtoUsersList);
      this.setState({
        IDtoUsers: receivedMap,
        status:
          peerCount > 1
            ? `Total Connected Peers to room ${window.location.pathname}: ${peerCount}`
            : "Waiting for other peers to connect",
        numberOfUsers: peerCount,
      });
    });

    this.socket.on("online-peer", (socketID) => {
      // console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      this.createPeerConnection(socketID, (pc) => {
        // 2. Create Offer
        if (pc) {
          // Send Channel
          const handleSendChannelStatusChange = (event) => {
            console.log(
              "send channel status: " + this.state.sendChannels[0].readyState
            );
          };

          const sendChannel = pc.createDataChannel("sendChannel");
          sendChannel.onopen = handleSendChannelStatusChange;
          sendChannel.onclose = handleSendChannelStatusChange;

          this.setState((prevState) => {
            return {
              sendChannels: [...prevState.sendChannels, sendChannel],
            };
          });

          // Receive Channels
          const handleReceiveMessage = (event) => {
            const message = JSON.parse(event.data);
            // console.log(message)
            this.setState((prevState) => {
              return {
                messages: [...prevState.messages, message],
              };
            });
          };

          const handleReceiveChannelStatusChange = (event) => {
            if (this.receiveChannel) {
              console.log(
                "receive channel's status has changed to " +
                  this.receiveChannel.readyState
              );
            }
          };

          const receiveChannelCallback = (event) => {
            const receiveChannel = event.channel;
            receiveChannel.onmessage = handleReceiveMessage;
            receiveChannel.onopen = handleReceiveChannelStatusChange;
            receiveChannel.onclose = handleReceiveChannelStatusChange;
          };

          pc.ondatachannel = receiveChannelCallback;

          pc.createOffer(this.state.sdpConstraints).then((sdp) => {
            pc.setLocalDescription(sdp);

            this.sendToPeer("offer", sdp, {
              local: this.socket.id,
              remote: socketID,
            });
          });
        }
      });
    });

    this.socket.on("offer", (data) => {
      this.createPeerConnection(data.socketID, (pc) => {
        pc.addStream(this.state.localStream);

        // Send Channel
        const handleSendChannelStatusChange = (event) => {
          console.log(
            "send channel status: " + this.state.sendChannels[0].readyState
          );
        };

        const sendChannel = pc.createDataChannel("sendChannel");
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;

        this.setState((prevState) => {
          return {
            sendChannels: [...prevState.sendChannels, sendChannel],
          };
        });

        // Receive Channels
        const handleReceiveMessage = (event) => {
          const message = JSON.parse(event.data);
          // console.log(message)
          this.setState((prevState) => {
            return {
              messages: [...prevState.messages, message],
            };
          });
        };

        const handleReceiveChannelStatusChange = (event) => {
          if (this.receiveChannel) {
            console.log(
              "receive channel's status has changed to " +
                this.receiveChannel.readyState
            );
          }
        };

        const receiveChannelCallback = (event) => {
          const receiveChannel = event.channel;
          receiveChannel.onmessage = handleReceiveMessage;
          receiveChannel.onopen = handleReceiveChannelStatusChange;
          receiveChannel.onclose = handleReceiveChannelStatusChange;
        };

        pc.ondatachannel = receiveChannelCallback;

        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
          () => {
            // 2. Create Answer
            pc.createAnswer(this.state.sdpConstraints).then((sdp) => {
              pc.setLocalDescription(sdp);

              this.sendToPeer("answer", sdp, {
                local: this.socket.id,
                remote: data.socketID,
              });
            });
          }
        );
      });
    });

    this.socket.on("answer", (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID];
      // console.log(data.sdp)
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
        () => {}
      );
    });

    this.socket.on("candidate", (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID];

      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
  };
  // componentDidMount = () => {};
  switchVideo = (_video) => {
    // console.log(_video)
    this.setState({
      selectedVideo: _video,
    });
  };

  // ************************************* //
  // ************************************* //
  stopTracks = (stream) => {
    stream.getTracks().forEach((track) => track.stop());
  };

  callbackFunction = (data) => {
    this.setState({ disconnected: data });
  };
  changeMicBeforeJoin = () => {
    const temp = this.state.micstart;
    this.setState({ micstart: !temp });
  };
  changeCameraBeforeJoin = () => {
    const temp = this.state.vidstart;
    this.setState({ vidstart: !temp });
  };
  handleUsername = (e) => {
    this.setState({
      username: e.target.value,
    });
  };
  playConnectSound = () => {
    const audioEl = new Audio(connectSound);
    audioEl.play();
  };
  playDisconnectSound = () => {
    const audioEl = new Audio(disconnectSound);
    audioEl.play();
  };
  startconnection = (e) => {
    this.setState({ askForUsername: false });
    this.connectToSocketServer();
    this.playConnectSound();
  };
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

  shareScreen = () => {
    let peerConnectionList = this.state.peerConnections;
    const currentlocalstream = this.state.localStream;
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      const screenTrack = stream.getTracks()[0];
      for (const id in peerConnectionList) {
        peerConnectionList[id].getSenders().forEach(async (s) => {
          if (s.track && s.track.kind === "video") {
            await s.replaceTrack(screenTrack);
          }
        });
      }
      window.localStream = stream; //this is a global variable available through the app, attacking stream to this local variable
      this.setState({
        localStream: stream,
        sharingScreen: true,
      });
      screenTrack.onended = () => {
        console.log("STREAM ENDED");
        window.localStream = currentlocalstream; //this is a global variable available through the app, attacking stream to this local variable
        this.setState({
          localStream: currentlocalstream, //updates the localstream
          sharingScreen: false,
        });
        const newscreenTrack = currentlocalstream.getTracks()[1];
        for (const id in peerConnectionList) {
          peerConnectionList[id].getSenders().forEach(async (s) => {
            if (s.track && s.track.kind === "video") {
              await s.replaceTrack(newscreenTrack);
            }
          });
        }
      };
    });
  };

  startRecording = () => {
    this.recordVideo = RecordRTC(this.state.localStream, {
      type: "video",
      mimeType: "video/webm; codecs=vp9",
    });
    this.recordVideo.startRecording();
    this.setState({
      recordingVideo: true,
    });
  };

  stopRecording = () => {
    this.setState({
      recordingVideo: false,
    });
    this.recordVideo.stopRecording(() => {
      this.recordVideo.save();
    });
  };

  changeColor(params) {
    this.setState({
      color: params.target.value,
    });
  }

  changeSize(params) {
    this.setState({
      size: params.target.value,
    });
  }
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
          </div>
          <div className="close-canvas-container">
            <button onClick={() => this.closeCanvas()}>Close</button>
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
    const {
      status,
      messages,
      disconnected,
      localStream,
      peerConnections,
      remoteStreams,
    } = this.state;

    if (disconnected) {
      this.socket.close();
      // stop local audio & video tracks
      this.stopTracks(localStream);
      this.playDisconnectSound();
      // stop all remote audio & video tracks
      remoteStreams.forEach((rVideo) => this.stopTracks(rVideo.stream));

      // stop all remote peerconnections
      peerConnections &&
        Object.values(peerConnections).forEach((pc) => pc.close());

      return (
        <div className="cssanimation sequence fadeInBottom">
          <div
            className="border-radius"
            style={{
              background: "white",
              width: "30%",
              height: "auto",
              padding: "20px",
              minWidth: "500px",
              minHeight: "200px",
              textAlign: "center",
              margin: "auto",
              marginTop: "150px",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                marginTop: "15px",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              You have successfully disconnected.
              <br /> Room ID = {window.location.pathname}
              <br />
              <br />
              {/* PRODUCTION */}
              {/* <a
                href={
                  "https://webrtc-video-call-test.herokuapp.com" +
                  window.location.pathname
                }
              >
                Click here to join the meeting again.
              </a> */}
              <a href={"//localhost:8080" + window.location.pathname}>
                Click Here to join the meeting again.
              </a>
            </p>
          </div>
        </div>
      );
    }

    const statusText = (
      <div style={{ color: "yellow", padding: 5 }}>{status}</div>
    );
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
              <div
                style={{
                  margin: "10px",
                  marginBottom: "20px",
                }}
              >
                <Video
                  videoStyles={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    objectFit: "cover",
                    marginLeft: "-50%",
                  }}
                  videoType="localVideo"
                  frameStyle={{
                    position: "relative",
                    width: "100%",
                    height: 400,
                    borderRadius: 5,
                    backgroundColor: "black",
                  }}
                  showMuteControls={true}
                  videoStream={localStream}
                  parentCallback={this.callbackFunction}
                  changeMic={this.changeMicBeforeJoin}
                  changeCamera={this.changeCameraBeforeJoin}
                  startmic={true}
                  startvid={true}
                  showEndCall={false}
                  showControls={true}
                  autoPlay
                  muted
                ></Video>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={this.startconnection}
                style={{ margin: "5px" }}
              >
                Join meeting
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div
              className="navbar-meet"
              style={{
                backgroundColor: "black",
                justifyContent: "center",
                margin: 0,
              }}
            >
              <p style={{ color: "white" }}>Meeting</p>
            </div>
            <div
              className="navbar-meet"
              style={{
                margin: 0,
                backgroundColor: "#212121",
                //backgroundColor: "#424242",
                zIndex: 104,
              }}
            >
              <Button
                style={{
                  backgroundColor: "#424242",
                  color: "white",
                  marginBottom: 10,
                }}
                onClick={this.shareScreen}
                className="side-panel-button"
                disabled={this.state.sharingScreen}
                startIcon={<ScreenShareIcon />}
              >
                Share Screen
              </Button>
              <Button
                style={{
                  backgroundColor: "#424242",
                  color: "white",
                  marginBottom: 10,
                }}
                startIcon={<Note />}
                onClick={() => {
                  this.setState({
                    openCanvas: true,
                  });
                }}
                className="side-panel-button"
              >
                Open WhiteBoard
              </Button>
              <Button
                style={{
                  backgroundColor: "#424242",
                  color: "white",
                  marginBottom: 10,
                }}
                onClick={() => {
                  if (screenfull.isEnabled) {
                    screenfull.toggle();
                  } else {
                    // Ignore or do something else
                  }
                }}
                className="side-panel-button"
                startIcon={<Fullscreen />}
              >
                Full screen
              </Button>
              <Button
                className="side-panel-button"
                style={{
                  backgroundColor: "#424242",
                  color: "white",
                  marginBottom: 10,
                }}
                startIcon={<RadioButtonChecked />}
                onClick={() => {
                  if (this.state.recordingVideo === false) {
                    this.startRecording();
                  } else {
                    this.stopRecording();
                  }
                }}
              >
                {this.state.recordingVideo === false
                  ? "Start Recording"
                  : "Stop Recording"}
              </Button>
            </div>
            <div style={{ zIndex: 150, position: "relative" }}>
              {this.state.openCanvas && showCanvas()}
            </div>
            <div
              style={{
                margin: 5,
                position: "absolute",
                left: 17,
                backgroundColor: "#212121",
                width: 300,
                height: "100%",
              }}
            >
              <div
                style={{
                  margin: 10,
                  backgroundColor: "white",
                  padding: 10,
                  borderRadius: 5,
                }}
              >
                <Input value={window.location.href} disable="true"></Input>
                <Button
                  style={{
                    backgroundColor: "#3f51b5",
                    color: "whitesmoke",
                    marginLeft: "20px",
                    width: "120px",
                    fontSize: "10px",
                  }}
                  onClick={this.copyUrl}
                >
                  Copy invite link
                </Button>
              </div>
              <div
                style={{
                  margin: 10,
                  backgroundColor: "#cdc4ff4f",
                  padding: 10,
                  borderRadius: 5,
                }}
              >
                {statusText}
              </div>
              <div
                style={{
                  margin: 10,
                  backgroundColor: "#cdc4ff4f",
                  padding: 10,
                  borderRadius: 5,
                }}
              >
                {[...this.state.IDtoUsers.keys()].map((k) => (
                  <div>
                    {this.state.IDtoUsers.get(k) === this.state.username ? (
                      <List>{this.state.IDtoUsers.get(k)} (You)</List>
                    ) : (
                      <List>{this.state.IDtoUsers.get(k)}</List>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                zIndex: 101,
                right: 19,
              }}
            >
              <Video
                videoType="localVideo"
                videoStyles={{
                  width: 300,
                  height: 245,
                }}
                frameStyle={{
                  width: 300,
                  height: 255,
                  margin: 5,
                  borderRadius: 5,
                  backgroundColor: "black",
                }}
                showMuteControls={true}
                // ref={this.localVideoref}
                startmic={this.state.micstart}
                startvid={this.state.vidstart}
                videoStream={localStream}
                parentCallback={this.callbackFunction}
                changeMic={this.changeMicBeforeJoin}
                changeCamera={this.changeCameraBeforeJoin}
                showEndCall={true}
                autoPlay
                showControls={true}
                muted
              ></Video>
            </div>
            <Chat
              user={{
                //uid: this.socket && this.socket.id || ''
                uid: this.state.username,
              }}
              messages={messages}
              sendMessage={(message) => {
                this.setState((prevState) => {
                  return { messages: [...prevState.messages, message] };
                });
                this.state.sendChannels.forEach((sendChannel) => {
                  sendChannel.readyState === "open" &&
                    sendChannel.send(JSON.stringify(message));
                });
                this.sendToPeer("new-message", JSON.stringify(message), {
                  local: this.socket.id,
                });
              }}
            />
            <div>
              <div>
                <Videos
                  switchVideo={this.switchVideo}
                  remoteStreams={remoteStreams}
                ></Videos>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
export default Meet;
