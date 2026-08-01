// =================================
// ARG Control
// Task Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, tx } from "./common.js";

const member = getLoggedInMember();

initHeader();


const params = new URLSearchParams(location.search);
const taskID = params.get("id");

if (!taskID) {
    alert("TASK ID NOT FOUND");
    location.href = "tasks.html";
}


const titleElement = document.getElementById("title");
const assigneeElement = document.getElementById("assignee");
const authorElement = document.getElementById("author");
const dueDateElement = document.getElementById("dueDate");
const statusElement = document.getElementById("status");
const bodyElement = document.getElementById("body");
const controlArea = document.getElementById("controlArea");
const toggleButton = document.getElementById("toggleButton");
const editButton = document.getElementById("editButton");
const deleteButton = document.getElementById("deleteButton");

let currentTask = null;


function render(task) {

    titleElement.textContent = task.title;
    assigneeElement.textContent = task.assignee_name || "未割当";
    authorElement.textContent = task.author_name;
    dueDateElement.textContent = task.due_date || "-";
    statusElement.textContent = task.status === "done" ? "完了" : "未完了";
    bodyElement.textContent = task.body;

    toggleButton.textContent = task.status === "done" ? "未完了に戻す" : "完了にする";

}


get(ref(db, "tasks/" + taskID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("TASK NOT FOUND");
            location.href = "tasks.html";
            return;
        }

        currentTask = snapshot.val();

        render(currentTask);

        const canManage = currentTask.author_id === member.member_id ||
            currentTask.assignee_id === member.member_id ||
            Number(member.access_level) >= 4;

        if (canManage) {

            controlArea.style.display = "block";

            toggleButton.onclick = async () => {

                const newStatus = currentTask.status === "done" ? "pending" : "done";

                try {
                    await update(ref(db, "tasks/" + taskID), { status: newStatus });
                    currentTask.status = newStatus;
                    render(currentTask);
                } catch (error) {
                    console.error(error);
                    alert("SYSTEM ERROR");
                }

            };

            editButton.onclick = () => location.href = "task-edit.html?id=" + taskID;

            deleteButton.onclick = async () => {

                if (!confirm(tx("このタスクを削除しますか？"))) return;

                try {
                    await remove(ref(db, "tasks/" + taskID));
                    alert("DELETE COMPLETE");
                    location.href = "tasks.html";
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
