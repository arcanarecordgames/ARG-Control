// =================================
// ARG Control
// Project List System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, escapeHTML, serenaAnnounce } from "./common.js";

const member = getLoggedInMember();

initHeader();


const newButton = document.getElementById("newButton");
newButton.onclick = () => location.href = "project-new.html";


const projectList = document.getElementById("projectList");

get(ref(db, "projects"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            projectList.innerHTML = `<tr><td colspan="3">NO DATA</td></tr>`;
            return;
        }

        const projects = snapshot.val();

        projectList.innerHTML = "";

        // 新しい順に表示
        Object.keys(projects).reverse().forEach((id) => {

            const data = projects[id];

            projectList.innerHTML += `
                <tr>
                    <td><a href="project-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(data.title)}</a></td>
                    <td>${escapeHTML(data.author_name)}</td>
                    <td>${escapeHTML(new Date(data.created_at).toLocaleString("ja-JP"))}</td>
                </tr>
            `;

        });

    })
    .catch((error) => {

        console.error(error);
        serenaAnnounce("error");
        projectList.innerHTML = `<tr><td colspan="3">SYSTEM ERROR</td></tr>`;

    });
