// ============================================================================
// HOME FRONT — Command Center (PC Browser-udgave koblet på Supabase)
// ============================================================================

const SUPABASE_URL = "https://gtajdqbqbcqqgooaqahe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vH5S1tfDep32Umb_Ofy5_A_vlq0pmH1";
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const GAME_CONFIG = {
    TILE_SIZE_M: 30.0,
    REF_LAT_DEG: 56.0,
    SOLDIER_SECONDS_PER_TILE: 18,
    INSTANT_SOLDIER_STEPS: 50,
    BUILDING_DEFENSE_PER_LEVEL: 2,
    BUILDINGS: {
        barracks: {
            id: "barracks",
            name: "Barrakken",
            shortName: "barrak",
            desc: "Giver sengepladser til dine soldater: 100 på trin 1 og op til 1.000 på trin 5.",
            stages: ["Bivuak", "Teltlejr", "Barrak", "Kaserne", "Hovedkaserne"],
            sprites: ["barrak_1", "barrak_2", "barrak_3", "barrak_4", "barrak_5"],
            prices: [500, 600, 700, 800, 900],
            housing: [100, 250, 450, 700, 1000]
        },
        academy: {
            id: "academy",
            name: "Militærskolen",
            shortName: "militærskole",
            desc: "Uddanner nye soldater over tid — og lader dig straks-uddanne soldater for skridt.",
            stages: ["Skydebane", "Træningslejr", "Rekrutskole", "Militærakademi", "Krigsskole"],
            sprites: ["skole_1", "skole_2", "skole_3", "skole_4", "skole_5"],
            prices: [600, 1200, 2500, 5000, 10000],
            production: {
                material: "soldiers",
                per_hour: [1, 2, 4, 7, 12],
                capacity: [5, 10, 20, 35, 60]
            }
        }
    }
};

// ============================================================================
// Grid-matematik (100% identisk med Grid.kt i Android-appen)
// ============================================================================
const METRES_PER_LAT_DEG = 111320.0;
const Grid = {
    tileSizeM: GAME_CONFIG.TILE_SIZE_M,
    referenceLatDeg: GAME_CONFIG.REF_LAT_DEG,
    metresPerLonDeg() {
        return METRES_PER_LAT_DEG * Math.cos((this.referenceLatDeg * Math.PI) / 180.0);
    },
    tileLatDeg() {
        return this.tileSizeM / METRES_PER_LAT_DEG;
    },
    tileLonDeg() {
        return this.tileSizeM / this.metresPerLonDeg();
    },
    tileAt(latDeg, lonDeg) {
        return {
            x: Math.floor(lonDeg / this.tileLonDeg()),
            y: Math.floor(latDeg / this.tileLatDeg())
        };
    },
    centreOf(tile) {
        const dLat = this.tileLatDeg();
        const dLon = this.tileLonDeg();
        return [(tile.y + 0.5) * dLat, (tile.x + 0.5) * dLon];
    },
    cornersOf(tile) {
        const dLat = this.tileLatDeg();
        const dLon = this.tileLonDeg();
        const s = tile.y * dLat;
        const n = (tile.y + 1) * dLat;
        const w = tile.x * dLon;
        const e = (tile.x + 1) * dLon;
        return [
            [w, s],
            [e, s],
            [e, n],
            [w, n],
            [w, s]
        ];
    },
    distanceM(lat1, lon1, lat2, lon2) {
        const R = 6371000.0;
        const p1 = (lat1 * Math.PI) / 180.0;
        const p2 = (lat2 * Math.PI) / 180.0;
        const dp = ((lat2 - lat1) * Math.PI) / 180.0;
        const dl = ((lon2 - lon1) * Math.PI) / 180.0;
        const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    key(tile) {
        return `${tile.x},${tile.y}`;
    }
};

// ============================================================================
// Spil-tilstand
// ============================================================================
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    user: null,
    balance: 0,
    steel: 0,
    soldiers: 0,
    myBuildings: [],       // Alle spillerens egne bygninger
    visibleTiles: [],      // { x, y, owner_id }
    visibleBuildings: [],  // { x, y, owner_id, kind, level, emptied_at }
    selectedTile: null,    // { x, y }
    pendingMarchOrder: null, // { fromTile, count, fromGarrison, redirectMarchId }
    marches: [],           // Gemmes i localStorage + synkroniseres
    garrisons: [],
    hasCenteredOnce: false
};

let map = null;
let mapReady = false;
const registeredTroopBadges = new Set();

// ============================================================================
// LocalStorage til Tropper (March & Vagtstyrker)
// ============================================================================
function loadLocalTroops() {
    try {
        state.marches = JSON.parse(localStorage.getItem("hf_marches") || "[]");
        state.garrisons = JSON.parse(localStorage.getItem("hf_garrisons") || "[]");
    } catch (_) {
        state.marches = [];
        state.garrisons = [];
    }
}

function saveLocalTroops() {
    localStorage.setItem("hf_marches", JSON.stringify(state.marches.filter(m => m.count > 0)));
    localStorage.setItem("hf_garrisons", JSON.stringify(state.garrisons.filter(g => g.count > 0)));
}

function deployedSoldierCount() {
    if (!state.user) return 0;
    const uid = state.user.id;
    const onMarch = state.marches.filter(m => m.owner_id === uid).reduce((s, m) => s + m.count, 0);
    const onGuard = state.garrisons.filter(g => g.owner_id === uid).reduce((s, g) => s + g.count, 0);
    return onMarch + onGuard;
}

function availableInBarracks() {
    return Math.max(0, state.soldiers - deployedSoldierCount());
}

function totalSoldierCapacity() {
    return state.myBuildings.reduce((sum, b) => {
        const cfg = GAME_CONFIG.BUILDINGS[b.kind];
        if (!cfg || !cfg.housing) return sum;
        const h = cfg.housing[b.level - 1] || 0;
        return sum + h;
    }, 0);
}

// ============================================================================
// Kort & Pixel-Art Landskab (MapLibre GL JS)
// ============================================================================
function initMap() {
    map = new maplibregl.Map({
        container: "map",
        style: STYLE_URL,
        center: [12.43, 55.65], // Brøndby / Storkøbenhavn som udgangspunkt
        zoom: 16.2,
        pitchWithRotate: false,
        dragRotate: false
    });

    map.on("load", async () => {
        await installPixelLandscape();
        installGameLayers();
        mapReady = true;
        refreshViewportData();
        renderTroopsOnMap();
    });

    map.on("moveend", () => {
        if (mapReady) refreshViewportData();
    });

    map.on("click", (e) => {
        const tile = Grid.tileAt(e.lngLat.lat, e.lngLat.lng);
        onMapTileClicked(tile);
    });
}

