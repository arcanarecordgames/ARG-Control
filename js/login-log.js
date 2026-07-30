// =================================
// ARG Control
// Login Log System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, attachLogoutButton, escapeHTML } from "./common.js";

// 修正: このページには元々ログイン確認/管理者確認が一切なく、
// URLを直接開けば誰でも全メンバーのログイン履歴を閲覧できてしまっていた。
const member = getLoggedInMember();
requireAdmin(member);

attachLogoutButton();


// 表示場所

const loginList = document.getElementById("loginList");


// LOGIN LOG取得

get(ref(db, "login_logs"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            loginList.innerHTML = `<tr><td colspan="4">NO DATA</td></tr>`;
            return;
        }

        const logs = snapshot.val();

        loginList.innerHTML = "";

        // 新しい順に表示
        Object.keys(logs).reverse().forEach((id) => {

            const data = logs[id];

            loginList.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.time)}</td>
                    <td>${escapeHTML(data.member_id)}</td>
                    <td>${escapeHTML(data.username ?? "-")}</td>
                    <td>${escapeHTML(data.result)}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        loginList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });
