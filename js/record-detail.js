// =================================
// ARG Control
// Record (Thread) Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    set,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, isLevel5, escapeHTML, logSystemAction, tx } from "./common.js";

const member = getLoggedInMember();

initHeader();


const params = new URLSearchParams(location.search);
const recordID = params.get("id");

if (!recordID) {
    alert("THREAD NOT FOUND");
    location.href = "records.html";
}


// リアクション候補（20種類）
const REACTIONS = [
    "👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏", "🙏", "😍",
    "🤔", "😱", "💯", "🚀", "👀", "🥳", "😅", "🤝", "✨", "💡"
];

const opTitle = document.getElementById("opTitle");
const opAuthor = document.getElementById("opAuthor");
const opDate = document.getElementById("opDate");
const opBody = document.getElementById("opBody");
const opReactions = document.getElementById("opReactions");
const opDeleteArea = document.getElementById("opDeleteArea");
const opDeleteButton = document.getElementById("opDeleteButton");

const postList = document.getElementById("postList");
const newPostInput = document.getElementById("newPostInput");
const newPostButton = document.getElementById("newPostButton");

let currentRecordTitle = "";


// 既に使われているリアクションのボタン＋「＋」追加ボタンのHTMLを組み立てる
// 「＋」を押すと20種類の候補パネルが開き、選んだものがトグルで追加される

function renderReactionBlock(reactions, path) {

    reactions = reactions || {};

    const usedButtons = REACTIONS
        .filter((emoji) => Object.keys(reactions[emoji] || {}).length > 0)
        .map((emoji) => {

            const users = reactions[emoji] || {};
            const count = Object.keys(users).length;
            const reacted = !!users[member.member_id];

            return `
                <button type="button" class="reaction-btn ${reacted ? "reacted" : ""}"
                    data-path="${path}" data-emoji="${emoji}">${emoji} ${count}</button>
            `;

        }).join("");

    const pickerId = "picker_" + Math.random().toString(36).slice(2);

    const pickerButtons = REACTIONS.map((emoji) => {

        const reacted = !!(reactions[emoji] && reactions[emoji][member.member_id]);

        return `
            <button type="button" class="reaction-btn ${reacted ? "reacted" : ""}"
                data-path="${path}" data-emoji="${emoji}" style="font-size:18px;">${emoji}</button>
        `;

    }).join("");

    return `
        <div class="reaction-row">
            ${usedButtons}
            <button type="button" class="reaction-btn reaction-add" data-picker="${pickerId}">＋</button>
        </div>
        <div class="reaction-picker" id="${pickerId}" style="display:none;">
            ${pickerButtons}
        </div>
    `;

}


// リアクション関連の要素にイベントを付与する

function bindReactionEvents(container) {

    // ピッカー開閉
    container.querySelectorAll(".reaction-add").forEach((btn) => {

        btn.onclick = () => {

            const picker = document.getElementById(btn.dataset.picker);
            if (!picker) return;

            const isOpen = picker.style.display !== "none";
            picker.style.display = isOpen ? "none" : "grid";

        };

    });

    // リアクション本体
    container.querySelectorAll(".reaction-btn:not(.reaction-add)").forEach((btn) => {

        btn.onclick = () => toggleReaction(btn.dataset.path, btn.dataset.emoji);

    });

}


// 自分のリアクションをトグルする

async function toggleReaction(path, emoji) {

    const reactionRef = ref(db, path + "/reactions/" + emoji + "/" + member.member_id);

    try {

        const snapshot = await get(reactionRef);

        if (snapshot.exists()) {
            await remove(reactionRef);
        } else {
            await set(reactionRef, true);
        }

        await loadRecord();

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

}


async function loadRecord() {

    const snapshot = await get(ref(db, "records/" + recordID));

    if (!snapshot.exists()) {
        alert("THREAD NOT FOUND");
        location.href = "records.html";
        return;
    }

    const record = snapshot.val();
    currentRecordTitle = record.title;

    // ===== スレッド本文 =====

    opTitle.textContent = record.title;
    opAuthor.textContent = record.author_name;
    opDate.textContent = new Date(record.created_at).toLocaleString("ja-JP");
    opBody.textContent = record.body;

    const opPath = "records/" + recordID;

    opReactions.innerHTML = renderReactionBlock(record.reactions, opPath);
    bindReactionEvents(opReactions);

    // スレッド削除: access_level 5 のみ
    if (isLevel5(member)) {

        opDeleteArea.style.display = "block";

        opDeleteButton.onclick = async () => {

            if (!confirm(tx("このスレッドを削除しますか？（書き込みも全て削除されます）"))) return;

            try {
                await remove(ref(db, "records/" + recordID));
                await logSystemAction(member, "THREAD_DELETE", record.title);
                alert("DELETE COMPLETE");
                location.href = "records.html";
            } catch (error) {
                console.error(error);
                alert("SYSTEM ERROR");
            }

        };

    }

    // ===== 書き込み一覧 =====

    const posts = record.posts || {};
    const postIDs = Object.keys(posts).sort(); // pushキーは時系列順

    if (postIDs.length === 0) {
        postList.innerHTML = `<p style="opacity:0.6;">まだ書き込みはありません。</p>`;
        return;
    }

    postList.innerHTML = "";

    postIDs.forEach((postID) => {

        const post = posts[postID];
        const postPath = "records/" + recordID + "/posts/" + postID;

        const postDiv = document.createElement("div");
        postDiv.className = "post-item";

        postDiv.innerHTML = `
            <div class="post-meta">
                ${escapeHTML(post.author_name)} ・ ${escapeHTML(new Date(post.created_at).toLocaleString("ja-JP"))}
                ${isLevel5(member) ? `<button type="button" class="delete-inline-button" data-post-id="${postID}">DELETE</button>` : ""}
            </div>
            <div class="post-body">${escapeHTML(post.body)}</div>
            <div class="post-reactions">${renderReactionBlock(post.reactions, postPath)}</div>
        `;

        postList.appendChild(postDiv);

        bindReactionEvents(postDiv);

        const deleteBtn = postDiv.querySelector(".delete-inline-button");

        if (deleteBtn) {

            deleteBtn.onclick = async () => {

                if (!confirm(tx("この書き込みを削除しますか？"))) return;

                try {
                    await remove(ref(db, "records/" + recordID + "/posts/" + postID));
                    await logSystemAction(member, "THREAD_POST_DELETE", currentRecordTitle);
                    await loadRecord();
                } catch (error) {
                    console.error(error);
                    alert("SYSTEM ERROR");
                }

            };

        }

    });

}


newPostButton.onclick = async () => {

    if (newPostInput.value.trim() === "") {
        alert(tx("内容を入力してください"));
        return;
    }

    const postRef = push(ref(db, "records/" + recordID + "/posts"));

    try {

        await set(postRef, {
            body: newPostInput.value,
            author_id: member.member_id,
            author_name: member.username,
            created_at: new Date().toISOString(),
            reactions: {}
        });

        await logSystemAction(member, "THREAD_POST_CREATE", currentRecordTitle);

        newPostInput.value = "";

        await loadRecord();

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};


loadRecord().catch((error) => {

    console.error(error);
    alert("SYSTEM ERROR");

});
