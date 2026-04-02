/* ================================================================
   RENDER: Article
   ================================================================ */

function renderArticle(f, w, r, sh, lh, ph, sf) {
  const typo  = calcTypography(sh);
  const sizeMap = Object.fromEntries(typo.map(t => [t.name, t.size]));
  const sizes = {
    h1: sizeMap['heading.2XL'], h2: sizeMap['heading.XL'], h3: sizeMap['heading.L'], h4: sizeMap['heading.M'],
    body: sizeMap['interface.M'], 'body-lg': sizeMap['paragraph.M'],
  };
  const sp    = Object.fromEntries(calcSpacing(sf).map(s => [s.name, s.val]));
  const brand = COLORS.brand[0]?.hex || '#2563EB';

  const brandScale = generateOklchScale(brand);
  const calloutBg     = isDark ? brandScale[8].hex : brandScale[0].hex;
  const calloutBorder = isDark ? brandScale[4].hex : brandScale[5].hex;

  const accentHex    = COLORS.accent[0]?.hex || brand;
  const accentScale  = generateOklchScale(accentHex);
  const accentBg     = isDark ? accentScale[8].hex : accentScale[0].hex;
  const accentBorder = isDark ? accentScale[4].hex : accentScale[5].hex;
  const pGap        = Math.round(16 * ph) + 'px';  /* paragraph spacing */

  document.getElementById('article-content').innerHTML = `
    <h1 style="font-size:${sizes.h1}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;font-family:${f.heading}">The Principles of Systematic Design</h1>

    <p style="font-size:${sizes['body-lg']}px;line-height:${1.4*lh};margin-bottom:${sp.XL}px;font-family:${f.body};color:var(--color-contrast-secondary)">
      Design systems are more than component libraries. They are the codification of design decisions, a shared language between designers and developers, and the foundation upon which scalable products are built.
    </p>

    <img src="https://picsum.photos/seed/article1/800/400" style="margin-bottom:${sp.XS}px" loading="lazy">
    <p class="caption" style="margin-bottom:${sp['2XL']}px">A well-structured design system creates harmony across every touchpoint.</p>

    <h2 style="font-size:${sizes.h2}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;margin-top:${sp['3XL']}px;font-family:${f.heading}">Tokens: The Atomic Units of Design</h2>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      Design tokens are the smallest pieces of a design system. They store visual attributes like color, spacing, typography, and elevation as named values. Unlike hardcoded values scattered across codebases, tokens provide a single source of truth that can be updated globally.
    </p>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      When a brand color changes, updating a single token propagates the change everywhere it is used. This is the power of abstraction applied to visual design. Tokens eliminate the need for search-and-replace operations and reduce the risk of inconsistency.
    </p>

    <div class="callout" style="margin:${sp['2XL']}px 0;border-radius:0 ${r.M}px ${r.M}px 0;background:${accentBg};border-color:${accentBorder};font-family:${f.body}">
      <strong style="display:block;margin-bottom:4px;color:var(--color-contrast-primary)">About Design Tokens</strong>
      <p style="font-size:${sizes.body}px;margin:0;color:var(--color-contrast-secondary);line-height:${1.4*lh}">Design tokens were first introduced by Salesforce in their Lightning Design System. Today, they are a core concept in every major design system, from Material Design to Carbon. The W3C Design Tokens Community Group is working on a standard format for token exchange.</p>
    </div>

    <h3 style="font-size:${sizes.h3}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;margin-top:${sp['2XL']}px;font-family:${f.heading}">The Three Tiers</h3>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      A robust token architecture typically consists of three tiers, each serving a distinct purpose in the design pipeline:
    </p>

    <ul style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      <li><strong style="color:var(--color-contrast-primary)">Core tokens</strong> define raw values: specific hex colors, pixel measurements, font stacks. They are the primitive layer.</li>
      <li><strong style="color:var(--color-contrast-primary)">Semantic tokens</strong> map core values to roles: <code>base-clear</code>, <code>contrast-primary</code>, <code>action-base</code>. They carry meaning, not values.</li>
      <li><strong style="color:var(--color-contrast-primary)">Component tokens</strong> reference semantic tokens for specific UI elements: <code>button-bg</code>, <code>card-radius</code>, <code>input-border</code>.</li>
    </ul>

    <table style="margin-bottom:${sp['2XL']}px">
      <thead>
        <tr><th>Category</th><th>Token Example</th><th>Light Value</th><th>Dark Value</th></tr>
      </thead>
      <tbody>
        <tr><td>Background</td><td><code>base-clear</code></td><td>${FOUNDATION.lightClear.hex}</td><td>${FOUNDATION.darkClear.hex}</td></tr>
        <tr><td>Background</td><td><code>base-cloudy</code></td><td>${FOUNDATION.lightCloudy.hex}</td><td>${FOUNDATION.darkCloudy.hex}</td></tr>
        <tr><td>Foreground</td><td><code>contrast-primary</code></td><td>${FOUNDATION.darkClear.hex}</td><td>${FOUNDATION.lightClear.hex}</td></tr>
        <tr><td>Foreground</td><td><code>contrast-secondary</code></td><td>rgba(20,20,18,0.62)</td><td>rgba(250,250,248,0.62)</td></tr>
        <tr><td>Brand</td><td><code>brand-primary</code></td><td>${brand}</td><td>${brand}</td></tr>
      </tbody>
    </table>

    <blockquote style="border-color:${brand};margin:${sp.XL}px 0;border-radius:0 ${r.M}px ${r.M}px 0;background:${calloutBg};font-family:${f.heading}">
      <p style="font-size:${sizes.body}px;margin:0;color:var(--color-contrast-primary);font-style:italic">"The best design systems feel invisible to the user but indispensable to the team. They reduce friction everywhere: in design, in development, and in decision-making."</p>
    </blockquote>

    <h2 style="font-size:${sizes.h2}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;margin-top:${sp['3XL']}px;font-family:${f.heading}">Parametric Design: Flexibility with Guardrails</h2>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      Parametric design systems take tokens a step further by deriving values from a small set of input parameters. Instead of manually choosing every spacing value, a single <code>space_factor</code> generates an entire scale. Change the factor, and the entire spacing system recalculates while maintaining its internal proportions.
    </p>

    <div class="two-col" style="margin-bottom:${sp.XL}px;margin-top:${sp.L}px">
      <div>
        <h3 style="font-size:${sizes.h4}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.M}px;font-family:${f.heading}">Input Parameters</h3>
        <p style="font-size:${sizes.body}px;line-height:${1.4*lh};font-family:${f.body};color:var(--color-contrast-primary);margin-bottom:${sp.M}px">
          A small number of high-level parameters control the entire design character. Roundness shapes borders, scale hierarchy drives typography, and space factor determines density.
        </p>
        <p style="font-size:${sizes.body}px;line-height:${1.4*lh};font-family:${f.body};color:var(--color-contrast-primary)">
          Each parameter is bounded within a safe range and processed through snap functions that guarantee pixel-perfect alignment on consistent grids.
        </p>
      </div>
      <div>
        <h3 style="font-size:${sizes.h4}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.M}px;font-family:${f.heading}">Output Tokens</h3>
        <p style="font-size:${sizes.body}px;line-height:${1.4*lh};font-family:${f.body};color:var(--color-contrast-primary);margin-bottom:${sp.M}px">
          From these parameters, the system generates complete token sets: spacing scales, type scales, radius values, sizing values, and color scales.
        </p>
        <p style="font-size:${sizes.body}px;line-height:${1.4*lh};font-family:${f.body};color:var(--color-contrast-primary)">
          Monotonic enforcement ensures that adjacent tokens never collapse to the same value, even at extreme parameter settings. The result is always a usable, distinct scale.
        </p>
      </div>
    </div>

    <img src="https://picsum.photos/seed/article2/800/350" style="margin-bottom:${sp.XS}px" loading="lazy">
    <p class="caption" style="margin-bottom:${sp['2XL']}px">Parameters control the character of the design while maintaining mathematical relationships.</p>

    <h3 style="font-size:${sizes.h3}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;margin-top:${sp['2XL']}px;font-family:${f.heading}">Snap Functions</h3>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      Raw computed values rarely land on clean numbers. Snap functions round values to specific grids, ensuring that spacing stays on a 4px grid and font sizes on a 2px grid. Additionally, monotonic enforcement guarantees that adjacent tokens never collapse to the same value.
    </p>

    <pre style="margin-bottom:${sp.L}px;border-radius:${r.M}px"><code>snap_4(x)  = max(4, round(x / 4) * 4)
snap_2(x)  = max(10, round(x / 2) * 2)
snap_to(scale, x) = scale[argmin(|scale[i] - x|)]

// Example: space_factor = 1.2
// Raw: 4 * 1.2 * 3 = 14.4
// After snap_4: 16px (clean grid alignment)</code></pre>

    <hr style="margin:${sp['3XL']}px 0">

    <h2 style="font-size:${sizes.h2}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;font-family:${f.heading}">Color in OKLCH Space</h2>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      Traditional color spaces like HSL produce uneven perceptual results. A 50% lightness in HSL looks dramatically different between a yellow and a blue. OKLCH solves this by operating in a perceptually uniform space where equal numeric differences correspond to equal visual differences.
    </p>

    <ol style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      <li><strong style="color:var(--color-contrast-primary)">L (Lightness)</strong> ranges from 0 (black) to 1 (white), perceptually uniform.</li>
      <li><strong style="color:var(--color-contrast-primary)">C (Chroma)</strong> represents color saturation, from 0 (gray) to the gamut boundary.</li>
      <li><strong style="color:var(--color-contrast-primary)">H (Hue)</strong> is the angular position on the color wheel, 0 to 360 degrees.</li>
    </ol>

    <div class="callout" style="margin:${sp['2XL']}px 0;border-radius:0 ${r.M}px ${r.M}px 0;background:${calloutBg};border-color:${calloutBorder};font-family:${f.body}">
      <strong style="display:block;margin-bottom:4px;color:var(--color-contrast-primary)">Key Insight</strong>
      <p style="font-size:${sizes.body}px;margin:0;color:var(--color-contrast-secondary);line-height:${1.4*lh}">By generating color scales in OKLCH space, we ensure that lightness steps from 50 to 950 are visually equidistant. This produces more natural-looking gradients and more predictable contrast ratios for accessibility compliance.</p>
    </div>

    <img src="https://picsum.photos/seed/article3/800/300" style="margin-bottom:${sp.XS}px" loading="lazy">
    <p class="caption" style="margin-bottom:${sp['2XL']}px">OKLCH produces perceptually uniform color scales across all hues.</p>

    <h2 style="font-size:${sizes.h2}px;line-height:${1.0*lh};font-weight:${w.heading};margin-bottom:${sp.L}px;margin-top:${sp['3XL']}px;font-family:${f.heading}">Conclusion</h2>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      A parametric design system is not just a collection of components. It is a mathematical model of your brand's visual language, capable of producing infinite variations while guaranteeing consistency, accessibility, and harmony. The parameters are the knobs; the tokens are the outputs. Together, they form the architecture of systematic design.
    </p>

    <p style="font-size:${sizes.body}px;line-height:${1.4*lh};margin-bottom:${pGap};font-family:${f.body};color:var(--color-contrast-primary)">
      As teams scale and products evolve, the system grows with them. New components inherit the existing token structure. New colors slot into the OKLCH pipeline. New spacing needs are met by the existing scale. The investment in a well-designed parametric foundation pays dividends at every stage of product development, from initial prototype to production at scale.
    </p>
  `;
}

