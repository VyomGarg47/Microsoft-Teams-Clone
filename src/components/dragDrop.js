//https://medium.com/@650egor/simple-drag-and-drop-file-upload-in-react-2cb409d88929
import React, { useState } from "react";

var DragDrop = (props) => {
  const [bgColor, setBgColor] = useState("transparent");

  const changeBgColor = (state) => {
    setBgColor((state && "green") || "transparent");
  };

  return (
    <div
      style={{
        backgroundColor: bgColor,
      }}
      className={props.className}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeBgColor(true);
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeBgColor(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeBgColor(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          props.sendFiles(e.dataTransfer.files);
        }
      }}
    >
      {props.children}
    </div>
  );
};

export default DragDrop;
