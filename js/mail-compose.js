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