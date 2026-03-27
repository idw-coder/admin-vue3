<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/quizzes" class="mb-4">
      一覧へ戻る
    </v-btn>

    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span class="text-h6">{{ isNew ? '新規クイズ作成' : 'クイズを編集' }}</span>
        <v-spacer />
        <v-btn variant="tonal" size="small" prepend-icon="mdi-import" @click="importDialog = true">
          インポート
        </v-btn>
        <v-btn variant="tonal" size="small" prepend-icon="mdi-export" @click="exportJson">
          エクスポート
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- AI Prompt Helper -->
        <v-sheet rounded="lg" color="grey-lighten-4" class="pa-3 mb-5">
          <div class="text-subtitle-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-robot-outline</v-icon>
            AI生成支援
          </div>
          <div class="d-flex align-center ga-2">
            <v-text-field
              v-model="aiTopic"
              label="トピック（例: JavaScriptのクロージャ）"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
              bg-color="white"
              @keyup.enter="copyPrompt"
            />
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-content-copy"
              :disabled="!aiTopic.trim()"
              @click="copyPrompt"
            >
              プロンプトをコピー
            </v-btn>
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            トピックを入力 → プロンプトをコピー → AIに貼り付け → 結果を「インポート」で取り込み
          </div>
        </v-sheet>

        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="slug"
            label="スラッグ"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-1"
          />

          <v-textarea
            v-model="question"
            label="問題文"
            variant="outlined"
            rows="3"
            :rules="[rules.required]"
            class="mb-1"
          />

          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">解説</div>
            <TiptapEditor v-model="explanation" placeholder="解説を入力してください" />
          </div>

          <v-select
            v-model="categoryId"
            :items="categoryItems"
            label="カテゴリ"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-1"
          />

          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">タグ</div>
            <div class="d-flex flex-wrap ga-2">
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
              <span v-if="store.tags.length === 0" class="text-medium-emphasis text-body-2">
                タグが登録されていません
              </span>
            </div>
          </div>

          <div class="mb-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-2">選択肢</div>
              <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addChoice">
                追加
              </v-btn>
            </div>

            <v-radio-group
              v-model="correctIndex"
              :rules="[rules.correctSelected]"
              hide-details="auto"
              class="mt-0 pt-0"
            >
              <div
                v-for="(choice, index) in choices"
                :key="index"
                class="d-flex align-center gap-2 mb-2"
              >
                <v-radio :value="index" density="compact" hide-details />
                <v-text-field
                  v-model="choice.choice_text"
                  :label="`選択肢 ${index + 1}`"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  hide-details="auto"
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
            </v-radio-group>

            <div class="text-caption text-medium-emphasis mt-1">
              ラジオボタンで正解を1つ選んでください
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn color="primary" variant="flat" :loading="saving" @click="handleSubmit"> 保存 </v-btn>
        <v-btn variant="text" to="/quizzes">キャンセル</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Import Dialog -->
    <v-dialog v-model="importDialog" max-width="640" persistent>
      <v-card>
        <v-card-title>JSONインポート</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            AIが生成したJSONをそのまま貼り付けてください。コードブロック付きでもOKです。
          </p>
          <v-alert v-if="importError" type="error" density="compact" class="mb-3">
            {{ importError }}
          </v-alert>
          <v-textarea
            v-model="importJson"
            label="JSON"
            variant="outlined"
            rows="12"
            auto-grow
            placeholder='{ "slug": "...", "question": "...", ... }'
            monospace
            style="font-family: monospace"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeImportDialog">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!importJson.trim()" @click="applyImport">
            取り込み
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Feedback Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import TiptapEditor from '@/components/TiptapEditor.vue'
import type { VForm } from 'vuetify/components'

const route = useRoute()
const router = useRouter()
const store = useQuizStore()
const formRef = ref<InstanceType<typeof VForm> | null>(null)

const id = route.params.id as string | undefined
const isNew = !id || id === 'new'

// --- Form state ---
const slug = ref('')
const question = ref('')
const explanation = ref('')
const categoryId = ref<number | null>(null)
const selectedTags = ref<string[]>([])
const choices = ref(createDefaultChoices())
const correctIndex = ref<number | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

// --- AI helper state ---
const aiTopic = ref('')
const importDialog = ref(false)
const importJson = ref('')
const importError = ref<string | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')

// --- Computed ---
const categoryItems = computed(() =>
  store.categories.map((c) => ({ title: c.category_name, value: c.id })),
)

// --- Validation rules ---
const rules = {
  required: (v: unknown) => {
    if (typeof v === 'string') return v.trim().length > 0 || '必須項目です'
    return v != null || '必須項目です'
  },
  correctSelected: (v: unknown) => (v !== null && v !== undefined) || '正解を選択してください',
}

