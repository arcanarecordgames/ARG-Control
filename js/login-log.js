// =================================
// ARG Control
// Login Log System
// =================================


import { db } from "./firebase-config.js";


import {

ref,
get

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";




// 表示場所

const loginList =

document.getElementById(
"loginList"
);




// LOGIN LOG取得


get(
ref(
db,
"login_logs"
)

)

.then(
(snapshot)=>{


if(snapshot.exists()){


const logs =
snapshot.val();


loginList.innerHTML = "";



Object.keys(logs).forEach((id)=>{


const data =
logs[id];



loginList.innerHTML += `

<tr>

<td>
${data.time}
</td>

<td>
${data.member_id}
</td>

<td>
${data.username ?? "-"}
</td>

<td>
${data.result}
</td>

</tr>

`;



});


}

else{


loginList.innerHTML = `

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


loginList.innerHTML = `

<tr>

<td colspan="4">
SYSTEM ERROR
</td>

</tr>

`;



});