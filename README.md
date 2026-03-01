# admin-vue3

管理画面をReact (Vite) からVue 3へ移行するプロジェクトです。

## 技術スタック

Vue 3 / TypeScript / Vite / Vuetify 3 / Pinia / Vue Router 4 / Axios / tiptap v2

## 移行の背景

既存の管理画面はReact (Vite) で構築されていましたが、Vue 2ベースの参考プロジェクトの構成に近づけること、およびエディタライブラリの統一を目的としてVue 3へ移行します。

エディタはBlockNote（React専用）からtiptap v2（Vue 3公式対応）に変更します。これにあわせてユーザー向けフロントエンド（Next.js）側の解説文表示もtiptap対応に更新します。

## 移行ステップ

Vue 3 + Vuetifyで管理画面UIを作成し、既存のバックエンドAPIに接続できる状態にします。

ローカル環境でReactからVueに切り替え、動作確認を行います。

Next.jsのExplanationViewをBlockNote表示からプレーンテキスト表示に変更し、既存データの表示が崩れないことを確認します。

Next.jsにtiptap対応を追加し、Vue側で保存したデータがリッチ表示されることを確認します。

## ディレクトリ構成

```
src/
  main.ts
  App.vue
  router/
    index.ts
  stores/
    auth.ts
    notes.ts
    quizzes.ts
    tags.ts
    users.ts
  modules/
    auth/
    notes/
    quizzes/
    tags/
    users/
  lib/
    api.ts
  components/
    layout/
    notes/
    quizzes/
    common/
  pages/
    Dashboard.vue
    NoteCreate.vue
    NoteDetail.vue
    QuizList.vue
    QuizEdit.vue
    TagManage.vue
    UserManage.vue
    Signin.vue
    Signup.vue
```

## ビルド・デプロイ

ビルド出力先は `../backend/public` です。`base` は `/admin/` に設定しています。

本番環境はAWS Lightsail上のDockerコンテナで動作しており、GitHub Actionsによるデプロイはサーバー上でgit pullしてビルドする方式です。

## 関連リポジトリ

`backend` — Express API

`next-basic` — Next.js ユーザー向けフロントエンド

`express-mysql-docker` — インフラ設定（docker-compose等）
