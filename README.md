# Microsoft Teams Clone

## Introduction

This project aims to build a video conferencing website that is easy to use, provides good video quality and latency, and contains all the necessary features for an engaging and complete video call experience.

Best works with: Chrome, Edge.

Check out the demo at: https://teams-clone-engage2k21.herokuapp.com/

## Features

### Primary features 

* An unlimited number of conference rooms without any call time limitations.
* Support for multiple participants in each room.
* Screen sharing to present documents, slides, and more.
* Share photos and chat with your friends.
* Continue your conversation before or after the meeting in the chatroom.
* Persistent chats so you won’t have to worry about losing them.
* Simple collaborative whiteboard for teaching and sharing new ideas.
* Raise your hand in the meeting to ask a question.
* Support for Toast notifications.

### Secondary features

* Record your screen, audio, and video.
* Activity center so you won’t miss any notifications.
* Emojis that allow you to express yourself.
* Full-screen mode for Video elements.
* Option to mute audio of each participant.
* Customize username, adjust audio and video before joining the meeting.
* Copy and share Room URLs easily.
* Sound notifications for better user experience.
* Direct peer-to-peer connections ensure low latency thanks to WebRTC.

## Instructions

* To start a meeting, visit https://teams-clone-engage2k21.herokuapp.com/, then click on the “Go” button to create a new room or enter an existing room URL to join that room.
* After the room is created, set up your username and click on the “Join Room” button.
* In the chatroom,
  * Chat with the room participants using the Meeting Chat.
  * Share photos by dragging and dropping them on the "Enter your message" panel.
  * Copy the chat room URL using the “Copy Invite Link” button.
  * Check out the recent activities by clicking on the “Activity” button on the sidebar.
  * Start an instant meeting by using the “Create a meeting” button.
* Before joining,
  * Allow the permissions for using your camera and microphone.
  * Adjust your audio and video before joining the meeting.
* In the meeting,
  * Toggle your audio and video, or end the call using the buttons on the top right, just below your stream.
  * Copy the room URL using the “Copy Invite Link” button.
  * Switch between the streams of different participants by clicking on it from the bottom panel.
  * Mute or unmute the participants by clicking on the button with three dots on their stream and then clicking mute.
  * Share your screen, go fullscreen, start recording, raise your hand or open a collaborative whiteboard using their respective      buttons on the top.
  * Use “Go back to room” if you want to go back to the chatroom.

## Agile methodology used
* Scrum.
* CI/CD and TDD.

## Technical Stack
Tech stack used primarily includes:
* Socket.IO
* React
* Node.js
* Express.js
* React-toastify
* RecordRTC
* Screenfull
* Compression
* Material-UI
* Jest and React-testing libraries

## Getting started
Prerequisites: Node.js(https://nodejs.org/en/)
Clone the repository
Then run the following commands in the project root folder.
* ```npm install ```
* ```npm run build```
* ```node server.js```

## Additional Resources
An excellent series on WebRTC by Amir Eshaq
* https://youtu.be/h2WkZ0h0-Rc

