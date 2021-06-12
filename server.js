const express = require('express')

var io = require('socket.io')
({
    path: '/webrtc'
})

const app = express()
const port = 8080

//app.get('/',(req,res) => res.send('Hello World'))
app.use(express.static(__dirname + '/build'))//once app is build, the react server which was originally at 3000 will now serve at 8080
app.get('/',(req,res,next)=>{
    res.sendFile(__dirname + '/build/index.html')
})

const server = app.listen(port,()=> console.log("server running on 8080"))

io.listen(server)
const peers = io.of('/webrtcPeer')
// keep a reference of all socket connections
let connectedPeers = new Map()

peers.on('connection',socket => {
    console.log(socket.id)
    socket.emit('connection-sucess',{sucess: socket.id})//reponding to the client that connection was successful,sending socket.id to the client(success:socket.id => sending socket.id as success parameter)
    connectedPeers.set(socket.id, socket)//making an entry into the connected peers
    socket.on('disconnect',()=>{
        console.log('disconnected')
        connectedPeers.delete(socket.id)
    })
    //whenever we recieve offer or answer, we want to send it to other peers
    socket.on('offerOrAnswer',(data) =>{
        //send (sdp) to the other peer(s) if any
        for (const[socketID,socket] of connectedPeers.entries()){
            //don't send to self
            if(socketID !== data.socketID){
                console.log(socketID,data.payload.type)
                socket.emit('offerOrAnswer',data.payload)//triggering event, handled by event handlers
            }
        }
    })
    //same thing for candidate
    socket.on('candidate',(data) =>{
        //send candidate to the other peer(s) if any
        for (const[socketID,socket] of connectedPeers.entries()){
            //don't send to self
            if(socketID !== data.socketID){
                console.log(socketID,data.payload.type)
                socket.emit('candidate',data.payload)//triggering event, handled by event handlers
            }
        }
    })
})