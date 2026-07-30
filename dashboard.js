// =================================
// ARG Control
// Dashboard System
// =================================

import { getLoggedInMember, attachLogoutButton } from "./common.js";
import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const member = getLoggedInMember();

attachLogoutButton();

document.getElementById("username").textContent = member.username;
document.getElementById("memberID").textContent = member.member_id;
document.getElementById("accessLevel").textContent = member.access_level;
document.getElementById("status").textContent = member.status;


// お知らせバナー表示

get(ref(db, "settings/system/announcement"))
    .then((snapshot) => {

        const text = snapshot.exists() ? snapshot.val() : "";

        if (text && text.trim() !== "") {

            document.getElementById("announcementSection").style.display = "block";
            document.getElementById("announcementText").textContent = text;

        }

    })
    .catch((error) => console.error(error));


// ADMIN PANEL CONTROL

const adminPanel = document.getElementById("adminPanel");

if (adminPanel) {

    if (Number(member.access_level) >= 4) {

        adminPanel.style.display = "block";

        adminPanel.onclick = function () {
            location.href = "admin.html";
        };

    } else {

        adminPanel.style.display = "none";

    }

}