function loadPixelTexture(url, scale = 2) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve({ width: canvas.width, height: canvas.height, data: imageData.data });
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

async function installPixelLandscape() {
    const texList = [
        ["img-ground", "assets/land_jord.png", 2],
        ["img-town", "assets/land_by.png", 2],
        ["img-farm-0", "assets/land_mark_1.png", 2],
        ["img-farm-1", "assets/land_mark_2.png", 2],
        ["img-farm-2", "assets/land_mark_3.png", 2],
        ["img-farm-3", "assets/land_mark_4.png", 2],
        ["img-grass", "assets/land_graes.png", 2],
        ["img-wood", "assets/land_skov.png", 2],
        ["img-sand", "assets/land_sand.png", 2],
        ["img-water", "assets/land_vand.png", 2],
        ["img-b-barrak_1", "assets/barrak_1.png", 4],
        ["img-b-barrak_2", "assets/barrak_2.png", 4],
        ["img-b-barrak_3", "assets/barrak_3.png", 4],
        ["img-b-barrak_4", "assets/barrak_4.png", 4],
        ["img-b-barrak_5", "assets/barrak_5.png", 4],
        ["img-b-skole_1", "assets/skole_1.png", 4],
        ["img-b-skole_2", "assets/skole_2.png", 4],
        ["img-b-skole_3", "assets/skole_3.png", 4],
        ["img-b-skole_4", "assets/skole_4.png", 4],
        ["img-b-skole_5", "assets/skole_5.png", 4]
    ];

    for (const [id, url, scale] of texList) {
        const tex = await loadPixelTexture(url, scale);
        if (tex && !map.hasImage(id)) {
            map.addImage(id, tex);
        }
    }

    if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-pattern", "img-ground");
    }
    if (map.getLayer("building")) {
        map.setPaintProperty("building", "fill-color", "#A35A43");
        map.setPaintProperty("building", "fill-outline-color", "#5C2E22");
        map.setPaintProperty("building", "fill-opacity", 0.9);
    }

    const beforeLayer = map.getLayer("waterway") ? "waterway" : undefined;
    const surfaces = [
        { id: "land-town", sourceLayer: "landuse", filter: ["==", ["get", "class"], "residential"], pattern: "img-town" },
        { id: "land-farm", sourceLayer: "landcover", filter: ["==", ["get", "class"], "farmland"], pattern: "img-farm-0" },
        { id: "land-park", sourceLayer: "park", filter: null, pattern: "img-grass" },
        { id: "land-grass", sourceLayer: "landcover", filter: ["==", ["get", "class"], "grass"], pattern: "img-grass" },
        { id: "land-wood", sourceLayer: "landcover", filter: ["==", ["get", "class"], "wood"], pattern: "img-wood" },
        { id: "land-sand", sourceLayer: "landcover", filter: ["==", ["get", "class"], "sand"], pattern: "img-sand" },
        { id: "land-water", sourceLayer: "water", filter: ["!=", ["get", "brunnel"], "tunnel"], pattern: "img-water" }
    ];

    for (const s of surfaces) {
        if (!map.getLayer(s.id)) {
            const lyr = {
                id: s.id,
                type: "fill",
                source: "openmaptiles",
                "source-layer": s.sourceLayer,
                paint: { "fill-pattern": s.pattern }
            };
            if (s.filter) lyr.filter = s.filter;
            map.addLayer(lyr, beforeLayer);
        }
    }
}

function installGameLayers() {
    const empty = { type: "FeatureCollection", features: [] };

    map.addSource("src-mine", { type: "geojson", data: empty });
    map.addSource("src-others", { type: "geojson", data: empty });
    map.addSource("src-grid", { type: "geojson", data: empty });
    map.addSource("src-selected", { type: "geojson", data: empty });
    map.addSource("src-buildings", { type: "geojson", data: empty });
    map.addSource("src-march-lines", { type: "geojson", data: empty });
    map.addSource("src-troops", { type: "geojson", data: empty });

    map.addLayer({
        id: "lyr-mine-fill",
        type: "fill",
        source: "src-mine",
        paint: { "fill-color": "#39FF14", "fill-opacity": 0.20 }
    });
    map.addLayer({
        id: "lyr-others-fill",
        type: "fill",
        source: "src-others",
        paint: { "fill-color": "#FF2E88", "fill-opacity": 0.20 }
    });
    map.addLayer({
        id: "lyr-grid",
        type: "line",
        source: "src-grid",
        paint: { "line-color": "#37474F", "line-width": 0.8, "line-opacity": 0.55 }
    });
    map.addLayer({
        id: "lyr-mine-edge",
        type: "line",
        source: "src-mine",
        paint: { "line-color": "#39FF14", "line-width": 2.5 }
    });
    map.addLayer({
        id: "lyr-others-edge",
        type: "line",
        source: "src-others",
        paint: { "line-color": "#FF2E88", "line-width": 2.5 }
    });
    map.addLayer({
        id: "lyr-selected",
        type: "line",
        source: "src-selected",
        paint: { "line-color": "#FFD54F", "line-width": 3.5 }
    });
    map.addLayer({
        id: "lyr-buildings",
        type: "symbol",
        source: "src-buildings",
        layout: {
            "icon-image": ["concat", "img-b-", ["get", "sprite"]],
            "icon-size": [
                "interpolate", ["exponential", 2], ["zoom"],
                14, 0.22,
                16, 0.45,
                18, 1.15,
                20, 2.4
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
    });
    map.addLayer({
        id: "lyr-march-lines",
        type: "line",
        source: "src-march-lines",
        paint: {
            "line-color": "#39FF14",
            "line-width": 3,
            "line-dasharray": [2, 2],
            "line-opacity": 0.9
        }
    });
    map.addLayer({
        id: "lyr-troops",
        type: "symbol",
        source: "src-troops",
        layout: {
            "icon-image": ["concat", "img-troop-", ["get", "count"]],
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
    });
}

// ============================================================================
// Kort-opdatering (Grid, Ejede felter, Bygninger og Tropper)
// ============================================================================
function getViewportTileBounds() {
    if (!map || map.getZoom() < 14.0) return null;
    const b = map.getBounds();
    const sw = Grid.tileAt(b.getSouth(), b.getWest());
    const ne = Grid.tileAt(b.getNorth(), b.getEast());
    const count = (ne.x - sw.x + 1) * (ne.y - sw.y + 1);
    if (count > 4500) return null;
    return { x0: sw.x, x1: ne.x, y0: sw.y, y1: ne.y };
}

function redrawGridLines(bounds) {
    if (!mapReady) return;
    const src = map.getSource("src-grid");
    if (!src) return;
    if (!bounds) {
        src.setData({ type: "FeatureCollection", features: [] });
        return;
    }
    const dLat = Grid.tileLatDeg();
    const dLon = Grid.tileLonDeg();
    const south = bounds.y0 * dLat;
    const north = (bounds.y1 + 1) * dLat;
    const west = bounds.x0 * dLon;
    const east = (bounds.x1 + 1) * dLon;

    const coords = [];
    for (let x = bounds.x0; x <= bounds.x1 + 1; x++) {
        const lon = x * dLon;
        coords.push([[lon, south], [lon, north]]);
    }
    for (let y = bounds.y0; y <= bounds.y1 + 1; y++) {
        const lat = y * dLat;
        coords.push([[west, lat], [east, lat]]);
    }
    src.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: coords } }]
    });
}

