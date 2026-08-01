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

import { getLoggedInMember, initHeader, pushNews, logSystemAction } from "./common.js";

const member = getLoggedInMember();

initHeader();


const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const assigneeSelect = document.getElementById("assigneeSelect");
const mentionSelect = document.getElementById("mentionSelect");
const submitButton = document.getElementById("submitButton");


// 担当者候補・メンション候補を読み込み（未割当 + 自分 + 他メンバー）

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) return;

        const members = snapshot.val();

        Object.keys(members).forEach((id) => {

            const data = members[id];
            const label = `${data.username} (${id})`;

            const assigneeOption = document.createElement("option");
            assigneeOption.value = id;
            assigneeOption.textContent = label;
            if (id === member.member_id) assigneeOption.selected = true;
            assigneeSelect.appendChild(assigneeOption);

            const mentionOption = document.createElement("option");
            mentionOption.value = id;
            mentionOption.textContent = label;
            mentionSelect.appendChild(mentionOption);

        });

    });


// =================================
// 日付選択（カレンダークリック方式）
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
// 送信
// =================================

submitButton.onclick = async () => {

    if (titleInput.value.trim() === "") {
        alert("TITLE REQUIRED");
        return;
    }

    const assigneeID = assigneeSelect.value;
    const assigneeName = assigneeID ? assigneeSelect.options[assigneeSelect.selectedIndex].textContent : "";

    const mentionIDs = Array.from(mentionSelect.selectedOptions).map((option) => option.value);

    const taskRef = push(ref(db, "tasks"));

    try {

        await set(taskRef, {
            title: titleInput.value,
            body: bodyInput.value,
            due_date: selectedDueDate,
            status: "pending",
            assignee_id: assigneeID || null,
            assignee_name: assigneeID ? assigneeName : "",
            mentions: mentionIDs,
            author_id: member.member_id,
            author_name: member.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // 担当者への通知（自分自身が担当の場合は通知しない）
        if (assigneeID && assigneeID !== member.member_id) {
            await pushNews("task", `新しいタスクが割り当てられました：${titleInput.value}`, "task-detail.html?id=" + taskRef.key, assigneeID);
        }

        // メンションされたメンバーへの通知
        await Promise.all(
            mentionIDs
                .filter((id) => id !== member.member_id)
                .map((id) => pushNews("task", `タスクでメンションされました：${titleInput.value}`, "task-detail.html?id=" + taskRef.key, id))
        );

        await logSystemAction(member, "TASK_CREATE", titleInput.value);

        alert("TASK CREATED");
        location.href = "tasks.html";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
