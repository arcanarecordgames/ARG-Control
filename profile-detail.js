// =================================
// ARG Control
// Profile Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, isLevel5 } from "./common.js";

const member = getLoggedInMember();

initHeader();


const params = new URLSearchParams(location.search);
const targetID = params.get("id");

if (!targetID) {
    alert("PROFILE NOT FOUND");
    location.href = "profiles.html";
}


const usernameEl = document.getElementById("username");
const midEl = document.getElementById("mid");
const accessLevelEl = document.getElementById("accessLevel");
const birthDateEl = document.getElementById("birthDate");
const registeredAtEl = document.getElementById("registeredAt");
const genderEl = document.getElementById("gender");
const rolesEl = document.getElementById("roles");
const bioEl = document.getElementById("bio");
const editArea = document.getElementById("editArea");
const editButton = document.getElementById("editButton");


get(ref(db, "members/" + targetID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("PROFILE NOT FOUND");
            location.href = "profiles.html";
            return;
        }

        const data = snapshot.val();
        const profile = data.profile || {};

        usernameEl.textContent = data.username;
        midEl.textContent = targetID;
        accessLevelEl.textContent = data.access_level;
        birthDateEl.textContent = profile.birth_date || "-";
        registeredAtEl.textContent = data.created_at ? new Date(data.created_at).toLocaleDateString("ja-JP") : "-";
        genderEl.textContent = profile.gender || "-";
        rolesEl.textContent = (profile.roles && profile.roles.length > 0) ? profile.roles.join(" / ") : "-";
        bioEl.textContent = profile.bio || "-";

        // 編集: 本人 または access_level 5 のみ
        const canEdit = targetID === member.member_id || isLevel5(member);

        if (canEdit) {
            editArea.style.display = "block";
            editButton.onclick = () => location.href = "profile-edit.html?id=" + targetID;
        }

    })
    .catch((error) => {

        console.error(error);
        alert("SYSTEM ERROR");

    });
