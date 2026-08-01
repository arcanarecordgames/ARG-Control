// =================================
// ARG Control
// Settings System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { hashPassword } from "./security.js";
import { getLoggedInMember, initHeader, isLevel5, applyTheme, getLang, setLang, applyI18n, getAutoLogoutMinutes, setAutoLogoutMinutes, tx } from "./common.js";

const member = getLoggedInMember();

initHeader();


// =================================
// デザイン設定（全メンバー共通）
// =================================

const themeSelect = document.getElementById("themeSelect");
const fontSelect = document.getElementById("fontSelect");
const uiSelect = document.getElementById("uiSelect");
const saveDesignButton = document.getElementById("saveDesignButton");

// 現在の設定を読み込み（アカウント優先、無ければこの端末のキャッシュ）

get(ref(db, "members/" + member.member_id + "/preferences"))
    .then((snapshot) => {

        const prefs = snapshot.exists() ? snapshot.val() : {};

        themeSelect.value = prefs.theme || localStorage.getItem("ARG_THEME") || "cyan";
        fontSelect.value = prefs.font || localStorage.getItem("ARG_FONT") || "monospace";
        uiSelect.value = prefs.ui || localStorage.getItem("ARG_UI") || "neon";

    })
    .catch((error) => console.error(error));


// プルダウン変更で即プレビュー

function previewTheme() {
    applyTheme(themeSelect.value, fontSelect.value, uiSelect.value);
}

themeSelect.onchange = previewTheme;
fontSelect.onchange = previewTheme;
uiSelect.onchange = previewTheme;


