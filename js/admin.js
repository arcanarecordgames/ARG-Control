// =================================
// ARG Control
// Admin Authorization System
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