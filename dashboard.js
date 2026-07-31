// =================================
// ARG Control
// Dashboard System
// =================================

import { getLoggedInMember, initHeader, escapeHTML, markNewsRead } from "./common.js";
import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const member = getLoggedInMember();

initHeader();

document.getElementById("username").textContent = member.username;
document.getElementById("memberID").textContent = member.member_id;
document.getElementById("accessLevel").textContent = member.access_level;
document.getElementById("status").textContent = member.status;


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
        newsListEl.innerHTML = `<p style="opacity:0.6;">SYSTEM ERROR</p>`;

    }

}

loadNews();
