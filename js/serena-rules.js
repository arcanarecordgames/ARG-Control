// =================================
// ARG Control
// Serena Rule Management System
// セレナの定型応答(キーワード → 回答)を管理する
// =================================

import { db } from "./firebase-config.js";

import {
    ref,
    get,
    push,
    set,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getLoggedInMember, requireAdmin, initHeader, escapeHTML, logSystemAction } from "./common.js";

const admin = getLoggedInMember();
requireAdmin(admin);

initHeader();


const keywordsInput = document.getElementById("keywordsInput");
const replyInput = document.getElementById("replyInput");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formTitle = document.getElementById("formTitle");
const ruleList = document.getElementById("ruleList");

let rules = {};
let editingId = null;


function resetForm() {

    editingId = null;
    keywordsInput.value = "";
    replyInput.value = "";
    formTitle.textContent = "新しいルールを追加";
    submitButton.textContent = "追加する";
    cancelEditButton.style.display = "none";

}


function loadRules() {

    get(ref(db, "serena_rules"))
        .then((snapshot) => {

            rules = snapshot.exists() ? snapshot.val() : {};

            if (Object.keys(rules).length === 0) {
                ruleList.innerHTML = `<tr><td colspan="3">NO DATA（まだ追加されたルールはありません）</td></tr>`;
                return;
            }

            ruleList.innerHTML = "";

            Object.keys(rules).forEach((id) => {

                const rule = rules[id];
                const keywordsText = (rule.keywords || []).join(", ");

                ruleList.innerHTML += `
                    <tr>
                        <td>${escapeHTML(keywordsText)}</td>
                        <td style="text-align:left;white-space:pre-wrap;">${escapeHTML(rule.reply)}</td>
                        <td>
                            <button type="button" class="edit-btn" data-id="${id}" style="width:auto;padding:6px 10px;margin-bottom:6px;">編集</button>
                            <button type="button" class="delete-btn" data-id="${id}" style="width:auto;padding:6px 10px;">削除</button>
                        </td>
                    </tr>
                `;

            });

            ruleList.querySelectorAll(".edit-btn").forEach((btn) => {

                btn.onclick = () => {

                    const id = btn.dataset.id;
                    const rule = rules[id];

                    editingId = id;
                    keywordsInput.value = (rule.keywords || []).join(", ");
                    replyInput.value = rule.reply;

                    formTitle.textContent = "ルールを編集";
                    submitButton.textContent = "更新する";
                    cancelEditButton.style.display = "inline-block";

                    window.scrollTo({ top: 0, behavior: "smooth" });

                };

            });

            ruleList.querySelectorAll(".delete-btn").forEach((btn) => {

                btn.onclick = async () => {

                    const id = btn.dataset.id;
                    const rule = rules[id];

                    if (!confirm(`このルールを削除しますか？\n\nキーワード：${(rule.keywords || []).join(", ")}`)) return;

                    try {

                        await remove(ref(db, "serena_rules/" + id));
                        await logSystemAction(admin, "SERENA_RULE_DELETE", (rule.keywords || []).join(", "));

                        if (editingId === id) resetForm();

                        loadRules();

                    } catch (error) {

                        console.error(error);
                        alert("SYSTEM ERROR");

                    }

                };

            });

        })
        .catch((error) => {

            console.error(error);
            ruleList.innerHTML = `<tr><td colspan="3">SYSTEM ERROR</td></tr>`;

        });

}


submitButton.onclick = async () => {

    const keywords = keywordsInput.value
        .split(/[,、]/)
        .map((k) => k.trim())
        .filter((k) => k !== "");

    const reply = replyInput.value.trim();

    if (keywords.length === 0 || reply === "") {
        alert("キーワードと回答の両方を入力してください");
        return;
    }

    try {

        if (editingId) {

            await update(ref(db, "serena_rules/" + editingId), {
                keywords: keywords,
                reply: reply,
                updated_at: new Date().toISOString(),
                updated_by: admin.member_id
            });

            await logSystemAction(admin, "SERENA_RULE_EDIT", keywords.join(", "));

        } else {

            const ruleRef = push(ref(db, "serena_rules"));

            await set(ruleRef, {
                keywords: keywords,
                reply: reply,
                created_at: new Date().toISOString(),
                created_by: admin.member_id
            });

            await logSystemAction(admin, "SERENA_RULE_CREATE", keywords.join(", "));

        }

        resetForm();
        loadRules();

    } catch (error) {

        console.error(error);
        alert("SYSTEM ERROR");

    }

};

cancelEditButton.onclick = resetForm;


resetForm();
loadRules();
