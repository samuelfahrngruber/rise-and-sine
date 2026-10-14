<script setup lang="ts">
import { computed } from "vue";
import FunctionDiagram from "./FunctionDiagram.vue";
import {
  EARTH_TILT,
  equinoxPosition,
  solarTime,
  sunDeclination,
  sunHourAngle,
} from "../solar-position";
import { yearBounds, yearPosition } from "../year-time";

const props = defineProps<{ timestamp: number; longitude: number; speed: number }>();
const date = computed(() => new Date(props.timestamp));
const year = computed(() => date.value.getFullYear());
const time = computed(() => solarTime(props.timestamp));
const bounds = computed(() => yearBounds(year.value));
const progress = computed(() => yearPosition(props.timestamp));
const equinox = computed(() => equinoxPosition(year.value));
const yearTimes = computed(() =>
  Array.from(
    { length: 49 },
    (_, index) => bounds.value.start + (index / 48) * (bounds.value.end - bounds.value.start - 1),
  ),
);
const dayStart = computed(() =>
  Date.UTC(date.value.getUTCFullYear(), date.value.getUTCMonth(), date.value.getUTCDate()),
);
const dayTimes = computed(() =>
  Array.from({ length: 49 }, (_, index) => dayStart.value + (index / 48) * (86_400_000 - 1)),
);
const declination = computed(() => yearTimes.value.map(sunDeclination));
const hourAngle = computed(() =>
  dayTimes.value.map((timestamp) => sunHourAngle(timestamp, props.longitude)),
);
const dayMinutes = computed(() => dayTimes.value.map((timestamp) => solarTime(timestamp).minutes));
const tiltRadians = (EARTH_TILT * Math.PI) / 180;
const tiltArc = `M 64 38 A 26 26 0 0 1 ${64 + 26 * Math.sin(tiltRadians)} ${64 - 26 * Math.cos(tiltRadians)}`;
</script>

<template>
  <div class="diagrams">
    <FunctionDiagram
      name="Solar declination δ(t) illustration"
      caption="Declination δ(t) (°)"
      :points="declination"
      :minimum="-24"
      :maximum="24"
      :position="progress"
      :value="sunDeclination(timestamp)"
      x-label="Year"
    />
    <FunctionDiagram
      name="Solar hour angle H(λ, t) illustration"
      caption="Hour angle H(λ, t) (°)"
      :points="hourAngle"
      :minimum="-180"
      :maximum="180"
      :position="time.minutes / 1440"
      :value="sunHourAngle(timestamp, longitude)"
      x-label="UTC day"
      :jump-limit="180"
    />
    <FunctionDiagram
      name="UTC minutes m(t) illustration"
      caption="UTC minutes m(t)"
      :points="dayMinutes"
      :minimum="0"
      :maximum="1440"
      :position="time.minutes / 1440"
      :value="time.minutes"
      x-label="UTC day"
    />
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Earth tilt ε illustration"
      >
        <circle cx="64" cy="64" r="32" fill="none" stroke="currentColor" />
        <path d="M 64 18 V 110" stroke="currentColor" stroke-dasharray="3 3" />
        <path
          d="M 64 18 V 110 M 32 64 H 96"
          stroke="currentColor"
          :transform="`rotate(${EARTH_TILT} 64 64)`"
        />
        <path :d="tiltArc" fill="none" stroke="currentColor" />
        <text x="77" y="34">ε</text>
        <text x="64" y="124" text-anchor="middle" font-size="10">{{ EARTH_TILT }}°</text>
      </svg>
      <figcaption>Earth tilt ε</figcaption>
    </figure>
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Reference equinox tₑ illustration"
      >
        <path d="M 8 64 H 120 M 8 58 V 70 M 120 58 V 70" stroke="currentColor" />
        <circle :cx="8 + equinox * 112" cy="64" r="4" />
        <text :x="8 + equinox * 112" y="54" text-anchor="middle">tₑ</text>
        <text x="8" y="85">0</text>
        <text x="120" y="85" text-anchor="end">1</text>
        <text x="8" y="108" font-size="10">21 Mar · 12:00 UTC</text>
      </svg>
      <figcaption>Reference equinox tₑ</figcaption>
    </figure>
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Playback speed v illustration"
      >
        <text x="12" y="30" font-size="11">1 real second</text>
        <path d="M 12 54 H 112 L 104 48 M 112 54 L 104 60" fill="none" stroke="currentColor" />
        <text x="12" y="84" font-size="11">{{ speed }} simulated s</text>
      </svg>
      <figcaption>Playback speed v</figcaption>
    </figure>
  </div>
</template>

<style scoped>
.diagrams {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
