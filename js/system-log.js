// =================================
// ARG Control
// System Log (Audit Log) System
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


const logList = document.getElementById("logList");

get(ref(db, "system_logs"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            logList.innerHTML = `<tr><td colspan="5">NO DATA</td></tr>`;
            return;
        }

        const logs = snapshot.val();

        logList.innerHTML = "";

        // 新しい順に表示
        Object.keys(logs).reverse().forEach((id) => {

            const data = logs[id];

            logList.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.time)}</td>
                    <td>${escapeHTML(data.member_name)} (${escapeHTML(data.member_id)})</td>
                    <td>${escapeHTML(data.action)}</td>
                    <td>${escapeHTML(data.detail)}</td>
                    <td>${escapeHTML(data.page)}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        logList.innerHTML = `<tr><td colspan="5">SYSTEM ERROR</td></tr>`;

    });
