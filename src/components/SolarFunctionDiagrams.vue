<script setup lang="ts">
import { computed } from "vue";
import FunctionDiagram from "./FunctionDiagram.vue";
import { solarEquationOfTime, solarTime, sunDeclination, sunHourAngle } from "../solar-position";

const props = defineProps<{ timestamp: number; longitude: number; speed: number }>();
const date = computed(() => new Date(props.timestamp));
const year = computed(() => date.value.getUTCFullYear());
const time = computed(() => solarTime(props.timestamp));
const start = computed(() => Date.UTC(year.value, 0, 1));
const end = computed(() => Date.UTC(year.value + 1, 0, 1));
const yearTimes = computed(() =>
  Array.from(
    { length: 49 },
    (_, index) => start.value + (index / 48) * (end.value - start.value - 1),
  ),
);
const dayStart = computed(() =>
  Date.UTC(year.value, date.value.getUTCMonth(), date.value.getUTCDate()),
);
const dayTimes = computed(() =>
  Array.from({ length: 49 }, (_, index) => dayStart.value + (index / 48) * (86_400_000 - 1)),
);
const declination = computed(() => yearTimes.value.map(sunDeclination));
const clockCorrection = computed(() => yearTimes.value.map(solarEquationOfTime));
const hourAngle = computed(() =>
  dayTimes.value.map((timestamp) => sunHourAngle(timestamp, props.longitude)),
);
const yearPhase = computed(() => yearTimes.value.map((timestamp) => solarTime(timestamp).phase));
const elapsedDays = computed(() =>
  yearTimes.value.map((timestamp) => solarTime(timestamp).elapsedDays),
);
const dayMinutes = computed(() => dayTimes.value.map((timestamp) => solarTime(timestamp).minutes));
</script>

<template>
  <div class="diagrams">
    <FunctionDiagram
      name="Solar declination δ(t) illustration"
      caption="Declination δ(t) (°)"
      :points="declination"
      :minimum="-24"
      :maximum="24"
      :position="time.elapsedDays / time.days"
      :value="sunDeclination(timestamp)"
      x-label="UTC year"
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
      name="Equation of time E(t) illustration"
      caption="Clock correction E(t) (min)"
      :points="clockCorrection"
      :minimum="-20"
      :maximum="20"
      :position="time.elapsedDays / time.days"
      :value="solarEquationOfTime(timestamp)"
      x-label="UTC year"
    />
    <FunctionDiagram
      name="Year phase γ(t) illustration"
      caption="Year phase γ(t) (rad)"
      :points="yearPhase"
      :minimum="-0.02"
      :maximum="6.3"
      :position="time.elapsedDays / time.days"
      :value="time.phase"
      x-label="UTC year"
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
    <FunctionDiagram
      name="Elapsed days u(t) illustration"
      caption="Elapsed UTC days u(t)"
      :points="elapsedDays"
      :minimum="0"
      :maximum="time.days"
      :position="time.elapsedDays / time.days"
      :value="time.elapsedDays"
      x-label="UTC year"
    />
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Days in year D illustration"
      >
        <rect x="20" y="26" width="88" height="72" fill="none" stroke="currentColor" />
        <path d="M 20 44 H 108 M 40 20 V 32 M 88 20 V 32" stroke="currentColor" />
        <text x="64" y="62" text-anchor="middle">{{ year }}</text>
        <text x="64" y="84" text-anchor="middle">{{ time.days }} days</text>
      </svg>
      <figcaption>Days in year D</figcaption>
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
