<template>
  <div>
    <h1 class="text-h5 mb-4">ユーザー管理</h1>

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <v-card>
      <v-progress-linear v-if="store.loading" indeterminate />
      <v-table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>メールアドレス</th>
            <th>ロール</th>
            <th>登録日</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.users.length === 0 && !store.loading">
            <td colspan="6" class="text-center text-medium-emphasis py-4">ユーザーがいません</td>
          </tr>
          <tr v-for="user in store.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              {{ user.name }}
              <span v-if="user.id === authStore.user?.id" class="text-caption text-medium-emphasis">
                (自分)
              </span>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <v-chip
                :color="user.role === 'admin' ? 'warning' : undefined"
                size="small"
                variant="flat"
              >
                {{ ROLE_LABELS[user.role] ?? user.role }}
              </v-chip>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(user)" />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                :disabled="user.id === authStore.user?.id"
                @click="handleDelete(user)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>ユーザーを編集</v-card-title>
        <v-card-text>
          <v-alert v-if="editError" type="error" class="mb-4">{{ editError }}</v-alert>
          <v-text-field
            v-model="editName"
            label="名前"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="editEmail"
            label="メールアドレス"
            type="email"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-select
            v-model="editRole"
            :items="roleItems"
            label="ロール"
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEdit">キャンセル</v-btn>
          <v-btn color="primary" :loading="saving" @click="handleUpdate">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/user'

const store = useUserStore()
const authStore = useAuthStore()
const router = useRouter()

const ROLE_LABELS: Record<string, string> = {
  admin: '管理者',
  user: 'ユーザー',
}

const roleItems = [
  { title: 'ユーザー', value: 'user' },
  { title: '管理者', value: 'admin' },
]

const dialog = ref(false)
const editTarget = ref<User | null>(null)
const editName = ref('')
const editEmail = ref('')
const editRole = ref<'admin' | 'user'>('user')
const saving = ref(false)
const editError = ref<string | null>(null)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

const openEdit = (user: User) => {
  editTarget.value = user
  editName.value = user.name
  editEmail.value = user.email
  editRole.value = user.role
  editError.value = null
  dialog.value = true
}

const closeEdit = () => {
  dialog.value = false
  editTarget.value = null
  editError.value = null
}

const handleUpdate = async () => {
  if (!editTarget.value) return
  const name = editName.value.trim()
  const email = editEmail.value.trim()
  if (!name || !email) {
    editError.value = '名前とメールアドレスは必須です'
    return
  }
  saving.value = true
  editError.value = null
  try {
    const params: Record<string, string> = {}
    if (name !== editTarget.value.name) params.name = name
    if (email !== editTarget.value.email) params.email = email
    if (editRole.value !== editTarget.value.role) params.role = editRole.value
    await store.updateUser(editTarget.value.id, params)
    closeEdit()
  } catch (e: any) {
    editError.value = e?.response?.data?.error ?? '更新に失敗しました'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (user: User) => {
  if (user.id === authStore.user?.id) {
    alert('自分自身は削除できません')
    return
  }
  if (!confirm(`「${user.name}」を削除しますか？`)) return
  await store.deleteUser(user.id)
}

onMounted(() => {
  // if (authStore.user?.role !== 'admin') {
  // router.push('/')
  // return
  // }
  store.fetchUsers()
})
</script>
