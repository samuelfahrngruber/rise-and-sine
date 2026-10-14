<script setup lang="ts">
import ParameterDiagrams from "./ParameterDiagrams.vue";
import { computed } from "vue";
import SolarFunctionDiagrams from "./SolarFunctionDiagrams.vue";
import { daysInYear } from "../year-time";

const props = defineProps<{
  latitude: number;
  longitude: number;
  timestamp: number;
  elevation: number;
}>();
const days = computed(() => daysInYear(new Date(props.timestamp).getFullYear()));
</script>

<template>
  <section aria-label="Sun angle formula">
    <div class="equation">
      <math
        display="block"
        aria-label="Sun elevation as a function of latitude, longitude, and year position"
      >
        <mrow>
          <mi mathvariant="normal">α</mi><mo>(</mo><mi mathvariant="normal">φ</mi><mo>,</mo
          ><mi mathvariant="normal">λ</mi><mo>,</mo><mi>t</mi><mo>)</mo><mo>=</mo>
          <mfrac
            ><mrow><mn>180</mn><mo>°</mo></mrow
            ><mi mathvariant="normal">π</mi></mfrac
          >
          <mo>arcsin</mo><mo>(</mo> <mo>sin</mo><mi mathvariant="normal">φ</mi><mo>sin</mo
          ><mi mathvariant="normal">δ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>+</mo> <mo>cos</mo
          ><mi mathvariant="normal">φ</mi><mo>cos</mo><mi mathvariant="normal">δ</mi><mo>(</mo
          ><mi>t</mi><mo>)</mo> <mo>cos</mo><mi>H</mi><mo>(</mo><mi mathvariant="normal">λ</mi
          ><mo>,</mo><mi>t</mi><mo>)</mo><mo>)</mo>
        </mrow>
      </math>
    </div>
    <div class="equation">
      <math display="block" aria-label="Solar declination equation">
        <mrow
          ><mi mathvariant="normal">δ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>
          <mi mathvariant="normal">ε</mi><mo>sin</mo><mo>(</mo><mn>2</mn
          ><mi mathvariant="normal">π</mi> <mo>(</mo><mi>t</mi><mo>−</mo
          ><msub><mi>t</mi><mi>e</mi></msub
          ><mo>)</mo><mo>)</mo>
        </mrow>
      </math>
    </div>
    <div class="equation">
      <math display="block" aria-label="Solar hour angle equation">
        <mrow
          ><mi>H</mi><mo>(</mo><mi mathvariant="normal">λ</mi><mo>,</mo><mi>t</mi><mo>)</mo
          ><mo>=</mo><mn>2</mn><mi mathvariant="normal">π</mi><mo>·</mo><mn>{{ days }}</mn
          ><mo>·</mo><mi>t</mi> <mo>+</mo><mi mathvariant="normal">λ</mi><mo>+</mo
          ><msub><mi mathvariant="normal">θ</mi><mn>0</mn></msub>
        </mrow>
      </math>
    </div>
    <ParameterDiagrams
      :latitude="latitude"
      :longitude="longitude"
      :timestamp="timestamp"
      :elevation="elevation"
    />
    <SolarFunctionDiagrams :timestamp="timestamp" :longitude="longitude" />
  </section>
</template>

<style scoped>
.equation {
  overflow-x: auto;
}

.equation + .equation {
  margin-top: 1.5rem;
}
</style>
