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
