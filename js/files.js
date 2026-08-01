// =================================
// ARG Control
// File List System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, requireLevel5, escapeHTML, serenaAnnounce } from "./common.js";

const member = getLoggedInMember();
requireLevel5(member); // FILES機能は現在準備中のため、access_level 5のみ利用可能

initHeader();


document.getElementById("uploadButton").onclick = () => location.href = "file-upload.html";


const CATEGORY_LABEL = {
    image: "🖼️ IMAGE",
    video: "🎬 VIDEO",
    audio: "🎵 AUDIO",
    other: "📄 OTHER"
};

const fileList = document.getElementById("fileList");

get(ref(db, "files"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            fileList.innerHTML = `<tr><td colspan="5">NO DATA</td></tr>`;
            return;
        }

        const files = snapshot.val();

        fileList.innerHTML = "";

        // 新しい順に表示
        Object.keys(files).reverse().forEach((id) => {

            const data = files[id];
            const sizeMB = ((data.size || 0) / 1024 / 1024).toFixed(2);

            fileList.innerHTML += `
                <tr>
                    <td><a href="file-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(data.name)}</a></td>
                    <td>${escapeHTML(CATEGORY_LABEL[data.category] || CATEGORY_LABEL.other)}</td>
                    <td>${escapeHTML(data.uploader_name)}</td>
                    <td>${sizeMB} MB</td>
                    <td>${escapeHTML(new Date(data.uploaded_at).toLocaleString("ja-JP"))}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        serenaAnnounce("error");
        fileList.innerHTML = `<tr><td colspan="5">SYSTEM ERROR</td></tr>`;

    });
