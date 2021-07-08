// https://www.freecodecamp.org/news/building-a-modern-chat-application-with-react-js-558896622194/
import Picker from "emoji-picker-react";
import React, { useState, useEffect } from "react";
import DragDrop from "./dragDrop";
import IconButton from "@material-ui/core/IconButton";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import Modal from "@material-ui/core/Modal";

const Chat = (props) => {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState({ uid: 0 });
  const [imageZoom, setImageZoom] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [Panel, setPanel] = useState(false);
  const scrollToBottom = () => {
    const chat = document.getElementById("chatList");
    chat.scrollTop = chat.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
    setUser({ uid: props.user.uid });
  }, [props]);

  const sendMessage = (msg) => {
    props.sendMessage(msg);
    scrollToBottom();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage({
      type: "text",
      message: {
        id: user.uid,
        sender: { uid: user.uid },
        data: { text: message },
      },
    });
    setMessage("");
    if (Panel) {
      setPanel(false);
    }
  };

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  const addEmoji = (event, emojiObject) => {
    setMessage(message + emojiObject.emoji);
  };

  const renderMessage = (userType, data) => {
    const message = data.message;

    const msgDiv = (data.type === "text" && (
      <div className="msg">
        <p>{message.sender.uid}</p>
        <div className="message"> {message.data.text}</div>
      </div>
    )) || (
      <div className="msg">
        <p>{message.sender.uid}</p>
        <img
          onClick={() => {
            setImageZoom(true);
            setSelectedImage(message.data);
          }}
          className="message"
          style={{
            width: 200,
            // height: 100
            cursor: "pointer",
          }}
          src={message.data}
          alt=""
        />
      </div>
    );

    return <li className={userType}>{msgDiv}</li>;
  };

  const showEnlargedImage = (data) => {
    return (
      <img
        src={data}
        style={{
          backgroundColor: "black",
          zIndex: 100,
          cursor: "pointer",
          marginLeft: "auto",
          marginRight: "auto",
          padding: 20,
          borderRadius: 20,
          objectFit: "contain",
        }}
        onClick={() => setImageZoom(false)}
        alt=""
      />
    );
  };

  return (
    <div>
      {/* {imageZoom && showEnlargedImage(selectedImage)} */}
      <Modal
        open={imageZoom}
        onClose={() => {
          setImageZoom(false);
        }}
      >
        <div
          style={{
            position: "absolute",
            overflow: "auto",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {showEnlargedImage(selectedImage)}
        </div>
      </Modal>
      <div
        className="chatWindow"
        style={{
          ...props.chatstyle,
        }}
      >
        <div style={{ backgroundColor: "black" }}>
          <p
            style={{
              color: "white",
              fontWeight: "bold",
            }}
          >
            Meeting chat
          </p>
        </div>
        <ul className="chat" id="chatList">
          {props.messages.map((data) => (
            <div key={data.id}>
              {user.uid === data.message.sender.uid
                ? renderMessage("self", data)
                : renderMessage("other", data)}
            </div>
          ))}
        </ul>
        <DragDrop
          className="chatInputWrapper"
          sendFiles={(files) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              //https://blog.mozilla.org/webrtc/large-data-channel-messages/
              //https://lgrahl.de/articles/demystifying-webrtc-dc-size-limit.html
              const maximumMessageSize = 262118; //65535 <=== 64KiB // 16384 <=== 16KiB to be safe
              if (e.target.result.length <= maximumMessageSize)
                sendMessage({
                  type: "image",
                  message: {
                    id: user.uid,
                    sender: { uid: user.uid },
                    data: e.target.result,
                  },
                });
              else alert("File exceeds maximum allowed size!");
            };

            reader.readAsDataURL(files[0]);
          }}
        >
          {Panel === true ? (
            <Picker
              pickerStyle={{ position: "absolute", bottom: 60 }}
              onEmojiClick={addEmoji}
            />
          ) : null}
          <IconButton
            style={{
              position: "absolute",
              color: "yellow",
              left: 0,
              bottom: 0,
              width: 50,
            }}
            onClick={() => {
              setPanel((prevPanel) => !prevPanel);
            }}
          >
            <EmojiEmotionsIcon />
          </IconButton>
          <form onSubmit={handleSubmit}>
            <input
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "calc(100% - 50px)",
              }}
              className="textarea input"
              type="text"
              placeholder="Enter your message..."
              onChange={handleChange}
              value={message}
            />
          </form>
        </DragDrop>
      </div>
    </div>
  );
};

export default Chat;
