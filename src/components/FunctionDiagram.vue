<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name: string;
  points: number[];
  minimum: number;
  maximum: number;
  position: number;
  value: number;
  xLabel: string;
  jumpLimit?: number;
}>();
const y = (value: number) => 96 - ((value - props.minimum) / (props.maximum - props.minimum)) * 72;
const path = computed(() =>
  props.points
    .map((value, index) => {
      const move =
        index === 0 ||
        (props.jumpLimit !== undefined &&
          Math.abs(value - props.points[index - 1]!) > props.jumpLimit);
      return `${move ? "M" : "L"} ${12 + (index / (props.points.length - 1)) * 104} ${y(value)}`;
    })
    .join(" "),
);
</script>

<template>
  <svg width="112" height="112" viewBox="0 0 128 128" role="img" :aria-label="name">
    <path d="M 12 20 V 96 H 116" fill="none" stroke="currentColor" />
    <path :d="path" fill="none" stroke="currentColor" />
    <circle :cx="12 + position * 104" :cy="y(value)" r="3" />
    <text x="14" y="15" font-size="10">{{ maximum }}</text>
    <text x="2" y="107" font-size="10">{{ minimum }}</text>
    <text x="116" y="119" text-anchor="end" font-size="10">{{ xLabel }}</text>
  </svg>
</template>
