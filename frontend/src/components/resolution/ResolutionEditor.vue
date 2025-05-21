<template>
    <div class="resolution-editor">
        <div class="toolbar">
            <!-- Resolution formatting tools -->
        </div>
        <editor-content :editor="editor" />
    </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
    content: props.modelValue,
    extensions: [
        StarterKit,
        Placeholder.configure({
            placeholder: 'Start typing your resolution...'
        })
    ],
    onUpdate: ({ editor }) => {
        emit('update:modelValue', editor.getHTML())
    }
})
</script>