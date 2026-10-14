<script setup lang="ts">
import { computed } from "vue";
import { yearPosition } from "../year-time";

const props = defineProps<{
  latitude: number;
  longitude: number;
  timestamp: number;
  elevation: number;
}>();

function point(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return { x: 64 + radius * Math.cos(radians), y: 64 - radius * Math.sin(radians) };
}

function angleArc(angle: number): string {
  const end = point(angle, 20);
  return `M 84 64 A 20 20 0 0 ${angle < 0 ? 1 : 0} ${end.x} ${end.y}`;
}

const observer = computed(() => point(props.latitude, 42));
const sun = computed(() => point(props.elevation, 42));
const yearProgress = computed(() => yearPosition(props.timestamp));
const meridian = computed(() => point(props.longitude, 42));
</script>

<template>
  <div class="diagrams">
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Latitude φ illustration"
      >
        <circle cx="64" cy="64" r="42" fill="none" stroke="currentColor" />
        <path
          d="M 16 64 H 112 M 64 18 V 110"
          fill="none"
          stroke="currentColor"
          stroke-dasharray="3 3"
        />
        <path :d="angleArc(latitude)" fill="none" stroke="currentColor" />
        <line x1="64" y1="64" :x2="observer.x" :y2="observer.y" stroke="currentColor" />
        <circle :cx="observer.x" :cy="observer.y" r="3" />
        <text x="79" :y="latitude < 0 ? 82 : 56">φ</text>
        <text x="60" y="14">N</text>
      </svg>
      <figcaption>Latitude φ</figcaption>
    </figure>
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Year position t illustration"
      >
        <path
          d="M 8 64 H 120 M 8 58 V 70 M 36 61 V 67 M 64 61 V 67 M 92 61 V 67 M 120 58 V 70"
          stroke="currentColor"
        />
        <circle :cx="8 + 112 * yearProgress" cy="64" r="4" />
        <text :x="8 + 112 * yearProgress" y="56" text-anchor="middle">t</text>
        <text x="8" y="84">0</text>
        <text x="120" y="84" text-anchor="end">1</text>
        <text x="8" y="103" font-size="10">Jan 1</text>
        <text x="120" y="103" font-size="10" text-anchor="end">Dec 31</text>
      </svg>
      <figcaption>Year position t</figcaption>
    </figure>
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Longitude λ illustration"
      >
        <circle cx="64" cy="64" r="42" fill="none" stroke="currentColor" />
        <path d="M 64 64 H 106" fill="none" stroke="currentColor" stroke-dasharray="3 3" />
        <path :d="angleArc(longitude)" fill="none" stroke="currentColor" />
        <line x1="64" y1="64" :x2="meridian.x" :y2="meridian.y" stroke="currentColor" />
        <circle :cx="meridian.x" :cy="meridian.y" r="3" />
        <text x="76" :y="longitude < 0 ? 82 : 56">λ</text>
        <text x="108" y="68" font-size="10">0°</text>
      </svg>
      <figcaption>Longitude λ</figcaption>
    </figure>
    <figure>
      <svg
        width="112"
        height="112"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Sun angle α illustration"
      >
        <path d="M 12 64 H 116" stroke="currentColor" />
        <line x1="64" y1="64" :x2="sun.x" :y2="sun.y" stroke="currentColor" />
        <path :d="angleArc(elevation)" fill="none" stroke="currentColor" />
        <circle :cx="sun.x" :cy="sun.y" r="5" fill="none" stroke="currentColor" />
        <text x="78" :y="elevation < 0 ? 82 : 56">α</text>
        <text x="12" y="59" font-size="10">Horizon</text>
      </svg>
      <figcaption>Sun angle α</figcaption>
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
