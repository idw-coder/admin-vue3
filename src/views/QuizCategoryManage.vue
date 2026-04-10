<template>
  <div>
    <h1 class="text-h5 mb-4">カテゴリー管理</h1>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- 新規追加フォーム -->
    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1">カテゴリー追加</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap ga-2">
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
            label="カテゴリー名"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 200px"
          />
          <v-text-field
            v-model="newDescription"
            label="説明（任意）"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-text-field
            v-model.number="newDisplayOrder"
            label="表示順"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 100px"
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

    <!-- 一覧 -->
    <v-card>
      <v-progress-linear v-if="loading" indeterminate />
      <v-table>
        <thead>
          <tr>
            <th style="width: 60px">順</th>
            <th style="width: 150px">slug</th>
            <th style="width: 180px">カテゴリー名</th>
            <th>説明</th>
            <th style="width: 120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in store.categories" :key="cat.id">
            <template v-if="editingId === cat.id">
              <td>
                <v-text-field
                  v-model.number="editDisplayOrder"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td>
                <v-text-field
                  v-model="editSlug"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td>
                <v-text-field
                  v-model="editName"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td>
                <v-text-field
                  v-model="editDescription"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td>
                <v-btn
                  icon="mdi-check"
                  variant="text"
                  color="primary"
                  size="small"
                  :loading="saving"
                  @click="handleUpdate(cat.id)"
                />
                <v-btn icon="mdi-close" variant="text" size="small" @click="cancelEdit" />
              </td>
            </template>
            <template v-else>
              <td class="text-medium-emphasis">{{ cat.display_order ?? '-' }}</td>
              <td class="text-medium-emphasis">{{ cat.slug }}</td>
              <td>{{ cat.category_name }}</td>
              <td class="text-medium-emphasis">{{ cat.description || '-' }}</td>
              <td>
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="startEdit(cat)" />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="handleDelete(cat.id)"
                />
              </td>
            </template>
          </tr>
          <tr v-if="store.categories.length === 0 && !loading">
            <td colspan="5" class="text-center text-medium-emphasis py-4">
              カテゴリーがまだありません
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'
import type { QuizCategory } from '@/stores/quiz'

const store = useQuizStore()

const loading = ref(false)
const error = ref<string | null>(null)

const newSlug = ref('')
const newName = ref('')
const newDescription = ref('')
const newDisplayOrder = ref<number | null>(null)
const creating = ref(false)

const editingId = ref<number | null>(null)
const editSlug = ref('')
const editName = ref('')
const editDescription = ref('')
const editDisplayOrder = ref<number | null>(null)
const saving = ref(false)

const handleCreate = async () => {
  error.value = null
  creating.value = true
  try {
    await store.createCategory({
      slug: newSlug.value.trim(),
      category_name: newName.value.trim(),
      ...(newDescription.value.trim() ? { description: newDescription.value.trim() } : {}),
      ...(newDisplayOrder.value != null ? { display_order: newDisplayOrder.value } : {}),
    })
    newSlug.value = ''
    newName.value = ''
    newDescription.value = ''
    newDisplayOrder.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '作成に失敗しました'
  } finally {
    creating.value = false
  }
}

const startEdit = (cat: QuizCategory) => {
  editingId.value = cat.id
  editSlug.value = cat.slug
  editName.value = cat.category_name
  editDescription.value = cat.description ?? ''
  editDisplayOrder.value = cat.display_order ?? null
}

const cancelEdit = () => {
  editingId.value = null
  editSlug.value = ''
  editName.value = ''
  editDescription.value = ''
  editDisplayOrder.value = null
}

const handleUpdate = async (id: number) => {
  error.value = null
  saving.value = true
  try {
    await store.updateCategory(id, {
      slug: editSlug.value.trim(),
      category_name: editName.value.trim(),
      description: editDescription.value.trim(),
      display_order: editDisplayOrder.value ?? undefined,
    })
    cancelEdit()
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '更新に失敗しました'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('このカテゴリーを削除しますか？')) return
  error.value = null
  try {
    await store.removeCategory(id)
  } catch {
    error.value = '削除に失敗しました'
  }
}

onMounted(async () => {
  loading.value = true
  await store.fetchCategories()
  loading.value = false
})
</script>
