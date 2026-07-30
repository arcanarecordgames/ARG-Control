// =================================
// ARG Control
// Admin Authorization System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, attachLogoutButton, escapeHTML } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

attachLogoutButton();


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
