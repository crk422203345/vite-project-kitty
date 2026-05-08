<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'

interface Chapter {
  title: string
  content: string
}

const chapters = ref<Chapter[]>([])
const currentChapterIndex = ref(0)
const bookName = ref('未命名小说')
const fontSize = ref(18)
const theme = ref('light')
const isControlsVisible = ref(false)
const isSidebarOpen = ref(false)
const isLoading = ref(false)
const searchQuery = ref('')

// Load settings from localStorage
const loadSettings = () => {
  const savedFontSize = localStorage.getItem('reader_font_size')
  if (savedFontSize) fontSize.value = parseInt(savedFontSize)

  const savedTheme = localStorage.getItem('reader_theme')
  if (savedTheme) {
    theme.value = savedTheme
    document.body.className = savedTheme
  }
}

// Parse TXT content into chapters
const parseTxt = (text: string) => {
  isLoading.value = true
  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n')

  // Improved Chapter regex: handles Chinese chapter patterns, works at start of line
  // Matches "第...章/节/回/..."
  const chapterRegex = /^\s*(第[零一二三四五六七八九十百千万\d]+[章节回集部卷].*)$|(\n\s*第[零一二三四五六七八九十百千万\d]+[章节回集部卷].*)/gm

  const result: Chapter[] = []
  
  // Find all chapter headers
  const matches = [...text.matchAll(chapterRegex)]
  
  if (matches.length > 0) {
    // Handle text before the first chapter
    if (matches[0].index! > 0) {
      result.push({
        title: '前言',
        content: text.substring(0, matches[0].index).trim()
      })
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!
      const end = i < matches.length - 1 ? matches[i+1].index! : text.length
      
      const fullMatch = matches[i][0]
      const title = fullMatch.trim()
      const content = text.substring(start + fullMatch.length, end).trim()
      
      result.push({ title, content })
    }
  } else {
    result.push({ title: '正文', content: text.trim() })
  }

  chapters.value = result
  isLoading.value = false
}

const filteredChapters = computed(() => {
  const all = chapters.value.map((c, index) => ({ ...c, originalIndex: index }))
  if (!searchQuery.value) return all
  const query = searchQuery.value.toLowerCase()
  return all.filter(c => c.title.toLowerCase().includes(query))
})

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  bookName.value = file.name.replace('.txt', '')
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    parseTxt(text)
    currentChapterIndex.value = 0
    saveProgress()
  }
  reader.readAsText(file)
}

const saveProgress = () => {
  localStorage.setItem(`progress_${bookName.value}`, currentChapterIndex.value.toString())
}

const loadProgress = () => {
  const saved = localStorage.getItem(`progress_${bookName.value}`)
  if (saved) {
    const index = parseInt(saved)
    if (index >= 0 && index < chapters.value.length) {
      currentChapterIndex.value = index
    }
  }
}

const changeChapter = (index: number) => {
  if (index >= 0 && index < chapters.value.length) {
    currentChapterIndex.value = index
    saveProgress()
    isSidebarOpen.value = false
    isControlsVisible.value = false
    
    // Scroll to top immediately
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
  }
}

const setTheme = (newTheme: string) => {
  theme.value = newTheme
  document.body.className = newTheme
  localStorage.setItem('reader_theme', newTheme)
}

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const readingProgressPercent = computed(() => {
  if (chapters.value.length === 0) return 0
  return Math.round(((currentChapterIndex.value + 1) / chapters.value.length) * 100)
})

