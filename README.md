# ARG Control - 修正・整理内容

このZIPは元のコード一式を整理し、確認できたバグを修正したものです。
デザイン・画面遷移・全体構成は既存のものを踏襲し、大きな変更はしていません。

## 🐛 修正した重大バグ

1. **`register.js` に管理者チェックが無かった**
   `register.html` は「ADMINISTRATOR ONLY」と表示していただけで、実際にはログインすらしていなくてもURLを直接開けば誰でもメンバー登録できてしまっていました。`common.js` の `requireAdmin()` で保護しました。

2. **`login-log.js` にログイン/管理者チェックが無かった**
   同様にURL直打ちで誰でも全メンバーのログイン履歴を閲覧できました。保護を追加しました。

3. **メール詳細画面が常に空表示になるバグ**
   `mail-detail.js` が存在しないフィールド `mail.created_at` / `mail.message` を参照していましたが、実際にメール作成時(`mail-compose.js`)に保存されるのは `time` / `body` でした。参照先を修正しました。

4. **新着メールが常に「既読(READ)」表示になるバグ**
   既読状態を `read:{}`（空オブジェクト）で初期化していましたが、JavaScriptでは空オブジェクトも真値と判定されるため、メール一覧が常に「READ」と表示されていました。`read` をメンバーIDごとの既読マップとして扱うように統一しました。

5. **メール機能が重複・スキーマ不一致だった**
   `mail-compose.html/js`（保存先: `mail`）と `send-mail.html/js`（保存先: `mails`、フィールド名も別）という互換性のない同機能が2系統存在していました。ダッシュボードから実際に使われているのは前者のため、`mail-compose.html/js` に一本化し、`send-mail.*` は削除しました。

6. **会員ID採番の衝突チェックが無かった**
   `Date.now()` の下5桁を使っていたため、短時間に複数登録すると同じIDになる可能性がありました。生成後にFirebase側で重複確認するループを追加しました。

## 🧹 整理した内容

- 各画面で重複していた「ログイン確認」「管理者確認(access_level >= 4)」「XSSエスケープ」処理を `js/common.js` に集約
- `register.html` の権限名（TESTER〜FOUNDER）と `member-edit.html` の権限名（GUEST〜ADMIN）が食い違っていたため、`member-edit.html` 側の表記（1 GUEST 〜 5 ADMIN）に統一
- `register.html` にあった未使用の「招待コード」入力欄を削除（JS側で一度も参照されていなかったため）
- メンバー名・メール件名など他メンバーが入力した文字列を `innerHTML` に挿入している箇所に `escapeHTML()` を適用（簡易的なXSS対策）

## ✨ 追加した機能

- **ログアウトボタン**：ログイン後の全画面に存在しませんでした。各画面ヘッダーの STATUS 表示の隣に自動追加されます。
- **ダッシュボードの MEMBERS / SYSTEM LOG カード**：リンクが設定されておらず押しても何も起きなかったため、それぞれ `members.html` / `login-log.html` へ遷移するようにしました。
- **メールボックスの「NEW MAIL」ボタン**：メール一覧画面から新規作成画面への導線がありませんでした（管理者 access_level >= 4 のみ表示）。

## 🆕 追加機能：PROJECTS（企画投稿）

- `projects.html`：企画一覧＋NEWボタン
- `project-new.html`：新規投稿
- `project-detail.html`：詳細（投稿者本人 or 管理者のみ EDIT/DELETE 表示）
- `project-edit.html`：編集
- 保存先：Firebase `projects/{id}`（title, body, author_id, author_name, created_at, updated_at）
- 編集・削除は投稿者本人または管理者(access_level≥4)のみ

## 🆕 追加機能：TASKS（Todo + カレンダー）

- `tasks.html`：月表示カレンダー＋Todoリスト。日付をクリックするとその日のタスクだけに絞り込み表示
- `task-new.html`：新規作成（タイトル・内容・期日・担当者）
- `task-detail.html`：詳細（完了/未完了の切替、EDIT、DELETE）
- `task-edit.html`：編集
- 保存先：Firebase `tasks/{id}`（title, body, due_date, status, assignee_id, assignee_name, author_id, author_name, created_at, updated_at）
- 編集・削除・完了切替は投稿者本人／担当者／管理者(access_level≥4)のみ

## 🆕 追加機能：SETTINGS（設定）

「個人設定（全メンバー共通）」と「システム設定（ACCESS LEVEL 5 = FOUNDER専用）」を明確に分けています。

**個人設定（誰でも安全に触れる部分）**
- 表示名の変更
- パスワード変更（現在のパスワードをDB側で再検証してから変更）

