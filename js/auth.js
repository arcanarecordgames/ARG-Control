// =================================
// ARG Control
// Authentication System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    push,
    set,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { hashPassword } from "./security.js";
import { applySavedTheme, applyI18n, startSession, tx } from "./common.js";

// この端末に記憶されているテーマを適用（未ログインでも見た目を統一するため）
applySavedTheme();
applyI18n();

// 数字以外の入力を弾く
const memberNumberInput = document.getElementById("memberNumber");

if (memberNumberInput) {
    memberNumberInput.oninput = () => {
        memberNumberInput.value = memberNumberInput.value.replace(/[^0-9]/g, "");
    };
}

// 自動ログアウトで送還されてきた場合、その旨を知らせる
if (localStorage.getItem("ARG_AUTO_LOGOUT_FLAG")) {

    localStorage.removeItem("ARG_AUTO_LOGOUT_FLAG");

    const messageEl = document.getElementById("message");
    if (messageEl) messageEl.innerHTML = tx("しばらく操作が確認できなかったため、自動的にログアウトしました。");

}


async function createLoginLog(data) {

    const logRef = push(ref(db, "login_logs"));

    await set(logRef, data);

}


async function getSystemSettings() {

    const snapshot = await get(ref(db, "settings/system"));

    return snapshot.exists() ? snapshot.val() : {};

}


window.login = async function () {

    const memberNumber = document.getElementById("memberNumber").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (memberNumber === "" || password === "") {
        message.innerHTML = "INPUT ERROR";
        return;
    }

    const memberID = "ARG-" + memberNumber.padStart(5, "0");

    try {

        const snapshot = await get(ref(db, "members/" + memberID));

        if (!snapshot.exists()) {

            await createLoginLog({
                member_id: memberID,
                result: "MEMBER ID NOT FOUND",
                time: new Date().toISOString()
            });

            message.innerHTML = "MEMBER ID NOT FOUND";
            return;
        }

        const member = snapshot.val();

        const hashedPassword = await hashPassword(password);

        const settings = await getSystemSettings();

        if (hashedPassword !== member.password_hash) {

            await createLoginLog({
                member_id: memberID,
                result: "PASSWORD ERROR",
                time: new Date().toISOString()
            });

            // システム設定: n回パスワード誤りで自動ロック
            const threshold = Number(settings.login_lockout_threshold) || 0;

            if (threshold > 0) {

                const failCount = (Number(member.failed_login_count) || 0) + 1;

                if (failCount >= threshold) {

                    await update(ref(db, "members/" + memberID), {
                        failed_login_count: failCount,
                        status: "locked"
                    });

                    await createLoginLog({
                        member_id: memberID,
                        result: "ACCOUNT LOCKED (AUTO)",
                        time: new Date().toISOString()
                    });

                    message.innerHTML = "ACCOUNT LOCKED";
                    return;

                }

                await update(ref(db, "members/" + memberID), { failed_login_count: failCount });

            }

            message.innerHTML = "PASSWORD ERROR";
            return;
        }

        // システム設定: メンテナンスモード中はACCESS LEVEL 5以外ログイン不可
        if (settings.maintenance_mode && Number(member.access_level) !== 5) {

            await createLoginLog({
                member_id: memberID,
                username: member.username,
                result: "LOGIN BLOCKED (MAINTENANCE)",
                time: new Date().toISOString()
            });

            message.innerHTML = "SYSTEM MAINTENANCE";
            return;
        }

        if (member.status !== "active") {

            if (member.status === "locked") {

                await createLoginLog({
                    member_id: memberID,
                    result: "ACCOUNT LOCKED",
                    time: new Date().toISOString()
                });

                message.innerHTML = "ACCOUNT LOCKED";

            } else if (member.status === "suspended") {

                await createLoginLog({
                    member_id: memberID,
                    result: "ACCOUNT SUSPENDED",
                    time: new Date().toISOString()
                });

                message.innerHTML = "ACCOUNT SUSPENDED";

            } else {

                message.innerHTML = "ACCOUNT UNAVAILABLE";

            }

            return;
        }

        await createLoginLog({
            member_id: memberID,
            username: member.username,
            result: "LOGIN SUCCESS",
            time: new Date().toISOString()
        });

        // ログイン成功時は失敗カウントをリセット
        if (member.failed_login_count) {
            await update(ref(db, "members/" + memberID), { failed_login_count: 0 });
            member.failed_login_count = 0;
        }

        localStorage.setItem("ARG_MEMBER", JSON.stringify(member));

        await startSession(member);

        location.href = "dashboard.html";

    } catch (error) {

        console.error(error);
        message.innerHTML = "SYSTEM ERROR";

    }

};
