// =================================
// ARG Control
// Task New System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const dueDateInput = document.getElementById("dueDate");
const assigneeSelect = document.getElementById("assigneeSelect");
const submitButton = document.getElementById("submitButton");


// 担当者候補を読み込み（未割当 + 自分 + 他メンバー）

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) return;

        const members = snapshot.val();

        Object.keys(members).forEach((id) => {

            const data = members[id];

            const option = document.createElement("option");

            option.value = id;
            option.textContent = `${data.username} (${id})`;

            if (id === member.member_id) option.selected = true;

            assigneeSelect.appendChild(option);

        });

    });


submitButton.onclick = async () => {

    if (titleInput.value.trim() === "") {
        alert("TITLE REQUIRED");
        return;
    }

    const assigneeID = assigneeSelect.value;
    const assigneeName = assigneeID ? assigneeSelect.options[assigneeSelect.selectedIndex].textContent : "";

    const taskRef = push(ref(db, "tasks"));

    try {

        await set(taskRef, {
            title: titleInput.value,
            body: bodyInput.value,
            due_date: dueDateInput.value || "",
            status: "pending",
            assignee_id: assigneeID || null,
            assignee_name: assigneeID ? assigneeName : "",
            author_id: member.member_id,
            author_name: member.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        alert("TASK CREATED");
        location.href = "tasks.html";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
