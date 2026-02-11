<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const containerRef = ref(null)
let root = null

onMounted(async () => {
    const React = (await import('react')).default
    const { createRoot } = await import('react-dom/client')
    const { default: App } = await import('../../src/App.tsx')

    if (containerRef.value) {
        root = createRoot(containerRef.value)
        root.render(React.createElement(App))
        window.rendered = true
    }
})

onBeforeUnmount(() => {
    if (root) root.unmount()
})
</script>

<template>
    <div ref="containerRef">加载中</div>
</template>