function tilesToGeoJson(tiles) {
    return {
        type: "FeatureCollection",
        features: tiles.map(t => ({
            type: "Feature",
            properties: { x: t.x, y: t.y },
            geometry: { type: "Polygon", coordinates: [Grid.cornersOf(t)] }
        }))
    };
}

async function refreshViewportData() {
    if (!mapReady || !state.user) return;
    const bounds = getViewportTileBounds();
    redrawGridLines(bounds);

    // Hvis vi er zoomet langt ud, viser vi stadig vores egne bygninger og tropper!
    const queryBounds = bounds || { x0: -9999999, x1: 9999999, y0: -9999999, y1: 9999999 };

    const [tilesRes, bldRes] = await Promise.all([
        sb.from("tiles")
            .select("x,y,owner_id")
            .gte("x", queryBounds.x0).lte("x", queryBounds.x1)
            .gte("y", queryBounds.y0).lte("y", queryBounds.y1),
        sb.from("buildings")
            .select("x,y,owner_id,kind,level,emptied_at")
            .gte("x", queryBounds.x0).lte("x", queryBounds.x1)
            .gte("y", queryBounds.y0).lte("y", queryBounds.y1)
    ]);

    if (tilesRes.data) {
        state.visibleTiles = tilesRes.data;
        const uid = state.user.id;
        const mine = tilesRes.data.filter(t => t.owner_id === uid);
        const others = tilesRes.data.filter(t => t.owner_id !== uid);
        map.getSource("src-mine")?.setData(tilesToGeoJson(mine));
        map.getSource("src-others")?.setData(tilesToGeoJson(others));
    }

    if (bldRes.data) {
        state.visibleBuildings = bldRes.data;
        const features = bldRes.data.map(b => {
            const cfg = GAME_CONFIG.BUILDINGS[b.kind];
            const sprite = cfg ? cfg.sprites[Math.min(b.level - 1, cfg.sprites.length - 1)] : "barrak_1";
            const [lat, lon] = Grid.centreOf(b);
            return {
                type: "Feature",
                properties: { sprite },
                geometry: { type: "Point", coordinates: [lon, lat] }
            };
        });
        map.getSource("src-buildings")?.setData({ type: "FeatureCollection", features });
    }

    if (state.selectedTile) {
        renderSelectedTileBox();
    }
}

// ============================================================================
// Troppe-ikoner & Kyst-Pathfinding (A* uden om vand)
// ============================================================================
let baseSoldierImg = null;
const soldierImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { baseSoldierImg = img; resolve(img); };
    img.src = "assets/tropper.png";
});

async function ensureTroopBadge(count) {
    if (!mapReady || registeredTroopBadges.has(count)) return;
    registeredTroopBadges.add(count);
    await soldierImgPromise;
    if (!baseSoldierImg) return;

    const scale = 3;
    const sw = baseSoldierImg.width * scale;
    const sh = baseSoldierImg.height * scale;
    const text = String(count);

    const canvas = document.createElement("canvas");
    const badgeW = Math.max(34, text.length * 10 + 16);
    const badgeH = 22;
    canvas.width = Math.max(sw, badgeW) + 8;
    canvas.height = sh + badgeH + 6;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const bx = (canvas.width - badgeW) / 2;
    ctx.fillStyle = "rgba(17, 22, 28, 0.92)";
    ctx.strokeStyle = "#39FF14";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, 2, badgeW, badgeH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, 2 + badgeH / 2);

    const sx = (canvas.width - sw) / 2;
    ctx.drawImage(baseSoldierImg, sx, badgeH + 4, sw, sh);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imgId = `img-troop-${count}`;
    if (!map.hasImage(imgId)) {
        map.addImage(imgId, { width: canvas.width, height: canvas.height, data: imageData.data });
    }
}

function isWaterAt(lat, lon) {
    if (!mapReady || !map.getLayer("land-water")) return false;
    const pt = map.project([lon, lat]);
    const feats = map.queryRenderedFeatures(pt, { layers: ["land-water"] });
    return feats && feats.length > 0;
}

function terrainAtTile(tile) {
    if (!mapReady) return { id: "ground", name: "Åbent land" };
    const [lat, lon] = Grid.centreOf(tile);
    const pt = map.project([lon, lat]);
    const order = [
        ["land-water", "water", "Vand (kræver båd/bro)"],
        ["land-sand", "sand", "Strand"],
        ["land-wood", "wood", "Skov"],
        ["land-grass", "grass", "Græs"],
        ["land-park", "park", "Park"],
        ["land-farm", "farm", "Mark"],
        ["land-town", "town", "By"]
    ];
    for (const [lyr, id, name] of order) {
        if (map.getLayer(lyr)) {
            const f = map.queryRenderedFeatures(pt, { layers: [lyr] });
            if (f && f.length > 0) return { id, name };
        }
    }
    return { id: "ground", name: "Åbent land" };
}

function segmentCrossesWater(lat1, lon1, lat2, lon2, samples = 24) {
    for (let s = 1; s < samples; s++) {
        const t = s / samples;
        if (isWaterAt(lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t)) return true;
    }
    return false;
}

