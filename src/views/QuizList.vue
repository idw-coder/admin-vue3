<template>
  <div class="quiz-list-page">
    <div class="d-flex align-center justify-space-between mb-2">
      <h1 class="text-subtitle-1 font-weight-bold">クイズ管理</h1>
      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-download"
          :loading="exporting"
          @click="handleExport"
        >
          CSV出力
        </v-btn>
        <v-btn variant="tonal" size="small" prepend-icon="mdi-upload" @click="importDialog = true">
          CSV取込
        </v-btn>
        <v-btn color="primary" size="small" to="/quizzes/new" prepend-icon="mdi-plus">
          クイズ作成
        </v-btn>
      </div>
    </div>

    <v-row dense class="mb-2" align="center">
      <v-col cols="12" sm="4">
        <v-select
          v-model="selectedCategoryId"
          :items="categoryItems"
          label="カテゴリ"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @update:model-value="onCategoryChange"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="selectedTagSlug"
          :items="tagItems"
          label="タグ"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :disabled="!selectedCategoryId"
          @update:model-value="fetchQuizzes"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model="searchQuery"
          label="キーワード検索"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          @keydown.enter="fetchQuizzes"
          @click:clear="onClearSearch"
        />
      </v-col>
    </v-row>

    <!-- インポートダイアログ -->
    <v-dialog v-model="importDialog" max-width="520">
      <v-card>
        <v-card-title>CSVインポート</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <div class="d-flex align-center justify-space-between">
              <span>フォーマットが分からない場合はサンプルをダウンロードしてください</span>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-file-download"
                :href="sampleCsvUrl"
                target="_blank"
              >
                サンプルCSV
              </v-btn>
            </div>
          </v-alert>
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv"
            :disabled="importing"
            style="display: none"
            @change="onNativeFileChange"
          />
          <v-btn
            variant="outlined"
            prepend-icon="mdi-file-delimited"
            block
            :disabled="importing"
            @click="fileInputRef?.click()"
          >
            {{ fileName || 'CSVファイルを選択' }}
          </v-btn>
          <v-alert
            v-if="importResult"
            :type="importResult.error_count > 0 ? 'warning' : 'success'"
            class="mt-2"
            density="compact"
          >
            <div>
              作成: {{ importResult.created_count }}件 / 更新: {{ importResult.updated_count }}件 /
              エラー: {{ importResult.error_count }}件
            </div>
            <div v-if="importResult.created_tags.length > 0" class="mt-1 text-caption">
              新規タグ作成: {{ importResult.created_tags.join(', ') }}
            </div>
            <div v-if="importResult.errors.length > 0" class="mt-1 text-caption">
              <div v-for="(err, i) in importResult.errors" :key="i">{{ err }}</div>
            </div>
          </v-alert>
          <v-alert v-if="importError" type="error" class="mt-2" density="compact">{{
            importError
          }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeImportDialog">閉じる</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="importing"
            :disabled="!fileName"
            @click="handleImport"
          >
            インポート
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card>
      <v-data-table
        class="quiz-table"
        :headers="headers"
        :items="filteredQuizzes"
        :loading="store.loading"
        :group-by="groupBy"
        :items-per-page="100"
        item-value="id"
        density="compact"
        hover
        fixed-header
        no-data-text="クイズがありません"
      >
        <template #item.question="{ item }">
          <span class="text-caption">{{ item.question }}</span>
        </template>
        <template #item.tags="{ item }">
          <v-chip
            v-for="tag in item.tags"
            :key="tag.id"
            size="x-small"
            variant="tonal"
            class="mr-1"
          >
            {{ tag.name }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="x-small" :to="`/quizzes/${item.id}/edit`" />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="x-small"
            color="error"
            @click="handleDelete(item.id)"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const selectedCategoryId = ref<number | null>(null)
const selectedTagSlug = ref<string | null>(null)
const searchQuery = ref('')

const exporting = ref(false)
const importDialog = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileName = ref('')
let rawFile: File | null = null
const importing = ref(false)
const importResult = ref<{
  created_count: number
  updated_count: number
  error_count: number
  created_tags_count: number
  created: string[]
  updated: string[]
  errors: string[]
  created_tags: string[]
} | null>(null)
const importError = ref<string | null>(null)
const sampleCsvUrl = import.meta.env.PROD
  ? '/api/quiz/csv/sample'
  : 'http://localhost:8888/api/quiz/csv/sample'

const groupBy = [{ key: 'category_name', order: 'asc' as const }]

const headers = [
  { title: 'ID', key: 'id', width: '50px' },
  { title: 'Slug', key: 'slug', width: '130px' },
  { title: '問題文', key: 'question' },
  { title: 'タグ', key: 'tags', sortable: false, width: '160px' },
  { title: '操作', key: 'actions', sortable: false, width: '160px', align: 'center' as const },
]

const categoryItems = computed(() => [
  ...store.categories.map((c) => ({ title: c.category_name, value: c.id })),
])

const tagItems = computed(() => store.categoryTags.map((t) => ({ title: t.name, value: t.slug })))

const filteredQuizzes = computed(() => {
  let quizzes = store.quizzes

  if (selectedCategoryId.value) {
    quizzes = quizzes.filter((q) => q.category_id === selectedCategoryId.value)
  }

  if (selectedTagSlug.value) {
    quizzes = quizzes.filter((q) => q.tags?.some((t) => t.slug === selectedTagSlug.value))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    quizzes = quizzes.filter((q) => q.question.toLowerCase().includes(query))
  }

  return quizzes
})

const fetchQuizzes = () => {
  if (selectedCategoryId.value) {
    const params: { tagSlug?: string; q?: string } = {}
    if (selectedTagSlug.value) params.tagSlug = selectedTagSlug.value
    if (searchQuery.value) params.q = searchQuery.value
    store.fetchQuizzesByCategory(selectedCategoryId.value, params)
  } else {
    store.fetchAllQuizzes()
  }
}

const onCategoryChange = (id: number | null) => {
  selectedTagSlug.value = null
  searchQuery.value = ''
  if (id) {
    store.fetchTagsByCategory(id)
  }
}

const onClearSearch = () => {
  searchQuery.value = ''
}

const handleDelete = async (id: number) => {
  if (!confirm('削除しますか？')) return
  await store.removeQuiz(id)
}

const handleExport = async () => {
  exporting.value = true
  try {
    await store.exportCsv(selectedCategoryId.value ?? undefined)
  } finally {
    exporting.value = false
  }
}

const onNativeFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  rawFile = input.files?.[0] ?? null
  fileName.value = rawFile?.name ?? ''
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file, 'UTF-8')
  })
}

const handleImport = async () => {
  if (!rawFile) return
  importing.value = true
  importResult.value = null
  importError.value = null
  try {
    const csvText = await readFileAsText(rawFile)
    const result = await store.importCsv(csvText)
    importResult.value = result
    await store.fetchAllQuizzes()
  } catch (e: any) {
    importError.value = e?.response?.data?.error ?? 'インポートに失敗しました'
  } finally {
    importing.value = false
  }
}

const closeImportDialog = () => {
  importDialog.value = false
  rawFile = null
  fileName.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
  importResult.value = null
  importError.value = null
}

onMounted(() => {
  store.fetchAllQuizzes()
})
</script>

<style scoped>
.quiz-list-page {
  font-size: 0.8125rem;
}

.quiz-table :deep(.v-table__wrapper) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.quiz-table :deep(th) {
  font-size: 0.75rem !important;
  white-space: nowrap;
}

.quiz-table :deep(td) {
  font-size: 0.75rem !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.quiz-table :deep(.v-data-table-group-header-row td) {
  font-size: 0.8rem !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
</style>
