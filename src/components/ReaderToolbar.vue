<script setup lang="ts">
import type { ThemeType } from '../composables/useReaderSettings'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{
  bookName: string
  fontSize: number
  theme: ThemeType
  isControlsVisible: boolean
  isFullscreen: boolean
  progressPercent: number
  currentChapterIndex: number
  chaptersLength: number
}>()

const emit = defineEmits<{
  (e: 'update:fontSize', value: number): void
  (e: 'changeTheme', value: ThemeType): void
  (e: 'toggleSidebar'): void
  (e: 'toggleFullscreen'): void
  (e: 'importFile', file: File): void
}>()

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    emit('importFile', file)
  }
}

const decreaseFontSize = () => {
  if (props.fontSize > 12) {
    emit('update:fontSize', props.fontSize - 2)
  }
}

const increaseFontSize = () => {
  if (props.fontSize < 40) {
    emit('update:fontSize', props.fontSize + 2)
  }
}
</script>

<template>
  <div>
    <header :class="['top-bar glass', { visible: isControlsVisible }]" @click.stop>
      <ProgressBar :progress-percent="progressPercent" />
      <div class="top-content">
        <button class="btn" @click.stop="emit('toggleSidebar')">
          <span class="icon">☰</span>
          目录
        </button>
        <h1 class="book-title">{{ bookName }}</h1>
        <div class="top-actions">
          <label class="btn btn-primary">
            导入 TXT
            <input type="file" accept=".txt" hidden @change="handleFileUpload" />
          </label>
        </div>
      </div>
    </header>

    <footer :class="['bottom-bar glass', { visible: isControlsVisible }]" @click.stop>
      <div class="controls-grid">
        <div class="control-item">
          <span>字号</span>
          <button class="btn" @click="decreaseFontSize">-</button>
          <span class="font-size-val">{{ fontSize }}px</span>
          <button class="btn" @click="increaseFontSize">+</button>
        </div>
        <div class="control-item">
          <span>背景</span>
          <div class="theme-dots">
            <div
              class="theme-dot light"
              :class="{ active: theme === 'light' }"
              @click="emit('changeTheme', 'light')"
            ></div>
            <div
              class="theme-dot green"
              :class="{ active: theme === 'green' }"
              @click="emit('changeTheme', 'green')"
            ></div>
            <div
              class="theme-dot dark"
              :class="{ active: theme === 'dark' }"
              @click="emit('changeTheme', 'dark')"
            ></div>
          </div>
        </div>
        <div class="control-item">
          <button class="btn" @click="emit('toggleFullscreen')">
            {{ isFullscreen ? '退出全屏' : '全屏阅读' }}
          </button>
        </div>
      </div>
      <div class="progress-info">
        进度: {{ progressPercent }}% ({{ chaptersLength > 0 ? currentChapterIndex + 1 : 0 }} / {{ chaptersLength }})
      </div>
    </footer>
  </div>
</template>

<style scoped>
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
  top: 0;
  transform: translateY(-130%);
  opacity: 0;
}

.top-bar.visible {
  transform: translateY(0);
  opacity: 1;
}

.bottom-bar {
  bottom: 0;
  transform: translateY(130%);
  opacity: 0;
}

.bottom-bar.visible {
  transform: translateY(0);
  opacity: 1;
}

.top-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.top-actions {
  display: flex;
  gap: 10px;
}

.controls-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 12px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.font-size-val {
  font-size: 0.9rem;
  min-width: 40px;
  text-align: center;
}

.theme-dots {
  display: flex;
  gap: 12px;
}

.theme-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.theme-dot.active {
  border-color: var(--primary);
  transform: scale(1.1);
}

.theme-dot.light {
  background-color: hsl(0, 0%, 98%);
  box-shadow: inset 0 0 0 1px hsla(0, 0%, 0%, 0.1);
}

.theme-dot.green {
  background-color: hsl(120, 30%, 88%);
}

.theme-dot.dark {
  background-color: hsl(220, 15%, 10%);
}

.progress-info {
  font-size: 0.8rem;
  opacity: 0.6;
  text-align: right;
}

@media (max-width: 600px) {
  .top-bar,
  .bottom-bar {
    padding: 15px 20px;
  }
  .controls-grid {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  .control-item {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
