// =================================
// ARG Control
// Common Utilities
// =================================
// 各画面で重複していたログイン確認 / 管理者確認 / ログアウト処理 /
// ヘッダー共通部品(ハンバーガーメニュー・時計・タイトルリンク) をここに集約

import { db } from "./firebase-config.js";
import {
    ref,
    get,
    push,
    set,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =================================
// カラーテーマ / フォント / UIスタイル
// =================================

// カラーテーマ定義（ダーク系5種 + ライト系5種）
const THEMES = {

    // ---- ダーク系 ----
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

    // ---- ライト系 ----
    light: {
        "--bg-radial-1": "#f5f7fa", "--bg-radial-2": "#e2e6ee",
        "--text-color": "#1f2937", "--accent": "#2563eb", "--accent-rgb": "37,99,235",
        "--success": "#059669",
        "--panel-bg": "rgba(255,255,255,0.9)", "--card-bg": "rgba(255,255,255,0.75)",
        "--input-bg": "#ffffff", "--input-text": "#1f2937", "--on-accent": "#ffffff"
    },
    "light-pink": {
        "--bg-radial-1": "#fff0f5", "--bg-radial-2": "#ffe1ec",
        "--text-color": "#8a3b5a", "--accent": "#ff6f9c", "--accent-rgb": "255,111,156",
        "--success": "#ff9ec4",
        "--panel-bg": "rgba(255,255,255,0.85)", "--card-bg": "rgba(255,255,255,0.7)",
        "--input-bg": "#ffffff", "--input-text": "#5c2740", "--on-accent": "#ffffff"
    },
    "light-mint": {
        "--bg-radial-1": "#f0fbf6", "--bg-radial-2": "#dcf5ea",
        "--text-color": "#0f5132", "--accent": "#18a37b", "--accent-rgb": "24,163,123",
        "--success": "#0ca678",
        "--panel-bg": "rgba(255,255,255,0.85)", "--card-bg": "rgba(255,255,255,0.7)",
        "--input-bg": "#ffffff", "--input-text": "#0f3d29", "--on-accent": "#ffffff"
    },
    "light-sand": {
        "--bg-radial-1": "#fbf6ea", "--bg-radial-2": "#f3e8d0",
        "--text-color": "#5b4526", "--accent": "#c98a2b", "--accent-rgb": "201,138,43",
        "--success": "#8a9a3a",
        "--panel-bg": "rgba(255,255,255,0.85)", "--card-bg": "rgba(255,255,255,0.7)",
        "--input-bg": "#fffdf8", "--input-text": "#4a3820", "--on-accent": "#ffffff"
    },
    "light-lavender": {
        "--bg-radial-1": "#f5f0fc", "--bg-radial-2": "#e9dcf7",
        "--text-color": "#4a2e7a", "--accent": "#8b5cf6", "--accent-rgb": "139,92,246",
        "--success": "#7c3aed",
        "--panel-bg": "rgba(255,255,255,0.85)", "--card-bg": "rgba(255,255,255,0.7)",
        "--input-bg": "#ffffff", "--input-text": "#3b2360", "--on-accent": "#ffffff"
    }

};

// フォント定義
const FONTS = {

    monospace: { "--font-family": '"Courier New","Consolas",monospace', "--letter-spacing": "1px" },
    sans: { "--font-family": '-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', "--letter-spacing": "0px" },
    serif: { "--font-family": 'Georgia,"Times New Roman","Yu Mincho",serif', "--letter-spacing": "0.3px" },
    handwriting: { "--font-family": '"Klee One","Yomogi","Comic Sans MS",cursive', "--letter-spacing": "0.5px" },
    rounded: { "--font-family": '"Zen Maru Gothic","Hiragino Maru Gothic ProN","Century Gothic",sans-serif', "--letter-spacing": "0.2px" },
    gothic: { "--font-family": '"Yu Gothic","Noto Sans JP",sans-serif', "--letter-spacing": "0px" }

};

// UIスタイル定義（角丸・影・ホバー挙動）
const UI_STYLES = {

    neon: {
        "--radius": "0px", "--hover-transform": "translateY(-5px)",
        "--shadow-blur": "15px", "--shadow-blur-hover": "20px"
    },
    flat: {
        "--radius": "12px", "--hover-transform": "translateY(-3px) scale(1.01)",
        "--shadow-blur": "6px", "--shadow-blur-hover": "12px"
    },
    minimal: {
        "--radius": "6px", "--hover-transform": "translateY(-1px)",
        "--shadow-blur": "2px", "--shadow-blur-hover": "4px"
    },
    cute: {
        "--radius": "26px", "--hover-transform": "translateY(-4px) scale(1.02)",
        "--shadow-blur": "10px", "--shadow-blur-hover": "16px"
    },
    glass: {
        "--radius": "18px", "--hover-transform": "translateY(-3px)",
        "--shadow-blur": "12px", "--shadow-blur-hover": "18px"
    },
    retro: {
        "--radius": "2px", "--hover-transform": "translateY(-2px)",
        "--shadow-blur": "4px", "--shadow-blur-hover": "8px"
    }

};

export const THEME_NAMES = Object.keys(THEMES);
export const FONT_NAMES = Object.keys(FONTS);
export const UI_STYLE_NAMES = Object.keys(UI_STYLES);


// テーマ・フォント・UIスタイルを画面に適用し、この端末に記憶する
export function applyTheme(themeName, fontName, uiStyleName) {

    const theme = THEMES[themeName] || THEMES.cyan;
    const font = FONTS[fontName] || FONTS.monospace;
    const uiStyle = UI_STYLES[uiStyleName] || UI_STYLES.neon;

    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
    Object.entries(font).forEach(([key, value]) => root.style.setProperty(key, value));
    Object.entries(uiStyle).forEach(([key, value]) => root.style.setProperty(key, value));

    localStorage.setItem("ARG_THEME", THEMES[themeName] ? themeName : "cyan");
    localStorage.setItem("ARG_FONT", FONTS[fontName] ? fontName : "monospace");
    localStorage.setItem("ARG_UI", UI_STYLES[uiStyleName] ? uiStyleName : "neon");

}

// この端末に記憶されているテーマを反映する（未ログイン画面でも使用）
export function applySavedTheme() {

    applyTheme(
        localStorage.getItem("ARG_THEME") || "cyan",
        localStorage.getItem("ARG_FONT") || "monospace",
        localStorage.getItem("ARG_UI") || "neon"
    );

}

// アカウントに保存されているテーマ設定を取得し、この端末のキャッシュより優先して反映する
async function syncThemeFromAccount(member) {

    try {

        const snapshot = await get(ref(db, "members/" + member.member_id + "/preferences"));

        if (snapshot.exists()) {

            const prefs = snapshot.val();
            applyTheme(prefs.theme, prefs.font, prefs.ui);

            if (prefs.lang) {
                setLang(prefs.lang);
                applyI18n();
            }

        }

    } catch (error) {
        console.error(error);
    }

}


// =================================
// 言語設定（簡易i18n基盤）
// =================================
// 注意: これは辞書ベースの機械的な翻訳です。ニュアンスの違いや
// 誤訳が含まれる可能性があります（設定画面にもその旨を明記しています）。
//
// 仕組み: 日本語で書かれた画面の静的テキスト(見出し・ラベル・ボタン・
// placeholder等)を、完全一致の辞書引きでその場で英語に置き換えます。
// DBに保存されたユーザー入力内容(企画名・タスク名・メール本文など)や、
// ニュース通知の文面・システムログの内容は翻訳対象外です(誤訳によって
// データの意味が変わって見えることを避けるため)。

const I18N = {

    ja: {
        logout: "ログアウト", back_to_dashboard: "← ダッシュボードへ戻る",
        news: "ニュース", no_news: "新しいニュースはありません",
        my_profile: "自分のプロフィール"
    },
    en: {
        logout: "LOGOUT", back_to_dashboard: "← BACK TO DASHBOARD",
        news: "NEWS", no_news: "No new notifications",
        my_profile: "My Profile"
    }

};

export function getLang() {
    return localStorage.getItem("ARG_LANG") || "ja";
}

export function setLang(lang) {
    localStorage.setItem("ARG_LANG", (lang === "en") ? "en" : "ja");
}

export function t(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || (I18N.ja[key] || key);
}


// 画面の静的テキスト（日本語 → 英語）の完全一致辞書
// key: 画面に書かれている日本語そのまま / value: 対応する英訳
const UI_TRANSLATIONS_EN = {

    // ---- 共通 ----
    "戻る": "Back", "・": "・", "日本語": "Japanese", "English": "English",

    // ---- ログイン ----
    "ダーク系": "Dark", "ライト系": "Light",

    // ---- ダッシュボード ----
    "すべてのタスク": "All Tasks", "絞り込み解除": "Clear Filter",
    "🌐 公式サイト": "🌐 Official Website", "🐦 公式X": "🐦 Official X",
    "▶️ 公式YouTube": "▶️ Official YouTube",

    // ---- 個人設定 / SETTINGS ----
    "個人設定": "Personal Settings", "全メンバー共通": "All Members",
    "全メンバー共通・アカウントとこの端末に保存されます": "All members ・ Saved to your account and this device",
    "表示名": "Display Name", "現在のパスワード": "Current Password",
    "新しいパスワード": "New Password", "新しいパスワード（確認）": "New Password (Confirm)",
    "デザイン設定": "Design Settings", "カラーテーマ（背景色）": "Color Theme (Background)",
    "フォント": "Font", "UIデザイン": "UI Design",
    "CYAN（デフォルト）": "CYAN (Default)", "GREEN（マトリックス風）": "GREEN (Matrix style)",
    "LIGHT（スタンダード）": "LIGHT (Standard)", "LIGHT PINK（かわいい系）": "LIGHT PINK (Cute)",
    "LIGHT SAND（ベージュ・温かみ）": "LIGHT SAND (Warm beige)",
    "MONOSPACE（等幅・ターミナル風）": "MONOSPACE (Terminal style)",
    "SANS-SERIF（サンセリフ・モダン）": "SANS-SERIF (Modern)",
    "SERIF（セリフ・落ち着いた印象）": "SERIF (Calm impression)",
    "HANDWRITING（手書き風）": "HANDWRITING (Handwriting style)",
    "ROUNDED（丸ゴシック・やわらかい印象）": "ROUNDED (Soft impression)",
    "GOTHIC（ゴシック体）": "GOTHIC",
    "NEON（ネオン風・角無し）": "NEON (Sharp corners)",
    "FLAT（フラット・角丸）": "FLAT (Rounded corners)",
    "MINIMAL（最小限の装飾）": "MINIMAL",
    "CUTE（かわいい・丸みの強いデザイン）": "CUTE (Extra rounded)",
    "GLASS（透明感のあるデザイン）": "GLASS (Translucent)",
    "RETRO（レトロ・控えめな装飾）": "RETRO",
    "言語設定 / Language": "Language Settings / 言語", "言語 / Language": "Language / 言語",
    "システム設定": "System Settings",
    "新規登録時のデフォルト権限レベル": "Default access level for new registrations",
    "ログイン失敗の自動ロック閾値（0で無効）": "Auto-lock threshold for failed logins (0 = disabled)",
    "ダッシュボードのお知らせバナー（空欄で非表示）": "Dashboard announcement banner (blank = hidden)",
    "ログイン履歴の保持日数（手動削除用の基準日数）": "Login log retention (days, for manual purge)",
    "古いログイン履歴を今すぐ削除": "Purge old login logs now",

    // ---- プロジェクト ----
    "企画を投稿": "Post Project", "企画を編集": "Edit Project",
    "投稿後の編集はできません。内容をご確認の上、投稿してください。": "This cannot be edited after posting. Please review before posting.",

    // ---- タスク ----
    "タスクを作成": "Create Task", "タスクを編集": "Edit Task",
    "DUE DATE（任意）": "DUE DATE (optional)", "📅 日付を選択（未設定）": "📅 Select a date (not set)",
    "未割当": "Unassigned",
    "MENTION（任意・複数選択可）": "MENTION (optional, multi-select)",
    "選択したメンバーに、このタスクの通知(ニュース)が届きます。": "Selected members will receive a notification (News) about this task.",

    // ---- スレッド ----
    "スレッドを作成": "Create Thread",
    "書き込み": "Posts", "新しい書き込み（投稿後の編集はできません）": "New post (cannot be edited after posting)",

    // ---- ファイル ----
    "ファイルをアップロード": "Upload File",
    "対応形式：画像(jpg/png/gif/webp)・動画(mp4/webm/mov)・音声(mp3/wav/m4a) ／ 上限 50MB":
        "Supported: images (jpg/png/gif/webp), video (mp4/webm/mov), audio (mp3/wav/m4a) ／ Max 50MB",
    "DESCRIPTION（任意）": "DESCRIPTION (optional)",

    // ---- メール ----
    "件名": "Subject", "本文": "Body", "宛先": "To",

    // ---- プロフィール ----
    "プロフィール一覧": "Profile List", "プロフィールを編集": "Edit Profile",
    "ユーザー名": "Username", "ユーザー名 :": "Username :",
    "権限レベル": "Access Level", "権限レベル :": "Access Level :",
    "状態": "Status", "担当": "Role", "担当 :": "Role :",
    "登録日 :": "Registered :", "生年月日 :": "Birth Date :", "性別 :": "Gender :",
    "自己紹介": "Bio", "自己紹介：": "Bio:",
    "生年月日（任意）": "Birth Date (optional)", "性別": "Gender",
    "男性": "Male", "女性": "Female", "その他": "Other", "回答しない": "Prefer not to say",
    "担当（複数選択可）": "Role (multi-select)",

    // ---- 管理画面 ----
    "管理画面": "Admin Panel", "システム管理": "System Management",
    "新規アカウント発行": "Issue new account", "登録情報一覧": "Registered member list",
    "利用状態制御": "Account status control", "アクセス権限設定（近日公開）": "Access permission settings (Coming soon)",
    "ログイン記録一覧": "Login record list", "ARG Control設定（近日公開）": "ARG Control settings (Coming soon)",
    "メイン画面へ移動": "Go to main dashboard", "メンバーデータベース": "Member Database",
    "ニュースを投稿": "Post News",
    "ダッシュボードのNEWS欄に直接お知らせを配信できます。": "Send an announcement directly to the dashboard NEWS section.",
    "宛先（空欄で全員向け）": "Target (blank = everyone)", "全員向け": "Everyone",
    "リンク先（任意・クリック時に移動する画面）": "Link (optional, page to open on click)",
    "誰が・いつ・何をしたか": "Who did what, when", "操作": "Action",
    "操作ログ（誰が・いつ・何をしたか）": "Action log (who did what, when)",
    "ログイン履歴は別画面（ログイン履歴）で確認できます。こちらは企画/スレッド/ファイル/メール/プロフィール/ニュース投稿などの操作記録です。":
        "Login history is on a separate page (Login Log). This page records actions such as projects/threads/files/mail/profile/news posting.",
    "👤 メンバー登録": "👤 Register Member", "📋 メンバーリスト": "📋 Member List",
    "🔐 アカウント管理": "🔐 Account Control", "🛡️ 権限管理": "🛡️ Permission Management",
    "🔑 ログイン履歴": "🔑 Login Log", "🗒️ システムログ": "🗒️ System Log",
    "🏠 ダッシュボードへ戻る": "🏠 Back to Dashboard", "メンバー一覧へ": "To Member List",

    // ---- ハンバーガーメニュー(JS生成) ----
    "管理画面（要admin以上）": "Admin Panel",

    // ---- 個別ページの残り ----
    "ARG Control | 管理画面": "ARG Control | Admin Panel",
    "← BACK TO 管理画面": "← BACK TO Admin Panel",
    "タイトル": "Title",
    "＋ NEW TASK": "＋ NEW TASK",

    // ---- placeholder ----
    "お知らせの内容": "Announcement content", "スレッドタイトル": "Thread title",
    "タスク名": "Task name", "ファイルの説明": "File description",
    "企画タイトル": "Project title", "企画内容": "Project description",
    "例：dashboard.html": "e.g. dashboard.html", "内容": "Content",

    // ---- alert / confirm ダイアログ ----
    "このスレッドを削除しますか？（書き込みも全て削除されます）": "Delete this thread? (All posts in it will also be deleted)",
    "このタスクを削除しますか？": "Delete this task?",
    "このファイルを削除しますか？": "Delete this file?",
    "この企画を削除しますか？": "Delete this project?",
    "この書き込みを削除しますか？": "Delete this post?",
    "アップロードが完了しました": "Upload complete",
    "アップロードに失敗しました": "Upload failed",
    "システム設定を保存しました": "System settings saved",
    "タイトルを入力してください": "Please enter a title",
    "デザイン設定を保存しました": "Design settings saved",
    "ニュースを投稿しました": "News posted",
    "パスワードは4文字以上にしてください": "Password must be at least 4 characters",
    "パスワードを変更しました": "Password changed",
    "ファイルを選択してください": "Please select a file",
    "ファイルサイズは50MBまでです": "File size must be 50MB or less",
    "プロフィールを更新しました": "Profile updated",
    "保持日数を1以上に設定してください": "Please set retention days to 1 or more",
    "内容を入力してください": "Please enter content",
    "削除対象のログはありません": "No logs to delete",
    "宛先を選択してください": "Please select a recipient",
    "新しいパスワードが一致しません": "New passwords do not match",
    "現在のパスワードが正しくありません": "Current password is incorrect",
    "表示名を更新しました": "Display name updated",
    "言語設定を保存しました。次回以降のページ読み込みから反映されます。\nLanguage setting saved. It will apply from the next page load.":
        "Language setting saved. It will apply from the next page load."

};

// data-i18n を付けなくても、既知の日本語テキストと完全一致すれば自動で英語化する
// (タグ構造を変えずに導入できるよう、テキストのみを持つ要素を走査する簡易実装)
export function applyI18n() {

    if (getLang() !== "en") return; // 日本語(既定)の場合は何もしない

    const dict = UI_TRANSLATIONS_EN;

    const walk = (root) => {

        root.querySelectorAll("h1,h2,h3,p,label,button,th,td,span,div,option,a,legend").forEach((el) => {

            // 子要素にさらにタグを持つ場合は誤爆しやすいのでスキップ(葉ノードのみ対象)
            if (el.children.length > 0) return;

            const text = el.textContent;
            const trimmed = text.trim();

            if (!trimmed) return;

            if (dict[trimmed]) {

                // 前後の空白/改行を保ったまま置換
                el.textContent = text.replace(trimmed, dict[trimmed]);

            }

        });

        root.querySelectorAll("[placeholder]").forEach((el) => {

            const ph = el.getAttribute("placeholder");
            if (dict[ph]) el.setAttribute("placeholder", dict[ph]);

        });

        root.querySelectorAll("optgroup[label]").forEach((el) => {

            const label = el.getAttribute("label");
            if (dict[label]) el.setAttribute("label", dict[label]);

        });

    };

    walk(document);

    if (dict[document.title]) document.title = dict[document.title];

}

// 個別のJS文言（alert/confirmのメッセージなど）を翻訳する
// 完全一致しない場合は元の日本語文言をそのまま返す
export function tx(jaText) {

    if (getLang() !== "en") return jaText;

    return UI_TRANSLATIONS_EN[jaText] || jaText;

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
export function requireAdmin(member) {

    if (Number(member.access_level) < 4) {
        alert("ACCESS DENIED");
        location.href = "dashboard.html";
        throw new Error("ACCESS DENIED");
    }
}

// access_level が 5 (最高権限/FOUNDER) かどうかを判定する
export function isLevel5(member) {
    return Number(member.access_level) === 5;
}

// ログアウト処理
export function logout() {
    localStorage.removeItem("ARG_MEMBER");
    location.href = "index.html";
}

// innerHTML へ差し込むテキストをエスケープする（XSS対策）
export function escapeHTML(value) {

    if (value === undefined || value === null) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


// =================================
// システムログ（誰が・いつ・どこで・何をしたか）
// ログイン履歴(login_logs)とは別の、操作監査ログ
// =================================

export async function logSystemAction(member, action, detail) {

    try {

        const logRef = push(ref(db, "system_logs"));

        await set(logRef, {
            member_id: member.member_id,
            member_name: member.username,
            action: action,
            detail: detail || "",
            page: location.pathname.split("/").pop(),
            time: new Date().toISOString()
        });

    } catch (error) {

        // ログ記録の失敗で本来の操作を止めないよう、エラーは握りつぶしてコンソールにのみ出す
        console.error(error);

    }

}


// =================================
// ニュース（お知らせ）
// =================================

// ニュースを1件作成する
// targetMemberId が null の場合は全メンバー向け
export async function pushNews(type, title, refUrl, targetMemberId) {

    try {

        const newsRef = push(ref(db, "news"));

        await set(newsRef, {
            type: type,
            title: title,
            ref_url: refUrl || "",
            target_member_id: targetMemberId || null,
            created_at: new Date().toISOString()
        });

    } catch (error) {
        console.error(error);
    }

}

// あるニュースを既読にする
export async function markNewsRead(member, newsId) {

    try {
        await update(ref(db, "members/" + member.member_id + "/read_news"), { [newsId]: true });
    } catch (error) {
        console.error(error);
    }

}


// =================================
// 画面共通ヘッダー（タイトルリンク・時計・ハンバーガーメニュー・ログアウト）
// =================================

const NAV_ICONS = {
    "projects.html": "📁", "records.html": "💬", "tasks.html": "✅",
    "files.html": "📎", "mail.html": "✉️", "profiles.html": "👤",
    "settings.html": "⚙️", "admin.html": "🛠️"
};

export function initHeader() {

    const memberData = localStorage.getItem("ARG_MEMBER");
    const member = memberData ? JSON.parse(memberData) : null;

    // ---- タイトルクリックでダッシュボードへ ----
    const titleEl = document.querySelector("header h1");

    if (titleEl) {
        titleEl.style.cursor = "pointer";
        titleEl.title = "ダッシュボードへ戻る";
        titleEl.onclick = () => location.href = "dashboard.html";
    }

    // ---- リアルタイム時計 ----
    const header = document.querySelector("header");

    if (header && !document.getElementById("headerClock")) {

        const clock = document.createElement("div");
        clock.id = "headerClock";
        clock.style.cssText = "font-size:12px;opacity:0.85;margin-top:6px;";
        header.appendChild(clock);

        const DOW = ["日", "月", "火", "水", "木", "金", "土"];

        function updateClock() {
            const now = new Date();
            const p2 = (n) => String(n).padStart(2, "0");
            clock.textContent =
                `${now.getFullYear()}/${p2(now.getMonth() + 1)}/${p2(now.getDate())}` +
                `(${DOW[now.getDay()]}) ${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}`;
        }

        updateClock();
        setInterval(updateClock, 1000);

    }

    // ---- ハンバーガーメニュー ----
    if (document.getElementById("hamburgerButton")) return; // 二重生成防止

    const hamburgerBtn = document.createElement("button");
    hamburgerBtn.id = "hamburgerButton";
    hamburgerBtn.textContent = "☰";
    hamburgerBtn.style.cssText =
        "width:44px;height:44px;padding:0;position:fixed;top:14px;left:14px;z-index:1001;" +
        "font-size:20px;border-radius:50%;";

    const overlay = document.createElement("div");
    overlay.id = "navOverlay";
    overlay.style.cssText =
        "display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:999;";

    const panel = document.createElement("nav");
    panel.id = "navPanel";
    panel.style.cssText =
        "display:none;position:fixed;top:0;left:0;bottom:0;width:260px;max-width:80vw;" +
        "background:var(--panel-bg);border-right:1px solid var(--accent);z-index:1000;" +
        "padding:80px 20px 20px;overflow-y:auto;box-sizing:border-box;";

    const links = [
        { label: "PROJECTS", href: "projects.html" },
        { label: "THREADS", href: "records.html" },
        { label: "TASKS", href: "tasks.html" },
        { label: "FILES", href: "files.html" },
        { label: "MAIL", href: "mail.html" },
        { label: "PROFILES", href: "profiles.html" },
        { label: "SETTINGS", href: "settings.html" }
    ];

    if (member && Number(member.access_level) >= 4) {
        links.push({ label: "管理画面", href: "admin.html" });
    }

    panel.innerHTML =
        links.map((l) => `
            <a href="${l.href}" style="display:block;padding:14px 4px;color:var(--accent);
                text-decoration:none;border-bottom:1px solid rgba(var(--accent-rgb),0.2);font-size:15px;">
                ${NAV_ICONS[l.href] || "🔹"} ${l.label}
            </a>
        `).join("") +
        `<button id="navLogoutButton" style="margin-top:25px;">🚪 LOGOUT</button>`;

    document.body.appendChild(hamburgerBtn);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    function toggleNav(show) {
        overlay.style.display = show ? "block" : "none";
        panel.style.display = show ? "block" : "none";
    }

    hamburgerBtn.onclick = () => toggleNav(true);
    overlay.onclick = () => toggleNav(false);

    const navLogoutButton = document.getElementById("navLogoutButton");
    if (navLogoutButton) navLogoutButton.onclick = logout;

    // 画面の静的テキストを言語設定に応じて翻訳する
    applyI18n();

}