// --- Helpers ---
function createDefaultChoices(count = 4) {
  return Array.from({ length: count }, () => ({ choice_text: '', is_correct: false }))
}

function toggleTag(tagSlug: string) {
  const idx = selectedTags.value.indexOf(tagSlug)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tagSlug)
  }
}

function addChoice() {
  choices.value.push({ choice_text: '', is_correct: false })
}

function removeChoice(index: number) {
  if (choices.value.length <= 2) return
  choices.value.splice(index, 1)
  if (correctIndex.value === index) {
    correctIndex.value = null
  } else if (correctIndex.value !== null && correctIndex.value > index) {
    correctIndex.value--
  }
}

function showSnackbar(message: string) {
  snackbarMessage.value = message
  snackbar.value = true
}

// --- AI Prompt ---
function buildPrompt(topic: string): string {
  return `「${topic}」に関する4択クイズを1問作成してください。

以下のJSON形式のみを出力してください:
{
  "slug": "英語ケバブケース（例: javascript-closures）",
  "question": "問題文",
  "choices": [
    { "choice_text": "選択肢1", "is_correct": false },
    { "choice_text": "選択肢2", "is_correct": true },
    { "choice_text": "選択肢3", "is_correct": false },
    { "choice_text": "選択肢4", "is_correct": false }
  ],
  "explanation": "<p>HTML形式の解説（詳細は下記の条件を参照）</p>",
  "tags": ["関連タグをケバブケースで", "例: javascript"]
}

想定読者:
- プログラミングを学び始めて半年〜2年ほどの初学者〜中級者で、「なんとなく動く」から「なぜ動くか理解したい」フェーズに進みたいと考えている意欲的なエンジニア
- 公式ドキュメントや技術記事を自分から読みに行くタイプで、表面的な説明では物足りないと感じる層
- 問題の難易度は「基礎を理解していれば解けるが、曖昧な理解だと迷う」レベルを狙ってください

条件:
- is_correct が true の選択肢は必ず1つだけ
- 「なぜそうなるのか」を理解させることを重視し、丸暗記では対応できない問題にしてください
- slug・tags は英語のケバブケースで出力してください
- 重要: JSON文字列内のダブルクォートは必ず \\" でエスケープしてください
- HTML属性にはダブルクォートではなくシングルクォートを使ってください（例: <code class='example'>）
- コード例は &lt;pre&gt;&lt;code&gt; タグで囲み、中のHTMLタグは &amp;lt; &amp;gt; でエスケープしてください

解説（explanation）の作成ルール:
- 600〜1000文字程度で、「この解説だけで理解できた」「一段レベルアップした」と読者が感じる深さにしてください
- 「動く書き方」だけでなく「なぜそう書くのか」「プロはどう考えるか」という視点を盛り込んでください

■ 構成の考え方（この順番で書いてください）:
1. まず、なぜその答えが正解なのかをシンプルに説明してください。読者が一番知りたいのはここです。他の選択肢が不正解である理由も端的に触れてください。見出しは不要で <p> タグで書き始めてください。書き出しは毎回変えてください
2. 次に、理解を深める補足としてトピックに応じた周辺知識を自由に展開してください。何を書くか・いくつ見出しを立てるかはトピック次第で変えてください。背景知識、具体的なコード例、よくある間違い、実務での使いどころなど、そのトピックで読者が「知ってよかった」と思う情報を自然な流れで書いてください

■ 文体・フォーマット:
- <h3> の見出し文言はトピック固有の具体的なフレーズにしてください（例: 「mapとforEachは何が違うのか」「クロージャが生まれる仕組み」など。「背景・仕組み」のような汎用見出しは避けてください）
- ユーザーが検索しそうな自然なフレーズ（例:「配列から条件に合う要素だけ取り出すには」「○○と△△の違い」）を文中に自然に含めてください
- 専門用語には初出時に簡潔な説明を添えてください。ただし初歩的すぎる補足（「変数とは値を入れる箱です」等）は不要です
- 箇条書き（<ul><li>）・強調（<strong>）・コード例（<pre><code>）を適宜使い、視覚的に読みやすくしてください`
}

async function copyPrompt() {
  const topic = aiTopic.value.trim()
  if (!topic) return
  await navigator.clipboard.writeText(buildPrompt(topic))
  showSnackbar('プロンプトをコピーしました')
}

// --- Import / Export ---
function extractJsonFromText(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlock?.[1]) return codeBlock[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj?.[0]) return obj[0]
  return text.trim()
}

/**
 * AI が生成した JSON にありがちな「文字列値内の未エスケープ "」を修復する。
 * 文字を1つずつ走査し、" が JSON 構文上の区切りか文字列内部かを
 * 後続トークン（: , } ] など）で判定してエスケープを挿入する。
 */
