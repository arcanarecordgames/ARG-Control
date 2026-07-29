// =================================
// ARG Control
// Dashboard System
// =================================



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






document.getElementById(
"username"
).textContent =

member.username;





document.getElementById(
"memberID"
).textContent =

member.member_id;





document.getElementById(
"accessLevel"
).textContent =

member.access_level;





document.getElementById(
"status"
).textContent =

member.status;
// ADMIN PANEL CONTROL


const adminPanel =

document.getElementById(
"adminPanel"
);



if(adminPanel){


if(member.access_level >= 4){


adminPanel.style.display =
"block";



adminPanel.onclick = function(){


location.href =
"admin.html";


};


}else{


adminPanel.style.display =
"none";


}


}