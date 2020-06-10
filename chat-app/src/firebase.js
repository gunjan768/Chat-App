import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";
import 'firebase/analytics';

var firebaseConfig = 
{
    apiKey: "AIzaSyDV99nE48sfdQIHYS7wTT3yp7s_-pIAaAM",
    authDomain: "fir-chat-app-3d60b.firebaseapp.com",
    databaseURL: "https://fir-chat-app-3d60b.firebaseio.com",
    projectId: "fir-chat-app-3d60b",
    storageBucket: "fir-chat-app-3d60b.appspot.com",
    messagingSenderId: "938863791712",
    appId: "1:938863791712:web:f76d9f861c93dc0fdefd05",
    measurementId: "G-6C5XF8D0H4"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase;