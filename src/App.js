import React, {Component} from 'react';
import io from 'socket.io-client'
import Video from './components/Video'; 
import Videos from './components/Videos'
import Chat from './components/chat'
import Draggable from './components/draggable'
import {Input,Button} from '@material-ui/core'
import {message} from 'antd'
import 'antd/dist/antd.css'

class App extends Component{
  constructor(props){
    super(props)
    this.state={
      localStream:null,//used to hold local stream objects to avoid recreating the stream whenever new offer comes
      remoteStream:null,//used to hold remote stream objects to avoid recreating the stream whenever new offer comes

      remoteStreams: [], //holds all Video Streams (all remote streams), empty array
      peerConnections: {}, //holds all peer Connections
      selectedVideo: null,
      status: 'Please wait...',
      pc_config: {
        "iceServers": [
          {
            urls : 'stun:stun.l.google.com:19302'
          }
        ]
      },
      sdpConstraints:{
        'mandatory':{
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }
      },
      messages: [],
      sendChannels: [],
      disconnected: false,
      askForUsername: true,
      username: ''
    }
    //DONT FORGET TO CHANGE TO YOUR URL
    this.serviceIP = '/webrtcPeer'

    this.socket = null

  }
  getLocalStream = () => {
    // called when getUserMedia() successfully returns
    const success = (stream) => {
      window.localStream = stream //this is a global variable available through the app, attacking stream to this local variable
      this.setState({
        localStream: stream //updates the localstream 
      })

      this.whoisOnline()
    }
    // called when getUserMedia() fails
    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }
    const constraints = {
      audio: true,
      video: true,
      options: {
        mirror: true,
      }
    }

