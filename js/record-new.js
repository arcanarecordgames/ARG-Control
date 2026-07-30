// =================================
// ARG Control
// Record (Thread) New System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const submitButton = document.getElementById("submitButton");


submitButton.onclick = async () => {

    if (titleInput.value.trim() === "" || bodyInput.value.trim() === "") {
        alert("TITLE / BODY REQUIRED");
        return;
    }

    const recordRef = push(ref(db, "records"));

    try {

        await set(recordRef, {
            title: titleInput.value,
            body: bodyInput.value,
            author_id: member.member_id,
            author_name: member.username,
            created_at: new Date().toISOString(),
            reactions: {}
        });

        location.href = "record-detail.html?id=" + recordRef.key;

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