function findLandPath(startLat, startLon, targetTile) {
    const [endLat, endLon] = Grid.centreOf(targetTile);
    const direct = [[startLat, startLon], [endLat, endLon]];
    if (!mapReady || !segmentCrossesWater(startLat, startLon, endLat, endLon, 26)) {
        return direct;
    }

    const spanLat = Math.max(Math.abs(endLat - startLat), 0.004);
    const spanLon = Math.max(Math.abs(endLon - startLon), 0.006);
    const minLat = Math.min(startLat, endLat) - spanLat * 0.45;
    const maxLat = Math.max(startLat, endLat) + spanLat * 0.45;
    const minLon = Math.min(startLon, endLon) - spanLon * 0.45;
    const maxLon = Math.max(startLon, endLon) + spanLon * 0.45;

    const rows = 40, cols = 40;
    const stepLat = (maxLat - minLat) / (rows - 1);
    const stepLon = (maxLon - minLon) / (cols - 1);

    const toCell = (lat, lon) => [
        Math.max(0, Math.min(rows - 1, Math.round((lat - minLat) / stepLat))),
        Math.max(0, Math.min(cols - 1, Math.round((lon - minLon) / stepLon)))
    ];
    const cellLat = r => minLat + r * stepLat;
    const cellLon = c => minLon + c * stepLon;

    const [sr, sc] = toCell(startLat, startLon);
    const [er, ec] = toCell(endLat, endLon);
    const startIdx = sr * cols + sc;
    const goalIdx = er * cols + ec;

    const cache = new Int8Array(rows * cols);
    const walkable = (r, c) => {
        if ((r === sr && c === sc) || (r === er && c === ec)) return true;
        const idx = r * cols + c;
        if (cache[idx] !== 0) return cache[idx] === 1;
        const w = isWaterAt(cellLat(r), cellLon(c));
        cache[idx] = w ? 2 : 1;
        return !w;
    };

    const gScore = new Float32Array(rows * cols).fill(Infinity);
    const cameFrom = new Int32Array(rows * cols).fill(-1);
    const closed = new Uint8Array(rows * cols);
    gScore[startIdx] = 0;

    const open = [{ idx: startIdx, f: Math.hypot(er - sr, ec - sc) }];
    const dr = [-1, 1, 0, 0, -1, -1, 1, 1];
    const dc = [0, 0, -1, 1, -1, 1, -1, 1];
    const cost = [1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414];

    let bestIdx = startIdx;
    let bestDist = Math.hypot(er - sr, ec - sc);

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const cur = open.shift();
        const u = cur.idx;
        if (u === goalIdx) break;
        if (closed[u]) continue;
        closed[u] = 1;

        const ur = Math.floor(u / cols), uc = u % cols;
        const dGoal = Math.hypot(er - ur, ec - uc);
        if (dGoal < bestDist) { bestDist = dGoal; bestIdx = u; }

        for (let d = 0; d < 8; d++) {
            const nr = ur + dr[d], nc = uc + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const v = nr * cols + nc;
            if (closed[v] || !walkable(nr, nc)) continue;
            if (d >= 4 && !walkable(ur + dr[d], uc) && !walkable(ur, uc + dc[d])) continue;

            const tg = gScore[u] + cost[d];
            if (tg < gScore[v]) {
                cameFrom[v] = u;
                gScore[v] = tg;
                open.push({ idx: v, f: tg + Math.hypot(er - nr, ec - nc) });
            }
        }
    }

    const endNode = cameFrom[goalIdx] !== -1 ? goalIdx : bestIdx;
    if (endNode === startIdx) return direct;

    const raw = [];
    let cur = endNode;
    while (cur !== -1 && cur !== startIdx) {
        raw.push([cellLat(Math.floor(cur / cols)), cellLon(cur % cols)]);
        cur = cameFrom[cur];
    }
    raw.reverse();
    const full = [[startLat, startLon], ...raw];
    if (endNode === goalIdx) full.push([endLat, endLon]);

    // Glat ruten langs stranden
    const smoothed = [full[0]];
    let i = 0;
    while (i < full.length - 1) {
        let next = i + 1;
        for (let j = full.length - 1; j >= i + 2; j--) {
            if (!segmentCrossesWater(full[i][0], full[i][1], full[j][0], full[j][1], 14)) {
                next = j;
                break;
            }
        }
        smoothed.push(full[next]);
        i = next;
    }
    return smoothed;
}

function pathDistanceM(path) {
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) {
        sum += Grid.distanceM(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    }
    return sum;
}

function marchCurrentPos(m, now = Date.now()) {
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], Grid.centreOf({ x: m.toX, y: m.toY })];
    const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
    const p = Math.max(0, Math.min(1, (now - m.startedAtMillis) / totalMs));
    if (p <= 0) return pts[0];
    if (p >= 1) return pts[pts.length - 1];

    const segs = [];
    let totalLen = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const d = Grid.distanceM(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        segs.push(d);
        totalLen += d;
    }
    const target = totalLen * p;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
        if (acc + segs[i] >= target || i === segs.length - 1) {
            const t = segs[i] > 0.001 ? (target - acc) / segs[i] : 0;
            return [
                pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
                pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
            ];
        }
        acc += segs[i];
    }
    return pts[pts.length - 1];
}

function marchRemainingPath(m, now = Date.now()) {
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], Grid.centreOf({ x: m.toX, y: m.toY })];
    const cur = marchCurrentPos(m, now);
    if (pts.length <= 2) return [cur, pts[pts.length - 1]];

    const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
    const p = Math.max(0, Math.min(1, (now - m.startedAtMillis) / totalMs));
    let totalLen = 0;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const d = Grid.distanceM(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        segs.push(d);
        totalLen += d;
    }
    const target = totalLen * p;
    let acc = 0;
    const out = [cur];
    for (let i = 0; i < segs.length; i++) {
        acc += segs[i];
        if (acc > target) out.push(pts[i + 1]);
    }
    return out;
}

async function renderTroopsOnMap() {
    if (!mapReady) return;
    const now = Date.now();
    const troopFeatures = [];
    const lineFeatures = [];

    for (const g of state.garrisons) {
        if (g.count <= 0) continue;
        await ensureTroopBadge(g.count);
        const [lat, lon] = Grid.centreOf(g);
        troopFeatures.push({
            type: "Feature",
            properties: { count: String(g.count) },
            geometry: { type: "Point", coordinates: [lon, lat] }
        });
    }

    for (const m of state.marches) {
        if (m.count <= 0) continue;
        await ensureTroopBadge(m.count);
        const [lat, lon] = marchCurrentPos(m, now);
        troopFeatures.push({
            type: "Feature",
            properties: { count: String(m.count) },
            geometry: { type: "Point", coordinates: [lon, lat] }
        });
        const rem = marchRemainingPath(m, now);
        lineFeatures.push({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: rem.map(pt => [pt[1], pt[0]])
            }
        });
    }

    map.getSource("src-troops")?.setData({ type: "FeatureCollection", features: troopFeatures });
    map.getSource("src-march-lines")?.setData({ type: "FeatureCollection", features: lineFeatures });
}

