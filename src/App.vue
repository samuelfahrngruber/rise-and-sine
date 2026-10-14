<script setup lang="ts">
import FunctionPlot from "./components/FunctionPlot.vue";
import { ref } from "vue";
import type { PlotMarker } from "./plot-data";
import { createSineWave } from "./sine-wave";

const data = createSineWave();
data.series.push({ label: "cos(x)", values: data.x.map((value) => Math.cos(value)) });
const markers: PlotMarker[] = [
  { orientation: "vertical", value: Math.PI },
  { orientation: "horizontal", value: 0 },
];
const showLegend = ref(true);
</script>

<template>
  <main>
    <h1>Rise and Sine</h1>
    <figure>
      <figcaption>Sine and cosine (x in radians)</figcaption>
      <FunctionPlot :data="data" :markers="markers" :show-legend="showLegend" />
    </figure>
    <label><input v-model="showLegend" type="checkbox" /> Show legend</label>
    <p>Drag horizontally to zoom. Double-click to reset.</p>
  </main>
</template>
