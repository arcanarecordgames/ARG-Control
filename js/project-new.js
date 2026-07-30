// =================================
// ARG Control
// Project New System
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

    const projectRef = push(ref(db, "projects"));

    try {

        await set(projectRef, {
            title: titleInput.value,
            body: bodyInput.value,
            author_id: member.member_id,
            author_name: member.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        alert("PROJECT POSTED");
        location.href = "projects.html";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
