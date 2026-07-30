// =================================
// ARG Control
// Task Edit System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


const params = new URLSearchParams(location.search);
const taskID = params.get("id");

if (!taskID) {
    alert("TASK ID NOT FOUND");
    location.href = "tasks.html";
}


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const dueDateInput = document.getElementById("dueDate");
const assigneeSelect = document.getElementById("assigneeSelect");
const updateButton = document.getElementById("updateButton");

let currentTask = null;


async function loadMembers(selectedID) {

    const snapshot = await get(ref(db, "members"));

    if (!snapshot.exists()) return;

    const members = snapshot.val();

    Object.keys(members).forEach((id) => {

        const data = members[id];

        const option = document.createElement("option");

        option.value = id;
        option.textContent = `${data.username} (${id})`;

        if (id === selectedID) option.selected = true;

        assigneeSelect.appendChild(option);

    });

}


get(ref(db, "tasks/" + taskID))
    .then(async (snapshot) => {

        if (!snapshot.exists()) {
            alert("TASK NOT FOUND");
            location.href = "tasks.html";
            return;
        }

        currentTask = snapshot.val();

        const canManage = currentTask.author_id === member.member_id ||
            currentTask.assignee_id === member.member_id ||
            Number(member.access_level) >= 4;

        if (!canManage) {
            alert("ACCESS DENIED");
            location.href = "task-detail.html?id=" + taskID;
            return;
        }

        titleInput.value = currentTask.title;
        bodyInput.value = currentTask.body;
        dueDateInput.value = currentTask.due_date || "";

        await loadMembers(currentTask.assignee_id);

    });


updateButton.onclick = () => {

    if (titleInput.value.trim() === "") {
        alert("TITLE REQUIRED");
        return;
    }

    const assigneeID = assigneeSelect.value;
    const assigneeName = assigneeID ? assigneeSelect.options[assigneeSelect.selectedIndex].textContent : "";

    update(ref(db, "tasks/" + taskID), {
        title: titleInput.value,
        body: bodyInput.value,
        due_date: dueDateInput.value || "",
        assignee_id: assigneeID || null,
        assignee_name: assigneeID ? assigneeName : "",
        updated_at: new Date().toISOString()
    })
        .then(() => {

            alert("UPDATE COMPLETE");
            location.href = "task-detail.html?id=" + taskID;

        })
        .catch((error) => {

            console.error(error);
            alert("SYSTEM ERROR");

        });

};
