<script setup lang="ts">
import { computed, ref, watch } from "vue";
import FunctionPlot from "./components/FunctionPlot.vue";
import LocationControls from "./components/LocationControls.vue";
import TimestampControls from "./components/TimestampControls.vue";
import SunFormula from "./components/SunFormula.vue";
import PlotZoomControls from "./components/PlotZoomControls.vue";
import type { PlotMarker } from "./plot-data";
import {
  sampleSolarYear,
  solarYearPlot,
  sunElevation,
  VIENNA_LATITUDE,
  VIENNA_LONGITUDE,
} from "./solar-position";
import { seasonMarkers } from "./solar-markers";
import {
  dayZoomRange,
  nextTwoHoursZoomRange,
  timestampAtPosition,
  yearPosition,
  yearBounds,
} from "./year-time";
import { usePlayback } from "./use-playback";

const latitude = ref(VIENNA_LATITUDE);
const longitude = ref(VIENNA_LONGITUDE);
const timestamp = ref(Date.now());
const playing = ref(false);
const speed = ref(1);
const showLegend = ref(true);
const visibleWindow = ref<[number, number]>();
const year = computed(() => new Date(timestamp.value).getFullYear());
const xRange = computed<[number, number]>({
  get: (): [number, number] =>
    visibleWindow.value
      ? [
          yearPosition(visibleWindow.value[0], year.value),
          yearPosition(visibleWindow.value[1], year.value),
        ]
      : [0, 1],
  set: (range: [number, number]) => {
    visibleWindow.value =
      range[0] === 0 && range[1] === 1
        ? undefined
        : [
            timestampAtPosition(range[0], year.value, false),
            timestampAtPosition(range[1], year.value, false),
          ];
  },
});
watch(year, () => {
  const window = visibleWindow.value;
  if (window && (timestamp.value < window[0] || timestamp.value > window[1]))
    visibleWindow.value = undefined;
});
const samples = computed(() => sampleSolarYear(year.value, 0, 120));
const xIncrements = computed(() => {
  const { start, end } = yearBounds(year.value);
  return [
    1, 2, 5, 10, 15, 30, 60, 120, 360, 720, 1440, 10080, 43200, 86400, 172800, 525600, 527040,
  ].map((minutes) => Number(((minutes * 60_000) / (end - start)).toFixed(15)));
});
const axisDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const data = computed(() => solarYearPlot(samples.value, latitude.value, longitude.value));
const selectedPosition = computed(() => yearPosition(timestamp.value));
const selectedElevation = computed(() =>
  sunElevation(timestamp.value, latitude.value, longitude.value),
);
const maximum = computed(() =>
  data.value.series[1]!.values.reduce((max, value) => Math.max(max, value), -90),
);
const lowestDailyMaximum = computed(() =>
  data.value.series[1]!.values.reduce((min, value) => Math.min(min, value), 90),
);
const fixedMarkers = computed<PlotMarker[]>(() => [
  ...seasonMarkers(year.value),
  { orientation: "horizontal", value: 0, label: "Horizon", color: "black" },
  {
    orientation: "horizontal",
    value: lowestDailyMaximum.value,
    label: `Lowest daily maximum: ${lowestDailyMaximum.value.toFixed(2)}°`,
    color: "#ff7f0e",
  },
  {
    orientation: "horizontal",
    value: maximum.value,
    label: `Year maximum: ${maximum.value.toFixed(2)}°`,
    color: "#2ca02c",
  },
]);
const markers = computed<PlotMarker[]>(() => [
  ...fixedMarkers.value,
  {
    orientation: "vertical",
    value: selectedPosition.value,
    label: "Selected",
    color: "#1f77b4",
    width: 3,
    lineStyle: "solid",
  },
]);

usePlayback(timestamp, playing, speed);

function selectPosition(position: number): void {
  timestamp.value = timestampAtPosition(position, year.value, false);
}

function zoomToToday(): void {
  timestamp.value = Date.now();
  xRange.value = dayZoomRange(timestamp.value);
}

function formatX(position: number): string {
  const { start, end } = yearBounds(year.value);
  return axisDate.format(Math.round((start + position * (end - start)) / 60_000) * 60_000);
}
</script>

<template>
  <main>
    <h1>Rise and Sine</h1>
    <SunFormula
      :latitude="latitude"
      :longitude="longitude"
      :timestamp="timestamp"
      :elevation="selectedElevation"
      :speed="speed"
    />
    <LocationControls v-model:latitude="latitude" v-model:longitude="longitude" />
    <TimestampControls v-model="timestamp" v-model:playing="playing" v-model:speed="speed" />
    <figure>
      <PlotZoomControls
        @reset="xRange = [0, 1]"
        @today="zoomToToday"
        @next-two-hours="xRange = nextTwoHoursZoomRange(timestamp)"
      />
      <label><input v-model="showLegend" type="checkbox" /> Show legend</label>
      <FunctionPlot
        v-model:x-range="xRange"
        :data="data"
        :markers="markers"
        :show-legend="showLegend"
        x-label="Date and time (t)"
        y-label="Elevation α (°)"
        :format-x="formatX"
        :x-increments="xIncrements"
        :y-range="[-90, 90]"
        @select-x="selectPosition"
      />
    </figure>
  </main>
</template>
