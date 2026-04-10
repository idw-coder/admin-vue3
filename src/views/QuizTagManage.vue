<template>
  <div>
    <h1 class="text-h5 mb-4">タグ管理</h1>

    <v-alert v-if="error" type="error" closable class="mb-4" @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1 pb-0">新規タグ</v-card-title>
      <v-card-text>
        <div class="d-flex ga-2 align-center">
          <v-text-field
            v-model="newSlug"
            label="slug"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 160px"
            @keyup.enter="handleCreate"
          />
          <v-text-field
            v-model="newName"
            label="名前"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
            @keyup.enter="handleCreate"
          />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
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
      <v-card-title class="text-subtitle-1 d-flex align-center">
        タグ一覧
        <v-chip size="small" class="ml-2">{{ store.tags.length }}</v-chip>
      </v-card-title>
      <v-progress-linear v-if="loading" indeterminate />
      <v-list>
        <v-list-item v-for="tag in sortedTags" :key="tag.id">
          <template #default>
            <div v-if="editingId === tag.id" class="d-flex align-center ga-2 py-1">
              <v-text-field
                v-model="editSlug"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 160px"
                @keyup.enter="handleUpdate(tag.id)"
              />
              <v-text-field
                v-model="editName"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                @keyup.enter="handleUpdate(tag.id)"
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
              <v-chip size="small" variant="tonal" class="mr-4" style="min-width: 120px; justify-content: center">
                {{ tag.slug }}
              </v-chip>
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
          <v-list-item-title class="text-medium-emphasis text-center py-4">
            タグがまだありません
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'
import type { QuizTag } from '@/stores/quiz'

const store = useQuizStore()

const sortedTags = computed(() =>
  [...store.tags].sort((a, b) => a.slug.localeCompare(b.slug, 'ja'))
)

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
