<template>
  <div class="tiptap-editor">
    <div class="tiptap-toolbar">
      <button
        type="button"
        :class="{ active: editor?.isActive('heading', { level: 1 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        H1
      </button>
      <button
        type="button"
        :class="{ active: editor?.isActive('heading', { level: 2 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>
      <button
        type="button"
        :class="{ active: editor?.isActive('heading', { level: 3 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>
      <span class="divider" />
      <button
        type="button"
        :class="{ active: editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        :class="{ active: editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <em>I</em>
      </button>
      <span class="divider" />
      <button
        type="button"
        :class="{ active: editor?.isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        ・リスト
      </button>
      <button
        type="button"
        :class="{ active: editor?.isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        1. リスト
      </button>
      <span class="divider" />
      <button
        type="button"
        :class="{ active: editor?.isActive('code') }"
        @click="editor?.chain().focus().toggleCode().run()"
      >
        code
      </button>
      <button
        type="button"
        :class="{ active: editor?.isActive('codeBlock') }"
        @click="editor?.chain().focus().toggleCodeBlock().run()"
      >
        ```
      </button>
    </div>
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// --- BlockNote → Tiptap 変換 ---
// 移行前のBlockNote形式（配列 + props構造）をTiptap互換のJSON（{ type: "doc", content: [...] }）に変換する。
// BlockNote の styles を Tiptap の marks に、bulletListItem/numberedListItem を
// bulletList/orderedList > listItem 構造にグループ化する。

function convertBlockNoteInline(content: any[]): any[] {
  if (!Array.isArray(content) || content.length === 0) return []
  return content
    .filter((item) => item.type === 'text' && item.text)
    .map((item) => {
      const node: any = { type: 'text', text: item.text }
      const marks: any[] = []
      if (item.styles) {
        if (item.styles.bold) marks.push({ type: 'bold' })
        if (item.styles.italic) marks.push({ type: 'italic' })
        if (item.styles.code) marks.push({ type: 'code' })
        if (item.styles.strikethrough) marks.push({ type: 'strike' })
      }
      if (marks.length > 0) node.marks = marks
      return node
    })
}

function convertBlockNoteToTiptap(blocks: any[]): any {
  const doc: any = { type: 'doc', content: [] }
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.type === 'bulletListItem') {
      const items = []
      while (i < blocks.length && blocks[i].type === 'bulletListItem') {
        const inline = convertBlockNoteInline(blocks[i].content)
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', ...(inline.length ? { content: inline } : {}) }],
        })
        i++
      }
      doc.content.push({ type: 'bulletList', content: items })
      continue
    }

    if (block.type === 'numberedListItem') {
      const items = []
      while (i < blocks.length && blocks[i].type === 'numberedListItem') {
        const inline = convertBlockNoteInline(blocks[i].content)
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', ...(inline.length ? { content: inline } : {}) }],
        })
        i++
      }
      doc.content.push({ type: 'orderedList', content: items })
      continue
    }

    const inline = convertBlockNoteInline(block.content)

    if (block.type === 'heading') {
      doc.content.push({
        type: 'heading',
        attrs: { level: block.props?.level ?? 1 },
        ...(inline.length ? { content: inline } : {}),
      })
    } else if (block.type === 'codeBlock') {
      const text = (block.content ?? []).map((c: any) => c.text ?? '').join('')
      doc.content.push({
        type: 'codeBlock',
        ...(text ? { content: [{ type: 'text', text }] } : {}),
      })
    } else {
      doc.content.push({
        type: 'paragraph',
        ...(inline.length ? { content: inline } : {}),
      })
    }
    i++
  }

  if (doc.content.length === 0) {
    doc.content.push({ type: 'paragraph' })
  }
  return doc
}

// BlockNote形式の判定: 配列かつ各要素に props がある場合はBlockNote由来とみなす
function isBlockNoteFormat(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && data[0].props !== undefined
}

function parseContent(value: string) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    if (isBlockNoteFormat(parsed)) {
      return convertBlockNoteToTiptap(parsed)
    }
    return parsed
  } catch {
    return value
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder ?? '入力してください',
    }),
  ],
  content: parseContent(props.modelValue),
  onUpdate: ({ editor }) => {
    emit('update:modelValue', JSON.stringify(editor.getJSON()))
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return
    const current = JSON.stringify(editor.value.getJSON())
    if (val !== current) {
      editor.value.commands.setContent(parseContent(val))
    }
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #f5f5f5;
}

.tiptap-toolbar button {
  padding: 2px 8px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.tiptap-toolbar button.active {
  background: #1867c0;
  color: white;
  border-color: #1867c0;
}

.tiptap-toolbar .divider {
  width: 1px;
  background: rgba(0, 0, 0, 0.15);
  margin: 2px 4px;
}

.tiptap-editor .ProseMirror {
  min-height: 200px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 0 0 4px 4px;
  outline: none;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.tiptap-editor .ProseMirror code {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.tiptap-editor .ProseMirror pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  overflow-x: auto;
}
</style>
