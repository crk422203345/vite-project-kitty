<script setup lang="ts">
import type { Chapter } from '../utils/parser'

defineProps<{
  chapters: Chapter[]
  currentChapterIndex: number
  fontSize: number
  isLoading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'changeChapter', index: number): void
  (e: 'retry'): void
}>()
</script>

<template>
  <main class="reader-container" :style="{ fontSize: fontSize + 'px' }">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>正在努力解析小说...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen fade-in">
      <h2>加载出错</h2>
      <p class="error-msg">{{ error }}</p>
      <button class="btn btn-primary" @click="emit('retry')">重新加载</button>
    </div>

    <!-- Content State -->
    <div v-else class="content-grid">
      <Transition name="silk-fade" mode="out-in">
        <div v-if="chapters.length > 0" :key="currentChapterIndex" class="chapter-wrapper">
          <h2 class="current-chapter-title">{{ chapters[currentChapterIndex].title }}</h2>
          <div class="content-body">{{ chapters[currentChapterIndex].content }}</div>

          <div class="navigation-buttons">
            <button
              class="btn"
              :disabled="currentChapterIndex === 0"
              @click.stop="emit('changeChapter', currentChapterIndex - 1)"
            >
              上一章
            </button>
            <button
              class="btn"
              :disabled="currentChapterIndex === chapters.length - 1"
              @click.stop="emit('changeChapter', currentChapterIndex + 1)"
            >
              下一章
            </button>
          </div>
        </div>
        <div v-else class="welcome-screen">
          <h2>欢迎来到极简书阁</h2>
          <p>请点击导入 TXT 小说开始阅读</p>
        </div>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.reader-container {
  max-width: var(--reader-max-width);
  margin: 0 auto;
  padding: 120px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.content-grid {
  display: grid;
  grid-template-columns: 100%;
}

.chapter-wrapper {
  width: 100%;
  will-change: opacity, transform;
}

.current-chapter-title {
  font-size: 1.8em;
  font-weight: 700;
  margin-bottom: 2em;
  padding-bottom: 0.5em;
  line-height: 1.4;
  position: relative;
}

.current-chapter-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--primary);
  opacity: 0.8;
}

.content-body {
  line-height: var(--line-height);
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--font-serif);
  text-align: justify;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 4em;
  padding-top: 2em;
  border-top: 1px solid var(--border);
}

.navigation-buttons .btn {
  padding: 10px 24px;
}

.loading-overlay,
.error-screen,
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  min-height: 50vh;
}

.error-screen h2 {
  color: hsl(0, 80%, 50%);
  margin-bottom: 15px;
}

.error-msg {
  opacity: 0.8;
  margin-bottom: 24px;
  font-size: 1rem;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-bottom-color: var(--primary);
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Transitions */
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

@media (max-width: 600px) {
  .reader-container {
    padding: 100px 15px 80px;
  }
  .current-chapter-title {
    font-size: 1.5em;
  }
}
</style>
