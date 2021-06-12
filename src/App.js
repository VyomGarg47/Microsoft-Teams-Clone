import { throws } from 'assert';
import React, {Component} from 'react';
import io from 'socket.io-client'
class App extends Component{
  constructor(props){
    super(props)
    this.localVideoref = React.createRef()//Provides a way to access DOM nodes or react elements created in render method
    this.remoteVideoref = React.createRef()
    this.socket = null
    this.candidates = []
  }
  componentDidMount = () => {
    this.socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }
    )
    this.socket.on('connection-sucess',success=>{
      console.log(success)//logs in console in browser
    })
    this.socket.on('offerOrAnswer',(sdp)=>{
      this.textref.value = JSON.stringify(sdp)//setting textref to sdp
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })
    this.socket.on('candidate',(candidate)=>{
      //when recieving candidate, lets and that to array candidate
      //this.candidates = [...this.candidates,candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })
    //const pc_config = null//need to set this to stun server when working on different networks
    const pc_config = {
      "iceServers": [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
          urls : 'stun:stun.l.google.com:19302'
        }
      ]
    }
    this.pc = new RTCPeerConnection(pc_config)//need to send configuration 
    //triggered when a new candidate is triggered
    this.pc.onicecandidate = (e) => { //e -> event
      //send the candidate to the remote server
      if(e.candidate)
       //console.log(JSON.stringify(e.candidate))
       this.sendToPeer('candidate',e.candidate)//will send to server, and server will raise the candidate event

    }
    //triggered when there is a change in connection state
    this.pc.oniceconnectionstatechange = (e) => {//e->event
      console.log(e)
    }
    this.pc.ontrack = (e) => {
      this.remoteVideoref.current.srcObject = e.streams[0]
    }
    const constraints = {
      audio: false,
      video:true,
    }
    const success = (stream) => {//if success, then placing the stream in video reference(localVideoref)
      window.localStream = stream //attacking stream to the local object
      //localstream is user's local stream, for caller A it will be their stream
      //and for B, it will be their stream
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)//adds media stream as a local source of audio or video
    }
    const failure = (e) => {
      console.log('getUserMedia Error: ', e) //if permission is denied or any other error, then it comes here
    }
    //getUserMedia method prompts the user for permission to use up to one video input device
    //such as camera or shared screen and upto 1 audio input
    //If permission is granted, the specified stream is delievered to the specified callback
    //navigator.getUserMedia(constraints,success,failure) <-- depreciated
    //Then below method uses promises
    navigator.mediaDevices.getUserMedia(constraints)
    .then(success)
    .catch(failure)
    //Yet another method->
    // (async() =>{
    //   const stream = await navigator.mediaDevices.getUserMedia(constraints)
    // })().catch(failure)
  }
  //messageType could be offerOrAnswer or candidate
  sendToPeer = (messageType, payload) => {//sending it to server
    this.socket.emit(messageType,{
      socketID : this.socket.id,
      payload
    })
  }

  createOffer = () => {
    console.log('offer')
    //initiates the creation of SDP
    this.pc.createOffer({offerToReceiveVideo: 1}) //creating an offer
      .then(sdp => {//if it is successful
        //console.log(JSON.stringify(sdp))
        //set offer sdp as local description
        this.pc.setLocalDescription(sdp)//set set local discription as sdp
        this.sendToPeer('offerOrAnswer',sdp)
      },e=>{})
  }

  setRemoteDescription = () =>{
    //retrieve and parse the SDP copied from the remote peer (answer of the remote peer is set as our remote description)
    const desc = JSON.parse(this.textref.value)//get the value from textref.value
    //set sdp as remote description
    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  }
  //creates an SDP answer to an offer received from remote peer
  createAnswer = () =>{
    console.log('Answer')
    this.pc.createAnswer({offerToReceiveVideo: 1})
    .then(sdp=>{
      //console.log(JSON.stringify(sdp))
      //set answer sdp as local description
      this.pc.setLocalDescription(sdp)
      this.sendToPeer('offerOrAnswer',sdp)
    })
  }

  addCandidate = () => {
    //retrieve and parse the candidate copied from the remote peer
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)
    //add the candidate to the peer connection
    // this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    this.candidates.forEach(candidate=>{
      console.log(JSON.stringify(candidate))
      //adds the ICE candidates to the peer connections
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    });

  }

  render(){
    return(
      <div>
        {/* Assigning this reference using the above localVideoref in constructor */}
        <video 
          style={{
            width:240,height:240,
            margin:5, backgroundColor:'black'
          }}
          ref={this.localVideoref} 
          autoPlay>
        </video>
        <video 
          style={{
            width:240,height:240,
            margin:5, backgroundColor:'black'
          }}
          ref={this.remoteVideoref} 
          autoPlay>
        </video>
        <br/>
        <button onClick={this.createOffer}>Offer</button>
        <button onClick={this.createAnswer}>Answer</button>
        <br/>
        <textarea ref={ref=>{this.textref = ref}}/>
        {/* <br/>
        <button onClick={this.setRemoteDescription}>Set Remote Desc</button>
        <button onClick={this.addCandidate}>Add Candidate</button> */}
      </div>
    );
  }
}

export default App;
