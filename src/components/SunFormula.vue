<template>
  <section aria-labelledby="formula-heading">
    <h2 id="formula-heading">Sun angle</h2>
    <math
      display="block"
      aria-label="Elevation equals 180 over pi times arcsine of sin latitude sin declination plus cos latitude cos declination cos hour angle"
    >
      <mrow>
        <mi mathvariant="normal">α</mi><mo>=</mo
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
      φ is latitude, δ is solar declination, and H is solar hour angle. Trigonometric inputs use
      radians.
    </p>
    <p>
      Positive angles are above the horizon. Negative angles are below it. The observer is at sea
      level.
    </p>
    <details>
      <summary>Full formula and daily limits</summary>
      <pre>
γ = 2π(u − 0.5) / D
δ = 0.006918 − 0.399912 cos γ + 0.070257 sin γ
    − 0.006758 cos 2γ + 0.000907 sin 2γ
    − 0.002697 cos 3γ + 0.001480 sin 3γ
E = 229.18(0.000075 + 0.001868 cos γ − 0.032077 sin γ
    − 0.014615 cos 2γ − 0.040849 sin 2γ)
T = (UTC minutes + E + 4λ) mod 1440
H = (T / 4 − 180)π / 180
Daily maximum = 90° − |latitude − declination|
Daily minimum = |latitude + declination| − 90°</pre>
      <p>
        u is days since January 1 at 00:00 UTC; D is 365 or 366. E is the equation of time in
        minutes. λ is longitude in degrees east. The daily-limit formulas use degrees.
      </p>
    </details>
    <p>
      Approximate geometric angles, without atmospheric refraction.
      <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF">NOAA formula</a>.
    </p>
  </section>
</template>