const loadDefaultNovel = async () => {
  try {
    isLoading.value = true
    const response = await fetch('/txt/novel.txt')
    if (response.ok) {
      const text = await response.text()
      bookName.value = '我的模拟长生路'
      parseTxt(text)
      loadProgress()
    } else {
      console.error('Failed to load default novel')
    }
  } catch (error) {
    console.error('Error loading default novel:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadDefaultNovel()
})

watch(fontSize, (newSize) => {
  localStorage.setItem('reader_font_size', newSize.toString())
})
</script>

<template>
  <div id="reader-app" @click="isControlsVisible = !isControlsVisible">
    <!-- Side Navigation (PC Only) -->
    <div class="side-nav left glass" :class="{ disabled: currentChapterIndex <= 0 }"
      @click.stop="changeChapter(currentChapterIndex - 1)">
      <span class="nav-icon">❮</span>
    </div>
    <div class="side-nav right glass"
      :class="{ disabled: currentChapterIndex >= chapters.length - 1 || chapters.length === 0 }"
      @click.stop="changeChapter(currentChapterIndex + 1)">
      <span class="nav-icon">❯</span>
    </div>

    <!-- Top Bar -->
    <header :class="['top-bar glass', { visible: isControlsVisible }]" @click.stop>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: readingProgressPercent + '%' }"></div>
      </div>
      <div class="top-content">
        <button class="btn" @click.stop="isSidebarOpen = true">
          <span class="icon">☰</span> 目录
        </button>
        <h1 class="book-title">{{ bookName }}</h1>
        <div class="top-actions">
          <label class="btn btn-primary">
            导入 TXT
            <input type="file" accept=".txt" @change="handleFileUpload" hidden>
          </label>
        </div>
      </div>
    </header>

    <!-- Sidebar / Chapter List -->
    <aside :class="['sidebar glass', { open: isSidebarOpen }]" @click.stop>
      <div class="sidebar-header">
        <h2>目录</h2>
        <button class="btn close-btn" @click="isSidebarOpen = false">✕</button>
      </div>
      <div class="sidebar-search">
        <input type="text" v-model="searchQuery" placeholder="搜索章节..." class="search-input">
      </div>
      <div class="chapter-list">
        <div v-for="chapter in filteredChapters" :key="chapter.originalIndex"
          :class="['chapter-item', { active: chapter.originalIndex === currentChapterIndex }]" 
          @click="changeChapter(chapter.originalIndex)">
          {{ chapter.title }}
        </div>
        <div v-if="filteredChapters.length === 0" class="no-results">
          {{ isLoading ? '正在加载...' : '未找到相关章节' }}
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="reader-container" :style="{ fontSize: fontSize + 'px' }">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loader"></div>
        <p>正在努力解析小说...</p>
      </div>

      <!-- Content Grid for Silkier Transitions without flashing -->
      <div class="content-grid">
        <Transition name="silk-fade" mode="out-in">
          <div v-if="!isLoading && chapters.length > 0" :key="currentChapterIndex" class="chapter-wrapper">
            <h2 class="current-chapter-title">{{ chapters[currentChapterIndex].title }}</h2>
            <div class="content-body">{{ chapters[currentChapterIndex].content }}</div>

            <div class="navigation-buttons">
              <button class="btn" @click.stop="changeChapter(currentChapterIndex - 1)"
                :disabled="currentChapterIndex === 0">上一章</button>
              <button class="btn" @click.stop="changeChapter(currentChapterIndex + 1)"
                :disabled="currentChapterIndex === chapters.length - 1">下一章</button>
            </div>
          </div>
          <div v-else-if="!isLoading" class="welcome-screen">
            <h2>欢迎来到极简书阁</h2>
            <p>请导入 TXT 小说开始阅读</p>
          </div>
        </Transition>
      </div>
    </main>

    <!-- Bottom Controls -->
    <footer :class="['bottom-bar glass', { visible: isControlsVisible }]" @click.stop>
      <div class="controls-grid">
        <div class="control-item">
          <span>字号</span>
          <button class="btn" @click="fontSize -= 2">-</button>
          <button class="btn" @click="fontSize += 2">+</button>
        </div>
        <div class="control-item">
          <span>背景</span>
          <div class="theme-dots">
            <div class="theme-dot light" @click="setTheme('light')" :class="{ active: theme === 'light' }"></div>
            <div class="theme-dot green" @click="setTheme('green')" :class="{ active: theme === 'green' }"></div>
            <div class="theme-dot dark" @click="setTheme('dark')" :class="{ active: theme === 'dark' }"></div>
          </div>
        </div>
        <div class="control-item">
          <button class="btn" @click="toggleFullScreen">全屏阅读</button>
        </div>
      </div>
      <div class="progress-info">
        进度: {{ readingProgressPercent }}% ({{ currentChapterIndex + 1 }} / {{ chapters.length }})
      </div>
    </footer>

    <!-- Overlay: Only for sidebar to prevent clutter when just viewing controls -->
    <Transition name="fade">
      <div v-if="isSidebarOpen" class="overlay" @click.stop="isSidebarOpen = false"></div>
    </Transition>
  </div>
</template>

<style scoped>
/* Improved Silky Transition - Grid Based to prevent flashing */
.content-grid {
  display: grid;
  grid-template-columns: 100%;
}

