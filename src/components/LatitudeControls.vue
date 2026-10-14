<script setup lang="ts">
const latitude = defineModel<number>({ required: true });

function updateLatitude(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  if (Number.isFinite(value) && value >= -90 && value <= 90) latitude.value = value;
}
</script>

<template>
  <fieldset>
    <legend>Latitude (φ)</legend>
    <label>
      Degrees north (φ)
      <input
        type="number"
        min="-90"
        max="90"
        step="0.0001"
        :value="latitude"
        @input="updateLatitude"
      />
    </label>
    <input
      aria-label="Latitude (φ)"
      type="range"
      min="-90"
      max="90"
      step="0.0001"
      :value="latitude"
      @input="updateLatitude"
    />
  </fieldset>
</template>
