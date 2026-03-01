<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" max-width="400">
        <v-card width="100%" class="pa-4">
          <v-card-title class="text-center mb-4">サインイン</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="email"
              label="メールアドレス"
              type="email"
              variant="outlined"
              class="mb-2"
            />
            <v-text-field
              v-model="password"
              label="パスワード"
              type="password"
              variant="outlined"
            />
            <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
          </v-card-text>
          <v-card-actions>
            <v-btn block color="primary" size="large" :loading="loading" @click="handleSignin">
              サインイン
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleSignin = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('token', res.data.token)
    auth.setAuth(res.data.user)
    router.push('/')
  } catch {
    error.value = 'メールアドレスまたはパスワードが正しくありません'
  } finally {
    loading.value = false
  }
}
</script>
