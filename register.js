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

import { getLoggedInMember, requireAdmin, attachLogoutButton } from "./common.js";

// 修正: このページは元々「ADMINISTRATOR ONLY」と表示だけしていたが、
// JS側に管理者チェックが一切なく、URLを直接開けば誰でも新規メンバーを作成できてしまっていた。
const admin = getLoggedInMember();
requireAdmin(admin);

attachLogoutButton();


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


window.createMember = async function () {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const accessLevel = document.getElementById("accessLevel").value;
    const result = document.getElementById("result");

    if (username === "" || password === "") {
        result.innerHTML = "INPUT ERROR";
        return;
    }

    try {

        const memberID = await generateUniqueMemberID();

        const memberData = {
            member_id: memberID,
            username: username,
            internal_id_1: createInternalID1(),
            internal_id_2: createInternalID2(),
            password_hash: await hashPassword(password),
            access_level: Number(accessLevel),
            status: "active",
            created_at: new Date().toISOString(),
            created_by: admin.member_id
        };

        await set(ref(db, "members/" + memberID), memberData);

        result.innerHTML = `
            REGISTRATION COMPLETE
            <br><br>
            MEMBER ID :
            <br>
            ${memberID}
        `;

    } catch (error) {

        console.error(error);
        result.innerHTML = "SYSTEM ERROR";

    }

};
