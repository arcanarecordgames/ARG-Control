// =================================
// ARG Control
// Task List + Calendar System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, escapeHTML, serenaAnnounce } from "./common.js";

const member = getLoggedInMember();

initHeader();


const newButton = document.getElementById("newButton");
newButton.onclick = () => location.href = "task-new.html";


const calendarHeader = document.getElementById("calendarHeader");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const taskList = document.getElementById("taskList");
const filterLabel = document.getElementById("filterLabel");
const clearFilterButton = document.getElementById("clearFilterButton");

let allTasks = {};
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-11
let selectedDate = null; // "YYYY-MM-DD"

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function renderCalendar() {

    calendarHeader.textContent = `${viewYear}年 ${viewMonth + 1}月`;

    calendarGrid.innerHTML = "";

    DOW.forEach((d) => {
        const el = document.createElement("div");
        el.className = "calendar-dow";
        el.textContent = d;
        calendarGrid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    // タスク件数を日付ごとに集計
    const countByDate = {};

    Object.values(allTasks).forEach((task) => {
        if (!task.due_date) return;
        countByDate[task.due_date] = (countByDate[task.due_date] || 0) + 1;
    });

    // 前月の埋め
    for (let i = 0; i < startWeekday; i++) {
        const el = document.createElement("div");
        el.className = "calendar-day outside";
        calendarGrid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {

        const dateStr = toDateStr(viewYear, viewMonth, d);

        const el = document.createElement("div");
        el.className = "calendar-day";

        if (dateStr === todayStr) el.classList.add("today");
        if (dateStr === selectedDate) el.classList.add("selected");

        const count = countByDate[dateStr] || 0;

        el.innerHTML = `${d}${count > 0 ? `<br><span class="task-count">●${count}</span>` : ""}`;

        el.onclick = () => {
            selectedDate = (selectedDate === dateStr) ? null : dateStr;
            renderCalendar();
            renderTaskList();
        };

        calendarGrid.appendChild(el);

    }

}

function renderTaskList() {

    if (selectedDate) {
        filterLabel.textContent = `${selectedDate} の予定を表示中`;
        clearFilterButton.style.display = "inline-block";
    } else {
        filterLabel.textContent = "すべてのタスク";
        clearFilterButton.style.display = "none";
    }

    const entries = Object.entries(allTasks)
        .filter(([id, task]) => !selectedDate || task.due_date === selectedDate)
        .sort(([, a], [, b]) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));

    if (entries.length === 0) {
        taskList.innerHTML = `<tr><td colspan="4">NO DATA</td></tr>`;
        return;
    }

    taskList.innerHTML = "";

    entries.forEach(([id, task]) => {

        const isDone = task.status === "done";
        const canToggle = task.author_id === member.member_id ||
            task.assignee_id === member.member_id ||
            Number(member.access_level) >= 4;

        taskList.innerHTML += `
            <tr>
                <td>
                    <input type="checkbox" data-id="${escapeHTML(id)}" ${isDone ? "checked" : ""} ${canToggle ? "" : "disabled"}>
                </td>
                <td class="${isDone ? "task-done" : ""}">
                    <a href="task-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(task.title)}</a>
                </td>
                <td>${escapeHTML(task.assignee_name || "未割当")}</td>
                <td>${escapeHTML(task.due_date || "-")}</td>
            </tr>
        `;

    });

    taskList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {

        checkbox.onchange = async () => {

            const id = checkbox.dataset.id;
            const newStatus = checkbox.checked ? "done" : "pending";

            try {
                await update(ref(db, "tasks/" + id), { status: newStatus });
                allTasks[id].status = newStatus;
                renderTaskList();
                renderCalendar();
            } catch (error) {
                console.error(error);
                alert("SYSTEM ERROR");
                checkbox.checked = !checkbox.checked;
            }

        };

    });

}

clearFilterButton.onclick = () => {
    selectedDate = null;
    renderCalendar();
    renderTaskList();
};

prevMonthButton.onclick = () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
};

nextMonthButton.onclick = () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
};


get(ref(db, "tasks"))
    .then((snapshot) => {

        allTasks = snapshot.exists() ? snapshot.val() : {};

        renderCalendar();
        renderTaskList();

    })
    .catch((error) => {

        console.error(error);
        serenaAnnounce("error");
        taskList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });
