import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCyYXcQs1e2hnLKYwInQ_78EIJJcFSN25Y",
  authDomain: "bodymetrics.web.app",
  databaseURL: "https://fatlog-app.firebaseio.com",
  projectId: "fatlog-app",
  storageBucket: "fatlog-app.appspot.com",
  messagingSenderId: "893039177685",
  appId: "1:893039177685:web:b2d4cae60f09a1f5c7175c",
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

if (import.meta.env.DEV) {
  import("firebase/auth").then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, "http://localhost:9099")
  })
}
