<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { validatePlotData, type PlotData, type PlotMarker, type PlotSeries } from "../plot-data";

const props = withDefaults(
  defineProps<{
    data: PlotData;
    markers?: PlotMarker[];
    showLegend?: boolean;
    xLabel?: string;
    yLabel?: string;
    yRange?: [number, number];
  }>(),
  { markers: () => [], showLegend: false, xLabel: "x", yLabel: "y" },
);
const emit = defineEmits<{ selectX: [value: number] }>();
const container = useTemplateRef<HTMLDivElement>("container");
let plot: uPlot | undefined;
let resizeObserver: ResizeObserver | undefined;
const colors = ["#1f77b4", "#d62728", "#2ca02c", "#9467bd"];
let pointerStart: { x: number; y: number } | undefined;

function recordPointer(event: PointerEvent): void {
  pointerStart = { x: event.clientX, y: event.clientY };
}

function selectPosition(event: MouseEvent): void {
  if (!plot || !pointerStart || event.button !== 0 || event.detail > 1) return;
  if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
  const bounds = plot.over.getBoundingClientRect();
  const position = event.clientX - bounds.left;
  if (position < 0 || position > bounds.width) return;
  emit("selectX", plot.posToVal(position, "x"));
}

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
    if (marker.label) {
      ctx.font = `${12 * pixelRatio}px sans-serif`;
      ctx.fillStyle = marker.color ?? "#666";
      const labelFitsRight =
        position + ctx.measureText(marker.label).width + 4 * pixelRatio < bbox.left + bbox.width;
      ctx.textAlign = vertical && labelFitsRight ? "left" : "right";
      ctx.textBaseline = vertical ? "top" : "bottom";
      ctx.fillText(
        marker.label,
        vertical
          ? position + (labelFitsRight ? 4 : -4) * pixelRatio
          : bbox.left + bbox.width - 4 * pixelRatio,
        vertical ? bbox.top + 4 * pixelRatio : position - 4 * pixelRatio,
      );
    }
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
      scales: { x: { time: false }, y: { range: props.yRange } },
      series: [{ label: "x" }, ...props.data.series.map(seriesOptions)],
      axes: [{ label: props.xLabel }, { label: props.yLabel }],
      legend: { show: true },
      cursor: { y: false, drag: { x: true, y: false, dist: 5 } },
      hooks: { draw: [drawMarkers] },
    },
    [props.data.x, ...props.data.series.map((series) => series.values)],
    element,
  );

  plot.over.addEventListener("pointerdown", recordPointer);
  plot.over.addEventListener("click", selectPosition, true);

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
  plot?.over.removeEventListener("pointerdown", recordPointer);
  plot?.over.removeEventListener("click", selectPosition, true);
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
