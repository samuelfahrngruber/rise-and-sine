<script setup lang="ts">
import { fromDateTimeInput, toDateTimeInput } from "../year-time";

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
</script>

<template>
  <fieldset>
    <legend>Date and time</legend>
    <label>
      Local time ({{ timeZone }})
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
      Speed: {{ speed }}×
      <input
        v-model.number="speed"
        aria-label="Playback speed"
        type="range"
        min="0.5"
        max="100"
        step="0.5"
      />
    </label>
    <button type="button" @click="speed = 1">Real time (1×)</button>
  </fieldset>
</template>
