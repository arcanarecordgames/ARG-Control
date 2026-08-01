// =================================
// ARG Control
// Member Registration System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    createInternalID1,
    createInternalID2,
    createMemberID,
    generateRandomNumber,
    hashPassword
} from "./security.js";

import { getLoggedInMember, requireAdmin, initHeader, logSystemAction } from "./common.js";

// 修正: このページは元々「ADMINISTRATOR ONLY」と表示だけしていたが、
// JS側に管理者チェックが一切なく、URLを直接開けば誰でも新規メンバーを作成できてしまっていた。
const admin = getLoggedInMember();
requireAdmin(admin);

initHeader();


// システム設定のデフォルト権限レベルを反映（設定されていれば）

get(ref(db, "settings/system/default_access_level"))
    .then((snapshot) => {

        if (snapshot.exists()) {
            document.getElementById("accessLevel").value = snapshot.val();
        }

    })
    .catch((error) => console.error(error));


// 重複しない会員IDを発行する
// (旧実装は Date.now() の下5桁を使っていたため、短時間に複数登録すると衝突する可能性があった)

async function generateUniqueMemberID() {

    let memberID;
    let exists = true;

    while (exists) {

        memberID = createMemberID(generateRandomNumber());

        const snapshot = await get(ref(db, "members/" + memberID));

        exists = snapshot.exists();

    }

    return memberID;

}


const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const accessLevelSelect = document.getElementById("accessLevel");
const createButton = document.getElementById("createButton");

const resultModal = document.getElementById("resultModal");
const resultUsername = document.getElementById("resultUsername");
const resultMID = document.getElementById("resultMID");
const resultDate = document.getElementById("resultDate");
const confirmButton = document.getElementById("confirmButton");


createButton.onclick = async () => {

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const accessLevel = accessLevelSelect.value;

    if (username === "" || password === "") {
        alert("INPUT ERROR");
        return;
    }

    // 連打による重複作成を防止するため、送信中はボタンを無効化する
    createButton.disabled = true;

    try {

        const memberID = await generateUniqueMemberID();
        const createdAt = new Date().toISOString();

        const memberData = {
            member_id: memberID,
            username: username,
            internal_id_1: createInternalID1(),
            internal_id_2: createInternalID2(),
            password_hash: await hashPassword(password),
            access_level: Number(accessLevel),
            status: "active",
            created_at: createdAt,
            created_by: admin.member_id
        };

        await set(ref(db, "members/" + memberID), memberData);

        await logSystemAction(admin, "MEMBER_REGISTER", `${username} (${memberID})`);

        // 作成完了モーダルを表示し、「確定」を押すまで裏の画面を操作させない
        resultUsername.textContent = username;
        resultMID.textContent = memberID;
        resultDate.textContent = new Date(createdAt).toLocaleString("ja-JP");

        resultModal.classList.add("active");

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");
        createButton.disabled = false;

    }

};


confirmButton.onclick = () => {
    location.href = "admin.html";
};