function repairJson(input: string): string {
  const out: string[] = []
  let inStr = false
  let i = 0

  while (i < input.length) {
    const ch = input[i]!

    if (inStr) {
      if (ch === '\\') {
        out.push(ch, input[i + 1] ?? '')
        i += 2
        continue
      }
      if (ch === '\n') {
        out.push('\\n')
        i++
        continue
      }
      if (ch === '"') {
        const after = input.slice(i + 1).trimStart()
        const next = after[0] as string | undefined
        const isEndOfString =
          next === undefined || next === ',' || next === ':' || next === '}' || next === ']'

        if (isEndOfString) {
          inStr = false
          out.push(ch)
        } else {
          out.push('\\"')
        }
        i++
        continue
      }
      out.push(ch)
    } else {
      if (ch === '"') inStr = true
      out.push(ch)
    }
    i++
  }
  return out.join('')
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return JSON.parse(repairJson(text))
  }
}

interface QuizImportData {
  slug?: string
  question?: string
  choices?: { choice_text: string; is_correct: boolean }[]
  explanation?: string
  tags?: string[]
}

/**
 * <pre><code> 内の生HTMLタグをエンティティにエスケープする。
 * AIはコード例に <template> <div> 等をそのまま含めるが、
 * Tiptap（DOM）がそれをHTML要素として解釈しないようにする。
 */
function escapeHtmlInCodeBlocks(html: string): string {
  return html.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, content: string) => {
    const decoded = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
    const escaped = decoded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code>${escaped}</code></pre>`
  })
}

function applyImport() {
  importError.value = null
  try {
    const raw = extractJsonFromText(importJson.value)
    const data = safeParseJson(raw) as QuizImportData

    if (data.slug) slug.value = data.slug
    if (data.question) question.value = data.question
    if (data.explanation) explanation.value = escapeHtmlInCodeBlocks(data.explanation ?? '')

    if (data.choices?.length) {
      choices.value = data.choices.map((c) => ({
        choice_text: c.choice_text,
        is_correct: Boolean(c.is_correct),
      }))
      correctIndex.value = data.choices.findIndex((c) => Boolean(c.is_correct))
    }

    if (data.tags?.length) {
      const existingSlugs = new Set(store.tags.map((t) => t.slug))
      selectedTags.value = data.tags.filter((t) => existingSlugs.has(t))
    }

    closeImportDialog()
    showSnackbar('インポートしました')
  } catch (e) {
    const detail = e instanceof Error ? e.message : ''
    importError.value = `JSONの解析に失敗しました。${detail}`
  }
}

function closeImportDialog() {
  importDialog.value = false
  importJson.value = ''
  importError.value = null
}

async function exportJson() {
  const data = {
    slug: slug.value,
    question: question.value,
    choices: choices.value.map((c, i) => ({
      choice_text: c.choice_text,
      is_correct: i === correctIndex.value,
    })),
    explanation: explanation.value,
    tags: selectedTags.value,
  }
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
  showSnackbar('JSONをコピーしました')
}

// --- Submit ---
async function handleSubmit() {
  error.value = null

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  const choicesPayload = choices.value.map((c, i) => ({
    choice_text: c.choice_text,
    is_correct: i === correctIndex.value,
  }))

  saving.value = true
  try {
    const payload = {
      slug: slug.value.trim(),
      question: question.value.trim(),
      explanation: explanation.value,
      category_id: categoryId.value!,
      choices: choicesPayload,
      tags: selectedTags.value,
    }
    if (isNew) {
      const created = await store.createQuiz(payload)
      router.replace(`/quizzes/${created.id}/edit`)
    } else {
      await store.updateQuiz(Number(id), payload)
    }
    showSnackbar('保存しました')
  } catch (e: unknown) {
    const axiosErr = e as { response?: { data?: { error?: string } } }
    error.value = axiosErr.response?.data?.error ?? '保存に失敗しました'
  } finally {
    saving.value = false
  }
}

// --- Init ---
onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchTags()])

  if (!isNew && id) {
    await store.fetchQuiz(Number(id))
    const quiz = store.currentQuiz
    if (quiz) {
      slug.value = quiz.slug
      question.value = quiz.question
      explanation.value = quiz.explanation ?? ''
      categoryId.value = quiz.category_id
      selectedTags.value = quiz.tags?.map((t) => t.slug) ?? []
      if (quiz.choices?.length) {
        choices.value = quiz.choices.map((c) => ({
          choice_text: c.choice_text,
          is_correct: Boolean(c.is_correct),
        }))
        correctIndex.value = quiz.choices.findIndex((c) => Boolean(c.is_correct))
      }
      return
    }
  }

  const firstCategory = store.categories[0]
  if (firstCategory) categoryId.value = firstCategory.id
})
</script>
