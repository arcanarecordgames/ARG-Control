// =================================
// ARG Control
// Online Time (Session Analytics) System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, escapeHTML } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

initHeader();


const memberSelect = document.getElementById("memberSelect");
const rangeSelect = document.getElementById("rangeSelect");
const chartArea = document.getElementById("chartArea");
const dataTable = document.getElementById("dataTable");

let allSessions = [];
let membersMap = {};


function toLocalDateStr(date) {
    const p2 = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}

// 直近N日ぶんの日付配列(古い→新しい順)を作る
function buildDateRange(days) {

    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        result.push(toLocalDateStr(d));
    }

    return result;

}

// 指定メンバーの日別オンライン時間(時間単位)を集計する
function aggregateHours(memberId) {

    const byDate = {};

    allSessions
        .filter((s) => s.member_id === memberId)
        .forEach((s) => {

            const start = new Date(s.start).getTime();
            const end = new Date(s.end || s.last_seen || s.start).getTime();

            if (isNaN(start) || isNaN(end) || end < start) return;

            const hours = (end - start) / (1000 * 60 * 60);
            const dateKey = s.date || toLocalDateStr(new Date(s.start));

            byDate[dateKey] = (byDate[dateKey] || 0) + hours;

        });

    return byDate;

}

function renderChart() {

    const memberId = memberSelect.value;

    if (!memberId) {
        chartArea.innerHTML = `<p style="opacity:0.6;">対象メンバーを選択してください</p>`;
        dataTable.innerHTML = "";
        return;
    }

    const days = Number(rangeSelect.value);
    const dateRange = buildDateRange(days);
    const byDate = aggregateHours(memberId);

    const maxHours = Math.max(1, ...dateRange.map((d) => byDate[d] || 0));

    chartArea.innerHTML = "";

    dateRange.forEach((dateStr) => {

        const hours = byDate[dateStr] || 0;
        const heightPercent = Math.max(1, Math.round((hours / maxHours) * 100));
        const shortLabel = dateStr.slice(5).replace("-", "/"); // MM/DD

        const wrap = document.createElement("div");
        wrap.className = "chart-bar-wrap";

        wrap.innerHTML = `
            <div class="chart-bar-value">${hours > 0 ? hours.toFixed(1) + "h" : ""}</div>
            <div class="chart-bar" style="height:${heightPercent}%;" title="${dateStr} : ${hours.toFixed(2)}時間"></div>
            <div class="chart-bar-label">${shortLabel}</div>
        `;

        chartArea.appendChild(wrap);

    });

    // 表（正確な数値の一覧）
    dataTable.innerHTML = "";

    dateRange.slice().reverse().forEach((dateStr) => {

        const hours = byDate[dateStr] || 0;

        dataTable.innerHTML += `
            <tr>
                <td>${escapeHTML(dateStr)}</td>
                <td>${hours.toFixed(2)} 時間</td>
            </tr>
        `;

    });

}


// メンバー一覧・セッション一覧を取得

Promise.all([
    get(ref(db, "members")),
    get(ref(db, "sessions"))
])
    .then(([membersSnap, sessionsSnap]) => {

        if (membersSnap.exists()) {

            membersMap = membersSnap.val();

            Object.keys(membersMap).forEach((id) => {

                const option = document.createElement("option");
                option.value = id;
                option.textContent = `${membersMap[id].username} (${id})`;

                memberSelect.appendChild(option);

            });

        }

        allSessions = sessionsSnap.exists() ? Object.values(sessionsSnap.val()) : [];

        chartArea.innerHTML = `<p style="opacity:0.6;">対象メンバーを選択してください</p>`;

    })
    .catch((error) => {

        console.error(error);
        chartArea.innerHTML = `<p>SYSTEM ERROR</p>`;

    });


memberSelect.onchange = renderChart;
rangeSelect.onchange = renderChart;
