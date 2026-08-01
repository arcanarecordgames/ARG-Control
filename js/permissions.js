// =================================
// ARG Control
// Permission Management System
// 権限レベル1〜5ごとにメンバーを一覧表示する
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, escapeHTML } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

initHeader();


const LEVEL_LABEL = {
    5: "LEVEL 5 - ADMIN",
    4: "LEVEL 4 - MANAGER",
    3: "LEVEL 3 - STAFF",
    2: "LEVEL 2 - MEMBER",
    1: "LEVEL 1 - GUEST"
};

const container = document.getElementById("levelGrid");

get(ref(db, "members"))
    .then((snapshot) => {

        const grouped = { 5: [], 4: [], 3: [], 2: [], 1: [] };

        if (snapshot.exists()) {

            const members = snapshot.val();

            Object.keys(members).forEach((id) => {

                const data = members[id];
                const level = Number(data.access_level);

                if (grouped[level]) {
                    grouped[level].push({ id, username: data.username });
                }

            });

        }

        container.innerHTML = "";

        [5, 4, 3, 2, 1].forEach((level) => {

            const box = document.createElement("div");
            box.className = "admin-card";
            box.style.cursor = "default";

            const membersHTML = grouped[level].length > 0
                ? grouped[level].map((m) => `
                    <a href="member-detail.html?id=${encodeURIComponent(m.id)}"
                        style="display:block;padding:6px 0;color:var(--accent);text-decoration:none;border-bottom:1px solid rgba(var(--accent-rgb),0.2);">
                        ${escapeHTML(m.username)}
                    </a>
                `).join("")
                : `<p style="opacity:0.5;font-size:13px;">該当メンバーなし</p>`;

            box.innerHTML = `
                <h3>${LEVEL_LABEL[level]}</h3>
                <div>${membersHTML}</div>
            `;

            container.appendChild(box);

        });

    })
    .catch((error) => {

        console.error(error);
        container.innerHTML = `<p>SYSTEM ERROR</p>`;

    });
