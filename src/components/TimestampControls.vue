<script setup lang="ts">
import {
  fromDateTimeInput,
  toDateTimeInput,
  timestampAtPosition,
  yearPosition,
} from "../year-time";

const timestamp = defineModel<number>({ required: true });
const playing = defineModel<boolean>("playing", { required: true });
const speed = defineModel<number>("speed", { required: true });
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function selectTimestamp(event: Event): void {
  const input = event.target as HTMLInputElement;
  // Native inputs may omit seconds when they are zero.
  const value = input.value.length === 16 ? `${input.value}:00` : input.value;
  const selected = fromDateTimeInput(value);
  if (selected !== undefined) timestamp.value = selected;
}

function selectYearPosition(event: Event): void {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (Number.isFinite(value) && value >= 0 && value <= 1) {
    timestamp.value = timestampAtPosition(value, new Date(timestamp.value).getFullYear());
  }
}
</script>

<template>
  <fieldset>
    <legend>Date and time (t)</legend>
    <label>
      Year position (t)
      <input
        type="number"
        min="0"
        max="1"
        step="0.00000001"
        :value="yearPosition(timestamp).toFixed(8)"
        @input="selectYearPosition"
      />
    </label>
    <label>
      Local time (t, {{ timeZone }})
      <input
        type="datetime-local"
        step="1"
        :value="toDateTimeInput(timestamp)"
        @input="selectTimestamp"
      />
    </label>
    <button type="button" @click="timestamp = Date.now()">Now</button>
    <label><input v-model="playing" type="checkbox" role="switch" /> Live play</label>
    <label>
      Speed (v): {{ speed }}×
      <input
        v-model.number="speed"
        aria-label="Playback speed (v)"
        type="range"
        min="0.5"
        max="100"
        step="0.5"
      />
    </label>
    <button type="button" @click="speed = 1">Real time (1×)</button>
  </fieldset>
</template>
