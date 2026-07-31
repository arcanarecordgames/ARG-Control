// =================================
// ARG Control
// Member Management System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, escapeHTML, logSystemAction, tx } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

initHeader();


const STATUS_LABEL = {
    active: "ACTIVE",
    locked: "LOCKED",
    suspended: "SUSPENDED"
};


// メンバー一覧取得

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

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><a class="member-link" href="member-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(id)}</a></td>
                <td>${escapeHTML(data.username)}</td>
                <td>${escapeHTML(data.access_level)}</td>
                <td>
                    <select style="margin:0 0 0;width:auto;display:inline-block;padding:6px;">
                        <option value="active">ACTIVE</option>
                        <option value="locked">LOCKED</option>
                        <option value="suspended">SUSPENDED</option>
                    </select>
                    <button type="button" style="width:auto;padding:6px 12px;margin-left:6px;">更新</button>
                </td>
            `;

            const statusSelect = tr.querySelector("select");
            const updateBtn = tr.querySelector("button");

            statusSelect.value = data.status;

            updateBtn.onclick = async () => {

                const newStatus = statusSelect.value;

                if (newStatus === data.status) {
                    alert(tx("状態が変更されていません"));
                    return;
                }

                if (!confirm(tx(`${data.username} (${id}) の状態を ${STATUS_LABEL[newStatus]} に変更します。よろしいですか？`))) {
                    statusSelect.value = data.status;
                    return;
                }

                try {

                    await update(ref(db, "members/" + id), { status: newStatus });
                    await logSystemAction(member, "MEMBER_STATUS_CHANGE", `${data.username} (${id}) -> ${newStatus}`);

                    data.status = newStatus;
                    alert(tx("状態を更新しました"));

                } catch (error) {

                    console.error(error);
                    alert("SYSTEM ERROR");
                    statusSelect.value = data.status;

                }

            };

            memberList.appendChild(tr);

        });

    })
    .catch((error) => {

        console.error(error);
        memberList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });
