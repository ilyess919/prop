// js/firebase-config.js

// Vos véritables identifiants Firebase (Propatiss)
var firebaseConfig = {
  apiKey: "AIzaSyAwofVRk2BXlPHWFxZBInojY5ua7nNbNaQ",
  authDomain: "propatiss-6dfce.firebaseapp.com",
  projectId: "propatiss-6dfce",
  storageBucket: "propatiss-6dfce.firebasestorage.app",
  messagingSenderId: "1093872699893",
  appId: "1:1093872699893:web:2dde08f3439671140f78bc",
  measurementId: "G-S59GY4L34V"
};

// Initialisation pour le mode Compat (script CDN)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}