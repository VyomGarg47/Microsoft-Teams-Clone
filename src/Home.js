import React, { Component } from "react";
import { Input, Button } from "@material-ui/core";
import "./Home.css";

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
    };
  }

  handleChange = (e) => this.setState({ url: e.target.value });

  join = () => {
    if (this.state.url !== "") {
      var url = this.state.url.split("/");
      window.location.href = `/${url[url.length - 1]}`;
    } else {
      var url = Math.random().toString(36).substring(2, 7);
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
            padding: "20px",
            minWidth: "400px",
            textAlign: "center",
            margin: "auto",
            marginTop: "100px",
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
      </div>
    );
  }
}

export default Home;
