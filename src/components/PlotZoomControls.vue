<script setup lang="ts">
defineEmits<{
  year: [];
  month: [];
  week: [];
  today: [];
  nextTwoHours: [];
  nextTenMinutes: [];
}>();
</script>

<template>
  <div role="group" aria-label="Plot zoom">
    <button type="button" @click="$emit('year')">Zoom to year</button>
    <button type="button" @click="$emit('month')">Zoom to month</button>
    <button type="button" @click="$emit('week')">Zoom to week</button>
    <button type="button" @click="$emit('today')">Zoom to today</button>
    <button type="button" @click="$emit('nextTwoHours')">Zoom to next 2 hours</button>
    <button type="button" @click="$emit('nextTenMinutes')">Zoom to next 10 minutes</button>
  </div>
</template>
