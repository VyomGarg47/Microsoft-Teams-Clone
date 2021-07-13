import React, { Component } from "react";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import "./Home.css";
import Picture1 from "./images/Picture7.png";
import AddIcon from "@material-ui/icons/Add";
class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
    };
  }
  /**
   * updates the URL value
   */
  handleChange = (e) => this.setState({ url: e.target.value });
  /**
   * Called when user creates a room or enters a link for an existing room
   */
  join = () => {
    var url;
    if (this.state.url !== "") {
      url = this.state.url.split("/");
      window.location.href = `/${url[url.length - 1]}`;
    } else {
      alert("URL cannot be empty");
    }
  };

  create = () => {
    var url;
    url = Math.random().toString(36).substring(2, 10);
    window.location.href = `/${url}`;
  };

  render() {
    return (
      <div
        className="container2 cssanimation sequence fadeInBottom"
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ marginLeft: 50 }}>
          <div>
            <h1 style={{ fontSize: "45px", color: "white", textAlign: "left" }}>
              Microsoft Teams Clone
            </h1>
            <p
              style={{
                fontSize: "25px",
                fontWeight: "200",
                color: "white",
                marginRight: "20px",
                textAlign: "left",
                maxWidth: 600,
              }}
            >
              This project aims to build a video conferencing website that is
              easy to use, provides good video quality and latency, and contains
              all the necessary features for an engaging and complete video call
              experience.
            </p>
          </div>

          <div
            className="border-radius"
            style={{
              background: "white",
              width: "27%",
              height: "auto",
              padding: "15px",
              minWidth: "325px",
              textAlign: "center",
              marginTop: "50px",
            }}
          >
            <Button variant="contained" color="primary" onClick={this.create}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <AddIcon />
                <span>
                  <p style={{ fontSize: "15px", margin: 0 }}>
                    Create a new Room
                  </p>
                </span>
              </div>
            </Button>
            <p
              style={{
                margin: 0,
                fontWeight: "bold",
                fontSize: "20px",
                marginTop: 15,
              }}
            >
              or Join a room
            </p>
            <div style={{ marginTop: 15 }}>
              <Input placeholder="URL" onChange={(e) => this.handleChange(e)} />
              <Button
                color="primary"
                onClick={this.join}
                style={{
                  marginLeft: "20px",
                  width: "70px",
                  backgroundColor: "#ebf4ff",
                  //border: "2px solid #3f51b5",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold" }}>Join</p>
              </Button>
            </div>
          </div>
        </div>
        <img
          src={Picture1}
          alt="Picture1"
          style={{
            paddingTop: 150,
            margin: 50,
            width: "30%",
          }}
        ></img>
      </div>
    );
  }
}

export default Home;
