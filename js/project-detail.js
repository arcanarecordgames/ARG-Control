// =================================
// ARG Control
// Project Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


const params = new URLSearchParams(location.search);
const projectID = params.get("id");

if (!projectID) {
    alert("PROJECT ID NOT FOUND");
    location.href = "projects.html";
}


const titleElement = document.getElementById("title");
const authorElement = document.getElementById("author");
const dateElement = document.getElementById("date");
const bodyElement = document.getElementById("body");
const controlArea = document.getElementById("controlArea");
const editButton = document.getElementById("editButton");
const deleteButton = document.getElementById("deleteButton");


get(ref(db, "projects/" + projectID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("PROJECT NOT FOUND");
            location.href = "projects.html";
            return;
        }

        const project = snapshot.val();

        titleElement.textContent = project.title;
        authorElement.textContent = project.author_name;
        dateElement.textContent = new Date(project.created_at).toLocaleString("ja-JP");
        bodyElement.textContent = project.body;

        // 投稿者本人 または 管理者(access_level >= 4)のみ編集・削除を表示
        const isOwner = project.author_id === member.member_id;
        const isAdmin = Number(member.access_level) >= 4;

        if (isOwner || isAdmin) {

            controlArea.style.display = "block";

            editButton.onclick = () => location.href = "project-edit.html?id=" + projectID;

            deleteButton.onclick = async () => {

                if (!confirm("この企画を削除しますか？")) return;

                try {
                    await remove(ref(db, "projects/" + projectID));
                    alert("DELETE COMPLETE");
                    location.href = "projects.html";
                } catch (error) {
                    console.error(error);
                    alert("SYSTEM ERROR");
                }

            };

        }

    })
    .catch((error) => {

        console.error(error);
        alert("SYSTEM ERROR");

    });
