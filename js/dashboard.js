// =================================
// ARG Control
// Dashboard System
// =================================

import { getLoggedInMember, initHeader, escapeHTML, markNewsRead, serenaAnnounce } from "./common.js";
import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const member = getLoggedInMember();

initHeader();

// ダッシュボードでは右側の「日時」パネルに時計を表示するため、
// ヘッダー内の簡易時計(共通部品)は重複するので非表示にする
const headerClock = document.getElementById("headerClock");
if (headerClock) headerClock.remove();

document.getElementById("username").textContent = member.username;
document.getElementById("memberID").textContent = member.member_id;
document.getElementById("accessLevel").textContent = member.access_level;
document.getElementById("status").textContent = member.status;

// セレナのログイン挨拶（このブラウザタブのセッション内で最初の1回だけ）
if (!sessionStorage.getItem("ARG_SERENA_GREETED")) {
    sessionStorage.setItem("ARG_SERENA_GREETED", "1");
    serenaAnnounce("login");
}


// =================================
// 日時パネル（リアルタイム時計 + カレンダー）
// =================================

const dashboardClock = document.getElementById("dashboardClock");
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function updateDashboardClock() {

    const now = new Date();
    const p2 = (n) => String(n).padStart(2, "0");

    dashboardClock.textContent =
        `${now.getFullYear()}/${p2(now.getMonth() + 1)}/${p2(now.getDate())}` +
        `(${DOW[now.getDay()]}) ${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}`;

}

updateDashboardClock();
setInterval(updateDashboardClock, 1000);


let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-11

const calHeader = document.getElementById("calHeader");
const calGrid = document.getElementById("dashboardCalendarGrid");

function renderDashboardCalendar() {

    calHeader.textContent = `${calYear}年 ${calMonth + 1}月`;

    calGrid.innerHTML = "";

    DOW.forEach((d) => {
        const el = document.createElement("div");
        el.className = "calendar-dow";
        el.textContent = d;
        calGrid.appendChild(el);
    });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const firstDay = new Date(calYear, calMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
        const el = document.createElement("div");
        el.className = "calendar-day outside";
        calGrid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {

        const el = document.createElement("div");
        el.className = "calendar-day";
        el.style.cursor = "default";
        el.textContent = d;

        if (`${calYear}-${calMonth}-${d}` === todayStr) el.classList.add("today");

        calGrid.appendChild(el);

    }

}

document.getElementById("calPrevMonth").onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderDashboardCalendar();
};

document.getElementById("calNextMonth").onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderDashboardCalendar();
};

renderDashboardCalendar();


// =================================
// お知らせバナー（settings/system/announcement）
// =================================

get(ref(db, "settings/system/announcement"))
    .then((snapshot) => {

        const text = snapshot.exists() ? snapshot.val() : "";

        if (text && text.trim() !== "") {
            document.getElementById("announcementSection").style.display = "block";
            document.getElementById("announcementText").textContent = text;
        }

    })
    .catch((error) => console.error(error));


// =================================
// ニュース一覧
// =================================

const TYPE_LABEL = {
    project: "📁 PROJECT",
    task: "✅ TASK",
    record: "💬 THREAD",
    file: "📎 FILE",
    mail: "✉️ MAIL",
    announcement: "📢 お知らせ"
};

async function loadNews() {

    const newsListEl = document.getElementById("newsList");

    try {

        const [newsSnap, readSnap, tasksSnap] = await Promise.all([
            get(ref(db, "news")),
            get(ref(db, "members/" + member.member_id + "/read_news")),
            get(ref(db, "tasks"))
        ]);

        const readMap = readSnap.exists() ? readSnap.val() : {};
        const items = [];

        // DBに保存されているニュース（企画/スレッド/ファイル/メール/管理者からのお知らせ）
        if (newsSnap.exists()) {

            const news = newsSnap.val();

            Object.keys(news).forEach((id) => {

                const n = news[id];

                // 自分宛て以外(target_member_idが自分でない個別通知)は表示しない
                if (n.target_member_id && n.target_member_id !== member.member_id) return;

                // 既読なら表示しない
                if (readMap[id]) return;

                items.push({
                    id: id,
                    type: n.type,
                    title: n.title,
                    ref_url: n.ref_url,
                    time: n.created_at
                });

            });

        }

        // 期限が近い(3日以内)自分の未完了タスクを、その場で合成したニュースとして追加
        if (tasksSnap.exists()) {

            const tasks = tasksSnap.val();
            const now = new Date();
            const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

            Object.keys(tasks).forEach((id) => {

                const task = tasks[id];

                if (task.assignee_id !== member.member_id) return;
                if (task.status === "done") return;
                if (!task.due_date) return;

                const due = new Date(task.due_date + "T23:59:59");

                if (due < now || due > soon) return;

                const syntheticId = "duetask_" + id;

                if (readMap[syntheticId]) return;

                items.push({
                    id: syntheticId,
                    type: "task",
                    title: `期限が近づいています：${task.title}（${task.due_date} まで）`,
                    ref_url: "task-detail.html?id=" + id,
                    time: task.due_date
                });

            });

        }

        items.sort((a, b) => String(b.time || "").localeCompare(String(a.time || "")));

        // セレナの音声ガイド：新着メール・期限が近いタスクがあれば知らせる
        if (items.some((i) => i.type === "mail")) {
            serenaAnnounce("mail");
        }

        if (items.some((i) => i.type === "task" && String(i.id).startsWith("duetask_"))) {
            serenaAnnounce("task_due");
        }

        if (items.length === 0) {
            newsListEl.innerHTML = `<p style="opacity:0.6;">新しいニュースはありません</p>`;
            return;
        }

        newsListEl.innerHTML = "";

        items.forEach((item) => {

            const div = document.createElement("div");
            div.className = "news-item";

            div.innerHTML = `
                <div class="news-item-main">
                    <span class="news-item-type">${TYPE_LABEL[item.type] || "🔔"}</span>${escapeHTML(item.title)}
                    <div class="news-item-date">${escapeHTML(item.time || "")}</div>
                </div>
                <button type="button" class="news-dismiss">確認済み</button>
            `;

            div.querySelector(".news-item-main").onclick = async () => {
                await markNewsRead(member, item.id);
                if (item.ref_url) location.href = item.ref_url;
            };

            div.querySelector(".news-dismiss").onclick = async (event) => {

                event.stopPropagation();

                await markNewsRead(member, item.id);

                div.remove();

                if (!newsListEl.querySelector(".news-item")) {
                    newsListEl.innerHTML = `<p style="opacity:0.6;">新しいニュースはありません</p>`;
                }

            };

            newsListEl.appendChild(div);

        });

    } catch (error) {

        console.error(error);
        serenaAnnounce("error");
        newsListEl.innerHTML = `<p style="opacity:0.6;">SYSTEM ERROR</p>`;

    }

}

loadNews();
