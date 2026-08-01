// =================================
// ARG Control
// Admin Authorization System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, escapeHTML, pushNews, logSystemAction, tx } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

initHeader();


// 管理者情報表示

const adminName = document.getElementById("adminName");
const adminID = document.getElementById("adminID");
const adminLevel = document.getElementById("adminLevel");

if (adminName) adminName.textContent = member.username;
if (adminID) adminID.textContent = member.member_id;
if (adminLevel) adminLevel.textContent = member.access_level;


// MEMBER DATABASE取得

const memberList = document.getElementById("memberList");

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            memberList.innerHTML = `<tr><td colspan="4">NO DATA</td></tr>`;
            return;
        }

        const members = snapshot.val();

        memberList.innerHTML = "";

        Object.keys(members).forEach((id) => {

            const data = members[id];

            memberList.innerHTML += `
                <tr>
                    <td>${escapeHTML(id)}</td>
                    <td>${escapeHTML(data.username)}</td>
                    <td>${escapeHTML(data.access_level)}</td>
                    <td>${escapeHTML(data.status)}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        memberList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });


// =================================
// ニュース投稿（管理者からのお知らせ配信）
// =================================

const newsTitleInput = document.getElementById("newsTitleInput");
const newsTargetSelect = document.getElementById("newsTargetSelect");
const newsUrlInput = document.getElementById("newsUrlInput");
const postNewsButton = document.getElementById("postNewsButton");

// 宛先プルダウンにメンバー一覧を追加

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) return;

        const members = snapshot.val();

        Object.keys(members).forEach((id) => {

            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${members[id].username} (${id})`;

            newsTargetSelect.appendChild(option);

        });

    });

postNewsButton.onclick = async () => {

    if (newsTitleInput.value.trim() === "") {
        alert(tx("タイトルを入力してください"));
        return;
    }

    try {

        await pushNews(
            "announcement",
            newsTitleInput.value,
            newsUrlInput.value.trim(),
            newsTargetSelect.value || null
        );

        await logSystemAction(member, "NEWS_POST", newsTitleInput.value);

        alert(tx("ニュースを投稿しました"));

        newsTitleInput.value = "";
        newsUrlInput.value = "";
        newsTargetSelect.value = "";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
