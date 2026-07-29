// =================================
// ARG Control
// Member Registration System
// =================================


import { db }

from "./firebase-config.js";



import {

ref,
set

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



import {

createInternalID1,
createInternalID2,
createMemberID,
hashPassword

}

from "./security.js";





window.createMember = async function(){



const username =

document.getElementById(
"username"
).value;



const password =

document.getElementById(
"password"
).value;



const accessLevel =

document.getElementById(
"accessLevel"
).value;



const result =

document.getElementById(
"result"
);





if(
username === "" ||
password === ""
){


result.innerHTML =
"INPUT ERROR";


return;

}





// 仮採番
// 後で管理者発行番号方式へ変更可能

const number =

Date.now()
.toString()
.slice(-5);




const memberID =

createMemberID(number);





const memberData = {


member_id:
memberID,


username:
username,



internal_id_1:

createInternalID1(),



internal_id_2:

createInternalID2(),



password_hash:

await hashPassword(password),



access_level:

Number(accessLevel),



status:

"active",



created_at:

new Date()
.toISOString()



};






try {



await set(

ref(

db,

"members/" + memberID

),

memberData

);






result.innerHTML =


`

REGISTRATION COMPLETE

<br><br>

MEMBER ID :

<br>

${memberID}

`;





}

catch(error){


console.error(error);



result.innerHTML =

"SYSTEM ERROR";


}



}