**システム設定（ACCESS LEVEL 5 のみ）**
- 新規登録時のデフォルト権限レベル（`register.html` のプルダウンに自動反映）
- ログイン失敗の自動ロック閾値（0で無効。`auth.js` と連動し、n回連続でパスワードを間違えると自動でstatusが`locked`になる）
- メンテナンスモード（ONの間はACCESS LEVEL 5以外ログイン不可。`auth.js`で判定）
- ダッシュボードのお知らせバナー（ログイン後の全員のダッシュボードに表示）
- ログイン履歴の保持日数の設定＋その日数より古いログを一括削除するボタン

**権限の分け方について**
- レベル5専用セクションは `access_level !== 5` の場合、画面にそもそも描画されません（`settings.js` で非表示）。
- ただし表示を隠すだけでは devtools 等で回避される可能性があるため、保存・削除の実行関数側でも `isLevel5(member)` を再チェックしています（多重防御）。
- とはいえ根本的には、以前お伝えした通り現状の認証はFirebase Authを使わず `localStorage` の自己申告データに依存しているため、**本当の意味での防御はFirebase Security Rules側で行う必要があります**。この点は変わっていません。

保存先：Firebase `settings/system`（default_access_level, login_lockout_threshold, maintenance_mode, announcement, login_log_retention_days）

## 🆕 追加機能：デザイン設定（カラーテーマ / フォント・UIスタイル）

「設定」に全メンバー共通のデザイン設定を追加しました。

- **カラーテーマ**：CYAN(デフォルト) / BLUE / GREEN / RED / PURPLE / LIGHT の6種類
- **デザインスタイル**：TERMINAL(等幅フォント・ネオン風・角無し／デフォルト) / MODERN(サンセリフ・フラット・角丸) / CLASSIC(セリフフォント・落ち着いたデザイン) の3種類
- 組み合わせで最大18パターンから選べます
- プルダウンを変更するとすぐにプレビューされ、SAVE DESIGNでアカウント（Firebase `members/{id}/preferences`）と、この端末（localStorage）の両方に保存されます
- 別の端末でログインした場合も、アカウント側の設定が自動で反映されます
- ログイン前の画面（`index.html`）は、その端末に最後に保存されたテーマがそのまま使われます（アカウント判定前のため）

**実装方法**：`css/style.css` の色・フォント・角丸・影を全てCSS変数化し、`js/common.js` の `applyTheme()` が `:root` にインラインでCSS変数を上書きすることでテーマを切り替えています。既存の見た目（CYAN × TERMINAL）は変数のデフォルト値として維持しているため、初期状態の見た目は変わりません。

## 🆕 追加機能：RECORDS（スレッド形式の記録）

- `records.html`：スレッド一覧＋NEW THREADボタン
- `record-new.html`：新規スレッド作成（タイトル＋本文）
- `record-detail.html`：スレッド本文＋書き込み一覧＋リアクションスタンプ（👍❤️😂😮🎉）＋新規書き込みフォーム
- 保存先：Firebase `records/{id}`（スレッド本体）、`records/{id}/posts/{postId}`（書き込み）、各投稿の `reactions/{emoji}/{member_id}` でリアクションON/OFFを管理
- **投稿後の編集機能は一切実装していません**（編集ボタン自体が存在しない仕様）
- **削除はaccess_level=5のみ**：スレッド全体の削除、個別の書き込み削除の両方とも5専用ボタンとして表示（他の権限には表示自体されません）

## 🆕 追加機能：FILES（画像・動画・音声の共有）

- `files.html`：ファイル一覧＋UPLOAD FILEボタン
- `file-upload.html`：ファイル選択＋説明入力＋アップロード進捗バー
- `file-detail.html`：ファイルのプレビュー（画像はimg、動画はvideo、音声はaudioで表示）＋ダウンロードリンク＋削除ボタン
- 保存先：ファイル本体は **Firebase Cloud Storage**、メタデータ（ファイル名・アップロード者・カテゴリ等）は Realtime Database `files/{id}` に保存
- 対応形式：画像(jpg/png/gif/webp)・動画(mp4/webm/mov)・音声(mp3/wav/m4a等)、上限50MB（未対応形式は"OTHER"として扱われアップロード自体は可能）
- **削除権限は仕様に明記が無かったため、アップロード本人 または 管理者(access_level≥4)** と仮定して実装しています。もし「level5のみ」等に変更したい場合は `file-detail.js` の `canDelete` の条件を変更するだけで対応できます。
- Firebase側の対応：`firebase-config.js` に既にあった `storageBucket` の設定を使い、Cloud Storageを有効化しています。**Firebaseコンソール側でStorageの利用を開始し、Storage Security Rules（読み書き権限）も別途設定が必要です**（Realtime Databaseのルールとは別物です）。