    navigator.mediaDevices.getUserMedia(constraints)//capture audio and video
      .then(success)
      .catch(failure)
  }

  whoisOnline = () => {
    // let all peers know I am joining
    this.sendToPeer('onlinePeers', null, {local: this.socket.id})
  }

  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {//message send to server
      socketID,
      payload
    })
  }

  createPeerConnection = (socketID, callback) => {

    try {
      let pc = new RTCPeerConnection(this.state.pc_config)

      // add pc to peerConnections object
      const peerConnections = { ...this.state.peerConnections, [socketID]: pc }
      this.setState({
        peerConnections
      })

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendToPeer('candidate', e.candidate, {
            local: this.socket.id,
            remote: socketID
          })
        }
      }

      pc.oniceconnectionstatechange = (e) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)

        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }

      }

      pc.ontrack = (e) => {

        let _remoteStream = null
        let remoteStreams = this.state.remoteStreams
        let remoteVideo = {}


        // 1. check if stream already exists in remoteStreams
        const rVideos = this.state.remoteStreams.filter(stream => stream.id === socketID)

        // 2. if it does exist then add track
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream
          _remoteStream.addTrack(e.track, _remoteStream)
          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream,
          }
          remoteStreams = this.state.remoteStreams.map(_remoteVideo => {
            return _remoteVideo.id === remoteVideo.id && remoteVideo || _remoteVideo
          })
        } else {
          // 3. if not, then create new stream and add track
          _remoteStream = new MediaStream()
          _remoteStream.addTrack(e.track, _remoteStream)

          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream,
          }
          remoteStreams = [...this.state.remoteStreams, remoteVideo]
        }

        this.setState(prevState => {

          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
          const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: _remoteStream }

          // get currently selected video
          let selectedVideo = prevState.remoteStreams.filter(stream => stream.id === prevState.selectedVideo.id)
          // if the video is still in the list, then do nothing, otherwise set to new video stream
          selectedVideo = selectedVideo.length ? {} : { selectedVideo: remoteVideo }

          return {
            // selectedVideo: remoteVideo,
            ...selectedVideo,
            // remoteStream: e.streams[0],
            ...remoteStream,
            remoteStreams, //: [...prevState.remoteStreams, remoteVideo]
          }
        })
      }

      pc.close = () => {
        // alert('GONE')
        console.log("pc closed");
      }

      if (this.state.localStream)
        // pc.addStream(this.state.localStream)

        this.state.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.state.localStream)
        })

      // return pc
      callback(pc)

    } catch(e) {
      console.log('Something went wrong! pc not created!!', e)
      // return;
      callback(null)
    }
  }
  componentDidMount = () => {

    this.socket = io.connect(
      this.serviceIP,
      {
        path: '/webrtc',
        query: {
          room: window.location.pathname,
        }
      }
    )
    this.socket.on('connection-success', data => {

      //this.getLocalStream()

      //console.log(data.success)
      const status = data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'

      this.setState({
        status: status,
        messages: data.messages
      })
    })
    this.socket.on('joined-peers', data => {

      this.setState({
        status: data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'
      })
    })

    this.socket.on('peer-disconnected', data => {

      // close peer-connection with this peer
      this.state.peerConnections[data.socketID].close()

      // get and stop remote audio and video tracks of the disconnected peer
      const rVideo = this.state.remoteStreams.filter(stream => stream.id === data.socketID)
      rVideo && this.stopTracks(rVideo[0].stream)

      // filter out the disconnected peer stream
      const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== data.socketID)

      this.setState(prevState => {
        // check if disconnected peer is the selected video and if there still connected peers, then select the first
        const selectedVideo = prevState.selectedVideo.id === data.socketID && remoteStreams.length ? { selectedVideo: remoteStreams[0] } : null

        return {
          // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
          remoteStreams,
          ...selectedVideo,
          status: data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'
        }
        }
      )
    })


    this.socket.on('online-peer', socketID => {
      // console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      this.createPeerConnection(socketID, pc => {
        // 2. Create Offer
        if (pc) {
      
          // Send Channel
          const handleSendChannelStatusChange = (event) => {
            console.log('send channel status: ' + this.state.sendChannels[0].readyState)
          }

          const sendChannel = pc.createDataChannel('sendChannel')
          sendChannel.onopen = handleSendChannelStatusChange
          sendChannel.onclose = handleSendChannelStatusChange
        
          this.setState(prevState => {
            return {
              sendChannels: [...prevState.sendChannels, sendChannel]
            }
          })


          // Receive Channels
          const handleReceiveMessage = (event) => {
            const message = JSON.parse(event.data)
            // console.log(message)
            this.setState(prevState => {
              return {
                messages: [...prevState.messages, message]
              }
            })
          }

          const handleReceiveChannelStatusChange = (event) => {
            if (this.receiveChannel) {
              console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
            }
          }

          const receiveChannelCallback = (event) => {
            const receiveChannel = event.channel
            receiveChannel.onmessage = handleReceiveMessage
            receiveChannel.onopen = handleReceiveChannelStatusChange
            receiveChannel.onclose = handleReceiveChannelStatusChange
          }

          pc.ondatachannel = receiveChannelCallback


          pc.createOffer(this.state.sdpConstraints)
            .then(sdp => {
              pc.setLocalDescription(sdp)

              this.sendToPeer('offer', sdp, {
                local: this.socket.id,
                remote: socketID
              })
            })
        }
      })
    })


    this.socket.on('offer', data => {
      this.createPeerConnection(data.socketID, pc => {
        pc.addStream(this.state.localStream)

        // Send Channel
        const handleSendChannelStatusChange = (event) => {
          console.log('send channel status: ' + this.state.sendChannels[0].readyState)
        }

        const sendChannel = pc.createDataChannel('sendChannel')
        sendChannel.onopen = handleSendChannelStatusChange
        sendChannel.onclose = handleSendChannelStatusChange
        
        this.setState(prevState => {
          return {
            sendChannels: [...prevState.sendChannels, sendChannel]
          }
        })

        // Receive Channels
        const handleReceiveMessage = (event) => {
          const message = JSON.parse(event.data)
          // console.log(message)
          this.setState(prevState => {
            return {
              messages: [...prevState.messages, message]
            }
          })
        }

        const handleReceiveChannelStatusChange = (event) => {
          if (this.receiveChannel) {
            console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
          }
        }

        const receiveChannelCallback = (event) => {
          const receiveChannel = event.channel
          receiveChannel.onmessage = handleReceiveMessage
          receiveChannel.onopen = handleReceiveChannelStatusChange
          receiveChannel.onclose = handleReceiveChannelStatusChange
        }

        pc.ondatachannel = receiveChannelCallback

        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
          // 2. Create Answer
          pc.createAnswer(this.state.sdpConstraints)
            .then(sdp => {
              pc.setLocalDescription(sdp)

              this.sendToPeer('answer', sdp, {
                local: this.socket.id,
                remote: data.socketID
              })
            })
        })
      })
    })

    this.socket.on('answer', data => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]
      // console.log(data.sdp)
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(()=>{})
    })

    this.socket.on('candidate', (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]

      if (pc)
        pc.addIceCandidate(new RTCIceCandidate(data.candidate))
    })
  }

  // ************************************* //
  // DELETE ME
  // ************************************* //
  disconnectSocket = (socketToDisconnect) => {
    this.sendToPeer('socket-to-disconnect', null, {
      local: this.socket.id,
      remote: socketToDisconnect
    })
  }

  switchVideo = (_video) => {
    // console.log(_video)
    this.setState({
      selectedVideo: _video
    })
  }

  // ************************************* //
  // ************************************* //
  stopTracks = (stream) => {
    stream.getTracks().forEach(track => track.stop())
  }

  callbackFunction = (data) => {
    this.setState({disconnected: data})
  }

  handleUsername = (e) => {
    this.setState({
      username: e.target.value
    })
  }

  startconnection = (e) => {
    this.setState({askForUsername: false})
    this.getLocalStream()
  }
  copyUrl = () => {
		let text = window.location.href
		navigator.clipboard.writeText(text).then(function () {
			message.success("Link copied to clipboard!")
		}, () => {
			message.error("Failed to copy")
		})
	}

  render() {
    const {
      status,
      messages,
      disconnected,
      localStream,
      peerConnections,
      remoteStreams,
    } = this.state

    if (disconnected) {
      // disconnect socket
      this.socket.close()
      // stop local audio & video tracks
      this.stopTracks(localStream)

      // stop all remote audio & video tracks
      remoteStreams.forEach(rVideo => this.stopTracks(rVideo.stream))

      // stop all remote peerconnections
      peerConnections && Object.values(peerConnections).forEach(pc => pc.close())

      return (
        <div>
          You have successfully Disconnected. Room ID = {window.location.pathname}
          <br/>
          <a href={'//localhost:8080' + window.location.pathname}>Click Here to Rejoin the meeting</a>
        </div>
      )
    }

    const statusText = <div style={{ color: 'yellow', padding: 5 }}>{status}</div>
    
    return (
      <div>
        {this.state.askForUsername === true ? 
        <div>
          <div style={{background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
              textAlign: "center", margin: "auto", marginTop: "50px", justifyContent: "center"}}>
            <p style={{ margin: 0, fontWeight: "bold", paddingRight: "50px" }}>Set your username</p>
            <Input placeholder="Username" value={this.state.username} onChange={e => this.handleUsername(e)} />
            <Button variant="contained" color="primary" onClick={this.startconnection} style={{ margin: "20px" }}>Connect</Button>
          </div>
				</div>
        :
        <div>
          <Draggable style={{
              zIndex: 4,
              position: 'absolute',
              right: 0,
              cursor: 'move'
          }}>
            <Video
              videoType='localVideo'
              videoStyles={{
                width: 200,
              }}
              frameStyle={{
                width: 200,
                margin: 5,
                borderRadius: 5,
                backgroundColor: 'black',
              }}
              showMuteControls={true}
              // ref={this.localVideoref}
              videoStream={localStream}
              parentCallback = {this.callbackFunction}
              autoPlay muted>
            </Video>
          </Draggable>
          <br />
          <div style={{
              zIndex: 3,
              position: 'absolute',
          }}>
            <div style={{
              margin: 10,
              backgroundColor: '#cdc4ff4f',
              padding: 10,
              borderRadius: 5,
              }}><div style={{ paddingTop: "20px" }}>
                <Input value={window.location.href} disable="true"></Input>
                <Button style={{backgroundColor: "#3f51b5",color: "whitesmoke",marginLeft: "20px",
                  marginTop: "10px",width: "120px",fontSize: "10px"
                }} onClick={this.copyUrl}>Copy invite link</Button>
              </div>
            </div>
            <div style={{
              margin: 10,
              backgroundColor: '#cdc4ff4f',
              padding: 10,
              borderRadius: 5,
              }}>{ statusText }
            </div>
          </div>
          <div>
            <Videos
              switchVideo={this.switchVideo}
              remoteStreams={remoteStreams}
            ></Videos>
          </div>
          <br />
          <Chat
              user={{
                //uid: this.socket && this.socket.id || ''
                uid: this.state.username
            }}
            messages={messages}
            sendMessage={(message) => {
              this.setState(prevState => {
                return {messages: [...prevState.messages, message]}
              })
              this.state.sendChannels.map(sendChannel => {
                sendChannel.readyState === 'open' && sendChannel.send(JSON.stringify(message))
              })
              this.sendToPeer('new-message', JSON.stringify(message), {local: this.socket.id})
            }}
          />
        </div>
         }
      </div>
    )
  }
}

export default App;