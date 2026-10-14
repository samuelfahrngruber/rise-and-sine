<script setup lang="ts">
import ParameterDiagrams from "./ParameterDiagrams.vue";

defineProps<{ latitude: number; longitude: number; timestamp: number; elevation: number }>();
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
          ><mi>t</mi><mo>)</mo> <mo>cos</mo><mo>(</mo
          ><mfrac><mi mathvariant="normal">π</mi><mn>720</mn></mfrac> <mo>(</mo><mi>m</mi><mo>(</mo
          ><mi>t</mi><mo>)</mo><mo>+</mo><mi>E</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>+</mo><mn>4</mn
          ><mi mathvariant="normal">λ</mi><mo>−</mo><mn>720</mn><mo>)</mo><mo>)</mo><mo>)</mo>
        </mrow>
      </math>
    </div>
    <p>
      φ: latitude. λ: longitude in degrees east. t: year position. δ(t): solar declination. φ and δ
      use radians in the formula.
    </p>
    <p>
      m(t): UTC minutes since midnight. E(t): the
      <a href="https://en.wikipedia.org/wiki/Equation_of_time">equation of time</a> in minutes.
    </p>
    <p>
      t = (selected date/time − start of year) / (start of next year − start of year). Playback
      advances the selected date/time by v × elapsed time.
    </p>
    <ParameterDiagrams
      :latitude="latitude"
      :longitude="longitude"
      :timestamp="timestamp"
      :elevation="elevation"
    />
  </section>
</template>

<style scoped>
.equation {
  overflow-x: auto;
}
</style>
