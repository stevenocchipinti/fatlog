import React from "react";
import ReactDOM from "react-dom";
import { initializeApp } from "firebase";
import injectTapEventPlugin from "react-tap-event-plugin";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import App from "./components/App";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import theme from "./theme";
import "./index.css";

initializeApp({
  apiKey: "AIzaSyCyYXcQs1e2hnLKYwInQ_78EIJJcFSN25Y",
  authDomain: "fatlog.web.app",
  databaseURL: "https://fatlog-app.firebaseio.com",
  projectId: "fatlog-app",
  storageBucket: "fatlog-app.appspot.com",
  messagingSenderId: "893039177685",
  appId: "1:893039177685:web:6663b406d4ca051cc7175c"
});

injectTapEventPlugin();

ReactDOM.render(
  <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
    <App />
  </MuiThemeProvider>,
  document.getElementById("root")
);
