<script setup lang="ts">
defineProps<{
  progressPercent: number
}>()
</script>

<template>
  <div class="progress-bar-container">
    <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
  </div>
</template>

<style scoped>
.progress-bar-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: hsla(0, 0%, 50%, 0.1);
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px var(--primary);
}
</style>
