// =================================
// ARG Control
// Mail Detail System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, attachLogoutButton } from "./common.js";

const member = getLoggedInMember();

attachLogoutButton();


// URL取得

const params = new URLSearchParams(location.search);
const mailID = params.get("id");

if (!mailID) {
    alert("MAIL ID NOT FOUND");
    location.href = "mail.html";
}


// 表示場所

const sender = document.getElementById("sender");
const subject = document.getElementById("subject");
const date = document.getElementById("date");
const message = document.getElementById("message");


// メール取得

get(ref(db, "mail/" + mailID))
    .then((snapshot) => {

        if (!snapshot.exists()) {
            alert("MAIL NOT FOUND");
            location.href = "mail.html";
            return;
        }

        const mail = snapshot.val();

        // 宛先確認
        if (!mail.receivers || !mail.receivers.includes(member.member_id)) {
            alert("ACCESS DENIED");
            location.href = "mail.html";
            return;
        }

        sender.textContent = mail.senderName ?? mail.sender;
        subject.textContent = mail.subject;

        // 修正: 元は存在しない mail.created_at を参照しており常に空表示だった
        date.textContent = new Date(mail.time).toLocaleString("ja-JP");

        // 修正: 元は存在しない mail.message を参照しており常に空表示だった
        message.textContent = mail.body;

        // 修正: 既読状態を read:true で丸ごと上書きしていたため、
        // 他の受信者から見た既読状態や read マップ自体が壊れていた。
        // メンバーIDごとの既読マップとして更新する。
        update(ref(db, "mail/" + mailID + "/read"), {
            [member.member_id]: true
        });

    })
    .catch((error) => {

        console.error(error);
        alert("SYSTEM ERROR");

    });
