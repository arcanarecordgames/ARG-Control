// =================================
// ARG Control
// Security System
// =================================


// Internal ID 1
// Unique UUID

export function createInternalID1() {

    return crypto.randomUUID();

}


// Internal ID 2
// Long Security Key

export function createInternalID2() {

    const array = new Uint8Array(32);

    crypto.getRandomValues(array);

    return Array.from(array)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

}


// Member ID生成
// number は "00001" のような5桁ゼロ埋め文字列を想定

export function createMemberID(number) {

    return "ARG-" + String(number).padStart(5, "0");

}


// ランダムな5桁の会員番号を生成する（衝突チェックは呼び出し側で行う）

export function generateRandomNumber() {

    const n = Math.floor(Math.random() * 100000);

    return String(n).padStart(5, "0");

}


// Password Hash
// 注意: 既に登録済みのメンバーのパスワードがこの方式でハッシュ化されているため、
// アルゴリズムを変更すると既存メンバーが全員ログインできなくなる。
// 変更する場合は移行処理（次回ログイン時に再ハッシュする等）が別途必要。

export async function hashPassword(password) {

    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hash = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

}
