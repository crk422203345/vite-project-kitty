<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useReaderSettings } from './composables/useReaderSettings'
import { useNovel } from './composables/useNovel'
import { useReaderProgress } from './composables/useReaderProgress'

import ReaderToolbar from './components/ReaderToolbar.vue'
import ChapterList from './components/ChapterList.vue'
import ReaderContent from './components/ReaderContent.vue'

// 1. Settings state
const {
  fontSize,
  theme,
  isControlsVisible,
  isFullscreen,
  applyTheme,
  initTheme,
  toggleFullscreen,
  handleFullscreenChange,
} = useReaderSettings()

// 2. Novel loading and parsing state
const {
  bookName,
  chapters,
  isLoading,
  error,
  loadDefaultNovel,
  handleImportFile,
} = useNovel()

// 3. Reading progress state
const {
  currentChapterIndex,
  saveProgress,
  loadProgress,
  changeChapter,
} = useReaderProgress()

const isSidebarOpen = ref(false)

// Calculated progress percentage
const readingProgressPercent = computed(() => {
  if (chapters.value.length === 0) return 0
  return Math.round(((currentChapterIndex.value + 1) / chapters.value.length) * 100)
})

// Handle chapter navigation and view updating
const handleChapterChange = (index: number) => {
  const success = changeChapter(index, chapters.value.length, bookName.value)
  if (success) {
    isSidebarOpen.value = false
    isControlsVisible.value = false
    // Smooth scroll back to top of screen
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }
}

// Handle imported local TXT files
const handleFileImport = async (file: File) => {
  await handleImportFile(file)
  currentChapterIndex.value = 0
  saveProgress(bookName.value)
}

// Retry loading the default novel
const handleRetry = () => {
  loadDefaultNovel().then(() => {
    loadProgress(bookName.value, chapters.value.length)
  })
}

// Toggle controls visibility on main area click
const toggleControls = () => {
  isControlsVisible.value = !isControlsVisible.value
}

// Lifecycle hooks
onMounted(() => {
  initTheme()
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Load default novel and load progress after parsing finishes
  loadDefaultNovel().then(() => {
    loadProgress(bookName.value, chapters.value.length)
  })
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// Watch bookName to load its progress when user uploads a new book
watch(bookName, (newBookName) => {
  if (newBookName && chapters.value.length > 0) {
    loadProgress(newBookName, chapters.value.length)
  }
})
</script>

<template>
  <div id="reader-app" @click="toggleControls">
    <!-- Left Hover Page Turning -->
    <div
      class="side-nav left glass"
      :class="{ disabled: currentChapterIndex <= 0 }"
      @click.stop="handleChapterChange(currentChapterIndex - 1)"
    >
      <span class="nav-icon">❮</span>
    </div>

    <!-- Right Hover Page Turning -->
    <div
      class="side-nav right glass"
      :class="{ disabled: currentChapterIndex >= chapters.length - 1 || chapters.length === 0 }"
      @click.stop="handleChapterChange(currentChapterIndex + 1)"
    >
      <span class="nav-icon">❯</span>
    </div>

    <!-- Toolbar controls -->
    <ReaderToolbar
      :book-name="bookName"
      v-model:font-size="fontSize"
      :theme="theme"
      :is-controls-visible="isControlsVisible"
      :is-fullscreen="isFullscreen"
      :progress-percent="readingProgressPercent"
      :current-chapter-index="currentChapterIndex"
      :chapters-length="chapters.length"
      @change-theme="applyTheme"
      @toggle-sidebar="isSidebarOpen = true"
      @toggle-fullscreen="toggleFullscreen"
      @import-file="handleFileImport"
    />

    <!-- Chapter Catalog Sidebar -->
    <ChapterList
      :chapters="chapters"
      :current-chapter-index="currentChapterIndex"
      :is-sidebar-open="isSidebarOpen"
      :is-loading="isLoading"
      @change-chapter="handleChapterChange"
      @close-sidebar="isSidebarOpen = false"
    />

    <!-- Main Reader View -->
    <ReaderContent
      :chapters="chapters"
      :current-chapter-index="currentChapterIndex"
      :font-size="fontSize"
      :is-loading="isLoading"
      :error="error"
      @change-chapter="handleChapterChange"
      @retry="handleRetry"
    />

    <!-- Overlay under sidebar -->
    <Transition name="fade">
      <div v-if="isSidebarOpen" class="overlay" @click.stop="isSidebarOpen = false"></div>
    </Transition>
  </div>
</template>

<style scoped>
#reader-app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.side-nav {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  transition: all 0.3s ease;
  opacity: 0.2;
  background: hsla(0, 0%, 50%, 0.05);
  border: none;
  backdrop-filter: blur(8px);
  user-select: none;
}

.side-nav.disabled {
  opacity: 0.03 !important;
  cursor: not-allowed;
  pointer-events: none;
}

.side-nav:hover {
  opacity: 0.8;
  width: 90px;
  background: hsla(0, 0%, 50%, 0.1);
}

.side-nav.left {
  left: 0;
  border-right: 1px solid var(--border);
}

.side-nav.right {
  right: 0;
  border-left: 1px solid var(--border);
}

.nav-icon {
  font-size: 2.5rem;
  opacity: 0.5;
  transition: transform 0.3s ease;
}

.side-nav.left:hover .nav-icon {
  transform: translateX(-5px);
}

.side-nav.right:hover .nav-icon {
  transform: translateX(5px);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 290;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 800px) {
  .side-nav {
    display: none;
  }
}
</style>
