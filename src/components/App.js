import React, { Component } from "react";
import { unregister } from "../registerServiceWorker";

unregister();

class App extends Component {
  render() {
    return (
      <main>
        <h1>FatLog</h1>
        <img
          width={150}
          height={150}
          src="/android-chrome-192x192.png"
          alt="Fatlog logo"
        />
        <p>
          This app has moved to a new location.
          <br />
          <br />
          Please update your bookmark to use{" "}
          <a href="https://fatlog.web.app">fatlog.web.app</a> instead.
        </p>
        <a className="link-button" href="https://fatlog.web.app">
          Goto new URL
        </a>
      </main>
    );
  }
}
export default App;
