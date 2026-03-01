<template>
  <div>
    <h1 class="text-h5 mb-4">クイズ管理</h1>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
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
      <v-col cols="12" sm="6" class="d-flex justify-end">
        <v-btn color="primary" to="/quizzes/new" prepend-icon="mdi-plus"> クイズ作成 </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="store.loading" indeterminate class="mb-4" />

    <v-card v-if="!selectedCategoryId">
      <v-card-text class="text-center text-medium-emphasis">
        カテゴリを選択してください
      </v-card-text>
    </v-card>

    <v-list v-else lines="two">
      <v-list-item
        v-for="quiz in store.quizzes"
        :key="quiz.id"
        :title="quiz.question"
        :subtitle="quiz.slug"
      >
        <template #append>
          <v-btn icon="mdi-pencil" variant="text" size="small" :to="`/quizzes/${quiz.id}/edit`" />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="handleDelete(quiz.id)"
          />
        </template>
      </v-list-item>
      <v-list-item v-if="store.quizzes.length === 0">
        <v-list-item-title class="text-medium-emphasis"> クイズがありません </v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const selectedCategoryId = ref<number | null>(null)

const categoryItems = computed(() =>
  store.categories.map((c) => ({ title: c.category_name, value: c.id })),
)

const onCategoryChange = (id: number) => {
  store.fetchQuizzesByCategory(id)
}

const handleDelete = async (id: number) => {
  if (!confirm('削除しますか？')) return
  await store.removeQuiz(id)
}

onMounted(() => {
  store.fetchCategories()
})
</script>
