// =================================
// ARG Control
// Member Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, attachLogoutButton } from "./common.js";

const admin = getLoggedInMember();
requireAdmin(admin);

attachLogoutButton();


// URLからMID取得

const params = new URLSearchParams(location.search);
const memberID = params.get("id");

if (!memberID) {
    alert("MEMBER ID NOT FOUND");
    location.href = "members.html";
}


// 表示場所

const idElement = document.getElementById("memberID");
const nameElement = document.getElementById("username");
const levelElement = document.getElementById("accessLevel");
const statusElement = document.getElementById("status");


// Firebase取得

get(ref(db, "members/" + memberID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("MEMBER DATA NOT FOUND");
            location.href = "members.html";
            return;
        }

        const data = snapshot.val();

        idElement.textContent = memberID;
        nameElement.textContent = data.username;
        levelElement.textContent = data.access_level;
        statusElement.textContent = data.status;

    })
    .catch((error) => {

        console.error(error);
        alert("SYSTEM ERROR");

    });
