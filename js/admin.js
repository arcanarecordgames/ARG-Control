// =================================
// ARG Control
// Admin Authorization System
// =================================

import { db } from "./firebase-config.js";

import {
  ref,
  get
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







// ADMIN権限確認


if(
member.access_level < 4
){


alert(
"ACCESS DENIED"
);


location.href =
"dashboard.html";


}





// 管理者情報表示


const adminName =

document.getElementById(
"adminName"
);



const adminID =

document.getElementById(
"adminID"
);



const adminLevel =

document.getElementById(
"adminLevel"
);





if(adminName){

adminName.textContent =
member.username;

}



if(adminID){

adminID.textContent =
member.member_id;

}



if(adminLevel){

adminLevel.textContent =
member.access_level;

}
// MEMBER DATABASE取得

const memberList =
document.getElementById(
"memberList"
);


get(ref(db, "members"))
.then((snapshot)=>{


if(snapshot.exists()){


const members =
snapshot.val();


memberList.innerHTML = "";


Object.keys(members).forEach((id)=>{


const data =
members[id];


memberList.innerHTML += `

<tr>

<td>${id}</td>

<td>${data.username}</td>

<td>${data.access_level}</td>

<td>${data.status}</td>

</tr>

`;


});


}else{


memberList.innerHTML = `

<tr>

<td colspan="4">
NO DATA
</td>

</tr>

`;

}


})
.catch((error)=>{


console.error(error);


});