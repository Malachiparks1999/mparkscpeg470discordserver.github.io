// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";

import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";

import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional user

const firebaseConfig = {
  apiKey: "AIzaSyB2zBeQg2jEfb7qIM6JoW8I--6JPW3zrsA",

  authDomain: "mparks-discordserverlite.firebaseapp.com",

  databaseURL: "https://mparks-discordserverlite-default-rtdb.firebaseio.com",

  projectId: "mparks-discordserverlite",

  storageBucket: "mparks-discordserverlite.appspot.com",

  messagingSenderId: "426320090593",

  appId: "1:426320090593:web:9d02cbbc237c1258c62ea0",

  measurementId: "G-Q072GL6V60"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// set up database communication vars
const db = rtdb.getDatabase(app);
const chatRef = rtdb.ref(db, "/chats");

// set up database auth vars
const auth = fbauth.getAuth(app);

/* #######################    Send Messages Functions   ####################### */

// Used to send messages to the rtdb
function sendMessage() {
  
  // used to push message to DB
  var messageTxt = $("#messageBox").val();
  var currDate = new Date();
  let msgToBeSent = {"author": auth.currentUser.uid, "message": messageTxt, "timestamp": parseInt(currDate.getTime()), "edited": "false"};
  rtdb.push(chatRef, msgToBeSent);

  $("#messageBox").val(""); //set element value to empty
}

/* #######################    Auth Functions   ####################### */

fbauth.onAuthStateChanged(auth, (user) => {
  if (!!user) {
    // check to see if there is a user
    $(".login-wrapper").hide(); // hide login and register button
    $(".logoutUser").show(); // show logout button
    $(".chatSection").show(); // show chat area
    $("#loggedIn").html("Logged in as: " + user.displayName); // show who is logged in

    $("#logoutButton").on("click", () => {
      fbauth.signOut(auth);
      $(".logoutUser").hide();
      $(".chatSection").hide(); // show chat area
      $(".login-wrapper").show();
    });
  } else {
    $(".login-wrapper").show();
    $(".logoutUser").hide();
    $(".chatSection").hide();
  }
});

/* #######################    Rendering Functions   ####################### */

// renders when chat is added to DB
rtdb.onChildAdded(chatRef, ss => {
  displayMessage(ss.val(),ss.key); // passes obj and uuid to function to display
});

// used when rendering chats
function displayMessage(obj, messageID){
  // taken inspiration from Justin Henkie here for how to render information
  
  // setting up inner contents of the message
  var messageContent = document.createElement('p');
  messageContent.innerText = obj.message;
  messageContent.id = messageID + "_msgContent";
  
  // setting up author portion of message via rtdb
  var username = rtdb.ref(db, `users/${obj.author}/username`);
  rtdb.onValue(username, ss => { // creating and pushing message here so username data permanently pushed
    
  // setting up list Item container to be pushed
 var messageWrapper = '<li><div><h3>' + ss.val() + '</h3><h6>' + new Date(obj.timestamp) + '</h6><p>' + messageContent.innerText + '</p></div></li>'
  
  // show items in on screen when added
  $("#chatLog").append(messageWrapper);
  });
}

/* #######################    Binding Functions   ####################### */
$("#submitButton").click(sendMessage); // bind listener to send message with click

$("#registerCredsButton").click(function () {
  // bind listener to register message with
  var email = $("#regEmail").val();
  var regPass = $("#regPass").val();
  var confPass = $("#confPass").val();
  var username = $("#usernameReg").val();
  if (regPass != confPass) {
    alert("Passwords do not match");
    //sanatize boxes so they look empty
    $("#regPass").val("");
    $("#confPass").val("");
    return;
  }
  
  fbauth
    .createUserWithEmailAndPassword(auth, email, confPass)
    .then((somedata) => {
      var uid = somedata.user.uid;
      // refs section
      var userRoleRef = rtdb.ref(db, `/users/${uid}/roles/user`);
      var userEmailRef = rtdb.ref(db, `users/${uid}/email`);
      var usernameRef = rtdb.ref(db, `users/${uid}/username`);

      // setting infromation
      rtdb.set(userRoleRef, true); // user only accounts (not admin, mod or owner)
      rtdb.set(usernameRef, username); // set username up for user
      rtdb.set(userEmailRef, email); // set useraccount to email in case
    
      // Editing display name for user to call later
      fbauth.updateProfile(somedata.user, {
        displayName: username,
        photoURL: null
      })
      $("#loggedIn").html("Logged in as: " + username); // show who is logged in

      //sanatize boxes so they look empty
      $("#regEmail").val("");
      $("#usernameReg").val("");
      $("#regPass").val("");
      $("#confPass").val("");
    
      alert("Registration Successful!");
    })
    .catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;

      alert(errorMessage); //notify user
      console.log(errorCode);
      console.log(errorMessage);
    });
});

// used to sign into FB
$("#loginButton").click(function () {
  let email = $("#loginEmail").val();
  let pwd = $("#loginPass").val();
  fbauth
    .signInWithEmailAndPassword(auth, email, pwd)
    .then((somedata) => {
      console.log(somedata);
      $("#loginEmail").val("");
      $("#loginPass").val("");
    })
    .catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(errorMessage); // notfiy user
      console.log(errorCode);
      console.log(errorMessage);
    });
});

// used to sign reset email password
$("#forgotButton").click(function () {
  let email = $("#forgotEmail").val();
  fbauth
    .sendPasswordResetEmail(auth, email)
    .then((somedata) => {
      console.log(somedata);
      // clean up input
      $("#forgotEmailEmail").val("");
      alert("Password Reset Email Sent");
    })
    .catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(errorMessage); // notfiy user
      console.log(errorCode);
      console.log(errorMessage);
    });
});
