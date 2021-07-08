import React, { Component } from "react";
import IconButton from "@material-ui/core/IconButton";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import MicIcon from "@material-ui/icons/Mic";
import MicOffIcon from "@material-ui/icons/MicOff";
import CallEndIcon from "@material-ui/icons/CallEnd";
import Button from "@material-ui/core/Button";

class Video extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mic: this.props.startmic,
      camera: this.props.startvid,
      // currentStream: new MediaStream(),
      // videoTrack: false,
      videoVisible: true,
    };
  }

  componentDidMount() {
    if (this.props.videoStream) {
      this.video.srcObject = this.props.videoStream;
    }
  }

  componentWillReceiveProps(nextProps) {
    // console.log('1. nextProps', this.props.showMuteControls, nextProps.videoStream && nextProps.videoStream.getTracks())
    console.log("1", this.props.videoType, nextProps.videoStream);

    // This is done only once
    if (
      nextProps.videoStream &&
      nextProps.videoStream !== this.props.videoStream
    ) {
      // if (!this.props.videoStream) {
      console.log("2", this.props.videoType, nextProps.videoStream);
      this.video.srcObject = nextProps.videoStream;
    }

    // This is done only once when we receive a video track
    const videoTrack =
      nextProps.videoStream && nextProps.videoStream.getVideoTracks();
    if (
      this.props.videoType === "remoteVideo" &&
      videoTrack &&
      videoTrack.length
    ) {
      videoTrack[0].onmute = () => {
        // alert('muted')
        this.setState({
          videoVisible: false,
        });
        this.props.videoMuted(nextProps.videoStream);
      };

      videoTrack[0].onunmute = () => {
        this.setState({
          videoVisible: true,
        });
        this.props.videoMuted(nextProps.videoStream);
      };
    }

    const audioTrack =
      nextProps.videoStream && nextProps.videoStream.getAudioTracks();
    if (
      this.props.videoType === "remoteVideo" &&
      audioTrack &&
      audioTrack.length
    ) {
      audioTrack[0].onmute = () => {
        alert("muted");
      };
    }
  }

  mutemic = (e) => {
    const stream = this.video.srcObject
      .getTracks()
      .filter((track) => track.kind === "audio");
    this.setState((prevState) => {
      if (stream) stream[0].enabled = !prevState.mic;
      return { mic: !prevState.mic };
    });
    this.props.changeMic();
  };

  mutecamera = (e) => {
    const stream = this.video.srcObject
      .getTracks()
      .filter((track) => track.kind === "video");
    this.setState((prevState) => {
      if (stream) stream[0].enabled = !prevState.camera;
      return { camera: !prevState.camera };
    });
    this.props.changeCamera();
  };
  sendData = (e) => {
    this.props.parentCallback(true);
  };
  render() {
    const muteControls = this.props.showMuteControls && (
      <div
        style={{
          backgroundColor: "black",
          display: "flex",
          justifyContent: "space-evenly",
        }}
      >
        <IconButton
          disabled={this.props.sharingScreen}
          style={{ color: (this.state.mic && "white") || "#bf3459" }}
          onClick={this.mutemic}
        >
          {this.state.mic === true ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton
          style={{ color: (this.state.camera && "white") || "#bf3459" }}
          onClick={this.mutecamera}
        >
          {this.state.camera === true ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        {this.props.showEndCall === true ? (
          <Button
            style={{
              backgroundColor: "#bf3459",
              color: "white",
              height: 40,
              width: 120,
            }}
            onClick={this.sendData}
            startIcon={<CallEndIcon />}
          >
            <p style={{ fontWeight: "bold" }}>End call</p>
          </Button>
        ) : null}
      </div>
    );

    return (
      <div>
        <div style={{ ...this.props.frameStyle }}>
          <video
            controls={this.props.showControls}
            id={this.props.id}
            muted={this.props.muted}
            autoPlay
            style={{
              visibility: (this.state.videoVisible && "visible") || "hidden",
              ...this.props.videoStyles,
            }}
            ref={(ref) => {
              this.video = ref;
            }}
          ></video>
        </div>
        {muteControls}
      </div>
    );
  }
}

export default Video;
