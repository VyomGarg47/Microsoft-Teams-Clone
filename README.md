<img width="100%">![Readme Top](https://user-images.githubusercontent.com/55129843/125173135-3ba9c000-e1db-11eb-86b4-b2cce9498fdb.png)</img>
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

## Demo
### Video Meeting
![video meeting](https://user-images.githubusercontent.com/55129843/125177227-a4069a80-e1f7-11eb-9269-b0378bd176d7.png)
### Chatroom
![chatroom](https://user-images.githubusercontent.com/55129843/125177233-b5e83d80-e1f7-11eb-8670-0f3998aac8e5.png)
### Send photos in meeting chats!
![send image](https://user-images.githubusercontent.com/55129843/125177230-ae289900-e1f7-11eb-8702-d9c5c8c07362.png)
### Share your screen!
![share screen](https://user-images.githubusercontent.com/55129843/125177238-c00a3c00-e1f7-11eb-9901-a98894916d91.png)
### Join meeting directly from chatroom, and adjust your audio and video!
![Joining meeting](https://user-images.githubusercontent.com/55129843/125177334-88e85a80-e1f8-11eb-8931-adc376b852c4.gif)
### Pin and mute different participants!
![Participants control](https://user-images.githubusercontent.com/55129843/125177279-1b3c2e80-e1f8-11eb-8822-f48a959750c4.gif)
### Collaborative Whiteboard for better learning experience!
![whiteboard](https://user-images.githubusercontent.com/55129843/125177286-28591d80-e1f8-11eb-8574-ab21c9a6fc53.gif)





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
Prerequisites: [Node.js](https://nodejs.org/en/).
Clone the repository.
Then run the following commands in the project root folder.
* ```npm install ```
* ```npm run build```
* ```node server.js```

## Additional Resources
An excellent series on WebRTC by Amir Eshaq
* https://youtu.be/h2WkZ0h0-Rc