// ============================================================================
// Data-synkronisering med Supabase
// ============================================================================
async function syncAllFromSupabase() {
    if (!state.user) return;
    const uid = state.user.id;

    const [playerRes, matRes, myBldRes] = await Promise.all([
        sb.from("players").select("balance").eq("id", uid).maybeSingle(),
        sb.from("player_materials").select("material,amount").eq("player_id", uid),
        sb.from("buildings").select("x,y,owner_id,kind,level,emptied_at").eq("owner_id", uid)
    ]);

    if (playerRes.data) {
        state.balance = playerRes.data.balance || 0;
    }
    if (matRes.data) {
        const mapMat = {};
        matRes.data.forEach(r => { mapMat[r.material] = r.amount; });
        state.steel = mapMat.steel || 0;
        state.soldiers = mapMat.soldiers || 0;
    }
    if (myBldRes.data) {
        state.myBuildings = myBldRes.data;
        if (!state.hasCenteredOnce && myBldRes.data.length > 0 && map) {
            state.hasCenteredOnce = true;
            const first = myBldRes.data[0];
            const [lat, lon] = Grid.centreOf(first);
            map.jumpTo({ center: [lon, lat], zoom: 16.5 });
        }
    }

    updateHud();
    renderBuildingsSidebar();
    renderTroopsSidebar();
    await refreshViewportData();
}

function updateHud() {
    const fmt = n => Number(n || 0).toLocaleString("da-DK");
    document.getElementById("hud-steps").textContent = fmt(state.balance);
    document.getElementById("hud-steel").textContent = fmt(state.steel);
    document.getElementById("hud-soldiers").textContent = `${fmt(state.soldiers)} / ${fmt(totalSoldierCapacity())}`;
}

// ============================================================================
// Klik på kortet & Valgt Felt i Sidepanelet
// ============================================================================
function onMapTileClicked(tile) {
    if (state.pendingMarchOrder) {
        const order = state.pendingMarchOrder;
        if (!order.redirectMarchId && tile.x === order.fromTile.x && tile.y === order.fromTile.y) {
            showToast("Vælg et andet felt end startfeltet!");
            return;
        }
        const terr = terrainAtTile(tile);
        if (terr.id === "water") {
            showToast("Feltet ligger ude i vandet! Vælg et felt på land.");
            return;
        }
        openConfirmMarchModal(order, tile);
        return;
    }

    state.selectedTile = tile;
    if (mapReady) {
        map.getSource("src-selected")?.setData(tilesToGeoJson([tile]));
    }
    renderSelectedTileBox();
}

function computeProductionContents(b) {
    const cfg = GAME_CONFIG.BUILDINGS[b.kind];
    if (!cfg || !cfg.production) return null;
    const perHour = cfg.production.per_hour[b.level - 1] || 0;
    const cap = cfg.production.capacity[b.level - 1] || 0;
    const emptiedMs = b.emptied_at ? new Date(b.emptied_at).getTime() : Date.now();
    const hours = Math.max(0, (Date.now() - emptiedMs) / 3600000.0);
    const amount = Math.min(cap, Math.floor(hours * perHour));
    return { amount, capacity: cap, perHour };
}

function renderSelectedTileBox() {
    const tile = state.selectedTile;
    const box = document.getElementById("selected-tile-box");
    const badge = document.getElementById("selected-tile-coords");
    if (!tile) return;

    badge.textContent = `Felt ${tile.x},${tile.y}`;
    const terr = terrainAtTile(tile);
    const uid = state.user?.id;

    const tileOwner = state.visibleTiles.find(t => t.x === tile.x && t.y === tile.y)?.owner_id;
    const bld = state.myBuildings.find(b => b.x === tile.x && b.y === tile.y)
        || state.visibleBuildings.find(b => b.x === tile.x && b.y === tile.y);
    const gar = state.garrisons.find(g => g.x === tile.x && g.y === tile.y && g.count > 0);
    const isMine = tileOwner === uid || (bld && bld.owner_id === uid);

    let ownerBadge = `<span class="badge">Neutralt felt</span>`;
    if (isMine) ownerBadge = `<span class="badge badge-green">Dit territorium</span>`;
    else if (tileOwner) ownerBadge = `<span class="badge" style="color:#FF2E88">Fjendtligt felt</span>`;

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Terræn: ${terr.name}</strong>
            ${ownerBadge}
        </div>
    `;

    if (gar) {
        html += `
            <div class="item-row" style="margin-bottom:8px;">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title item-title-green">Vagtstyrke: ${gar.count} soldater</div>
                        <div class="item-sub">Står vagt på dette felt</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="openSendSoldiersModal(${tile.x}, ${tile.y}, ${gar.count}, true)">🪖 Send videre</button>
                </div>
            </div>
        `;
    }

    if (bld && isMine) {
        const cfg = GAME_CONFIG.BUILDINGS[bld.kind];
        const stageName = cfg ? cfg.stages[bld.level - 1] : bld.kind;
        const sprite = cfg ? cfg.sprites[bld.level - 1] : "barrak_1";
        const nextPrice = cfg && bld.level < 5 ? cfg.prices[bld.level] : null;
        const prod = computeProductionContents(bld);
        const housing = cfg?.housing ? cfg.housing[bld.level - 1] : null;

        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/${sprite}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title">${stageName} (Trin ${bld.level}/5)</div>
                        <div class="item-sub">${cfg ? cfg.desc : ""}</div>
                        ${housing ? `<div class="item-sub" style="color:#76FF03">Plads her: ${housing} · Ledige i barrak: ${availableInBarracks()}</div>` : ""}
                        ${prod ? `<div class="item-sub" style="color:#FFD54F">Klar til indkaldelse: ${prod.amount} / ${prod.capacity} (${prod.perHour}/t)</div>` : ""}
                    </div>
                </div>
                <div class="item-actions">
                    ${bld.kind === "barracks" ? `<button class="btn btn-small btn-primary" ${availableInBarracks() <= 0 ? "disabled" : ""} onclick="openSendSoldiersModal(${tile.x}, ${tile.y}, ${availableInBarracks()}, false)">🪖 Send soldater (${availableInBarracks()} klar)</button>` : ""}
                    ${prod && prod.amount > 0 ? `<button class="btn btn-small btn-primary" onclick="collectFromBuilding(${tile.x}, ${tile.y})">📥 Indkald ${prod.amount} soldater</button>` : ""}
                    ${bld.kind === "academy" ? `<button class="btn btn-small btn-gold" onclick="recruitSoldierInstant()">⚡ Uddan 1 straks (${GAME_CONFIG.INSTANT_SOLDIER_STEPS} skridt)</button>` : ""}
                    ${nextPrice ? `<button class="btn btn-small" onclick="buildOrUpgrade('${bld.kind}', ${tile.x}, ${tile.y}, '${terr.id}')">⬆️ Opgradér til trin ${bld.level + 1} (${nextPrice} skridt)</button>` : `<span class="badge">Fuldt udbygget</span>`}
                </div>
            </div>
        `;
    } else if (!bld && isMine && terr.id !== "water") {
        html += `<div class="muted-hint" style="margin-bottom:8px;">Dette felt er dit! Du kan opføre en ny bygning her fra Kommandocentralen:</div>`;
        for (const cfg of Object.values(GAME_CONFIG.BUILDINGS)) {
            const p = cfg.prices[0];
            html += `
                <div class="item-row" style="margin-bottom:6px;">
                    <div class="item-row-top">
                        <img src="assets/${cfg.sprites[0]}.png" class="pixel-img item-sprite" />
                        <div class="item-info">
                            <div class="item-title">${cfg.name} (${cfg.stages[0]})</div>
                            <div class="item-sub">${cfg.desc}</div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-small btn-primary" onclick="buildOrUpgrade('${cfg.id}', ${tile.x}, ${tile.y}, '${terr.id}')">🔨 Byg Trin 1 (${p} skridt)</button>
                    </div>
                </div>
            `;
        }
    } else if (!isMine) {
        html += `<p class="muted-hint">For at bygge her skal du enten gå hen til feltet med din telefon og sætte et flag, eller sende dine soldater på march hertil for at indtage feltet!</p>`;
    }

    box.innerHTML = html;
}

