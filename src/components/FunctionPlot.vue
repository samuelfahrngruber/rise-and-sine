<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { validatePlotData, type PlotData, type PlotMarker, type PlotSeries } from "../plot-data";

const props = withDefaults(
  defineProps<{ data: PlotData; markers?: PlotMarker[]; showLegend?: boolean }>(),
  { markers: () => [], showLegend: false },
);
const container = useTemplateRef<HTMLDivElement>("container");
let plot: uPlot | undefined;
let resizeObserver: ResizeObserver | undefined;
const colors = ["#1f77b4", "#d62728", "#2ca02c", "#9467bd"];

function seriesOptions(series: PlotSeries, index: number): uPlot.Series {
  return {
    label: series.label,
    stroke: series.color ?? colors[index % colors.length],
    width: 2,
  };
}

function drawMarkers(chart: uPlot): void {
  const { ctx, bbox } = chart;
  const pixelRatio = window.devicePixelRatio;

  ctx.save();
  ctx.beginPath();
  ctx.rect(bbox.left, bbox.top, bbox.width, bbox.height);
  ctx.clip();
  ctx.lineWidth = pixelRatio;
  ctx.setLineDash([4 * pixelRatio, 4 * pixelRatio]);

  for (const marker of props.markers) {
    if (!Number.isFinite(marker.value)) continue;

    const vertical = marker.orientation === "vertical";
    const position = chart.valToPos(marker.value, vertical ? "x" : "y", true);
    ctx.strokeStyle = marker.color ?? "#666";
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(position, bbox.top);
      ctx.lineTo(position, bbox.top + bbox.height);
    } else {
      ctx.moveTo(bbox.left, position);
      ctx.lineTo(bbox.left + bbox.width, position);
    }
    ctx.stroke();
  }

  ctx.restore();
}

onMounted(() => {
  const element = container.value!;
  validatePlotData(props.data);

  plot = new uPlot(
    {
      width: element.clientWidth,
      height: 320,
      scales: { x: { time: false } },
      series: [{ label: "x" }, ...props.data.series.map(seriesOptions)],
      axes: [{ label: "x" }, { label: "y" }],
      legend: { show: true },
      cursor: { drag: { x: true, y: false } },
      hooks: { draw: [drawMarkers] },
    },
    [props.data.x, ...props.data.series.map((series) => series.values)],
    element,
  );

  resizeObserver = new ResizeObserver(() => {
    plot?.setSize({ width: element.clientWidth, height: 320 });
  });
  resizeObserver.observe(element);
});

// Replace the data object to update curves while keeping horizontal zoom.
watch(
  () => props.data,
  (data) => {
    validatePlotData(data);
    const chart = plot;
    if (!chart) return;

    const options = data.series.map(seriesOptions);
    const seriesChanged =
      chart.series.length !== options.length + 1 ||
      options.some(
        (series, index) =>
          series.label !== chart.series[index + 1]?.label ||
          series.stroke !== chart.series[index + 1]?.stroke,
      );

    chart.batch(() => {
      if (seriesChanged) {
        for (let index = chart.series.length - 1; index > 0; index--) {
          chart.delSeries(index);
        }
        options.forEach((series) => chart.addSeries(series));
      }
      chart.setData([data.x, ...data.series.map((series) => series.values)], false);
      chart.setScale("x", { min: chart.scales.x!.min!, max: chart.scales.x!.max! });
    });
  },
);

watch(
  () => props.markers,
  () => plot?.redraw(false, false),
  { deep: true },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  plot?.destroy();
});
</script>

<template>
  <div
    ref="container"
    :class="{ 'legend-hidden': !showLegend }"
    role="img"
    aria-label="Function plot"
  />
</template>

<style scoped>
.legend-hidden :deep(.u-legend) {
  display: none;
}
</style>
