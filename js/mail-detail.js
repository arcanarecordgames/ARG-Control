// ARG Control
// Mail Detail System
// =================================


import { db } from "./firebase-config.js";


import {

ref,
get,
update

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




// URL取得

const params =

new URLSearchParams(
location.search
);


const mailID =

params.get("id");




if(!mailID){

alert(
"MAIL ID NOT FOUND"
);


location.href =
"mail.html";

}






// 表示場所

const sender =
document.getElementById("sender");


const subject =
document.getElementById("subject");


const date =
document.getElementById("date");


const message =
document.getElementById("message");







// メール取得

get(

ref(
db,
"mail/" + mailID
)

)

.then(
(snapshot)=>{


if(snapshot.exists()){


const mail =
snapshot.val();





// 宛先確認

if(
!mail.receivers.includes(member.member_id)
){

alert(
"ACCESS DENIED"
);

location.href =
"mail.html";

}





sender.textContent =
mail.sender;


subject.textContent =
mail.subject;


date.textContent =
mail.created_at;


message.textContent =
mail.message;






// 既読更新

update(

ref(
db,
"mails/" + mailID
),

{

read:true

}

);



}else{


alert(
"MAIL NOT FOUND"
);


location.href =
"mail.html";

}


})

.catch(
(error)=>{


console.error(error);


alert(
"SYSTEM ERROR"
);


});