saveDesignButton.onclick = async () => {

    const theme = themeSelect.value;
    const font = fontSelect.value;
    const ui = uiSelect.value;

    applyTheme(theme, font, ui);

    try {

        await update(ref(db, "members/" + member.member_id + "/preferences"), { theme, font, ui });

        alert("デザイン設定を保存しました");

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};


// =================================
// 言語設定（全メンバー共通）
// =================================

const langSelect = document.getElementById("langSelect");
const saveLangButton = document.getElementById("saveLangButton");

langSelect.value = getLang();

saveLangButton.onclick = async () => {

    setLang(langSelect.value);
    applyI18n();

    try {
        await update(ref(db, "members/" + member.member_id + "/preferences"), { lang: langSelect.value });
    } catch (error) {
        console.error(error);
    }

    alert("言語設定を保存しました。ページを再読み込みするとさらに反映されます。\nLanguage setting saved. Reload the page to fully apply it everywhere.");

};


// =================================
// 個人設定（全メンバー共通）
// =================================

const usernameInput = document.getElementById("username");
const updateUsernameButton = document.getElementById("updateUsernameButton");

const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const changePasswordButton = document.getElementById("changePasswordButton");

usernameInput.value = member.username;


updateUsernameButton.onclick = async () => {

    const newUsername = usernameInput.value.trim();

    if (newUsername === "") {
        alert("USERNAME INPUT ERROR");
        return;
    }

    try {

        await update(ref(db, "members/" + member.member_id), { username: newUsername });

        member.username = newUsername;
        localStorage.setItem("ARG_MEMBER", JSON.stringify(member));

        alert("表示名を更新しました");

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};


changePasswordButton.onclick = async () => {

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (currentPassword === "" || newPassword === "" || confirmPassword === "") {
        alert("INPUT ERROR");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("新しいパスワードが一致しません");
        return;
    }

    if (newPassword.length < 4) {
        alert("パスワードは4文字以上にしてください");
        return;
    }

    try {

        // localStorageのキャッシュではなく、必ず最新のDBデータで現在のパスワードを検証する
        const snapshot = await get(ref(db, "members/" + member.member_id));

        if (!snapshot.exists()) {
            alert("SYSTEM ERROR");
            return;
        }

        const data = snapshot.val();
        const hashedCurrent = await hashPassword(currentPassword);

        if (hashedCurrent !== data.password_hash) {
            alert("現在のパスワードが正しくありません");
            return;
        }

        const newHash = await hashPassword(newPassword);

        await update(ref(db, "members/" + member.member_id), { password_hash: newHash });

        alert("パスワードを変更しました");

        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};


// =================================
// 自動ログアウト設定（全メンバー共通・オフ不可）
// =================================

const autoLogoutSelect = document.getElementById("autoLogoutSelect");
const saveAutoLogoutButton = document.getElementById("saveAutoLogoutButton");

autoLogoutSelect.value = String(getAutoLogoutMinutes());

get(ref(db, "members/" + member.member_id + "/preferences/auto_logout_minutes"))
    .then((snapshot) => {
        if (snapshot.exists()) {
            autoLogoutSelect.value = String(snapshot.val());
            setAutoLogoutMinutes(snapshot.val());
        }
    })
    .catch((error) => console.error(error));

saveAutoLogoutButton.onclick = async () => {

    const minutes = Number(autoLogoutSelect.value);

    setAutoLogoutMinutes(minutes);

    try {
        await update(ref(db, "members/" + member.member_id + "/preferences"), { auto_logout_minutes: minutes });
    } catch (error) {
        console.error(error);
    }

    alert(tx("自動ログアウトまでの時間を保存しました。次のページ読み込みから反映されます。"));

};


// =================================
// システム設定（access_level 5 = FOUNDER 専用）
// =================================

const systemSection = document.getElementById("systemSection");

if (!isLevel5(member)) {

    // レベル5以外にはセクション自体を表示しない
    systemSection.style.display = "none";

} else {

    systemSection.style.display = "block";

    const defaultLevelSelect = document.getElementById("defaultLevelSelect");
    const lockoutThresholdInput = document.getElementById("lockoutThresholdInput");
    const maintenanceModeCheckbox = document.getElementById("maintenanceModeCheckbox");
    const announcementInput = document.getElementById("announcementInput");
    const retentionDaysInput = document.getElementById("retentionDaysInput");
    const saveSystemSettingsButton = document.getElementById("saveSystemSettingsButton");
    const purgeLogsButton = document.getElementById("purgeLogsButton");

    // 現在の設定を読み込み

    get(ref(db, "settings/system"))
        .then((snapshot) => {

            const settings = snapshot.exists() ? snapshot.val() : {};

            defaultLevelSelect.value = settings.default_access_level ?? 2;
            lockoutThresholdInput.value = settings.login_lockout_threshold ?? 0;
            maintenanceModeCheckbox.checked = !!settings.maintenance_mode;
            announcementInput.value = settings.announcement ?? "";
            retentionDaysInput.value = settings.login_log_retention_days ?? 0;

        });


    saveSystemSettingsButton.onclick = async () => {

        // 保存処理側でも必ず二重にチェックする（UI非表示だけに頼らない）
        if (!isLevel5(member)) {
            alert("ACCESS DENIED");
            return;
        }

        try {

            await update(ref(db, "settings/system"), {
                default_access_level: Number(defaultLevelSelect.value),
                login_lockout_threshold: Number(lockoutThresholdInput.value) || 0,
                maintenance_mode: maintenanceModeCheckbox.checked,
                announcement: announcementInput.value,
                login_log_retention_days: Number(retentionDaysInput.value) || 0,
                updated_by: member.member_id,
                updated_at: new Date().toISOString()
            });

            alert("システム設定を保存しました");

        } catch (error) {

            console.error(error);
            alert("SYSTEM ERROR");

        }

    };


    purgeLogsButton.onclick = async () => {

        if (!isLevel5(member)) {
            alert("ACCESS DENIED");
            return;
        }

        const retentionDays = Number(retentionDaysInput.value) || 0;

        if (retentionDays <= 0) {
            alert("保持日数を1以上に設定してください");
            return;
        }

        const confirmMessage = (getLang() === "en")
            ? `Delete login logs older than ${retentionDays} days. Are you sure?`
            : `${retentionDays}日より古いログイン履歴を削除します。よろしいですか？`;

        if (!confirm(confirmMessage)) return;

        try {

            const snapshot = await get(ref(db, "login_logs"));

            if (!snapshot.exists()) {
                alert("削除対象のログはありません");
                return;
            }

            const logs = snapshot.val();
            const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

            let deleteCount = 0;

            for (const id of Object.keys(logs)) {

                const logTime = new Date(logs[id].time).getTime();

                if (logTime < threshold) {
                    await remove(ref(db, "login_logs/" + id));
                    deleteCount++;
                }

            }

            const doneMessage = (getLang() === "en")
                ? `Deleted ${deleteCount} old log(s)`
                : `${deleteCount}件の古いログを削除しました`;

            alert(doneMessage);

        } catch (error) {

            console.error(error);
            alert("SYSTEM ERROR");

        }

    };

}