// ============================================================================
// Byg, Opgradér, Indkald & Straks-uddan via Supabase RPC
// ============================================================================
async function buildOrUpgrade(kindId, x, y, terrainId) {
    const [lat, lon] = Grid.centreOf({ x, y });
    const { data, error } = await sb.rpc("build_building", {
        p_x: x,
        p_y: y,
        p_kind: kindId,
        p_terrain: terrainId,
        p_lat: lat,
        p_lon: lon
    });
    if (error) {
        showToast("Kunne ikke bygge: " + error.message);
        return;
    }
    showToast(`Bygning opført/opgraderet til trin ${data.level}!`);
    await syncAllFromSupabase();
}

async function collectFromBuilding(x, y) {
    if (state.soldiers >= totalSoldierCapacity()) {
        showToast(`Dine barrakker er fulde (${state.soldiers}/${totalSoldierCapacity()})! Opgradér en barrak først.`);
        return;
    }
    const [lat, lon] = Grid.centreOf({ x, y });
    const { data, error } = await sb.rpc("empty_building", {
        p_x: x,
        p_y: y,
        p_lat: lat,
        p_lon: lon,
        p_remote: false
    });
    if (error) {
        showToast("Kunne ikke indkalde: " + error.message);
        return;
    }
    showToast(`+${data.amount} soldater føjet til din barrak!`);
    await syncAllFromSupabase();
}

async function recruitSoldierInstant() {
    if (state.soldiers >= totalSoldierCapacity()) {
        showToast(`Dine barrakker er fulde (${state.soldiers}/${totalSoldierCapacity()})! Opgradér en barrak først.`);
        return;
    }
    if (state.balance < GAME_CONFIG.INSTANT_SOLDIER_STEPS) {
        showToast(`Du mangler skridt (${GAME_CONFIG.INSTANT_SOLDIER_STEPS} skridt kræves).`);
        return;
    }
    const { data, error } = await sb.rpc("recruit_soldier_now", {
        p_cost: GAME_CONFIG.INSTANT_SOLDIER_STEPS
    });
    if (!error && typeof data === "number") {
        showToast(`+1 Soldat uddannet straks! (${GAME_CONFIG.INSTANT_SOLDIER_STEPS} skridt)`);
        await syncAllFromSupabase();
    } else {
        showToast("Kunne ikke straks-uddanne: " + (error?.message || "Tjek om databasen har recruit_soldier_now"));
    }
}

// ============================================================================
// Sidepanel: Dine Militærbygninger & Soldater ude på kortet
// ============================================================================
function renderBuildingsSidebar() {
    const list = document.getElementById("buildings-list");
    const badge = document.getElementById("buildings-summary-badge");
    badge.textContent = `${state.myBuildings.length} bygninger`;

    if (state.myBuildings.length === 0) {
        list.innerHTML = `<p class="muted-hint">Du har ingen bygninger endnu. Tag telefonen med ud eller vælg et af dine grønne felter for at bygge.</p>`;
        return;
    }

    list.innerHTML = state.myBuildings.map(b => {
        const cfg = GAME_CONFIG.BUILDINGS[b.kind];
        const stageName = cfg ? cfg.stages[b.level - 1] : b.kind;
        const sprite = cfg ? cfg.sprites[b.level - 1] : "barrak_1";
        const housing = cfg?.housing ? cfg.housing[b.level - 1] : null;
        const prod = computeProductionContents(b);
        const avail = availableInBarracks();

        return `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/${sprite}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title">${stageName} (Trin ${b.level})</div>
                        <div class="item-sub">Felt ${b.x},${b.y} ${housing ? `· Plads: ${housing} soldater` : ""}</div>
                        ${prod ? `<div class="item-sub" style="color:#FFD54F">Klar: ${prod.amount}/${prod.capacity} soldater (${prod.perHour}/t)</div>` : ""}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToTile(${b.x}, ${b.y})">🎯 Hop til</button>
                    ${b.kind === "barracks" ? `<button class="btn btn-small btn-primary" ${avail <= 0 ? "disabled" : ""} onclick="openSendSoldiersModal(${b.x}, ${b.y}, ${avail}, false)">🪖 Send soldater (${avail})</button>` : ""}
                    ${prod && prod.amount > 0 ? `<button class="btn btn-small btn-primary" onclick="collectFromBuilding(${b.x}, ${b.y})">📥 Indkald (${prod.amount})</button>` : ""}
                    ${b.kind === "academy" ? `<button class="btn btn-small btn-gold" onclick="recruitSoldierInstant()">⚡ +1 Soldat (${GAME_CONFIG.INSTANT_SOLDIER_STEPS})</button>` : ""}
                </div>
            </div>
        `;
    }).join("");
}

