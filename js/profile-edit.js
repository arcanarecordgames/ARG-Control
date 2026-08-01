// =================================
// ARG Control
// Profile Edit System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, isLevel5, logSystemAction, tx } from "./common.js";

const member = getLoggedInMember();

initHeader();


const ROLES = [
    "プロデューサー", "ディレクター", "プロジェクトマネージャー", "チームリーダー",
    "シナリオリーダー", "シナリオスタッフ", "プログラミングリーダー", "プログラミングスタッフ",
    "アートディレクター", "キャラデザリーダー", "キャラデザスタッフ", "デザイナーリーダー",
    "デザイナースタッフ", "モーションリーダー", "モーションスタッフ", "デバッグスタッフ"
];


const params = new URLSearchParams(location.search);
const targetID = params.get("id");

if (!targetID) {
    alert("PROFILE NOT FOUND");
    location.href = "profiles.html";
}


const birthDateInput = document.getElementById("birthDate");
const genderSelect = document.getElementById("gender");
const rolesArea = document.getElementById("rolesArea");
const bioInput = document.getElementById("bio");
const saveButton = document.getElementById("saveButton");


// 担当チェックボックスを生成

ROLES.forEach((role, index) => {

    const label = document.createElement("label");
    label.style.cssText = "display:block;font-weight:normal;margin:6px 0;";
    label.innerHTML = `<input type="checkbox" value="${role}" id="role_${index}" style="width:auto;margin-right:8px;">${role}`;

    rolesArea.appendChild(label);

});


get(ref(db, "members/" + targetID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("PROFILE NOT FOUND");
            location.href = "profiles.html";
            return;
        }

        const data = snapshot.val();

        // 編集権限確認: 本人 または access_level 5 のみ
        const canEdit = targetID === member.member_id || isLevel5(member);

        if (!canEdit) {
            alert("ACCESS DENIED");
            location.href = "profile-detail.html?id=" + targetID;
            return;
        }

        const profile = data.profile || {};

        birthDateInput.value = profile.birth_date || "";
        genderSelect.value = profile.gender || "";
        bioInput.value = profile.bio || "";

        (profile.roles || []).forEach((role) => {

            const checkbox = rolesArea.querySelector(`input[value="${CSS.escape(role)}"]`);
            if (checkbox) checkbox.checked = true;

        });

    });


saveButton.onclick = async () => {

    const selectedRoles = Array.from(rolesArea.querySelectorAll("input[type=checkbox]:checked")).map((cb) => cb.value);

    try {

        await update(ref(db, "members/" + targetID + "/profile"), {
            birth_date: birthDateInput.value || "",
            gender: genderSelect.value || "",
            roles: selectedRoles,
            bio: bioInput.value || ""
        });

        await logSystemAction(member, "PROFILE_EDIT", targetID);

        alert(tx("プロフィールを更新しました"));
        location.href = "profile-detail.html?id=" + targetID;

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
