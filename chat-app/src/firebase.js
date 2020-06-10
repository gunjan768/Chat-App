import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";
import 'firebase/analytics';

var firebaseConfig = 
{
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase;
