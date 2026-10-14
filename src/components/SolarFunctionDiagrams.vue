<script setup lang="ts">
import { computed } from "vue";
import FunctionDiagram from "./FunctionDiagram.vue";
import VariableCard from "./VariableCard.vue";
import {
  EARTH_TILT,
  equinoxPosition,
  initialRotation,
  solarTime,
  sunDeclination,
  sunHourAngle,
} from "../solar-position";
import { yearBounds, yearPosition } from "../year-time";

const props = defineProps<{ timestamp: number; longitude: number }>();
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
const startRotation = computed(() => initialRotation(year.value));
const rotationPoint = computed(() => ({
  x: 64 + 42 * Math.cos(startRotation.value),
  y: 64 - 42 * Math.sin(startRotation.value),
}));
const tiltRadians = (EARTH_TILT * Math.PI) / 180;
const tiltArc = `M 64 38 A 26 26 0 0 1 ${64 + 26 * Math.sin(tiltRadians)} ${64 - 26 * Math.cos(tiltRadians)}`;
</script>

<template>
  <div class="diagrams">
    <VariableCard
      symbol="δ(t)"
      title="Declination"
      description="Seasonal angle above Earth’s equatorial plane"
    >
      <FunctionDiagram
        name="Solar declination δ(t) illustration"
        :points="declination"
        :minimum="-24"
        :maximum="24"
        :position="progress"
        :value="sunDeclination(timestamp)"
        x-label="Year"
      />
    </VariableCard>
    <VariableCard
      symbol="H(λ, t)"
      title="Daily rotation"
      description="Angle relative to solar noon"
    >
      <FunctionDiagram
        name="Solar hour angle H(λ, t) illustration"
        :points="hourAngle"
        :minimum="-180"
        :maximum="180"
        :position="time.minutes / 1440"
        :value="sunHourAngle(timestamp, longitude)"
        x-label="UTC day"
        :jump-limit="180"
      />
    </VariableCard>
    <VariableCard
      symbol="θ₀"
      title="Start rotation"
      description="January 1, 00:00 local time, at zero longitude"
    >
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Start rotation θ₀ illustration"
      >
        <circle cx="64" cy="64" r="42" fill="none" stroke="currentColor" />
        <path d="M 64 64 H 106" stroke="currentColor" stroke-dasharray="3 3" />
        <line x1="64" y1="64" :x2="rotationPoint.x" :y2="rotationPoint.y" stroke="currentColor" />
        <circle :cx="rotationPoint.x" :cy="rotationPoint.y" r="3" />
        <text x="66" y="87">θ₀</text>
        <text x="64" y="123" text-anchor="middle" font-size="10">Jan 1 · t = 0</text>
      </svg>
    </VariableCard>
    <VariableCard symbol="ε" title="Earth’s tilt" :description="`${EARTH_TILT}°`">
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
    </VariableCard>
    <VariableCard symbol="tₑ" title="Reference equinox" description="March 21, 12:00 UTC">
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
    </VariableCard>
  </div>
</template>

<style scoped>
.diagrams {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.diagrams > :deep(figure) {
  flex: 0 1 24rem;
}
</style>
