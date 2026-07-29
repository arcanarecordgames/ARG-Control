// =================================
// ARG Control
// Member Edit System
// =================================


import { db } from "./firebase-config.js";


import {
  ref,
  get,
  update
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



const admin =
JSON.parse(memberData);




// 権限確認

if(admin.access_level < 4){

alert(
"ACCESS DENIED"
);


location.href =
"dashboard.html";

}




// URLからMID取得

const params =
new URLSearchParams(
location.search
);


const memberID =
params.get("id");



if(!memberID){

alert(
"MEMBER ID NOT FOUND"
);


location.href =
"members.html";

}




// 入力欄取得

const usernameInput =
document.getElementById(
"username"
);


const levelInput =
document.getElementById(
"accessLevel"
);


const updateButton =
document.getElementById(
"updateButton"
);





// 現在情報取得

get(
ref(
db,
"members/" + memberID
)

)

.then(
(snapshot)=>{


if(snapshot.exists()){


const data =
snapshot.val();



usernameInput.value =
data.username;


levelInput.value =
data.access_level;



}else{


alert(
"MEMBER DATA NOT FOUND"
);


location.href =
"members.html";


}


});






// 更新処理

updateButton.onclick = ()=>{


const newData = {


username:
usernameInput.value,


access_level:
Number(
levelInput.value
)


};




update(

ref(
db,
"members/" + memberID
),

newData

)

.then(()=>{


alert(
"UPDATE COMPLETE"
);



location.href =
"member-detail.html?id=" + memberID;



})

.catch(
(error)=>{


console.error(error);


alert(
"SYSTEM ERROR"
);


});


};