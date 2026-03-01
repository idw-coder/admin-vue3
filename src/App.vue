<template>
  <v-app v-if="!loading">
    <router-view />
  </v-app>
  <v-app v-else>
    <v-main class="d-flex align-center justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)

onMounted(async () => {
  await auth.initAuth()
  loading.value = false
})
</script>

<style scoped></style>
