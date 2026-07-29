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