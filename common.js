// =================================
// ARG Control
// Common Utilities
// =================================
// 各画面で重複していたログイン確認 / 管理者確認 / ログアウト処理をここに集約

import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =================================
// テーマ / デザインスタイル
// =================================

// カラーテーマ定義（背景色・アクセントカラーなど）
const THEMES = {

    cyan: {
        "--bg-radial-1": "#101820", "--bg-radial-2": "#030303",
        "--text-color": "#00ffff", "--accent": "#00ffff", "--accent-rgb": "0,255,255",
        "--success": "#00ff88",
        "--panel-bg": "rgba(0,0,0,0.75)", "--card-bg": "rgba(0,0,0,0.5)",
        "--input-bg": "#050505", "--input-text": "#ffffff", "--on-accent": "#000000"
    },

    blue: {
        "--bg-radial-1": "#0a1a2f", "--bg-radial-2": "#010208",
        "--text-color": "#3399ff", "--accent": "#3399ff", "--accent-rgb": "51,153,255",
        "--success": "#33d1ff",
        "--panel-bg": "rgba(0,10,30,0.75)", "--card-bg": "rgba(0,10,30,0.5)",
        "--input-bg": "#05070d", "--input-text": "#eaf3ff", "--on-accent": "#001327"
    },

    green: {
        "--bg-radial-1": "#0a1f0f", "--bg-radial-2": "#020a03",
        "--text-color": "#33ff66", "--accent": "#33ff66", "--accent-rgb": "51,255,102",
        "--success": "#a8ff33",
        "--panel-bg": "rgba(0,20,5,0.75)", "--card-bg": "rgba(0,20,5,0.5)",
        "--input-bg": "#030a04", "--input-text": "#eaffef", "--on-accent": "#001a06"
    },

    red: {
        "--bg-radial-1": "#2a0a0a", "--bg-radial-2": "#0a0202",
        "--text-color": "#ff5577", "--accent": "#ff3355", "--accent-rgb": "255,51,85",
        "--success": "#ffaa33",
        "--panel-bg": "rgba(20,0,0,0.75)", "--card-bg": "rgba(20,0,0,0.5)",
        "--input-bg": "#0a0303", "--input-text": "#ffecec", "--on-accent": "#1a0000"
    },

    purple: {
        "--bg-radial-1": "#1a0a2a", "--bg-radial-2": "#06020a",
        "--text-color": "#c68cff", "--accent": "#b266ff", "--accent-rgb": "178,102,255",
        "--success": "#66ffe0",
        "--panel-bg": "rgba(15,0,25,0.75)", "--card-bg": "rgba(15,0,25,0.5)",
        "--input-bg": "#0a0512", "--input-text": "#f3eaff", "--on-accent": "#14001f"
    },

    light: {
        "--bg-radial-1": "#f5f7fa", "--bg-radial-2": "#e2e6ee",
        "--text-color": "#1f2937", "--accent": "#2563eb", "--accent-rgb": "37,99,235",
        "--success": "#059669",
        "--panel-bg": "rgba(255,255,255,0.9)", "--card-bg": "rgba(255,255,255,0.75)",
        "--input-bg": "#ffffff", "--input-text": "#1f2937", "--on-accent": "#ffffff"
    }

};

// デザインスタイル定義（フォント・角丸・影の強さなど）
const STYLES = {

    terminal: {
        "--font-family": '"Courier New","Consolas",monospace',
        "--letter-spacing": "1px", "--radius": "0px",
        "--hover-transform": "translateY(-5px)",
        "--shadow-blur": "15px", "--shadow-blur-hover": "20px"
    },

    modern: {
        "--font-family": '-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        "--letter-spacing": "0px", "--radius": "12px",
        "--hover-transform": "translateY(-3px) scale(1.01)",
        "--shadow-blur": "6px", "--shadow-blur-hover": "12px"
    },

    classic: {
        "--font-family": 'Georgia,"Times New Roman","Yu Mincho",serif',
        "--letter-spacing": "0.3px", "--radius": "4px",
        "--hover-transform": "translateY(-2px)",
        "--shadow-blur": "3px", "--shadow-blur-hover": "6px"
    }

};

export const THEME_NAMES = Object.keys(THEMES);
export const STYLE_NAMES = Object.keys(STYLES);


// テーマ・スタイルを画面に適用し、この端末に記憶する
export function applyTheme(themeName, styleName) {

    const theme = THEMES[themeName] || THEMES.cyan;
    const style = STYLES[styleName] || STYLES.terminal;

    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
    Object.entries(style).forEach(([key, value]) => root.style.setProperty(key, value));

    localStorage.setItem("ARG_THEME", THEMES[themeName] ? themeName : "cyan");
    localStorage.setItem("ARG_STYLE", STYLES[styleName] ? styleName : "terminal");

}

// この端末に記憶されているテーマを反映する（未ログイン画面でも使用）
export function applySavedTheme() {

    const themeName = localStorage.getItem("ARG_THEME") || "cyan";
    const styleName = localStorage.getItem("ARG_STYLE") || "terminal";

    applyTheme(themeName, styleName);

}

// アカウントに保存されているテーマ設定を取得し、この端末のキャッシュより優先して反映する
// (他の端末で設定したテーマを、ログイン後に自動で反映するため)
async function syncThemeFromAccount(member) {

    try {

        const snapshot = await get(ref(db, "members/" + member.member_id + "/preferences"));

        if (snapshot.exists()) {

            const prefs = snapshot.val();
            applyTheme(prefs.theme, prefs.style);

        }

    } catch (error) {

        console.error(error);

    }

}


// ログイン中のメンバー情報を取得する
// 未ログインの場合は index.html へ強制送還する
export function getLoggedInMember() {

    const memberData = localStorage.getItem("ARG_MEMBER");

    if (!memberData) {
        location.href = "index.html";
        throw new Error("NOT LOGGED IN");
    }

    const member = JSON.parse(memberData);

    // この端末に記憶されているテーマをすぐに反映（体感速度優先）
    applySavedTheme();

    // アカウント側の設定があれば非同期で取得して反映する
    syncThemeFromAccount(member);

    return member;
}

// 管理者権限(access_level 4以上)を要求する
// 権限が無ければ警告してダッシュボードへ戻す
export function requireAdmin(member) {

    if (Number(member.access_level) < 4) {
        alert("ACCESS DENIED");
        location.href = "dashboard.html";
        throw new Error("ACCESS DENIED");
    }
}

// access_level が 5 (最高権限/FOUNDER) かどうかを判定する
// システム設定など、最上位権限者のみに許可する操作のガードに使う
export function isLevel5(member) {
    return Number(member.access_level) === 5;
}

// ログアウト処理
export function logout() {

    localStorage.removeItem("ARG_MEMBER");
    location.href = "index.html";
}

// 各画面ヘッダーの STATUS 表示の隣に LOGOUT ボタンを自動挿入する
// HTML側の変更を増やさずにログアウト機能を全画面へ配布するための仕組み
export function attachLogoutButton() {

    const statusArea = document.querySelector(".system-status");

    if (!statusArea) return;

    const button = document.createElement("button");

    button.textContent = "LOGOUT";
    button.id = "logoutButton";
    button.style.cssText =
        "width:auto;display:inline-block;padding:6px 16px;margin-left:15px;font-size:12px;vertical-align:middle;";

    button.onclick = logout;

    statusArea.appendChild(button);
}

// innerHTML へ差し込むテキストをエスケープする（XSS対策）
// メンバー名・メール件名など、他メンバーが入力した文字列を表示する箇所で必ず使用する
export function escapeHTML(value) {

    if (value === undefined || value === null) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
