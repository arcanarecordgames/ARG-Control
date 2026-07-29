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


// ログイン確認

const memberData =
localStorage.getItem(
"ARG_MEMBER"
);

if(!memberData){

    location.href =
    "index.html";

}

const member =
JSON.parse(memberData);


// 管理者確認

if(Number(member.access_level) < 4){

    alert(
    "ACCESS DENIED"
    );

    location.href =
    "dashboard.html";

}

const receiverSelect =
document.getElementById(
"receiverSelect"
);

const sendAll =
document.getElementById(
"sendAll"
);

const subject =
document.getElementById(
"subject"
);

const body =
document.getElementById(
"body"
);

const sendButton =
document.getElementById(
"sendButton"
);

get(
ref(db,"members")
)

.then((snapshot)=>{

    if(!snapshot.exists()) return;

    const members =
    snapshot.val();

    Object.keys(members).forEach((id)=>{

        const data =
        members[id];

        const option =
        document.createElement(
        "option"
        );

        option.value =
        id;

        option.textContent =
        `${data.username} (${id})`;

        receiverSelect.appendChild(
        option
        );

    });

});

sendAll.onchange = ()=>{

    receiverSelect.disabled =
    sendAll.checked;

};

sendButton.onclick = async ()=>{

    const receivers = [];

    if(sendAll.checked){

        const snapshot =
        await get(
            ref(db,"members")
        );

        const members =
        snapshot.val();

        Object.keys(members).forEach((id)=>{

            receivers.push(id);

        });

    }else{

        Array.from(
            receiverSelect.selectedOptions
        ).forEach((option)=>{

            receivers.push(
                option.value
            );

        });

    }

    if(receivers.length === 0){

        alert(
        "宛先を選択してください"
        );

        return;

    }

    const mailRef =
    push(
        ref(db,"mail")
    );

    await set(mailRef,{

        sender:
        member.member_id,

        receivers:
        receivers,

        subject:
        subject.value,

        body:
        body.value,

        time:
        Date.now(),

        read:{}

    });

    alert(
    "MAIL SENT"
    );

    location.href =
    "mail.html";

};