# FELIKS — Staging

Preview: https://marekfeliks.github.io/marek-staging/

A public **development preview** of the personal cinematic documentary. The staging banner and `noindex` setting are deliberate; neither constitutes access control.

## Current prototype

- 18 English-language chapters covering Poland, recruitment at Nice/Aubagne, initial training (2nd CEV), service at 2REI, overseas missions, two further periods at 4RE's 4th Company/CIC, promotion to sergent-chef during CCL, deputy section leadership at 4RE, and civilian IT/telecom work.
- Film-style chapter navigation, keyboard controls, autoplay, shareable chapter links and chapter index.
- **Journey atlas:** a self-contained interactive SVG world map with geographic country-level markers, a European detail view, a chronological replay, and clickable milestones linked to story chapters. Illustrated route lines are **not actual travel trajectories**. No maps API, CDN, cookies, or third-party tracking.
- Entirely vector/graphics based: no personal photographs or portraits.
- Professional epilogue linking to LinkedIn and mailto:marek@feliks.fr.
- Reduced-motion styles and mobile responsive layout.

## Editing and release

`js/story.js`: chapter narrative and `waypoints` linked to the geographic atlas.

`js/journey.js`: geographic reference points, animation, and chapter linking.

`js/land.js`: simplified land outlines derived from Natural Earth public-domain geographic data: https://www.naturalearthdata.com/about/ .

`js/art.js`: original chapter illustrations.

`css/style.css`: responsive design and reduced-motion behavior.

`index.html`: staging banner / noindex (retain **only** in staging).

Review in staging before copying to the separate `marekfeliks/marek-documentary` production repository at https://marek.feliks.fr/ . Preserve the production `CNAME`, its canonical URL, and public indexing settings. Do not deploy staging banner or noindex to production.

## Privacy and editorial review

No personal images. No actual military operational locations. Place markers inside mission countries are representative rather than precise deployment points. Exact deployment dates remain unspecified unless confirmed. Military abbreviations and unit names should be checked against the author's records before final publication.
