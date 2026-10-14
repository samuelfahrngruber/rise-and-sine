<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { PlotData } from "../plot-data";

const props = defineProps<{ data: PlotData }>();
const container = useTemplateRef<HTMLDivElement>("container");
let plot: uPlot | undefined;
let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  const element = container.value!;

  plot = new uPlot(
    {
      width: element.clientWidth,
      height: 320,
      scales: { x: { time: false } },
      series: [{}, { label: "y", stroke: "black", width: 2 }],
      axes: [{ label: "x (radians)" }, { label: "y" }],
      legend: { show: false },
      cursor: { drag: { x: true, y: true } },
    },
    [props.data.x, props.data.y],
    element,
  );

  resizeObserver = new ResizeObserver(() => {
    plot?.setSize({ width: element.clientWidth, height: 320 });
  });
  resizeObserver.observe(element);
});

// Replace the data object to update the curve while keeping the zoom range.
watch(
  () => props.data,
  (data) => plot?.setData([data.x, data.y], false),
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  plot?.destroy();
});
</script>

<template>
  <div ref="container" role="img" aria-label="Function plot" />
</template>
