import React, { Component } from "react";
import Meet from "./Meet";
import Home from "./Home";
import Chatroom from "./Chatroom";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

class App extends Component {
  render() {
    return (
      <div>
        <Router forceRefresh={true}>
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/Video/:url" component={Meet} />
            <Route path="/:url" component={Chatroom} />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
