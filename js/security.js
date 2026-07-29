// =================================
// ARG Control
// Security System
// =================================



// Internal ID 1
// Unique UUID

export function createInternalID1(){

    return crypto.randomUUID();

}





// Internal ID 2
// Long Security Key

export function createInternalID2(){


    const array =
    new Uint8Array(32);


    crypto.getRandomValues(array);



    return Array.from(array)

    .map(

        byte =>

        byte.toString(16)
        .padStart(2,"0")

    )

    .join("");

}





// Member ID生成

export function createMemberID(number){


    return "ARG-" +

    String(number)
    .padStart(5,"0");


}





// Password Hash

export async function hashPassword(password){


    const encoder =
    new TextEncoder();


    const data =
    encoder.encode(password);



    const hash =

    await crypto.subtle.digest(

        "SHA-256",

        data

    );



    return Array.from(

        new Uint8Array(hash)

    )

    .map(

        byte =>

        byte.toString(16)
        .padStart(2,"0")

    )

    .join("");

}