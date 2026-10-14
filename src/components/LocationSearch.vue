<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { reverseLocation, searchLocations, type Location } from "../location-api";

const props = defineProps<{ latitude: number; longitude: number }>();
const emit = defineEmits<{ select: [location: Location] }>();
const query = ref("");
const results = ref<Location[]>([]);
const status = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let selectedCoordinates = "";

function cancelLookup(): void {
  clearTimeout(timer);
  controller?.abort();
}

function scheduleLookup(lookup: (signal: AbortSignal) => Promise<void>): void {
  cancelLookup();
  const request = new AbortController();
  controller = request;
  status.value = "Looking up location…";
  timer = setTimeout(async () => {
    try {
      await lookup(request.signal);
    } catch {
      if (!request.signal.aborted) status.value = "Location lookup unavailable. Try again.";
    }
  }, 500);
}

function editQuery(event: Event): void {
  cancelLookup();
  query.value = (event.target as HTMLInputElement).value;
  results.value = [];
  status.value = "";
}

function search(): void {
  const text = query.value.trim();
  if (text.length < 2) {
    cancelLookup();
    status.value = "";
    return;
  }
  scheduleLookup(async (signal) => {
    const matches = await searchLocations(text, signal);
    if (signal.aborted) return;
    results.value = matches;
    status.value = matches.length ? "Choose a location." : "No locations found.";
  });
}

function select(location: Location): void {
  cancelLookup();
  selectedCoordinates = `${location.latitude},${location.longitude}`;
  query.value = location.name;
  results.value = [];
  status.value = "";
  emit("select", location);
}

watch(
  () => [props.latitude, props.longitude],
  () => {
    const coordinates = `${props.latitude},${props.longitude}`;
    if (coordinates === selectedCoordinates) {
      selectedCoordinates = "";
      return;
    }
    selectedCoordinates = "";
    query.value = "";
    results.value = [];
    scheduleLookup(async (signal) => {
      const location = await reverseLocation(props.latitude, props.longitude, signal);
      if (signal.aborted) return;
      query.value = location?.name ?? "";
      status.value = location ? "" : "No nearby place found.";
    });
  },
  { immediate: true },
);

onBeforeUnmount(cancelLookup);
</script>

<template>
  <div>
    <form @submit.prevent="search">
      <label>
        Location name
        <input type="search" :value="query" autocomplete="off" @input="editQuery" />
      </label>
      <button type="submit">Search</button>
    </form>
    <p role="status">{{ status }}</p>
    <ul v-if="results.length" aria-label="Location results">
      <li v-for="(location, index) in results" :key="index">
        <button type="button" @click="select(location)">{{ location.name }}</button>
      </li>
    </ul>
    <small
      >Location data:
      <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> ·
      <a href="https://photon.komoot.io">Photon</a></small
    >
  </div>
</template>
