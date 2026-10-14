<script setup lang="ts">
import ParameterDiagrams from "./ParameterDiagrams.vue";

defineProps<{ latitude: number; timestamp: number; elevation: number }>();
</script>

<template>
  <section aria-label="Sun angle formula">
    <math
      display="block"
      aria-label="Elevation equals 180 over pi times arcsine of sin latitude sin declination plus cos latitude cos declination cos hour angle"
    >
      <mrow>
        <mi mathvariant="normal">α</mi><mo>(</mo><mi mathvariant="normal">φ</mi><mo>,</mo
        ><mi mathvariant="normal">t</mi><mo>)</mo><mo>=</mo
        ><mfrac
          ><mrow><mn>180</mn><mo>°</mo></mrow
          ><mi mathvariant="normal">π</mi></mfrac
        >
        <mo>arcsin</mo><mo>(</mo><mo>sin</mo><mi mathvariant="normal">φ</mi><mo>sin</mo
        ><mi mathvariant="normal">δ</mi> <mo>+</mo><mo>cos</mo><mi mathvariant="normal">φ</mi
        ><mo>cos</mo><mi mathvariant="normal">δ</mi><mo>cos</mo><mi mathvariant="normal">H</mi
        ><mo>)</mo>
      </mrow>
    </math>
    <p>
      φ: latitude. t: year position. δ: solar declination. H: solar hour angle. Trigonometric inputs
      use radians.
    </p>
    <p>
      t = (selected date/time − start of year) / (start of next year − start of year). Playback
      advances the selected date/time by v × elapsed time.
    </p>
    <ParameterDiagrams :latitude="latitude" :timestamp="timestamp" :elevation="elevation" />
  </section>
</template>
