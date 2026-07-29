// =================================
// ARG Control
// Member Management System
// =================================


import { db } from "./firebase-config.js";


import {
  ref,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";




// 管理者確認

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




// LEVEL確認

if(
member.access_level < 4
){

alert(
"ACCESS DENIED"
);


location.href =
"dashboard.html";

}




// メンバー一覧取得


const memberList =

document.getElementById(
"memberList"
);



get(
ref(db,"members")
)

.then(
(snapshot)=>{


if(snapshot.exists()){


const members =
snapshot.val();



memberList.innerHTML = "";



Object.keys(members).forEach(
(id)=>{


const data =
members[id];



memberList.innerHTML += `

<tr>

<td>

<a href="member-detail.html?id=${id}">
${id}
</a>

</td>


<td>
${data.username}
</td>


<td>
${data.access_level}
</td>


<td>
${data.status}
</td>


<td>

<a href="account-control.html?id=${id}">
管理
</a>

</td>


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

.catch(
(error)=>{


console.error(error);


memberList.innerHTML = `

<tr>

<td colspan="4">
SYSTEM ERROR
</td>

</tr>

`;


});