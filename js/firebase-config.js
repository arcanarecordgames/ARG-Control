// Firebase SDK

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import { getDatabase }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



// Firebase configuration

const firebaseConfig = {

  apiKey:
  "AIzaSyCDCxPxP1Zqb6KKPyHPJZVYN1q_gXuyyMc",

  authDomain:
  "arg-control.firebaseapp.com",

  databaseURL:
  "https://arg-control-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
  "arg-control",

  storageBucket:
  "arg-control.firebasestorage.app",

  messagingSenderId:
  "440743421827",

  appId:
  "1:440743421827:web:651be000c82cc1c05438b6"

};



// Initialize Firebase

const app =
initializeApp(firebaseConfig);


// Realtime Database

export const db =
getDatabase(app);