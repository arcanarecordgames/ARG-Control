// =================================
// ARG Control
// Mail Compose System
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, pushNews, logSystemAction, tx } from "./common.js";

const member = getLoggedInMember();
requireAdmin(member);

initHeader();


const receiverSelect = document.getElementById("receiverSelect");
const sendAll = document.getElementById("sendAll");
const subject = document.getElementById("subject");
const body = document.getElementById("body");
const sendButton = document.getElementById("sendButton");


get(ref(db, "members"))
    .then((snapshot) => {

        if (!snapshot.exists()) return;

        const members = snapshot.val();

        Object.keys(members).forEach((id) => {

            const data = members[id];

            const option = document.createElement("option");

            option.value = id;
            option.textContent = `${data.username} (${id})`;

            receiverSelect.appendChild(option);

        });

    });


sendAll.onchange = () => {
    receiverSelect.disabled = sendAll.checked;
};


sendButton.onclick = async () => {

    if (subject.value.trim() === "" || body.value.trim() === "") {
        alert("SUBJECT / BODY REQUIRED");
        return;
    }

    const receivers = [];
    const receiverNames = [];

    if (sendAll.checked) {

        const snapshot = await get(ref(db, "members"));
        const members = snapshot.val();

        Object.keys(members).forEach((id) => {
            receivers.push(id);
            receiverNames.push(members[id].username);
        });

    } else {

        Array.from(receiverSelect.selectedOptions).forEach((option) => {
            receivers.push(option.value);
            receiverNames.push(option.textContent);
        });

    }

    if (receivers.length === 0) {
        alert(tx("宛先を選択してください"));
        return;
    }

    const mailRef = push(ref(db, "mail"));

    try {

        await set(mailRef, {
            sender: member.member_id,
            senderName: member.username,
            receivers: receivers,
            receiverNames: receiverNames,
            subject: subject.value,
            body: body.value,
            time: Date.now(),
            read: {}
        });

        // 受信者ごとにニュースを作成（送信者自身には作成しない）
        await Promise.all(
            receivers
                .filter((id) => id !== member.member_id)
                .map((id) => pushNews("mail", `新着メール：${subject.value}`, "mail-detail.html?id=" + mailRef.key, id))
        );

        await logSystemAction(member, "MAIL_SEND", subject.value + `（宛先${receivers.length}名）`);

        alert("MAIL SENT");
        location.href = "mail.html";

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};
