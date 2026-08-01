// =================================
// ARG Control
// Serena Rule Management System
// セレナの定型応答(キーワード → 回答・リンク・選択肢)を管理する
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
const linkUrlInput = document.getElementById("linkUrlInput");
const linkLabelInput = document.getElementById("linkLabelInput");
const choicesContainer = document.getElementById("choicesContainer");
const addChoiceButton = document.getElementById("addChoiceButton");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formTitle = document.getElementById("formTitle");
const ruleList = document.getElementById("ruleList");

let rules = {};
let editingId = null;


// =================================
// 選択肢の動的な入力行
// =================================

function addChoiceRow(label, value) {

    const row = document.createElement("div");
    row.className = "serena-rule-choice-row";

    row.innerHTML = `
        <input type="text" class="choice-label-input" placeholder="ボタンの表示文字（例：はい）" value="${escapeHTML(label || "")}">
        <input type="text" class="choice-value-input" placeholder="押した時にセレナへ送る内容（例：はい）" value="${escapeHTML(value || "")}">
        <button type="button" class="remove-choice-btn">削除</button>
    `;

    row.querySelector(".remove-choice-btn").onclick = () => row.remove();

    choicesContainer.appendChild(row);

}

addChoiceButton.onclick = () => addChoiceRow("", "");


function getChoicesFromForm() {

    return Array.from(choicesContainer.querySelectorAll(".serena-rule-choice-row"))
        .map((row) => ({
            label: row.querySelector(".choice-label-input").value.trim(),
            value: row.querySelector(".choice-value-input").value.trim()
        }))
        .filter((choice) => choice.label !== "" && choice.value !== "");

}


// =================================
// フォームの初期化・編集読み込み
// =================================

function resetForm() {

    editingId = null;
    keywordsInput.value = "";
    replyInput.value = "";
    linkUrlInput.value = "";
    linkLabelInput.value = "";
    choicesContainer.innerHTML = "";

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

                const badges = [
                    rule.link_url ? "🔗 リンクあり" : "",
                    (rule.choices && rule.choices.length > 0) ? `🔘 選択肢${rule.choices.length}件` : ""
                ].filter((b) => b !== "").join(" / ");

                ruleList.innerHTML += `
                    <tr>
                        <td>${escapeHTML(keywordsText)}</td>
                        <td style="text-align:left;white-space:pre-wrap;">
                            ${escapeHTML(rule.reply)}
                            ${badges ? `<div style="font-size:11px;opacity:0.6;margin-top:6px;">${escapeHTML(badges)}</div>` : ""}
                        </td>
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
                    linkUrlInput.value = rule.link_url || "";
                    linkLabelInput.value = rule.link_label || "";

                    choicesContainer.innerHTML = "";
                    (rule.choices || []).forEach((choice) => addChoiceRow(choice.label, choice.value));

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


// =================================
// 追加・更新
// =================================

submitButton.onclick = async () => {

    const keywords = keywordsInput.value
        .split(/[,、]/)
        .map((k) => k.trim())
        .filter((k) => k !== "");

    const reply = replyInput.value.trim();
    const linkUrl = linkUrlInput.value.trim();
    const linkLabel = linkLabelInput.value.trim();
    const choices = getChoicesFromForm();

    if (keywords.length === 0 || reply === "") {
        alert("キーワードと回答の両方を入力してください");
        return;
    }

    const data = {
        keywords: keywords,
        reply: reply,
        link_url: linkUrl,
        link_label: linkLabel,
        choices: choices
    };

    try {

        if (editingId) {

            await update(ref(db, "serena_rules/" + editingId), {
                ...data,
                updated_at: new Date().toISOString(),
                updated_by: admin.member_id
            });

            await logSystemAction(admin, "SERENA_RULE_EDIT", keywords.join(", "));

        } else {

            const ruleRef = push(ref(db, "serena_rules"));

            await set(ruleRef, {
                ...data,
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
