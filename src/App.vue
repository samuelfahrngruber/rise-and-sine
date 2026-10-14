<script setup lang="ts">
import FunctionPlot from "./components/FunctionPlot.vue";
import { createSineWave } from "./sine-wave";

const data = createSineWave();
</script>

<template>
  <main>
    <h1>Rise and Sine</h1>
    <figure>
      <figcaption>y = sin(x)</figcaption>
      <FunctionPlot :data="data" />
    </figure>
    <p>Drag across the plot to zoom. Double-click to reset.</p>
  </main>
</template>
