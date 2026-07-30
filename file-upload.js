// =================================
// ARG Control
// File Upload System
// =================================

import { db, storage } from "./firebase-config.js";

import {
    ref,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


// 許可する拡張子/MIMEタイプとサイズ上限

const ALLOWED_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/webm"]
};

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB


function categorize(mimeType) {

    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
        if (types.includes(mimeType)) return category;
    }

    return "other";

}


const fileInput = document.getElementById("fileInput");
const descriptionInput = document.getElementById("description");
const uploadButton = document.getElementById("uploadButton");
const progressArea = document.getElementById("progressArea");
const progressFill = document.getElementById("progressFill");


uploadButton.onclick = () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("ファイルを選択してください");
        return;
    }

    if (file.size > MAX_SIZE_BYTES) {
        alert("ファイルサイズは50MBまでです");
        return;
    }

    const category = categorize(file.type);

    const recordRef = push(ref(db, "files"));
    const storagePath = "files/" + recordRef.key + "/" + file.name;
    const targetRef = storageRef(storage, storagePath);

    const uploadTask = uploadBytesResumable(targetRef, file);

    uploadButton.disabled = true;
    progressArea.style.display = "block";

    uploadTask.on(
        "state_changed",

        (snapshot) => {

            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);

            progressFill.style.width = percent + "%";
            progressFill.textContent = percent + "%";

        },

        (error) => {

            console.error(error);
            alert("アップロードに失敗しました");
            uploadButton.disabled = false;

        },

        async () => {

            try {

                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                await set(recordRef, {
                    name: file.name,
                    description: descriptionInput.value,
                    mime_type: file.type,
                    category: category,
                    size: file.size,
                    storage_path: storagePath,
                    download_url: downloadURL,
                    uploader_id: member.member_id,
                    uploader_name: member.username,
                    uploaded_at: new Date().toISOString()
                });

                alert("アップロードが完了しました");
                location.href = "files.html";

            } catch (error) {

                console.error(error);
                alert("SYSTEM ERROR");
                uploadButton.disabled = false;

            }

        }
    );

};
