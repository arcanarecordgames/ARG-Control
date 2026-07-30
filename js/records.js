// =================================
// ARG Control
// Record (Thread) List System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton, escapeHTML } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


document.getElementById("newButton").onclick = () => location.href = "record-new.html";


const recordList = document.getElementById("recordList");

get(ref(db, "records"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            recordList.innerHTML = `<tr><td colspan="4">NO DATA</td></tr>`;
            return;
        }

        const records = snapshot.val();

        recordList.innerHTML = "";

        // 新しい順に表示
        Object.keys(records).reverse().forEach((id) => {

            const data = records[id];
            const postCount = data.posts ? Object.keys(data.posts).length : 0;

            recordList.innerHTML += `
                <tr>
                    <td><a href="record-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(data.title)}</a></td>
                    <td>${escapeHTML(data.author_name)}</td>
                    <td>${postCount}</td>
                    <td>${escapeHTML(new Date(data.created_at).toLocaleString("ja-JP"))}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        recordList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });
