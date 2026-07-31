// =================================
// ARG Control
// Member Management System
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


// メンバー一覧取得

const memberList = document.getElementById("memberList");

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            memberList.innerHTML = `<tr><td colspan="5">NO DATA</td></tr>`;
            return;
        }

        const members = snapshot.val();

        memberList.innerHTML = "";

        Object.keys(members).forEach((id) => {

            const data = members[id];

            memberList.innerHTML += `
                <tr>
                    <td><a class="member-link" href="member-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(id)}</a></td>
                    <td>${escapeHTML(data.username)}</td>
                    <td>${escapeHTML(data.access_level)}</td>
                    <td>${escapeHTML(data.status)}</td>
                    <td><a class="manage-link" href="account-control.html?id=${encodeURIComponent(id)}">管理</a></td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        memberList.innerHTML = `<tr><td colspan="5">SYSTEM ERROR</td></tr>`;

    });
