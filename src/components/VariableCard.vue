<script setup lang="ts">
defineProps<{ symbol: string; title: string; description: string }>();
</script>

<template>
  <figure :aria-label="`${symbol}: ${title}`">
    <div class="diagram"><slot /></div>
    <figcaption>
      <strong>{{ symbol }}</strong> — {{ title }}
      <p>{{ description }}</p>
    </figcaption>
  </figure>
</template>

<style scoped>
figure {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.diagram {
  flex: none;
}
figcaption {
  flex: 1;
  min-width: 0;
}
p {
  margin: 0.25rem 0 0;
}
</style>