function renderTroopsSidebar() {
    const list = document.getElementById("troops-list");
    const badge = document.getElementById("deployed-summary-badge");
    const uid = state.user?.id;
    const myMarches = state.marches.filter(m => m.owner_id === uid && m.count > 0);
    const myGarrisons = state.garrisons.filter(g => g.owner_id === uid && g.count > 0);

    const totalOut = deployedSoldierCount();
    badge.textContent = `${totalOut} soldater ude`;

    if (myMarches.length === 0 && myGarrisons.length === 0) {
        list.innerHTML = `<p class="muted-hint">Ingen soldater er sendt ud på kortet lige nu. Tryk "Send soldater" på din barrak for at sende en deling af sted.</p>`;
        return;
    }

    const now = Date.now();
    let html = "";

    for (const m of myMarches) {
        const remSec = Math.max(0, Math.ceil((m.arrivesAtMillis - now) / 1000));
        const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
        const prog = Math.max(2, Math.min(100, ((now - m.startedAtMillis) / totalMs) * 100));

        html += `
            <div class="item-row" data-march-id="${m.id}">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title item-title-green">${m.count} soldater på march</div>
                        <div class="item-sub march-eta-text">Mod felt ${m.toX},${m.toY} · Ankomst om ${formatSeconds(remSec)}</div>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill march-prog-bar" style="width:${prog.toFixed(1)}%"></div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToMarch('${m.id}')">🎯 Hop til</button>
                    <button class="btn btn-small btn-primary" onclick="startRedirectMarch('${m.id}')">🧭 Nyt mål</button>
                    <button class="btn btn-small btn-danger" onclick="recallMarch('${m.id}')">🏠 Kald hjem</button>
                </div>
            </div>
        `;
    }

    for (const g of myGarrisons) {
        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title">${g.count} soldater på vagt</div>
                        <div class="item-sub">Står vagt på felt ${g.x},${g.y}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToTile(${g.x}, ${g.y})">🎯 Hop til</button>
                    <button class="btn btn-small btn-primary" onclick="openSendSoldiersModal(${g.x}, ${g.y}, ${g.count}, true)">🪖 Send videre</button>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

// Opdaterer KUN nedtællingsteksten og bjælken hvert sekund uden at blinke!
function updateLiveTroopCountdowns() {
    const now = Date.now();
    for (const m of state.marches) {
        const row = document.querySelector(`.item-row[data-march-id="${m.id}"]`);
        if (!row) continue;
        const remSec = Math.max(0, Math.ceil((m.arrivesAtMillis - now) / 1000));
        const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
        const prog = Math.max(2, Math.min(100, ((now - m.startedAtMillis) / totalMs) * 100));

        const etaEl = row.querySelector(".march-eta-text");
        if (etaEl) etaEl.textContent = `Mod felt ${m.toX},${m.toY} · Ankomst om ${formatSeconds(remSec)}`;
        const barEl = row.querySelector(".march-prog-bar");
        if (barEl) barEl.style.width = `${prog.toFixed(1)}%`;
    }
}

// ============================================================================
// Udsendelse af soldater, Omdirigering, Hjemkaldelse & Ankomst
// ============================================================================
window.openSendSoldiersModal = function(fromX, fromY, maxAvail, fromGarrison) {
    if (maxAvail <= 0) return;
    const overlay = document.getElementById("modal-overlay");
    document.getElementById("modal-title").textContent = "Send soldater på march";
    document.getElementById("modal-body").innerHTML = `
        <p>Vælg hvor mange soldater du vil sende af sted fra felt ${fromX},${fromY}:</p>
        <div style="text-align:center;font-size:20px;font-weight:800;color:#39FF14;" id="slider-val-label">${maxAvail} / ${maxAvail} soldater</div>
        <input type="range" min="1" max="${maxAvail}" value="${maxAvail}" class="range-slider" id="soldier-range-input" />
    `;
    const slider = document.getElementById("soldier-range-input");
    const label = document.getElementById("slider-val-label");
    slider.oninput = () => {
        label.textContent = `${slider.value} / ${maxAvail} soldater`;
    };

    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal()">Luk</button>
        <button class="btn btn-primary" id="btn-pick-target-confirm">🎯 Vælg mål på kortet</button>
    `;
    document.getElementById("btn-pick-target-confirm").onclick = () => {
        const chosen = parseInt(slider.value, 10) || 1;
        closeModal();
        enterMarchTargetMode({ fromTile: { x: fromX, y: fromY }, count: chosen, fromGarrison });
    };
    overlay.classList.remove("hidden");
};

function enterMarchTargetMode(order) {
    state.pendingMarchOrder = order;
    document.getElementById("banner-soldier-count").textContent = order.count;
    document.getElementById("march-target-banner").classList.remove("hidden");
}

function exitMarchTargetMode() {
    state.pendingMarchOrder = null;
    document.getElementById("march-target-banner").classList.add("hidden");
}

function openConfirmMarchModal(order, targetTile) {
    const now = Date.now();
    let startPos;
    if (order.redirectMarchId) {
        const old = state.marches.find(m => m.id === order.redirectMarchId);
        startPos = old ? marchCurrentPos(old, now) : Grid.centreOf(order.fromTile);
    } else {
        startPos = Grid.centreOf(order.fromTile);
    }

    const landPath = findLandPath(startPos[0], startPos[1], targetTile);
    const distM = Math.round(pathDistanceM(landPath));
    const tilesCount = Math.max(1, Math.round(distM / Grid.tileSizeM));
    const durationSec = Math.max(2, Math.round(tilesCount * GAME_CONFIG.SOLDIER_SECONDS_PER_TILE));

    const overlay = document.getElementById("modal-overlay");
    document.getElementById("modal-title").textContent = `Send ${order.count} soldater af sted?`;
    document.getElementById("modal-body").innerHTML = `
        <p><strong>Mål:</strong> Felt ${targetTile.x},${targetTile.y}</p>
        <p><strong>Afstand langs land/kyst:</strong> ca. ${distM.toLocaleString("da-DK")} m (${tilesCount} felter)</p>
        <p><strong>Rejsetid:</strong> ${formatSeconds(durationSec)}</p>
        <p style="color:#90A4AE;font-size:13px;">Er du sikker på, at du vil sende soldaterne hertil?</p>
    `;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal(); exitMarchTargetMode();">Annullér</button>
        <button class="btn" onclick="closeModal();">Vælg andet felt</button>
        <button class="btn btn-primary" id="btn-confirm-march-go">✅ Ja, send af sted</button>
    `;
    document.getElementById("btn-confirm-march-go").onclick = () => {
        closeModal();
        exitMarchTargetMode();
        executeMarchOrder(order, targetTile, landPath, durationSec * 1000);
    };
    overlay.classList.remove("hidden");
}

function executeMarchOrder(order, targetTile, landPath, durationMs) {
    const now = Date.now();
    const uid = state.user.id;

    if (order.redirectMarchId) {
        const m = state.marches.find(x => x.id === order.redirectMarchId);
        if (m) {
            const cur = marchCurrentPos(m, now);
            m.startLat = cur[0];
            m.startLon = cur[1];
            m.toX = targetTile.x;
            m.toY = targetTile.y;
            m.startedAtMillis = now;
            m.arrivesAtMillis = now + durationMs;
            m.path = landPath;
            saveLocalTroops();
            renderTroopsSidebar();
            renderTroopsOnMap();
            showToast(`Ny ordre: ${m.count} soldater går nu mod felt ${targetTile.x},${targetTile.y}!`);
        }
        return;
    }

    if (order.fromGarrison) {
        const g = state.garrisons.find(x => x.x === order.fromTile.x && x.y === order.fromTile.y && x.owner_id === uid);
        if (g) {
            g.count -= order.count;
            state.garrisons = state.garrisons.filter(x => x.count > 0);
        }
    }

    const march = {
        id: "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        owner_id: uid,
        count: order.count,
        homeX: order.fromTile.x,
        homeY: order.fromTile.y,
        startLat: landPath[0][0],
        startLon: landPath[0][1],
        toX: targetTile.x,
        toY: targetTile.y,
        startedAtMillis: now,
        arrivesAtMillis: now + durationMs,
        path: landPath
    };

    state.marches.push(march);
    saveLocalTroops();
    renderTroopsSidebar();
    renderBuildingsSidebar();
    if (state.selectedTile) renderSelectedTileBox();
    renderTroopsOnMap();
    showToast(`${march.count} soldater er på vej mod felt ${targetTile.x},${targetTile.y}!`);
}

window.startRedirectMarch = function(marchId) {
    const m = state.marches.find(x => x.id === marchId);
    if (!m) return;
    enterMarchTargetMode({
        fromTile: { x: m.homeX, y: m.homeY },
        count: m.count,
        redirectMarchId: m.id
    });
    showToast("Klik på det nye målfelt på kortet!");
};

window.recallMarch = function(marchId) {
    const m = state.marches.find(x => x.id === marchId);
    if (!m) return;
    const now = Date.now();
    const cur = marchCurrentPos(m, now);
    const homeTile = { x: m.homeX, y: m.homeY };
    const homePath = findLandPath(cur[0], cur[1], homeTile);
    const distM = pathDistanceM(homePath);
    const durMs = Math.max(2000, Math.round((distM / Grid.tileSizeM) * GAME_CONFIG.SOLDIER_SECONDS_PER_TILE * 1000));

    m.startLat = cur[0];
    m.startLon = cur[1];
    m.toX = homeTile.x;
    m.toY = homeTile.y;
    m.startedAtMillis = now;
    m.arrivesAtMillis = now + durMs;
    m.path = homePath;
    saveLocalTroops();
    renderTroopsSidebar();
    renderTroopsOnMap();
    showToast(`${m.count} soldater vender om og går hjem til barrakken!`);
};

window.jumpToTile = function(x, y) {
    if (!map) return;
    const [lat, lon] = Grid.centreOf({ x, y });
    map.flyTo({ center: [lon, lat], zoom: 17.2, duration: 700 });
    onMapTileClicked({ x, y });
};

window.jumpToMarch = function(marchId) {
    const m = state.marches.find(x => x.id === marchId);
    if (!m || !map) return;
    const [lat, lon] = marchCurrentPos(m, Date.now());
    map.flyTo({ center: [lon, lat], zoom: 17.0, duration: 700 });
};

async function tickMarches() {
    const now = Date.now();
    const arrived = state.marches.filter(m => now >= m.arrivesAtMillis);
    if (arrived.length > 0) {
        state.marches = state.marches.filter(m => now < m.arrivesAtMillis);
        for (const m of arrived) {
            await resolveArrival(m);
        }
        saveLocalTroops();
        renderTroopsSidebar();
        renderBuildingsSidebar();
    } else {
        updateLiveTroopCountdowns();
    }
    renderTroopsOnMap();
}

async function resolveArrival(m) {
    const uid = state.user?.id;
    const isOwnBarracks = state.myBuildings.some(b => b.x === m.toX && b.y === m.toY && b.kind === "barracks");
    if (isOwnBarracks) {
        showToast(`${m.count} soldater er vendt hjem til barrakken!`);
        return;
    }

    // Tilføj til vagtstyrke på målfeltet og indtag feltet
    let existing = state.garrisons.find(g => g.x === m.toX && g.y === m.toY && g.owner_id === uid);
    if (existing) {
        existing.count += m.count;
    } else {
        state.garrisons.push({ x: m.toX, y: m.toY, owner_id: uid, count: m.count });
    }

    try {
        await sb.rpc("capture_tile_by_soldiers", { p_x: m.toX, p_y: m.toY, p_casualties: 0 });
    } catch (_) {}

    showToast(`Dine ${m.count} soldater har indtaget felt ${m.toX},${m.toY} og står nu vagt!`);
    await refreshViewportData();
}

// ============================================================================
// Hjælpefunktioner & Login-håndtering
// ============================================================================
window.closeModal = function() {
    document.getElementById("modal-overlay").classList.add("hidden");
};

let toastTimer = null;
function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 4500);
}

