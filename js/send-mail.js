// ARG Control
// Send Mail System
// =================================


import { db } from "./firebase-config.js";


import {

ref,
get,
push,
set

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





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





const receiver =

document.getElementById(
"receiver"
);


const subject =

document.getElementById(
"subject"
);


const message =

document.getElementById(
"message"
);


const sendButton =

document.getElementById(
"sendButton"
);





// メンバー一覧取得

get(
ref(db,"members")
)

.then(
(snapshot)=>{


const members =
snapshot.val();



Object.keys(members).forEach(
(id)=>{


if(id === member.member_id){

return;

}



receiver.innerHTML += `

<option value="${id}">

${members[id].username}
(${id})

</option>

`;


});


});








// 送信

sendButton.onclick = ()=>{



const receivers =

Array.from(
receiver.selectedOptions
)

.map(
(option)=>option.value
);





if(
receivers.length === 0
){

alert(
"SELECT RECEIVER"
);

return;

}




if(
subject.value === "" ||
message.value === ""
){

alert(
"INPUT REQUIRED"
);

return;

}





const mailRef =

push(
ref(db,"mails")
);





set(
mailRef,
{

sender:
member.member_id,


receivers:
receivers,


subject:
subject.value,


message:
message.value,


created_at:
new Date().toLocaleString(
"ja-JP"
),


read:false


}

)

.then(()=>{


alert(
"MAIL SENT"
);


location.href =
"mail.html";


});



};