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

import { getLoggedInMember, attachLogoutButton, isLevel5, escapeHTML } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


const params = new URLSearchParams(location.search);
const recordID = params.get("id");

if (!recordID) {
    alert("THREAD NOT FOUND");
    location.href = "records.html";
}


const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉"];

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


// パス配下のリアクション状況からボタン群のHTMLを組み立てる

function renderReactionButtons(reactions, path) {

    reactions = reactions || {};

    return REACTIONS.map((emoji) => {

        const users = reactions[emoji] || {};
        const count = Object.keys(users).length;
        const reacted = !!users[member.member_id];

        return `
            <button
                type="button"
                class="reaction-btn ${reacted ? "reacted" : ""}"
                data-path="${path}"
                data-emoji="${emoji}"
            >${emoji}${count > 0 ? " " + count : ""}</button>
        `;

    }).join("");

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


// リアクションボタンにイベントを付与する（親要素配下を一括で処理）

function bindReactionButtons(container) {

    container.querySelectorAll(".reaction-btn").forEach((btn) => {

        btn.onclick = () => toggleReaction(btn.dataset.path, btn.dataset.emoji);

    });

}


async function loadRecord() {

    const snapshot = await get(ref(db, "records/" + recordID));

    if (!snapshot.exists()) {
        alert("THREAD NOT FOUND");
        location.href = "records.html";
        return;
    }

    const record = snapshot.val();

    // ===== スレッド本文 =====

    opTitle.textContent = record.title;
    opAuthor.textContent = record.author_name;
    opDate.textContent = new Date(record.created_at).toLocaleString("ja-JP");
    opBody.textContent = record.body;

    const opPath = "records/" + recordID;

    opReactions.innerHTML = renderReactionButtons(record.reactions, opPath);
    bindReactionButtons(opReactions);

    // スレッド削除: access_level 5 のみ
    if (isLevel5(member)) {

        opDeleteArea.style.display = "block";

        opDeleteButton.onclick = async () => {

            if (!confirm("このスレッドを削除しますか？（書き込みも全て削除されます）")) return;

            try {
                await remove(ref(db, "records/" + recordID));
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
            <div class="post-reactions">${renderReactionButtons(post.reactions, postPath)}</div>
        `;

        postList.appendChild(postDiv);

        bindReactionButtons(postDiv);

        const deleteBtn = postDiv.querySelector(".delete-inline-button");

        if (deleteBtn) {

            deleteBtn.onclick = async () => {

                if (!confirm("この書き込みを削除しますか？")) return;

                try {
                    await remove(ref(db, "records/" + recordID + "/posts/" + postID));
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
        alert("内容を入力してください");
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
