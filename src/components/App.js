import React, { Component } from "react";

import backend from "../backend";
import { loadState, saveState, clearState } from "../localStorage";
import { registerServiceWorker } from "../serviceWorkerRegistration";

import Placeholder from "./Placeholder";
import CheckinTable from "./CheckinTable";
import NewCheckinDialog from "./NewCheckinDialog";
import AppBar from "./AppBar";

import Snackbar from "material-ui/Snackbar";

class App extends Component {
  constructor() {
    super();
    this.state = {
      checkins: [],
      notification: {
        message: "",
        visible: false
      },
      loading: true,
      offline: !navigator.onLine
    };
  }

  componentWillUpdate(props, state) {
    saveState({
      checkins: state.checkins,
      user: state.user
    });
  }

  componentDidMount() {
    registerServiceWorker({
      onInstall: () => {
        this.notify("Now available offline");
      },
      onUpdate: () => {
        this.notify("Refresh for the new version");
      }
    });

    let persistedState = loadState();
    if (persistedState) {
      this.setState({
        ...this.state,
        checkins: persistedState.checkins,
        user: persistedState.user
      });
    }

    if (window) window.addEventListener("online", () => {
      this.setState({...this.state, offline: false});
    });
    if (window) window.addEventListener("offline", () => {
      this.setState({...this.state, offline: true});
    });

    backend.init({
      onAuthStateChanged: user => {
        this.setState({...this.state, user});
      },
      onCheckinsChanged: checkins => {
        this.setState({
          ...this.state,
          loading: false,
          checkins
        });
      }
    });
  }

  handleCreate(checkin) {
    backend.addCheckin(checkin).then(() => {
      this.notify("Check-in created");
    });
  }

  handleDelete(checkinKey) {
    backend.deleteCheckin(checkinKey).then(() => {
      this.notify("Check-in deleted");
    });
  }

  notify(message) {
    this.setState({
      ...this.state,
      notification: { message, visible: true }
    });
  }
  hideNotification() {
    this.setState({
      ...this.state,
      notification: { message: "", visible: false }
    });
  }

  body() {
    if (!this.state.user) {
      return <Placeholder>Not signed in</Placeholder>;
    } else if (this.state.checkins.length === 0) {
      return <Placeholder>No logs yet</Placeholder>;
    } else {
      return (
        <CheckinTable
          checkins={ this.state.checkins }
          onDelete={ (key) => this.handleDelete(key) }
        />
      );
    }
  }

  render() {
    return (
      <div className="App">
        <AppBar
          onSignIn={ () => { backend.signIn(); } }
          onSignOut={ () => { backend.signOut(); clearState(); } }
          user={this.state.user}
          loading={this.state.user && this.state.loading}
          offline={this.state.offline}
        />

        <NewCheckinDialog onSubmit={ checkin => this.handleCreate(checkin) }/>

        { this.body() }

        <footer style={{ height: "100px" }} />

        <Snackbar
          open={this.state.notification.visible}
          message={this.state.notification.message}
          style={{textAlign: "center"}}
          autoHideDuration={3000}
          onRequestClose={ () => { this.hideNotification(); } }
        />
      </div>
    );
  }
}
export default App;
