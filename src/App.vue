<script setup lang="ts">
import { computed, ref } from "vue";
import FunctionPlot from "./components/FunctionPlot.vue";
import LatitudeControls from "./components/LatitudeControls.vue";
import TimestampControls from "./components/TimestampControls.vue";
import SunFormula from "./components/SunFormula.vue";
import type { PlotMarker } from "./plot-data";
import {
  sampleSolarYear,
  solarYearPlot,
  sunElevation,
  VIENNA_LATITUDE,
  VIENNA_LONGITUDE,
} from "./solar-position";
import { seasonMarkers } from "./solar-markers";
import { timestampAtPosition, yearPosition } from "./year-time";
import { usePlayback } from "./use-playback";

const latitude = ref(VIENNA_LATITUDE);
const timestamp = ref(Date.now());
const playing = ref(false);
const speed = ref(1);
const showLegend = ref(true);
const year = computed(() => new Date(timestamp.value).getFullYear());
const samples = computed(() => sampleSolarYear(year.value));
const data = computed(() => solarYearPlot(samples.value, latitude.value));
const selectedPosition = computed(() => yearPosition(timestamp.value));
const selectedElevation = computed(() => sunElevation(timestamp.value, latitude.value));
const maximum = computed(() =>
  data.value.series[1]!.values.reduce((max, value) => Math.max(max, value), -90),
);
const minimum = computed(() =>
  data.value.series[2]!.values.reduce((min, value) => Math.min(min, value), 90),
);
const fixedMarkers = computed<PlotMarker[]>(() => [
  ...seasonMarkers(year.value),
  { orientation: "horizontal", value: 0, label: "Horizon", color: "black" },
  {
    orientation: "horizontal",
    value: maximum.value,
    label: `Year maximum: ${maximum.value.toFixed(2)}°`,
    color: "#2ca02c",
  },
  {
    orientation: "horizontal",
    value: minimum.value,
    label: `Year minimum: ${minimum.value.toFixed(2)}°`,
    color: "#d62728",
  },
]);
const markers = computed<PlotMarker[]>(() => [
  ...fixedMarkers.value,
  { orientation: "vertical", value: selectedPosition.value, label: "Selected", color: "#1f77b4" },
]);

usePlayback(timestamp, playing, speed);

function selectPosition(position: number): void {
  timestamp.value = timestampAtPosition(position, year.value);
}
</script>

<template>
  <main>
    <h1>Rise and Sine</h1>
    <LatitudeControls v-model="latitude" />
    <TimestampControls v-model="timestamp" v-model:playing="playing" v-model:speed="speed" />
    <p>Longitude: {{ VIENNA_LONGITUDE }}° E (Vienna). Altitude: sea level.</p>
    <p>
      <output
        >Sun angle: {{ selectedElevation.toFixed(2) }}° · Year position:
        {{ selectedPosition.toFixed(6) }}</output
      >
    </p>
    <figure>
      <figcaption>Sun elevation in {{ year }}</figcaption>
      <FunctionPlot
        :data="data"
        :markers="markers"
        :show-legend="showLegend"
        x-label="Year position"
        y-label="Elevation (°)"
        :y-range="[-90, 90]"
        @select-x="selectPosition"
      />
    </figure>
    <label><input v-model="showLegend" type="checkbox" /> Show legend</label>
    <p>Click to select a time. Drag horizontally to zoom. Double-click to reset.</p>
    <p>Year position: 0 = January 1, 00:00 local time; 1 = the start of next year.</p>
    <p>Season markers use approximate equinox and solstice dates.</p>
    <SunFormula />
  </main>
</template>
