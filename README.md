# Heritage GIS India

An interactive, GitHub Pages-ready map viewer for the user-supplied India-wide heritage monument inventory, earthquake catalogue, fault endpoint dataset and building records.

## Features
- Search monuments by name and filter by state.
- Toggle heritage monuments, earthquake epicentres, earthquake density context, supplied fault segments and building records.
- Switch basemaps between OpenStreetMap, satellite imagery and terrain.
- Popups show source attributes and proximity indicators.

## Deploy with GitHub Pages
1. Create a public GitHub repository named `Heritage-GIS-India`.
2. Upload the complete contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for the Pages deployment. The site will be available at:
   `https://YOUR-GITHUB-USERNAME.github.io/Heritage-GIS-India/`

No build step is required. This is a static HTML/CSS/JavaScript site.

## Data and map layers
- `data/heritage_monuments.geojson`: monument point layer.
- `data/earthquake_events.geojson`: earthquake event point layer.
- `data/fault_segments.geojson`: fault segments reconstructed from supplied endpoints.
- `data/building_attributes.geojson`: 41 building records and nearest-monument candidates.
- `data/fault_sites.geojson`: site/fault/seismicity points.
- `data/summary.json`: QA summary metrics.

The basemap is provided by OpenStreetMap; optional satellite and terrain basemaps use Esri and OpenTopoMap services. These are external tile services and require internet access. Respect their attribution and usage policies.

## Important research limitations
1. The earthquake density layer is generated from the uploaded earthquake catalogue. It is not an official Indian seismic zonation map.
2. The map uses an India bounding rectangle (68–98°E, 6–38°N) for display filtering, not an authoritative national boundary polygon.
3. Earthquake epicentre proximity and density are not site-specific ground-motion estimates or a probabilistic seismic hazard analysis.
4. Fault lines are approximate straight segments between supplied endpoints, not verified fault traces.
5. Building-to-monument nearest-neighbour relationships are candidate links only, not confirmed identities.
6. The viewer is a reconnaissance/GIS research aid, not a structural safety certification or vulnerability assessment.
7. Verify source metadata, coordinate datum, licensing and positional accuracy before publication.

## Citation and attribution
The heritage, earthquake, building and fault data in `data/` were derived from files supplied for this project. Preserve original source citations and licensing statements when known. Map tile attribution is shown in the map controls.

## Local preview
Open `index.html` through a local web server (for example, `python -m http.server 8000`) rather than directly as a file, because browsers restrict local GeoJSON fetch requests.

## Official Indian seismicity reference
The application includes a link to the National Centre for Seismology (NCS) interactive portal for official seismic zoning and intensity-map context:
https://riseq.seismo.gov.in/riseq/interactive/index/SHhRcEJKMVNQZko2VzdHZGYxbm1SUT09/Reviewed

The app's in-map earthquake heat layer is computed from the supplied earthquake catalogue. It is intentionally kept distinct from the NCS seismic zoning map. Do not treat historical epicentre density as a substitute for seismic zonation, site-specific hazard, or a code-prescribed design spectrum.