function formatSeconds(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}t ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

async function checkAuthSession() {
    const { data } = await sb.auth.getSession();
    if (data?.session?.user) {
        onSignedIn(data.session.user);
    }
}

async function onSignedIn(user) {
    state.user = user;
    document.getElementById("auth-overlay").classList.add("hidden");
    loadLocalTroops();
    await syncAllFromSupabase();
}

document.getElementById("btn-login").onclick = async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errEl = document.getElementById("auth-error");
    errEl.classList.add("hidden");

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
        errEl.textContent = error.message;
        errEl.classList.remove("hidden");
        return;
    }
    if (data?.user) onSignedIn(data.user);
};

document.getElementById("btn-signup").onclick = async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errEl = document.getElementById("auth-error");
    errEl.classList.add("hidden");

    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) {
        errEl.textContent = error.message;
        errEl.classList.remove("hidden");
        return;
    }
    if (data?.user) {
        await sb.rpc("ensure_player");
        onSignedIn(data.user);
    }
};

document.getElementById("btn-logout").onclick = async () => {
    await sb.auth.signOut();
    state.user = null;
    document.getElementById("auth-overlay").classList.remove("hidden");
};

document.getElementById("btn-sync").onclick = () => syncAllFromSupabase();
document.getElementById("btn-cancel-march-mode").onclick = () => exitMarchTargetMode();
document.getElementById("btn-jump-home").onclick = () => {
    if (state.myBuildings.length > 0) {
        const b = state.myBuildings[0];
        window.jumpToTile(b.x, b.y);
    } else {
        showToast("Ingen bygninger fundet endnu.");
    }
};

// Start kortet og 1-sekunds march-løkke
initMap();
checkAuthSession();
setInterval(() => {
    if (state.user) tickMarches();
}, 1000);