## ⚠️ 今回は手を入れていない・要検討事項

- ダッシュボードの全カードにリンクを設定済みで、未実装のメニューは無くなりました。
- Firebase Realtime Database の Security Rules と、Cloud Storage の Security Rules の両方について、意図通りの権限になっているかFirebaseコンソール側で確認してください（クライアントコードだけでは本当のアクセス制御はできません）。
- **パスワードのハッシュ方式**（ソルト無しSHA-256）は、既存メンバーのパスワードと非互換になるため今回は変更していません。将来的に強化する場合は移行処理が必要です。
- **Firebase Realtime Database の Security Rules** はクライアントコードだけでは制御できません。`members` / `mail` / `login_logs` に対する read/write 権限が意図通りに制限されているか、Firebaseコンソール側で別途確認してください。

## ファイル構成

```
arg-control/
├── index.html            ログイン
├── dashboard.html         ダッシュボード
├── admin.html             管理者パネル
├── members.html           メンバー一覧（管理者用）
├── member-detail.html     メンバー詳細（管理者用）
├── member-edit.html       メンバー編集（管理者用）
├── account-control.html   アカウント状態変更（管理者用）
├── register.html          メンバー新規登録（管理者用）
├── login-log.html         ログイン履歴（管理者用）
├── mail.html              メールボックス
├── mail-compose.html      メール作成（管理者用）
├── mail-detail.html       メール詳細
├── css/style.css
└── js/
    ├── common.js          ★新規: 共通のログイン/権限/ログアウト/エスケープ処理
    ├── firebase-config.js
    ├── security.js
    ├── auth.js
    ├── dashboard.js
    ├── admin.js
    ├── members.js
    ├── member-detail.js
    ├── member-edit.js
    ├── account-control.js
    ├── register.js
    ├── login-log.js
    ├── mail.js
    ├── mail-compose.js
    └── mail-detail.js
```

---

# 🆕 大規模アップデート（報告書対応）

以下の報告書に基づき、全体の構成を大きく更新しました。

## ログイン・ヘッダー共通
- MID入力を「ARG-」固定表示＋数字のみ入力に変更（`index.html` / `auth.js`）
- 画面上部タイトル「ARG Control」をクリックするとダッシュボードに戻る（`common.js` `initHeader()`）
- 画面右上にリアルタイムの日付・曜日・時刻を表示
- ハンバーガーメニュー（☰）を追加し、PROJECTS/THREADS/TASKS/FILES/MAIL/PROFILES/SETTINGS/管理画面（admin以上）とログアウトをそこに集約。各項目に絵文字アイコンを付与
- 上記の反映は全ページ共通の `initHeader()` 一括呼び出しで実現（旧 `attachLogoutButton()` から全JSファイルを機械的に置換）

## ダッシュボード
- 自分のプロフィール表示を画面最下部に移動
- 元プロフィール表示位置に **NEWS欄** を新設（スクロール対応）。以下を集約表示し、開く/確認済みボタンで既読にすると非表示になります。
  - PROJECTSの新規投稿 / THREADSの新規スレッド / FILESの新規アップロード（全員向け）
  - 自分宛のMAIL、自分が担当者に指定されたTASK、タスクでメンションされた場合（個人向け）
  - 期限3日以内で未完了の自分の担当タスク（DBに保存せずその場で計算する合成ニュース）
  - 管理画面から直接投稿できるお知らせ（全員向け・個人向け両対応）
- 公式サイト（https://arcanarecordgames.com）・公式X（https://x.com/arcanarecord）・公式YouTube（https://youtube.com/@arcanarecord）のカードを新設（ハンバーガーメニューには含めず常時表示）

## PROJECTS / THREADS(旧RECORDS) / FILES / MAIL / TASKS / SETTINGS
- 一覧画面に「← BACK TO DASHBOARD」ボタンを追加
- RECORDSを「THREADS」に改称（ナビ表示・見出し）、サブタイトルも「スレッド」表記に統一
- スレッドのリアクションを20種類に拡張。常時20個並べるのではなく、「＋」ボタンを押すと候補パネルが開いて選ぶ方式に変更（要望どおりの挙動）
- TASKSの「NEW TASK」ボタンをタスク一覧から削除し、カレンダー右上に「＋ NEW TASK」として移動
- タスク新規作成画面の期日入力を、カレンダーをクリックして日付を選ぶ独自UIに変更（`task-new.html/js`）
- タスク新規作成に任意の「MENTION」欄（複数選択）を追加。選択した相手にダッシュボードNEWSへの通知が届きます