.chapter-wrapper {
  width: 100%;
  will-change: opacity, transform;
}

.silk-fade-enter-active {
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.silk-fade-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}

.silk-fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.silk-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

/* Only show on PC */
@media (max-width: 800px) {
  .side-nav {
    display: none;
  }
}

#reader-app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.top-bar,
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 250;
  padding: 20px 40px;
  padding-left: calc(40px + env(safe-area-inset-left));
  padding-right: calc(40px + env(safe-area-inset-right));
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.top-bar {
  background: var(--panel-light);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.bottom-bar {
  background: var(--panel-light);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

body.dark .top-bar, body.dark .bottom-bar { 
  background: var(--panel-dark); 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
body.green .top-bar, body.green .bottom-bar { background: var(--panel-green); }

.top-bar {
  top: 0;
  transform: translateY(-130%);
}

.top-bar.visible {
  transform: translateY(0);
}

.bottom-bar {
  bottom: 0;
  transform: translateY(130%);
}

.bottom-bar.visible {
  transform: translateY(0);
}

.bottom-bar {
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  padding-top: 20px;
}

.top-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.book-title {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  opacity: 0.9;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.reader-container {
  max-width: var(--reader-max-width);
  margin: 0 auto;
  padding: 100px 20px;
  min-height: 100vh;
  transition: font-size 0.2s ease; /* Smooth font size adjustment */
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 20px;
  color: var(--primary);
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid var(--primary);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.current-chapter-title {
  font-size: 1.8em;
  margin-bottom: 40px;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
  font-family: var(--font-serif);
}

.content-body {
  white-space: pre-wrap;
  line-height: var(--line-height);
  font-family: var(--font-serif);
  text-align: justify;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid var(--border);
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  z-index: 300;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  background: var(--panel-light);
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
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
  padding: 24px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-search {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
}

.close-btn {
  border: none !important;
  background: transparent !important;
  font-size: 1.2rem;
  padding: 8px;
  opacity: 0.6;
  transform: none !important;
}

.close-btn:hover {
  opacity: 1;
  background: hsla(0, 0%, 50%, 0.1) !important;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: hsla(0, 0%, 50%, 0.05);
  color: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--primary);
}

.no-results {
  padding: 40px 20px;
  text-align: center;
  opacity: 0.5;
  font-size: 0.9rem;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chapter-item {
  padding: 15px 25px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
  border-bottom: 1px solid hsla(0, 0%, 50%, 0.05);
}

.chapter-item:hover {
  background: hsla(0, 0%, 50%, 0.1);
}

.chapter-item.active {
  color: var(--primary);
  background: hsla(210, 100%, 60%, 0.1);
  font-weight: 600;
}

.controls-grid {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 10px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-dots {
  display: flex;
  gap: 10px;
}

.theme-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.theme-dot.active {
  border-color: var(--primary);
  transform: scale(1.1);
}

.theme-dot.light {
  background: #fff;
  border: 1px solid #ddd;
}

.theme-dot.green {
  background: #c7edcc;
}

.theme-dot.dark {
  background: #1a1a1a;
}

.progress-info {
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.6;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 290;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.welcome-screen {
  height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .sidebar {
    width: 85%;
  }

  .book-title {
    display: none;
  }

  .reader-container {
    padding-top: 100px;
    padding-bottom: 140px;
  }

  .top-bar, .bottom-bar {
    margin: 0;
    width: 100%;
    left: 0;
    right: 0;
    border: none;
    border-radius: 0;
    padding: 20px 25px;
  }

  .top-bar { 
    top: 0; 
    border-bottom: 1px solid var(--border);
    padding-top: calc(20px + env(safe-area-inset-top));
  }
  
  .bottom-bar { 
    bottom: 0; 
    border-top: 1px solid var(--border);
    padding-bottom: calc(25px + env(safe-area-inset-bottom));
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    padding: 10px 0;
  }

  .control-item:last-child {
    grid-column: span 2; /* Full width for full-screen button */
  }

  .control-item {
    background: hsla(0, 0%, 50%, 0.05);
    padding: 8px;
    border-radius: 8px;
    justify-content: center;
    font-size: 0.85rem;
  }

  .theme-dots {
    gap: 8px;
  }

  .theme-dot {
    width: 20px;
    height: 20px;
  }
}
</style>
