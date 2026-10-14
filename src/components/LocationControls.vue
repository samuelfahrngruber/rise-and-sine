<script setup lang="ts">
import LocationSearch from "./LocationSearch.vue";
import type { Location } from "../location-api";
const latitude = defineModel<number>("latitude", { required: true });
const longitude = defineModel<number>("longitude", { required: true });

function selectLocation(location: Location): void {
  latitude.value = location.latitude;
  longitude.value = location.longitude;
}

function updateLatitude(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  if (Number.isFinite(value) && value >= -90 && value <= 90) latitude.value = value;
}

function updateLongitude(event: Event): void {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (Number.isFinite(value) && value >= -180 && value <= 180) longitude.value = value;
}
</script>

<template>
  <fieldset>
    <legend>Location</legend>
    <LocationSearch :latitude="latitude" :longitude="longitude" @select="selectLocation" />
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
    <label>
      Degrees east (λ)
      <input
        type="number"
        min="-180"
        max="180"
        step="0.0001"
        :value="longitude"
        @input="updateLongitude"
      />
    </label>
    <input
      aria-label="Longitude (λ)"
      type="range"
      min="-180"
      max="180"
      step="0.0001"
      :value="longitude"
      @input="updateLongitude"
    />
  </fieldset>
</template>
