<template>
  <div>
    <h1 class="text-h5 mb-4">タグ管理</h1>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card class="mb-4">
      <v-card-text>
        <div class="d-flex gap-2">
          <v-text-field
            v-model="newSlug"
            label="slug"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 160px"
          />
          <v-text-field
            v-model="newName"
            label="名前"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-btn
            color="primary"
            :loading="creating"
            :disabled="!newSlug.trim() || !newName.trim()"
            @click="handleCreate"
          >
            追加
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-progress-linear v-if="loading" indeterminate />
      <v-list>
        <v-list-item v-for="tag in store.tags" :key="tag.id">
          <template #default>
            <div v-if="editingId === tag.id" class="d-flex align-center gap-2 py-1">
              <v-text-field
                v-model="editSlug"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 160px"
              />
              <v-text-field
                v-model="editName"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
              />
              <v-btn
                icon="mdi-check"
                variant="text"
                color="primary"
                :loading="saving"
                @click="handleUpdate(tag.id)"
              />
              <v-btn icon="mdi-close" variant="text" @click="cancelEdit" />
            </div>
            <div v-else class="d-flex align-center">
              <span class="text-medium-emphasis mr-4" style="min-width: 160px">{{ tag.slug }}</span>
              <span class="flex-grow-1">{{ tag.name }}</span>
            </div>
          </template>
          <template v-if="editingId !== tag.id" #append>
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="startEdit(tag)" />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="handleDelete(tag.id)"
            />
          </template>
        </v-list-item>
        <v-list-item v-if="store.tags.length === 0 && !loading">
          <v-list-item-title class="text-medium-emphasis">タグがまだありません</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'
import type { QuizTag } from '@/stores/quiz'

const store = useQuizStore()

const loading = ref(false)
const error = ref<string | null>(null)

const newSlug = ref('')
const newName = ref('')
const creating = ref(false)

const editingId = ref<number | null>(null)
const editSlug = ref('')
const editName = ref('')
const saving = ref(false)

const handleCreate = async () => {
  error.value = null
  creating.value = true
  try {
    await store.createTag({ slug: newSlug.value.trim(), name: newName.value.trim() })
    newSlug.value = ''
    newName.value = ''
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '作成に失敗しました'
  } finally {
    creating.value = false
  }
}

const startEdit = (tag: QuizTag) => {
  editingId.value = tag.id
  editSlug.value = tag.slug
  editName.value = tag.name
}

const cancelEdit = () => {
  editingId.value = null
  editSlug.value = ''
  editName.value = ''
}

const handleUpdate = async (id: number) => {
  error.value = null
  saving.value = true
  try {
    await store.updateTag(id, { slug: editSlug.value.trim(), name: editName.value.trim() })
    cancelEdit()
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '更新に失敗しました'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('このタグを削除しますか？')) return
  error.value = null
  try {
    await store.removeTag(id)
  } catch {
    error.value = '削除に失敗しました'
  }
}

onMounted(async () => {
  loading.value = true
  await store.fetchTags()
  loading.value = false
})
</script>
