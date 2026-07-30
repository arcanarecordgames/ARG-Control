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
import { applySavedTheme } from "./common.js";

// この端末に記憶されているテーマを適用（未ログインでも見た目を統一するため）
applySavedTheme();


async function createLoginLog(data) {

    const logRef = push(ref(db, "login_logs"));

    await set(logRef, data);

}


async function getSystemSettings() {

    const snapshot = await get(ref(db, "settings/system"));

    return snapshot.exists() ? snapshot.val() : {};

}


window.login = async function () {

    const memberID = document.getElementById("memberID").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (memberID === "" || password === "") {
        message.innerHTML = "INPUT ERROR";
        return;
    }

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

        location.href = "dashboard.html";

    } catch (error) {

        console.error(error);
        message.innerHTML = "SYSTEM ERROR";

    }

};
