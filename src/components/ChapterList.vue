<script setup lang="ts">
import { ref, computed } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Chapter } from '../utils/parser'

const props = defineProps<{
  chapters: Chapter[]
  currentChapterIndex: number
  isSidebarOpen: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'changeChapter', index: number): void
  (e: 'closeSidebar'): void
}>()

const searchQuery = ref('')
// Debounce search query changes by 250ms to prevent heavy computed recalculation
const debouncedSearchQuery = refDebounced(searchQuery, 250)

const filteredChapters = computed(() => {
  const all = props.chapters.map((chapter, index) => ({ ...chapter, originalIndex: index }))
  if (!debouncedSearchQuery.value) return all
  const query = debouncedSearchQuery.value.toLowerCase()
  return all.filter((chapter) => chapter.title.toLowerCase().includes(query))
})
</script>

<template>
  <aside :class="['sidebar glass', { open: isSidebarOpen }]" @click.stop>
    <div class="sidebar-header">
      <h2>目录</h2>
      <button class="btn close-btn" @click="emit('closeSidebar')">✕</button>
    </div>
    <div class="sidebar-search">
      <input v-model="searchQuery" type="text" placeholder="搜索章节..." class="search-input" />
    </div>
    <div class="chapter-list">
      <div
        v-for="chapter in filteredChapters"
        :key="chapter.originalIndex"
        :class="['chapter-item', { active: chapter.originalIndex === currentChapterIndex }]"
        @click="emit('changeChapter', chapter.originalIndex)"
      >
        {{ chapter.title }}
      </div>
      <div v-if="filteredChapters.length === 0" class="no-results">
        {{ isLoading ? '正在加载...' : '未找到相关章节' }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 350px;
  max-width: 85vw;
  background: var(--panel-light);
  z-index: 300;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

body.dark .sidebar {
  background: var(--panel-dark);
}

body.green .sidebar {
  background: var(--panel-green);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  padding: 6px 12px;
  border-radius: 50%;
  aspect-ratio: 1;
}

.sidebar-search {
  padding: 15px 24px;
  border-bottom: 1px solid var(--border);
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: hsla(0, 0%, 50%, 0.05);
  color: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: var(--primary);
  background: transparent;
  box-shadow: 0 0 0 3px hsla(210, 100%, 60%, 0.15);
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chapter-list::-webkit-scrollbar {
  width: 6px;
}

.chapter-list::-webkit-scrollbar-track {
  background: transparent;
}

.chapter-list::-webkit-scrollbar-thumb {
  background: hsla(0, 0%, 50%, 0.2);
  border-radius: 10px;
}

.chapter-list::-webkit-scrollbar-thumb:hover {
  background: hsla(0, 0%, 50%, 0.3);
}

.chapter-item {
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-item:hover {
  background: hsla(0, 0%, 50%, 0.05);
  padding-left: 28px;
}

.chapter-item.active {
  color: var(--primary);
  background: hsla(210, 100%, 60%, 0.1);
  font-weight: 600;
}

.no-results {
  padding: 40px 24px;
  text-align: center;
  opacity: 0.5;
  font-size: 0.9rem;
}
</style>
