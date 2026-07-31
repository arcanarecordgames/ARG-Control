// =================================
// ARG Control
// File Detail System
// =================================

import { db, storage } from "./firebase-config.js";

import {
    ref,
    get,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    ref as storageRef,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { getLoggedInMember, initHeader, logSystemAction, tx, requireLevel5 } from "./common.js";

const member = getLoggedInMember();
requireLevel5(member); // FILES機能は現在準備中のため、access_level 5のみ利用可能

initHeader();


const params = new URLSearchParams(location.search);
const fileID = params.get("id");

if (!fileID) {
    alert("FILE NOT FOUND");
    location.href = "files.html";
}


const nameElement = document.getElementById("name");
const uploaderElement = document.getElementById("uploader");
const dateElement = document.getElementById("date");
const sizeElement = document.getElementById("size");
const descriptionElement = document.getElementById("description");
const previewArea = document.getElementById("previewArea");
const downloadLink = document.getElementById("downloadLink");
const deleteArea = document.getElementById("deleteArea");
const deleteButton = document.getElementById("deleteButton");


get(ref(db, "files/" + fileID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("FILE NOT FOUND");
            location.href = "files.html";
            return;
        }

        const data = snapshot.val();

        nameElement.textContent = data.name;
        uploaderElement.textContent = data.uploader_name;
        dateElement.textContent = new Date(data.uploaded_at).toLocaleString("ja-JP");
        sizeElement.textContent = ((data.size || 0) / 1024 / 1024).toFixed(2) + " MB";
        descriptionElement.textContent = data.description || "-";

        downloadLink.href = data.download_url;

        if (data.category === "image") {

            previewArea.innerHTML = `<img src="${data.download_url}" alt="${data.name}">`;

        } else if (data.category === "video") {

            previewArea.innerHTML = `<video src="${data.download_url}" controls></video>`;

        } else if (data.category === "audio") {

            previewArea.innerHTML = `<audio src="${data.download_url}" controls></audio>`;

        } else {

            previewArea.innerHTML = `<p style="opacity:0.7;">このファイル形式はプレビューできません。DOWNLOADから確認してください。</p>`;

        }

        // 削除: アップロード本人 または 管理者(access_level >= 4)のみ
        const canDelete = data.uploader_id === member.member_id || Number(member.access_level) >= 4;

        if (canDelete) {

            deleteArea.style.display = "block";

            deleteButton.onclick = async () => {

                if (!confirm(tx("このファイルを削除しますか？"))) return;

                try {

                    await deleteObject(storageRef(storage, data.storage_path));
                    await remove(ref(db, "files/" + fileID));
                    await logSystemAction(member, "FILE_DELETE", data.name);

                    alert("DELETE COMPLETE");
                    location.href = "files.html";

                } catch (error) {

                    console.error(error);
                    alert("SYSTEM ERROR");

                }

            };

        }

    })
    .catch((error) => {

        console.error(error);
        alert("SYSTEM ERROR");

    });
