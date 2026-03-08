<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item to="/" title="ダッシュボード" prepend-icon="mdi-home" />
        <v-list-item to="/notes/new" title="ノート作成" prepend-icon="mdi-note-plus" />
        <v-list-item to="/quizzes" title="クイズ管理" prepend-icon="mdi-help-circle" />
        <v-list-item to="/quiz-categories" title="カテゴリー管理" prepend-icon="mdi-shape" />
        <v-list-item to="/quiz-tags" title="クイズタグ管理" prepend-icon="mdi-tag" />
        <v-list-item to="/users" title="ユーザー管理" prepend-icon="mdi-account" />
      </v-list>
      <template #append>
        <v-list>
          <v-list-item title="サインアウト" prepend-icon="mdi-logout" @click="handleSignout" />
        </v-list>
      </template>
    </v-navigation-drawer>
    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const handleSignout = () => {
  auth.clearAuth()
  router.push('/signin')
}
</script>
