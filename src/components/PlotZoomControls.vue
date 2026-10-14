<script setup lang="ts">
defineEmits<{ reset: []; today: []; nextTwoHours: [] }>();
</script>

<template>
  <div role="group" aria-label="Plot zoom">
    <button type="button" @click="$emit('reset')">Reset zoom</button>
    <button type="button" @click="$emit('today')">Zoom to today</button>
    <button type="button" @click="$emit('nextTwoHours')">Zoom to next 2 hours</button>
  </div>
</template>
