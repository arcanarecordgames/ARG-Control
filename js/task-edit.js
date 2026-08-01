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

import { getLoggedInMember, initHeader, pushNews, logSystemAction } from "./common.js";

const member = getLoggedInMember();

initHeader();


const params = new URLSearchParams(location.search);
const taskID = params.get("id");

if (!taskID) {
    alert("TASK ID NOT FOUND");
    location.href = "tasks.html";
}


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const assigneeSelect = document.getElementById("assigneeSelect");
const mentionSelect = document.getElementById("mentionSelect");
const updateButton = document.getElementById("updateButton");

let currentTask = null;


async function loadMembers(selectedAssigneeID, selectedMentionIDs) {

    const snapshot = await get(ref(db, "members"));

    if (!snapshot.exists()) return;

    const members = snapshot.val();

    Object.keys(members).forEach((id) => {

        const data = members[id];
        const label = `${data.username} (${id})`;

        const assigneeOption = document.createElement("option");
        assigneeOption.value = id;
        assigneeOption.textContent = label;
        if (id === selectedAssigneeID) assigneeOption.selected = true;
        assigneeSelect.appendChild(assigneeOption);

        const mentionOption = document.createElement("option");
        mentionOption.value = id;
        mentionOption.textContent = label;
        if (selectedMentionIDs.includes(id)) mentionOption.selected = true;
        mentionSelect.appendChild(mentionOption);

    });

}


// =================================
// 日付選択（カレンダークリック方式） ※ task-new.js と同じ仕組み
// =================================

let selectedDueDate = "";
let pickerYear = new Date().getFullYear();
let pickerMonth = new Date().getMonth();

const dueDateButton = document.getElementById("dueDateButton");
const dueDateCalendar = document.getElementById("dueDateCalendar");

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function renderDueDateCalendar() {

    dueDateCalendar.innerHTML = "";

    const nav = document.createElement("div");
    nav.style.cssText = "grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    nav.innerHTML = `
        <button type="button" id="pickerPrev" style="width:auto;padding:4px 10px;">&lt;</button>
        <span>${pickerYear}年 ${pickerMonth + 1}月</span>
        <button type="button" id="pickerNext" style="width:auto;padding:4px 10px;">&gt;</button>
    `;
    dueDateCalendar.appendChild(nav);

    DOW.forEach((d) => {
        const el = document.createElement("div");
        el.className = "calendar-dow";
        el.textContent = d;
        dueDateCalendar.appendChild(el);
    });

    const firstDay = new Date(pickerYear, pickerMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
        const el = document.createElement("div");
        el.className = "calendar-day outside";
        dueDateCalendar.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {

        const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const el = document.createElement("div");
        el.className = "calendar-day";
        if (dateStr === selectedDueDate) el.classList.add("selected");
        el.textContent = d;

        el.onclick = () => {
            selectedDueDate = dateStr;
            dueDateButton.textContent = "📅 " + dateStr;
            dueDateCalendar.style.display = "none";
        };

        dueDateCalendar.appendChild(el);

    }

    document.getElementById("pickerPrev").onclick = () => {
        pickerMonth--;
        if (pickerMonth < 0) { pickerMonth = 11; pickerYear--; }
        renderDueDateCalendar();
    };

    document.getElementById("pickerNext").onclick = () => {
        pickerMonth++;
        if (pickerMonth > 11) { pickerMonth = 0; pickerYear++; }
        renderDueDateCalendar();
    };

}

dueDateButton.onclick = () => {

    const show = dueDateCalendar.style.display === "none";
    dueDateCalendar.style.display = show ? "grid" : "none";

    if (show) renderDueDateCalendar();

};


// =================================
// 読み込み
// =================================

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

        if (currentTask.due_date) {
            selectedDueDate = currentTask.due_date;
            dueDateButton.textContent = "📅 " + currentTask.due_date;
            const [y, m] = currentTask.due_date.split("-").map(Number);
            pickerYear = y;
            pickerMonth = m - 1;
        }

        await loadMembers(currentTask.assignee_id, currentTask.mentions || []);

    });


// =================================
// 更新
// =================================

updateButton.onclick = async () => {

    if (titleInput.value.trim() === "") {
        alert("TITLE REQUIRED");
        return;
    }

    const newAssigneeID = assigneeSelect.value;
    const newAssigneeName = newAssigneeID ? assigneeSelect.options[assigneeSelect.selectedIndex].textContent : "";
    const newMentionIDs = Array.from(mentionSelect.selectedOptions).map((option) => option.value);

    const oldAssigneeID = currentTask.assignee_id;
    const oldMentionIDs = currentTask.mentions || [];

    try {

        await update(ref(db, "tasks/" + taskID), {
            title: titleInput.value,
            body: bodyInput.value,
            due_date: selectedDueDate,
            assignee_id: newAssigneeID || null,
            assignee_name: newAssigneeID ? newAssigneeName : "",
            mentions: newMentionIDs,
            updated_at: new Date().toISOString()
        });

        // 担当者が変更された場合、新しい担当者に通知（自分自身は除く）
        if (newAssigneeID && newAssigneeID !== oldAssigneeID && newAssigneeID !== member.member_id) {
            await pushNews("task", `タスクの担当者に指定されました：${titleInput.value}`, "task-detail.html?id=" + taskID, newAssigneeID);
        }

        // 新たに追加されたメンションにのみ通知
        const addedMentions = newMentionIDs.filter((id) => !oldMentionIDs.includes(id) && id !== member.member_id);

        await Promise.all(
            addedMentions.map((id) => pushNews("task", `タスクでメンションされました：${titleInput.value}`, "task-detail.html?id=" + taskID, id))
        );

        await logSystemAction(member, "TASK_EDIT", titleInput.value);

        alert("UPDATE COMPLETE");
        location.href = "task-detail.html?id=" + taskID;

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
