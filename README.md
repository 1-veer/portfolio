# Ayoub Bougatia — Portfolio

A plain HTML, CSS, and vanilla JavaScript portfolio. No build tools or runtime dependencies.

## Local preview

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

## Structure

- `index.html`: introduction, five projects, expertise, background, education, experience, and contact details.
- `styles.css`: continuous pure-black base, neutral typography, responsive layouts, native scrollbar styles, and the reveal mask.
- `script.js`: mobile navigation, accessible project filtering, mouse reveal, and footer year.
- `assets/reveal-grid.svg`: independently drawn repeating hexagonal grid. No reference-site code or image assets are included.
- `assets/Ayoub_Bougatia_CV.pdf`: the existing résumé.

## Background interaction

There is one fixed `.hidden-background` layer for the entire document. Only its soft circular mask moves; section backgrounds never cover it. The shaded hexagonal cells are completely hidden before interaction, after pointer exit, or outside the mask. `--spot-radius` scales from 130px to 230px, reaching about 210px at a 1440px desktop width. The center stays clearly illuminated and fades progressively toward the edge.

Pointer movement updates local CSS properties once per animation frame. The reveal now fades progressively throughout its radius rather than holding a flat bright center. Its central opacity is `.893`, a 5% reduction from the previous `.94`; the artwork and radius are unchanged.

A single transparent Canvas 2D overlay draws crisp white dots along timestamped pointer positions, including coalesced events where available. Spatial resampling preserves the actual trajectory with even spacing. The history and drawing buffers are fixed in size; no DOM particles are created during movement. The canvas scales to device pixel ratio, including density changes, and its bitmap is released when effects are disabled. The render loop stops after the history has faded.

The `trail` settings in `script.js` control the effect: up to 56 dots, a 380ms lifetime, up to 210px of recent path, fixed 4px spatial intervals, and sizes tapering from 7.5px to 1.6px. Both age and arc length limit the trail; fast sweeps stay short and dense. Idle history fades and the animation loop stops. The spotlight stays at the current pointer rather than following the trail. Native scrolling, clicks, selection, and the cursor remain intact.

The effect is disabled for touch/coarse input, reduced motion, and forced colors. Content is visible without JavaScript. Scrollbars use standards in Firefox and native pseudo-elements in Chromium/WebKit. Thirty-six candidate discoveries reuse eleven authentic Devicon v2.17.0 logos and the two restored C/C++ designs from one local SVG sprite, `assets/technology-logos.svg`. Devicon geometry is preserved; only fills are normalized to the existing purple treatment. C/C++ retain their earlier outline paths. Layout-aware placement requires at least 300px between centers on desktop (280px on smaller screens), prefers 420px on desktop, and omits candidates where no safe space exists. One of each technology and the footer discovery take priority over repeats. Sources, hashes, and attribution are recorded in `assets/technology-logos.md`, with the MIT notice in `assets/licenses/devicon-LICENSE.txt`.

Discoveries are anchored throughout the hero, project rows, skills, About, contact, and footer. On layout changes, a deterministic search moves preferred positions into nearby empty space, keeps icons apart, and reserves the sticky About heading's travel area. Filtered-out project icons hide with their rows; a symbol also hides if no safe placement exists in an unusually constrained viewport. Positioning never runs in the pointer or scroll handlers. The existing scroll transform and radial mask remain unchanged.

## Typography

The centered hero uses a locally hosted Barlow Condensed ExtraBold Italic font, paired with locally hosted Manrope for body text, navigation, metadata, and timeline entries. Barlow is also used for section and project headings; outline lettering is limited to the About heading. The SIL Open Font Licenses are included in `assets/fonts/OFL.txt` and `assets/fonts/Manrope-OFL.txt`. A localized radial glow sits behind the center of the deep-purple name. Name and project hover motion respect reduced-motion preferences. The single-letter A favicon is drawn as SVG paths, independent of installed fonts.

Chromium/WebKit scrollbars use rounded inset edges and a subtle two-tone thumb; Firefox uses its native thin scrollbar and solid purple color because its standard API does not support thumb gradients or independent hover styling.

## Content layouts

Project rows keep consistent identity, description, and metadata columns. The About section pairs a large sticky heading with a reading column and separate semantic experience and education timelines; it stacks on small screens. Skills and contact use shorter side-by-side compositions. All surfaces remain transparent over the existing reveal layer.

## Content

Team work is identified where applicable. Project descriptions focus on Ayoub's contributions without invented metrics. The OCP internship describes a feasibility and design study. Existing project, email, LinkedIn, and résumé links are retained. The project repository and deployed site responded successfully during this update; external availability can change. The contact GitHub link is explicitly a team project, since no personal GitHub URL was provided.

The hero adds a View Resume link that opens the existing PDF in a new tab, followed by accessible GitHub, LinkedIn, and email icons. The GitHub icon is explicitly labeled as the Trivia Trap team project; a personal GitHub profile URL still needs to be supplied.

The hero includes a concise 1337 supporting line, a wide purple résumé action with a trailing arrow, and 60px social buttons with 29px icons. All use the existing configured URLs.

The hero identifies Ayoub as a Software Engineering Student, with supporting text “1337 Coding School · C/C++ · Systems Programming”. Name hover lifts 4px and scales to 1.04 with a modest lighting increase; reduced motion removes the displacement. Social hover and keyboard-focus accents are off-white for GitHub, blue for LinkedIn, and purple for email.
