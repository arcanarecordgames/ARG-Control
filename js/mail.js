// =================================
// ARG Control
// Mail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, initHeader, escapeHTML } from "./common.js";

const member = getLoggedInMember();

initHeader();


// 管理者以上のみ新規メール作成ボタンを表示

const composeButton = document.getElementById("composeButton");

if (composeButton) {

    if (Number(member.access_level) >= 4) {
        composeButton.style.display = "block";
        composeButton.onclick = () => location.href = "mail-compose.html";
    } else {
        composeButton.style.display = "none";
    }

}


// メール一覧

const mailList = document.getElementById("mailList");

get(ref(db, "mail"))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            mailList.innerHTML = `<tr><td colspan="4">NO MAIL</td></tr>`;
            return;
        }

        const mails = snapshot.val();

        mailList.innerHTML = "";

        let hasMail = false;

        // 新しい順に表示
        Object.keys(mails).reverse().forEach((id) => {

            const mail = mails[id];

            // 自分宛確認
            if (!mail.receivers || !Array.isArray(mail.receivers) || !mail.receivers.includes(member.member_id)) {
                return;
            }

            hasMail = true;

            // 修正: read が空オブジェクト {} の場合、JSでは真値扱いになり
            // 「未読メールなのに常にREAD表示になる」バグがあったため、
            // read はメンバーIDごとの既読マップとして判定する
            const isRead = !!(mail.read && mail.read[member.member_id]);

            mailList.innerHTML += `
                <tr>
                    <td>${escapeHTML(mail.senderName)}</td>
                    <td><a href="mail-detail.html?id=${encodeURIComponent(id)}">${escapeHTML(mail.subject)}</a></td>
                    <td>${escapeHTML(new Date(mail.time).toLocaleString("ja-JP"))}</td>
                    <td>${isRead ? "READ" : "NEW"}</td>
                </tr>
            `;

        });

        if (!hasMail) {
            mailList.innerHTML = `<tr><td colspan="4">NO MAIL</td></tr>`;
        }

    })
    .catch((error) => {

        console.error(error);
        mailList.innerHTML = `<tr><td colspan="4">SYSTEM ERROR</td></tr>`;

    });
