// ARG Control
// Mail System
// =================================


import { db } from "./firebase-config.js";


import {

ref,
get

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





// メール一覧

const mailList =

document.getElementById(
"mailList"
);





get(

ref(
db,
"mail"
)

)

.then(
(snapshot)=>{


if(snapshot.exists()){



const mails =
snapshot.val();



mailList.innerHTML = "";




Object.keys(mails).forEach(
(id)=>{


const mail =
mails[id];





// 自分宛確認

if(
!mail.receivers.includes(member.member_id)
){

return;

}




mailList.innerHTML += `


<tr>


<td>

${mail.sender}

</td>



<td>

<a href="mail-detail.html?id=${id}">

${mail.subject}

</a>

</td>



<td>

${new Date(mail.time).toLocaleString()}

</td>



<td>

${mail.read ? "READ" : "NEW"}

</td>



</tr>


`;



});



}else{


mailList.innerHTML = `

<tr>

<td colspan="4">

NO MAIL

</td>

</tr>

`;

}


})

.catch(
(error)=>{


console.error(error);


mailList.innerHTML = `

<tr>

<td colspan="4">

SYSTEM ERROR

</td>

</tr>

`;

});

