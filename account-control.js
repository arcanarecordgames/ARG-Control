// =================================
// ARG Control
// Account Control System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, attachLogoutButton } from "./common.js";

const admin = getLoggedInMember();
requireAdmin(admin);

attachLogoutButton();


// URLからMID取得

const params = new URLSearchParams(location.search);
const memberID = params.get("id");

if (!memberID) {
    alert("MEMBER ID NOT FOUND");
    location.href = "members.html";
}


// 表示要素

const idElement = document.getElementById("memberID");
const currentStatus = document.getElementById("currentStatus");
const statusSelect = document.getElementById("statusSelect");
const updateButton = document.getElementById("updateButton");


// 現在情報取得

get(ref(db, "members/" + memberID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("MEMBER DATA NOT FOUND");
            location.href = "members.html";
            return;
        }

        const data = snapshot.val();

        idElement.textContent = memberID;
        currentStatus.textContent = data.status;
        statusSelect.value = data.status;

    });


// STATUS更新

updateButton.onclick = () => {

    const newStatus = statusSelect.value;

    update(ref(db, "members/" + memberID), { status: newStatus })
        .then(() => {

            alert("STATUS UPDATE COMPLETE");
            location.href = "member-detail.html?id=" + memberID;

        })
        .catch((error) => {

            console.error(error);
            alert("SYSTEM ERROR");

        });

};
