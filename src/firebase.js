// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGxezDHhLWb7bNfJ-bKmEaTzMwnA7mo_E",
  authDomain: "blatzzz.firebaseapp.com",
  databaseURL:
    "https://hyre-demo-ca592-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hyre-demo-ca592",
  storageBucket: "hyre-demo-ca592.appspot.com",
  messagingSenderId: "430857610465",
  appId: "1:430857610465:web:a534bbc8beeef14b67c3a0",
  measurementId: "G-JBRWV0187Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
