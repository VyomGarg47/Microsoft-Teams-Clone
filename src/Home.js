import React, { Component } from "react";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import "./Home.css";
import Picture1 from "./images/Picture7.png";
class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
    };
  }

  handleChange = (e) => this.setState({ url: e.target.value });

  join = () => {
    var url;
    if (this.state.url !== "") {
      url = this.state.url.split("/");
      window.location.href = `/${url[url.length - 1]}`;
    } else {
      url = Math.random().toString(36).substring(2, 7);
      window.location.href = `/${url}`;
    }
  };

  render() {
    return (
      <div className="container2 cssanimation sequence fadeInBottom">
        <div>
          <h1 style={{ fontSize: "45px", color: "white" }}>Video Meeting</h1>
          <p
            style={{
              fontSize: "25px",
              fontWeight: "200",
              color: "white",
              marginLeft: "20px",
              marginRight: "20px",
            }}
          >
            Video conference website that lets you stay in touch with all your
            friends.
          </p>
        </div>

        <div
          className="border-radius"
          style={{
            background: "white",
            width: "27%",
            height: "auto",
            padding: "10px",
            minWidth: "325px",
            textAlign: "center",
            margin: "auto",
            marginTop: "50px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "20px" }}>
            Start or join a meeting
          </p>
          <Input placeholder="URL" onChange={(e) => this.handleChange(e)} />
          <Button
            variant="contained"
            color="primary"
            onClick={this.join}
            style={{ margin: "20px" }}
          >
            Go
          </Button>
        </div>
        <img
          src={Picture1}
          alt="Picture1"
          style={{
            margin: 50,
            width: 300,
          }}
        ></img>
      </div>
    );
  }
}

export default Home;
