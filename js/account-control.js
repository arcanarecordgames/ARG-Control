// =================================
// ARG Control
// Account Control System
// メンバーリストや権限編集に含まれない、アカウント個別の詳細設定
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { hashPassword } from "./security.js";
import { getLoggedInMember, requireAdmin, initHeader, logSystemAction, tx } from "./common.js";

const admin = getLoggedInMember();
requireAdmin(admin);

initHeader();


const memberSelect = document.getElementById("memberSelect");
const detailArea = document.getElementById("detailArea");

const detailMID = document.getElementById("detailMID");
const detailUsername = document.getElementById("detailUsername");
const detailLevel = document.getElementById("detailLevel");
const detailStatus = document.getElementById("detailStatus");
const detailCreatedAt = document.getElementById("detailCreatedAt");
const detailFailCount = document.getElementById("detailFailCount");

const newPasswordInput = document.getElementById("newPasswordInput");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const resetFailCountButton = document.getElementById("resetFailCountButton");

let members = {};
let currentID = "";


// メンバー一覧を取得してプルダウンに反映

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) return;

        members = snapshot.val();

        Object.keys(members).forEach((id) => {

            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${members[id].username} (${id})`;

            memberSelect.appendChild(option);

        });

    })
    .catch((error) => console.error(error));


memberSelect.onchange = () => {

    currentID = memberSelect.value;

    if (!currentID) {
        detailArea.style.display = "none";
        return;
    }

    const data = members[currentID];

    detailMID.textContent = currentID;
    detailUsername.textContent = data.username;
    detailLevel.textContent = data.access_level;
    detailStatus.textContent = data.status;
    detailCreatedAt.textContent = data.created_at ? new Date(data.created_at).toLocaleString("ja-JP") : "-";
    detailFailCount.textContent = data.failed_login_count || 0;

    newPasswordInput.value = "";

    detailArea.style.display = "block";

};


resetPasswordButton.onclick = async () => {

    if (!currentID) return;

    const newPassword = newPasswordInput.value;

    if (newPassword.length < 4) {
        alert(tx("パスワードは4文字以上にしてください"));
        return;
    }

    if (!confirm(tx(`${members[currentID].username} (${currentID}) のパスワードをリセットします。よろしいですか？`))) return;

    try {

        const newHash = await hashPassword(newPassword);

        await update(ref(db, "members/" + currentID), { password_hash: newHash });
        await logSystemAction(admin, "PASSWORD_FORCE_RESET", `${members[currentID].username} (${currentID})`);

        alert(tx("パスワードをリセットしました"));
        newPasswordInput.value = "";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};


resetFailCountButton.onclick = async () => {

    if (!currentID) return;

    try {

        await update(ref(db, "members/" + currentID), { failed_login_count: 0 });
        await logSystemAction(admin, "FAILED_LOGIN_COUNT_RESET", `${members[currentID].username} (${currentID})`);

        detailFailCount.textContent = "0";
        members[currentID].failed_login_count = 0;

        alert(tx("ログイン失敗回数をリセットしました"));

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
