import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import { Link } from "react-router-dom";

class Error extends Component {
  render() {
    return (
      <div
        className="container2 cssanimation sequence fadeInBottom"
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: "45px", color: "white", textAlign: "center" }}>
          Access denied.
        </h1>
        <p
          style={{
            fontSize: "25px",
            fontWeight: "200",
            color: "white",
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Sorry, this app needs your camera and microphone permission to work.
        </p>
        <div
          className="border-radius"
          style={{
            background: "white",
            width: "27%",
            height: "auto",
            padding: "10px",
            minWidth: "325px",
            textAlign: "center",
            marginTop: "50px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "20px" }}>
            How about we try that again ?
          </p>
          <Link
            to={{
              pathname: "/",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              style={{ margin: "20px" }}
            >
              Go
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}

export default Error;
