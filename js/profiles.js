// =================================
// ARG Control
// Profile List System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, escapeHTML, serenaAnnounce } from "./common.js";

const member = getLoggedInMember();

initHeader();


const profileList = document.getElementById("profileList");

get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            profileList.innerHTML = `<tr><td colspan="3">NO DATA</td></tr>`;
            return;
        }

        const members = snapshot.val();

        profileList.innerHTML = "";

        Object.keys(members).forEach((id) => {

            const data = members[id];
            const roles = (data.profile && data.profile.roles) ? data.profile.roles.join(" / ") : "-";

            profileList.innerHTML += `
                <tr>
                    <td><a href="profile-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(data.username)}</a></td>
                    <td>${escapeHTML(id)}</td>
                    <td>${escapeHTML(roles)}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        serenaAnnounce("error");
        profileList.innerHTML = `<tr><td colspan="3">SYSTEM ERROR</td></tr>`;

    });
