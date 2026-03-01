import { defineStore } from 'pinia'
import api from '@/lib/api'

export interface QuizCategory {
  id: number
  slug: string
  category_name: string
  description: string
  author_id?: number
}

export interface QuizChoice {
  id?: number
  quiz_id?: number
  choice_text: string
  is_correct: boolean
}

export interface QuizTag {
  id: number
  slug: string
  name: string
}

export interface Quiz {
  id: number
  slug: string
  question: string
  explanation: string
  category_id: number
  author_id?: number
  choices?: QuizChoice[]
  tags?: QuizTag[]
  created_at?: string
  updated_at?: string
}

export interface QuizCreateParams {
  slug: string
  question: string
  explanation: string
  category_id: number
  choices: { choice_text: string; is_correct: boolean }[]
  tags?: string[]
}

export type QuizUpdateParams = Partial<QuizCreateParams>

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    categories: [] as QuizCategory[],
    quizzes: [] as Quiz[],
    currentQuiz: null as Quiz | null,
    tags: [] as QuizTag[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchCategories() {
      const res = await api.get('/quiz/categories')
      this.categories = res.data
    },
    async fetchQuizzesByCategory(categoryId: number) {
      this.loading = true
      try {
        const res = await api.get(`/quiz/category/${categoryId}/quizzes`)
        this.quizzes = res.data
      } finally {
        this.loading = false
      }
    },
    async fetchQuiz(id: number) {
      this.loading = true
      try {
        const res = await api.get(`/quiz/${id}`)
        this.currentQuiz = res.data
      } finally {
        this.loading = false
      }
    },
    async fetchTags() {
      const res = await api.get('/quiz/tags')
      this.tags = res.data
    },
    async createTag(params: { slug: string; name: string }) {
      const res = await api.post('/quiz/tags', params)
      this.tags.push(res.data)
    },
    async updateTag(id: number, params: { slug?: string; name?: string }) {
      const res = await api.put(`/quiz/tags/${id}`, params)
      this.tags = this.tags.map((t) => (t.id === id ? res.data : t))
    },
    async removeTag(id: number) {
      await api.delete(`/quiz/tags/${id}`)
      this.tags = this.tags.filter((t) => t.id !== id)
    },
    async createQuiz(params: QuizCreateParams) {
      const res = await api.post('/quiz', params)
      this.quizzes.unshift(res.data)
      return res.data
    },
    async updateQuiz(id: number, params: QuizUpdateParams) {
      const res = await api.put(`/quiz/${id}`, params)
      this.quizzes = this.quizzes.map((q) => (q.id === id ? res.data : q))
      this.currentQuiz = res.data
    },
    async removeQuiz(id: number) {
      await api.delete(`/quiz/${id}`)
      this.quizzes = this.quizzes.filter((q) => q.id !== id)
    },
  },
})
