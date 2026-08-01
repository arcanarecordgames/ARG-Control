// =================================
// ARG Control
// Project Edit System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader } from "./common.js";

const member = getLoggedInMember();

initHeader();


const params = new URLSearchParams(location.search);
const projectID = params.get("id");

if (!projectID) {
    alert("PROJECT ID NOT FOUND");
    location.href = "projects.html";
}


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const updateButton = document.getElementById("updateButton");


get(ref(db, "projects/" + projectID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("PROJECT NOT FOUND");
            location.href = "projects.html";
            return;
        }

        const project = snapshot.val();

        // 投稿者本人 または 管理者(access_level >= 4)のみ編集可能
        const isOwner = project.author_id === member.member_id;
        const isAdmin = Number(member.access_level) >= 4;

        if (!isOwner && !isAdmin) {
            alert("ACCESS DENIED");
            location.href = "project-detail.html?id=" + projectID;
            return;
        }

        titleInput.value = project.title;
        bodyInput.value = project.body;

    });


updateButton.onclick = () => {

    if (titleInput.value.trim() === "" || bodyInput.value.trim() === "") {
        alert("TITLE / BODY REQUIRED");
        return;
    }

    update(ref(db, "projects/" + projectID), {
        title: titleInput.value,
        body: bodyInput.value,
        updated_at: new Date().toISOString()
    })
        .then(() => {

            alert("UPDATE COMPLETE");
            location.href = "project-detail.html?id=" + projectID;

        })
        .catch((error) => {

            console.error(error);
            alert("SYSTEM ERROR");

        });

};
