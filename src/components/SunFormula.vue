<script setup lang="ts">
import ParameterDiagrams from "./ParameterDiagrams.vue";
import SolarFunctionDiagrams from "./SolarFunctionDiagrams.vue";

defineProps<{
  latitude: number;
  longitude: number;
  timestamp: number;
  elevation: number;
  speed: number;
}>();
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
          ><mi mathvariant="normal">δ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo> <mn>0.006918</mn
          ><mo>−</mo><mn>0.399912</mn><mo>cos</mo><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi
          ><mo>)</mo> <mo>+</mo><mn>0.070257</mn><mo>sin</mo><mi mathvariant="normal">γ</mi
          ><mo>(</mo><mi>t</mi><mo>)</mo> <mo>−</mo><mn>0.006758</mn><mo>cos</mo><mo>(</mo><mn>2</mn
          ><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>)</mo> <mo>+</mo
          ><mn>0.000907</mn><mo>sin</mo><mo>(</mo><mn>2</mn><mi mathvariant="normal">γ</mi><mo>(</mo
          ><mi>t</mi><mo>)</mo><mo>)</mo> <mo>−</mo><mn>0.002697</mn><mo>cos</mo><mo>(</mo><mn>3</mn
          ><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>)</mo> <mo>+</mo
          ><mn>0.001480</mn><mo>sin</mo><mo>(</mo><mn>3</mn><mi mathvariant="normal">γ</mi><mo>(</mo
          ><mi>t</mi><mo>)</mo><mo>)</mo>
        </mrow>
      </math>
    </div>
    <div class="equation">
      <math display="block" aria-label="Solar hour angle equation">
        <mrow
          ><mi>H</mi><mo>(</mo><mi mathvariant="normal">λ</mi><mo>,</mo><mi>t</mi><mo>)</mo
          ><mo>=</mo> <mfrac><mi mathvariant="normal">π</mi><mn>720</mn></mfrac
          ><mo>(</mo> <mo>(</mo><mi>m</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>+</mo><mi>E</mi
          ><mo>(</mo><mi>t</mi><mo>)</mo><mo>+</mo><mn>4</mn><mi mathvariant="normal">λ</mi
          ><mo>)</mo> <mo>mod</mo><mn>1440</mn><mo>−</mo><mn>720</mn><mo>)</mo>
        </mrow>
      </math>
    </div>
    <div class="equation">
      <math display="block" aria-label="Equation of time definition">
        <mrow
          ><mi>E</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mn>229.18</mn><mo>(</mo>
          <mn>0.000075</mn><mo>+</mo><mn>0.001868</mn><mo>cos</mo><mi mathvariant="normal">γ</mi
          ><mo>(</mo><mi>t</mi><mo>)</mo> <mo>−</mo><mn>0.032077</mn><mo>sin</mo
          ><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi><mo>)</mo> <mo>−</mo><mn>0.014615</mn
          ><mo>cos</mo><mo>(</mo><mn>2</mn><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi
          ><mo>)</mo><mo>)</mo> <mo>−</mo><mn>0.040849</mn><mo>sin</mo><mo>(</mo><mn>2</mn
          ><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>)</mo><mo>)</mo>
        </mrow>
      </math>
    </div>
    <div class="equation">
      <math display="block" aria-label="Year phase equation">
        <mrow
          ><mi mathvariant="normal">γ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>
          <mfrac
            ><mrow><mn>2</mn><mi mathvariant="normal">π</mi></mrow
            ><mi>D</mi></mfrac
          >
          <mo>(</mo><mi>u</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>−</mo
          ><mfrac><mn>1</mn><mn>2</mn></mfrac
          ><mo>)</mo>
        </mrow>
      </math>
    </div>
    <p>
      φ: latitude. λ: longitude in degrees east. t: year position. δ(t): solar declination. H(λ, t):
      solar hour angle. φ, δ, and H use radians in the formula.
    </p>
    <p>
      m(t): UTC minutes since midnight. E(t): the
      <a href="https://en.wikipedia.org/wiki/Equation_of_time">equation of time</a> in minutes.
    </p>
    <p>
      u(t): days since January 1 at 00:00 UTC. D: 365 or 366 days in that UTC year. γ(t): year phase
      in radians.
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
    <SolarFunctionDiagrams :timestamp="timestamp" :longitude="longitude" :speed="speed" />
  </section>
</template>

<style scoped>
.equation {
  overflow-x: auto;
}
</style>
