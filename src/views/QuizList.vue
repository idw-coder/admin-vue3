<template>
  <div>
    <h1 class="text-h5 mb-4">クイズ管理</h1>

    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="4">
        <v-select
          v-model="selectedCategoryId"
          :items="categoryItems"
          label="カテゴリ"
          variant="outlined"
          density="compact"
          hide-details
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
          :disabled="!selectedCategoryId"
          @keydown.enter="fetchQuizzes"
          @click:clear="onClearSearch"
        />
      </v-col>
      <v-col cols="12" sm="2" class="d-flex justify-end">
        <v-btn color="primary" to="/quizzes/new" prepend-icon="mdi-plus"> クイズ作成 </v-btn>
      </v-col>
    </v-row>

    <v-card v-if="!selectedCategoryId">
      <v-card-text class="text-center text-medium-emphasis">
        カテゴリを選択してください
      </v-card-text>
    </v-card>

    <v-data-table
      v-else
      class="quiz-table"
      :headers="headers"
      :items="store.quizzes"
      :loading="store.loading"
      item-value="id"
      hover
      fixed-header
      no-data-text="クイズがありません"
    >
      <template #item.question="{ item }">
        <span class="text-body-2">{{ item.question }}</span>
      </template>
      <template #item.tags="{ item }">
        <v-chip v-for="tag in item.tags" :key="tag.id" size="small" class="mr-1">
          {{ tag.name }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" :to="`/quizzes/${item.id}/edit`" />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          @click="handleDelete(item.id)"
        />
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const selectedCategoryId = ref<number | null>(null)
const selectedTagSlug = ref<string | null>(null)
const searchQuery = ref('')

const headers = [
  { title: 'ID', key: 'id', width: '70px' },
  { title: 'Slug', key: 'slug', width: '150px' },
  { title: '問題文', key: 'question' },
  { title: 'タグ', key: 'tags', sortable: false, width: '200px' },
  { title: '操作', key: 'actions', sortable: false, width: '120px', align: 'center' as const },
]

const categoryItems = computed(() =>
  store.categories.map((c) => ({ title: c.category_name, value: c.id })),
)

const tagItems = computed(() => store.categoryTags.map((t) => ({ title: t.name, value: t.slug })))

const fetchQuizzes = () => {
  if (!selectedCategoryId.value) return
  const params: { tagSlug?: string; q?: string } = {}
  if (selectedTagSlug.value) params.tagSlug = selectedTagSlug.value
  if (searchQuery.value) params.q = searchQuery.value
  store.fetchQuizzesByCategory(selectedCategoryId.value, params)
}

const onCategoryChange = (id: number) => {
  selectedTagSlug.value = null
  searchQuery.value = ''
  store.fetchTagsByCategory(id)
  store.fetchQuizzesByCategory(id)
}

const onClearSearch = () => {
  searchQuery.value = ''
  fetchQuizzes()
}

const handleDelete = async (id: number) => {
  if (!confirm('削除しますか？')) return
  await store.removeQuiz(id)
}

onMounted(() => {
  store.fetchCategories()
})
</script>

<style scoped>
/* Vuetify の v-data-table は height prop しか提供していないので、CSSで上書きします。 */
.quiz-table :deep(.v-table__wrapper) {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}
</style>