## PROFILES（新機能）
- ダッシュボードの「MEMBERS」表記を「PROFILES」に変更（サブタイトルも「プロフィール一覧」に）
- 既存の `members.html`（管理画面からのメンバー管理・編集）はそのまま維持しつつ、新たに全員が閲覧できる `profiles.html`（一覧）→ `profile-detail.html`（詳細）を追加
- プロフィール項目：ユーザー名・MID・権限レベル・生年月日（任意）・登録日（アカウント作成日を自動表示）・性別・担当（複数選択、指定の16ロール全て収録）・自己紹介
- 編集（`profile-edit.html`）は本人 または access_level 5 のみ

## 管理画面（旧：管理者管理画面）
- 表記を「管理画面」に統一
- 「システムログ」カードを新設。ログイン履歴（`login_logs`）とは別に、`system_logs` として「誰が・いつ・どこで(ページ)・何をしたか」を記録する監査ログを実装し、企画/スレッド/書き込み/ファイル/メール送信/プロフィール編集/ニュース投稿などの操作に記録を追加
- 管理画面から直接ニュースを投稿できるフォームを追加（宛先を全員 or 特定メンバーに指定可能）

## SETTINGS
- カラーテーマをダーク系5種（既存）＋ライト系4種追加の計10種に拡張（LIGHT PINK / LIGHT MINT / LIGHT SAND / LIGHT LAVENDER）
- デザインスタイルを「フォント」と「UI」の2軸に分離
  - フォント：等幅(ターミナル風) / サンセリフ / セリフ / 手書き風 / 丸ゴシック / ゴシック体 の6種
  - UI：ネオン / フラット / ミニマル / かわいい(CUTE) / ガラス風(GLASS) / レトロ の6種（ネオン以外を大幅追加）
  - テーマ×フォント×UIで360通りの組み合わせが可能に
- 「言語設定」を追加（日本語 / English の切替と保存基盤）。**現状は設定の保存とごく一部の共通表示のみ対応**しており、全画面約30ページ分の文言を丸ごと英訳・切替する対応は非常に規模が大きいため、今回は基盤（設定の保存・取得の仕組み）のみ実装しています。全ページの英語UIが必要な場合は追加の作業として次のステップで対応します。
- SETTINGS画面にも「← BACK TO DASHBOARD」を追加

## 既知の未対応・スコープ外にした点
- 完全な多言語対応（全画面の文言の英訳）は基盤のみで、表示の切り替えは今後の追加対応が必要です
- `task-edit.html`（既存タスクの編集画面）の日付入力は、今回は新規作成画面のみカレンダー式に変更し、編集画面は従来の日付入力のままにしています（ご要望があれば揃えます）
- ニュースの既読管理・システムログ・プロフィールなど新設したデータについても、Firebase Realtime Database の Security Rules 側の権限確認が別途必要です（クライアントコードだけでは本当の意味でのアクセス制御はできない点は従来と同様です）

---

# 🆕 追加対応（task-edit統一・言語設定の本実装）

## task-edit.html/js（既存タスクの編集画面）
- `task-new.html`と同じ、カレンダークリック式の日付選択に統一
- 「MENTION（任意・複数選択可）」欄を追加
- 担当者を変更した場合、新しい担当者に通知（ニュース）が届くように対応
- 新たに追加されたメンション相手にも通知が届くように対応（既存のメンションには再通知しません）

## 言語設定（日本語 / English）の本実装
- 設定画面の「言語設定」のすぐ下に、**「英語表示は機械的な辞書引きによる自動翻訳であり、ニュアンスの違いや誤訳を含む可能性がある」旨の注意書き**（日英併記）を追加しました
- 画面の見出し・ラベル・ボタン・placeholder・確認ダイアログなど、**全画面で使われている日本語の静的テキストを網羅的に辞書化**し、言語設定がEnglishのときに自動で英語表示に切り替わる仕組み（`common.js` の `applyI18n()` / `tx()`）を実装しました。HTMLファイル自体は変更せず、ページ読み込み時にJSが該当テキストを検出して置き換える方式です。
- 設定はアカウント（Firebase `members/{id}/preferences.lang`）とこの端末（localStorage）の両方に保存され、他の端末でログインしても自動反映されます
- **翻訳対象外にしている部分（意図的な仕様）**：
  - 企画名・タスク名・メール本文・スレッドの書き込み内容など、**メンバーが入力したデータそのもの**は翻訳しません（誤訳でデータの意味が変わって見えることを避けるため）
  - ニュース通知の文面（「新しい企画が投稿されました：〇〇」等）やシステムログの内容は、**投稿された時点の日本語のまま保存**されます。閲覧者の言語設定に応じてリアルタイムに再翻訳する仕組みは今回のスコープには含めていません（実装するにはニュース/ログの保存方式を「完成文」ではなく「種類+パラメータ」に変更する、より大きな設計変更が必要なため）
