// =================================
// ARG Control
// Authentication System
// =================================


import { db } 
from "./firebase-config.js";


import {

ref,
get,
push,
set

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


import {

hashPassword

}

from "./security.js";


async function createLoginLog(data){

const logRef =
push(ref(db,"login_logs"));


await set(
logRef,
data
);

}


window.login = async function(){



const memberID =

document.getElementById(
"memberID"
).value;



const password =

document.getElementById(
"password"
).value;



const message =

document.getElementById(
"message"
);





try {



const snapshot =

await get(

ref(
db,
"members/" + memberID
)

);





if(!snapshot.exists()){


await createLoginLog({

member_id: memberID,

result:
"MEMBER ID NOT FOUND",

time:
new Date().toISOString()

});


message.innerHTML =
"MEMBER ID NOT FOUND";


return;

}




const member =

snapshot.val();





const hashedPassword =

await hashPassword(password);





if(
hashedPassword !== member.password_hash
){


await createLoginLog({

member_id: memberID,

result:
"PASSWORD ERROR",

time:
new Date().toISOString()

});


message.innerHTML =
"PASSWORD ERROR";


return;

}





if(
member.status !== "active"
){

if(member.status === "locked"){


await createLoginLog({

member_id: memberID,

result:
"ACCOUNT LOCKED",

time:
new Date().toISOString()

});


message.innerHTML =
"ACCOUNT LOCKED";

}

else if(member.status === "suspended"){

message.innerHTML =

"ACCOUNT SUSPENDED";

}

else{

message.innerHTML =

"ACCOUNT UNAVAILABLE";

}

return;

}






localStorage.setItem(

"ARG_MEMBER",

JSON.stringify(member)

);





location.href =
"dashboard.html";





}

catch(error){


console.error(error);


message.innerHTML =
"SYSTEM ERROR";


}



}