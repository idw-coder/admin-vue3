<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/quizzes" class="mb-4">
      一覧へ戻る
    </v-btn>

    <v-card>
      <v-card-title>{{ isNew ? '新規クイズ' : 'クイズを編集' }}</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <v-text-field
          v-model="slug"
          label="スラッグ"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <v-textarea v-model="question" label="問題文" variant="outlined" rows="3" class="mb-3" />

        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">解説</div>
          <TiptapEditor v-model="explanation" placeholder="解説を入力してください" />
        </div>

        <v-select
          v-model="categoryId"
          :items="categoryItems"
          label="カテゴリ"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">タグ</div>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="tag in store.tags"
              :key="tag.slug"
              :color="selectedTags.includes(tag.slug) ? 'primary' : undefined"
              :variant="selectedTags.includes(tag.slug) ? 'flat' : 'outlined'"
              clickable
              @click="toggleTag(tag.slug)"
            >
              {{ tag.name }}
            </v-chip>
            <span v-if="store.tags.length === 0" class="text-medium-emphasis text-sm">
              タグが登録されていません
            </span>
          </div>
        </div>

        <div class="mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2">選択肢</div>
            <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addChoice">
              選択肢を追加
            </v-btn>
          </div>
          <div
            v-for="(choice, index) in choices"
            :key="index"
            class="d-flex align-center gap-2 mb-2"
          >
            <v-radio-group v-model="correctIndex" hide-details>
              <v-radio :value="index" hide-details />
            </v-radio-group>
            <v-text-field
              v-model="choice.choice_text"
              :label="`選択肢 ${index + 1}`"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              :disabled="choices.length <= 2"
              @click="removeChoice(index)"
            />
          </div>
          <div class="text-caption text-medium-emphasis">ラジオで正解を1つ選んでください</div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" :loading="saving" @click="handleSubmit"> 保存 </v-btn>
        <v-btn v-if="!isNew" variant="text" to="/quizzes"> キャンセル </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import TiptapEditor from '@/components/TiptapEditor.vue'

const route = useRoute()
const router = useRouter()
const store = useQuizStore()

const id = route.params.id as string | undefined
const isNew = !id || id === 'new'

const slug = ref('')
const question = ref('')
const explanation = ref('')
const categoryId = ref<number | null>(null)
const selectedTags = ref<string[]>([])
const choices = ref([
  { choice_text: '', is_correct: false },
  { choice_text: '', is_correct: false },
])
const correctIndex = ref<number | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

const categoryItems = computed(() =>
  store.categories.map((c) => ({ title: c.category_name, value: c.id })),
)

const toggleTag = (slug: string) => {
  if (selectedTags.value.includes(slug)) {
    selectedTags.value = selectedTags.value.filter((s) => s !== slug)
  } else {
    selectedTags.value.push(slug)
  }
}

const addChoice = () => {
  choices.value.push({ choice_text: '', is_correct: false })
}

const removeChoice = (index: number) => {
  if (choices.value.length <= 2) return
  choices.value.splice(index, 1)
  if (correctIndex.value === index) correctIndex.value = null
}

const handleSubmit = async () => {
  error.value = null
  const validChoices = choices.value.filter((c) => c.choice_text.trim() !== '')
  if (validChoices.length < 2) {
    error.value = '選択肢を2つ以上入力してください'
    return
  }
  if (correctIndex.value === null) {
    error.value = '正解を1つ選択してください'
    return
  }
  if (!categoryId.value) {
    error.value = 'カテゴリを選択してください'
    return
  }

  const choicesWithCorrect = choices.value.map((c, i) => ({
    ...c,
    is_correct: i === correctIndex.value,
  }))

  saving.value = true
  try {
    const payload = {
      slug: slug.value.trim(),
      question: question.value.trim(),
      explanation: explanation.value,
      category_id: categoryId.value,
      choices: choicesWithCorrect,
      tags: selectedTags.value,
    }
    if (isNew) {
      const created = await store.createQuiz(payload)
      router.replace(`/quizzes/${created.id}/edit`)
    } else {
      await store.updateQuiz(Number(id), payload)
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '保存に失敗しました'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchTags()])
  const firstCategory = store.categories[0]
  if (firstCategory) categoryId.value = firstCategory.id

  if (!isNew && id) {
    await store.fetchQuiz(Number(id))
    const quiz = store.currentQuiz
    if (quiz) {
      slug.value = quiz.slug
      question.value = quiz.question
      explanation.value = quiz.explanation ?? ''
      categoryId.value = quiz.category_id
      selectedTags.value = quiz.tags?.map((t) => t.slug) ?? []
      if (quiz.choices) {
        choices.value = quiz.choices.map((c) => ({
          choice_text: c.choice_text,
          is_correct: Boolean(c.is_correct),
        }))
        correctIndex.value = quiz.choices.findIndex((c) => Boolean(c.is_correct))
      }
    }
  }
})
</script>
