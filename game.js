// ============================================================================
// HOME FRONT — Command Center (PC Browser-udgave koblet på Supabase)
// ============================================================================

const SUPABASE_URL = "https://gtajdqbqbcqqgooaqahe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vH5S1tfDep32Umb_Ofy5_A_vlq0pmH1";
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const GAME_CONFIG = {
    TILE_SIZE_M: 30.0,
    REF_LAT_DEG: 56.0,
    // Alle afstande i meter og farter i m/s. Overskrives af config.rules fra serveren.
    SOLDIER_SPEED_MPS: 30 / 18,
    SOLDIER_VISION_M: 250,
    WORLD_POLL_MS: 15000,
    INSTANT_SOLDIER_STEPS: 100,
    BUILDING_DEFENSE_PER_LEVEL: 2,
    BUILD_RADIUS_M: 100,
    VISION_RADIUS_M: 500,
    SCOUT_POLL_MS: 30000,
    BUILDINGS: {
        barracks: {
            id: "barracks",
            name: "Barrakken",
            shortName: "barrak",
            desc: "Giver sengepladser til dine soldater: 100 på trin 1 og op til 1.000 på trin 5.",
            stages: ["Bivuak", "Teltlejr", "Barrak", "Kaserne", "Hovedkaserne"],
            sprites: ["barrak_1", "barrak_2", "barrak_3", "barrak_4", "barrak_5"],
            prices: [500, 600, 700, 800, 900],
            materials: [{}, {}, {}, {}, {}],
            housing: [100, 250, 450, 700, 1000]
        },
        academy: {
            id: "academy",
            name: "Militærskolen",
            shortName: "militærskole",
            desc: "Uddanner nye soldater over tid — og lader dig straks-uddanne soldater for skridt.",
            stages: ["Skydebane", "Træningslejr", "Rekrutskole", "Militærakademi", "Krigsskole"],
            sprites: ["skole_1", "skole_2", "skole_3", "skole_4", "skole_5"],
            prices: [300, 600, 1200, 2200, 4000],
            materials: [{}, {}, {}, { steel: 15 }, { steel: 40 }],
            production: {
                material: "soldiers",
                per_hour: [2, 5, 10, 18, 30],
                capacity: [10, 25, 50, 90, 150]
            }
        }
    }
};

// ============================================================================
// Grid-matematik (100% identisk med Grid.kt i Android-appen og tile_centre i SQL)
// ============================================================================
const EARTH_RADIUS_M = 6371008.8;
const DEG_PER_RAD = 180.0 / Math.PI;
const RAD_PER_DEG = Math.PI / 180.0;
const MIN_COS = 1e-6;

const Grid = {
    tileSizeM: GAME_CONFIG.TILE_SIZE_M,
    referenceLatDeg: GAME_CONFIG.REF_LAT_DEG,
    referenceCos() {
        return Math.max(Math.cos(this.referenceLatDeg * RAD_PER_DEG), MIN_COS);
    },
    tileLatDeg() {
        return (this.tileSizeM / EARTH_RADIUS_M) * DEG_PER_RAD;
    },
    tileLonDeg() {
        return (this.tileSizeM / (EARTH_RADIUS_M * this.referenceCos())) * DEG_PER_RAD;
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
        const meanLat = ((lat1 + lat2) / 2.0) * RAD_PER_DEG;
        const dx = (lon2 - lon1) * RAD_PER_DEG * EARTH_RADIUS_M * Math.cos(meanLat);
        const dy = (lat2 - lat1) * RAD_PER_DEG * EARTH_RADIUS_M;
        return Math.hypot(dx, dy);
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
    marches: [],           // Egne marcher fra serveren (se marchFromRow)
    garrisons: [],         // Egne vagtstyrker fra serveren { owner_id, x, y, count }
    ownTiles: [],          // Egne felter i kortudsnittet
    ownBuildingsInView: [],
    enemies: { tiles: [], buildings: [], garrisons: [], marches: [] }, // fra visible_enemies()
    seenBySoldiers: new Set(), // nøgler på fjender, dine soldater allerede har meldt om
    bookmarks: [],         // { x, y, purpose: "build" | "target", note } — sat med telefonen på stedet
    scoutAlerts: [],       // { x, y, kind, scouts } — grove advarsler om fjendtlige spejdere
    isTester: false,       // Testkonto: må bygge uden byggepladsbogmærke (sættes af admin)
    isAdmin: false,        // Admin: ser Admin-knappen med spillerlisten
    hasCenteredOnce: false
};

let map = null;
let mapReady = false;
const registeredTroopBadges = new Set();

// ============================================================================
// Tropper fra serveren (Marcher & Vagtstyrker)
// ============================================================================
// Serveren gemmer en march som rute + starttid + ankomsttid; positionen regnes ud her og dér.
function marchFromRow(row) {
    return {
        id: row.id,
        owner_id: row.owner_id,
        count: row.count,
        homeX: row.home_x,
        homeY: row.home_y,
        toX: row.to_x,
        toY: row.to_y,
        path: row.path,
        startLat: row.path[0][0],
        startLon: row.path[0][1],
        startedAtMillis: Date.parse(row.started_at),
        arrivesAtMillis: Date.parse(row.arrives_at)
    };
}

async function loadArmy() {
    if (!state.user) return;
    const [mRes, gRes] = await Promise.all([
        sb.from("marches").select("id,owner_id,count,home_x,home_y,to_x,to_y,path,started_at,arrives_at"),
        sb.from("garrisons").select("owner_id,x,y,count")
    ]);
    if (mRes.data) state.marches = mRes.data.map(marchFromRow);
    if (gRes.data) state.garrisons = gRes.data;
    renderTroopsSidebar();
    renderBuildingsSidebar();
    renderTroopsOnMap();
    if (state.selectedTile) renderSelectedTileBox();
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
        renderBookmarksOnMap();
        refreshViewportData();
        renderTroopsOnMap();
    });

    map.on("move", () => waterCache.clear());

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

function buildingIconSizeExpression() {
    // Bygnings-sprites er 56x56 px og indlæses med scale=4 -> 224x224 px.
    // Ved breddegrad ~55.65° er 1 felt (30m) på MapLibre-kortet (512 px ved zoom 0):
    // pxAtZoom0 = (tileLatDeg / cos(lat) / 360) * 512
    const texPx = 56 * 4;
    const latCos = Math.cos(55.65 * RAD_PER_DEG);
    const tileDegInMercator = Grid.tileLatDeg() / latCos;
    const pxAtZoom0 = (tileDegInMercator / 360.0) * 512.0;
    const sizeAt = (z) => (pxAtZoom0 * Math.pow(2, z)) / texPx;

    return [
        "interpolate", ["exponential", 2], ["zoom"],
        5, sizeAt(5),
        10, sizeAt(10),
        12, sizeAt(12),
        14, sizeAt(14),
        16, sizeAt(16),
        18, sizeAt(18),
        20, sizeAt(20),
        22, sizeAt(22)
    ];
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
    map.addSource("src-bookmarks", { type: "geojson", data: empty });

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
        id: "lyr-bookmarks",
        type: "line",
        source: "src-bookmarks",
        paint: {
            "line-color": ["match", ["get", "purpose"], "build", "#FFD54F", "#FF5252"],
            "line-width": 2.5,
            "line-dasharray": [1.5, 1]
        }
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
            "icon-size": buildingIconSizeExpression(),
            "icon-anchor": "center",
            "icon-rotation-alignment": "map",
            "icon-pitch-alignment": "map",
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
            "icon-image": ["get", "img"],
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

    if (tilesRes.data) state.ownTiles = tilesRes.data;
    if (bldRes.data) state.ownBuildingsInView = bldRes.data;
    renderWorld();
}

// Tegner egne felter/bygninger (fra kortudsnittet) og de fjender, serveren siger du kan se.
// Fjender uden for udsynet når aldrig hertil — de er skjult på serveren.
function renderWorld() {
    if (!mapReady || !state.user) return;
    const uid = state.user.id;
    const enemyTiles = state.enemies.tiles;
    const enemyBuildings = state.enemies.buildings;

    state.visibleTiles = [...state.ownTiles, ...enemyTiles];
    state.visibleBuildings = [...state.ownBuildingsInView, ...enemyBuildings];
    map.getSource("src-mine")?.setData(tilesToGeoJson(state.ownTiles.filter(t => t.owner_id === uid)));
    map.getSource("src-others")?.setData(tilesToGeoJson(enemyTiles));

    const features = state.visibleBuildings.map(b => {
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

function troopBadgeId(count, enemy = false) {
    return `${enemy ? "img-enemy-" : "img-troop-"}${count}`;
}

async function ensureTroopBadge(count, enemy = false) {
    const imgId = troopBadgeId(count, enemy);
    if (!mapReady || registeredTroopBadges.has(imgId)) return;
    registeredTroopBadges.add(imgId);
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
    ctx.strokeStyle = enemy ? "#FF5252" : "#39FF14";
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
    if (!map.hasImage(imgId)) {
        map.addImage(imgId, { width: canvas.width, height: canvas.height, data: imageData.data });
    }
}

function isPointOnScreen(lat, lon) {
    if (!mapReady || !map) return false;
    const canvas = map.getCanvas();
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const pt = map.project([lon, lat]);
    return pt.x >= 2 && pt.x <= w - 2 && pt.y >= 2 && pt.y <= h - 2;
}

// Ruteberegningen spørger om de samme pixels igen og igen; svaret huskes, til kortet flytter sig.
const waterCache = new Map();

function isWaterAt(lat, lon) {
    if (!mapReady || !map) return false;
    const pt = map.project([lon, lat]);
    const key = `${Math.round(pt.x / 2)},${Math.round(pt.y / 2)}`;
    const known = waterCache.get(key);
    if (known !== undefined) return known;
    const water = isWaterAtPixel(pt);
    waterCache.set(key, water);
    return water;
}

function isWaterAtPixel(pt) {
    const layers = ["land-water", "water"].filter(l => map.getLayer(l));
    if (layers.length === 0) return false;
    const box = [
        [pt.x - 1.5, pt.y - 1.5],
        [pt.x + 1.5, pt.y + 1.5]
    ];
    const feats = map.queryRenderedFeatures(box, { layers });
    return !!(feats && feats.length > 0);
}

function terrainAtTile(tile) {
    if (!mapReady) return { id: "ground", name: "Åbent land" };
    const [lat, lon] = Grid.centreOf(tile);
    const pt = map.project([lon, lat]);
    const order = [
        ["land-water", "water", "Vand (kræver båd/bro)"],
        ["water", "water", "Vand (kræver båd/bro)"],
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

function segmentCrossesWater(lat1, lon1, lat2, lon2, customSamples = null) {
    if (!mapReady || !map) return false;
    if (!isPointOnScreen(lat1, lon1) || !isPointOnScreen(lat2, lon2)) return true;
    const pt1 = map.project([lon1, lat1]);
    const pt2 = map.project([lon2, lat2]);
    const pxDist = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
    const samples = customSamples || Math.max(20, Math.min(360, Math.ceil(pxDist / 3)));

    for (let s = 1; s < samples; s++) {
        const t = s / samples;
        const lat = lat1 + (lat2 - lat1) * t;
        const lon = lon1 + (lon2 - lon1) * t;
        if (isWaterAt(lat, lon)) return true;
    }
    return false;
}

/**
 * Strammer en rute op (String-Pulling + Kyst-stramning), så soldaterne går i
 * snorlige linjer hen over græs, marker, skov og bygninger — og kun drejer
 * ved vand (langs kysten/stranden) eller for at gå over en bro.
 */
// Hvor mange punkter frem stramningen prøver at springe over ad gangen. Uden grænse prøver den
// alle punkter til enden af ruten fra hvert punkt, og det tager et halvt minut på en rute på 190 km.
const STRING_PULL_LOOKAHEAD = 30;

// Giver browseren et øjeblik til at tegne (så "Beregner rute…" ikke fryser).
const yieldToBrowser = () => new Promise(r => setTimeout(r, 0));

async function tightenPathAcrossLand(rawPts) {
    if (!rawPts || rawPts.length <= 2) return rawPts;

    function stringPull(pts) {
        const out = [pts[0]];
        let i = 0;
        while (i < pts.length - 1) {
            let next = i + 1;
            for (let j = Math.min(pts.length - 1, i + STRING_PULL_LOOKAHEAD); j >= i + 2; j--) {
                if (!segmentCrossesWater(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) {
                    next = j;
                    break;
                }
            }
            out.push(pts[next]);
            i = next;
        }
        return out;
    }

    // 1. Første grov-stramning hen over alt tørt land
    let path = stringPull(rawPts);
    await yieldToBrowser();

    // 2. Indsæt ekstra mellempunkter langs kyst-strækninger og træk hjørnerne helt ind til strandkanten
    const refined = [path[0]];
    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        const d = Grid.distanceM(a[0], a[1], b[0], b[1]);
        if (d > 1200 && i > 0 && i < path.length - 2) {
            const steps = Math.min(6, Math.ceil(d / 1000));
            for (let s = 1; s < steps; s++) {
                const t = s / steps;
                const mLat = a[0] + (b[0] - a[0]) * t;
                const mLon = a[1] + (b[1] - a[1]) * t;
                if (!isWaterAt(mLat, mLon)) refined.push([mLat, mLon]);
            }
        }
        refined.push(b);
    }
    path = refined;

    const rounds = path.length > 40 ? 2 : 5;
    for (let iter = 0; iter < rounds; iter++) {
        await yieldToBrowser();
        for (let k = 1; k < path.length - 1; k++) {
            const prev = path[k - 1];
            const cur = path[k];
            const next = path[k + 1];
            const midLat = (prev[0] + next[0]) * 0.5;
            const midLon = (prev[1] + next[1]) * 0.5;
            const candLat = cur[0] * 0.6 + midLat * 0.4;
            const candLon = cur[1] * 0.6 + midLon * 0.4;
            if (
                isPointOnScreen(candLat, candLon) &&
                !isWaterAt(candLat, candLon) &&
                !segmentCrossesWater(prev[0], prev[1], candLat, candLon) &&
                !segmentCrossesWater(candLat, candLon, next[0], next[1])
            ) {
                path[k] = [candLat, candLon];
            }
        }
        path = stringPull(path);
    }

    return path;
}

function waitForMapRender(timeoutMs = 450) {
    return new Promise((resolve) => {
        if (!map) return resolve();
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            setTimeout(resolve, 60);
        };
        map.once("idle", finish);
        setTimeout(finish, timeoutMs);
    });
}

async function ensureRouteInView(lat1, lon1, lat2, lon2) {
    if (!mapReady || !map) return;
    if (isPointOnScreen(lat1, lon1) && isPointOnScreen(lat2, lon2)) return;
    const minLon = Math.min(lon1, lon2) - 0.02;
    const maxLon = Math.max(lon1, lon2) + 0.02;
    const minLat = Math.min(lat1, lat2) - 0.015;
    const maxLat = Math.max(lat1, lat2) + 0.015;
    map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 80, duration: 0 });
    await waitForMapRender(500);
}

function simplifyPolyline(pts, tolDeg = 0.00035) {
    if (pts.length <= 2) return pts;
    const sqTol = tolDeg * tolDeg;

    function sqSegDist(p, a, b) {
        let x = a[0], y = a[1];
        let dx = b[0] - x, dy = b[1] - y;
        if (dx !== 0 || dy !== 0) {
            const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) { x = b[0]; y = b[1]; }
            else if (t > 0) { x += dx * t; y += dy * t; }
        }
        dx = p[0] - x;
        dy = p[1] - y;
        return dx * dx + dy * dy;
    }

    const keep = new Uint8Array(pts.length);
    keep[0] = 1;
    keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];

    while (stack.length > 0) {
        const [first, last] = stack.pop();
        let maxSq = 0;
        let idx = -1;
        for (let i = first + 1; i < last; i++) {
            const d = sqSegDist(pts[i], pts[first], pts[last]);
            if (d > maxSq) {
                maxSq = d;
                idx = i;
            }
        }
        if (maxSq > sqTol && idx !== -1) {
            keep[idx] = 1;
            stack.push([first, idx], [idx, last]);
        }
    }

    return pts.filter((_, i) => keep[i] === 1);
}

// Lokal A*-fallback hvis man er offline
function findLandPathLocal(startLat, startLon, targetTile) {
    const [endLat, endLon] = Grid.centreOf(targetTile);
    const direct = [[startLat, startLon], [endLat, endLon]];
    const distM = Grid.distanceM(startLat, startLon, endLat, endLon);
    const samples = Math.max(30, Math.min(200, Math.ceil(distM / 20)));
    if (!mapReady || !segmentCrossesWater(startLat, startLon, endLat, endLon, samples)) {
        return direct;
    }

    const spanLat = Math.max(Math.abs(endLat - startLat), 0.004);
    const spanLon = Math.max(Math.abs(endLon - startLon), 0.006);
    const minLat = Math.min(startLat, endLat) - spanLat * 0.45;
    const maxLat = Math.max(startLat, endLat) + spanLat * 0.45;
    const minLon = Math.min(startLon, endLon) - spanLon * 0.45;
    const maxLon = Math.max(startLon, endLon) + spanLon * 0.45;

    const rows = 56, cols = 56;
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

    // Glat ruten langs stranden med tæt vand-tjek
    const smoothed = [full[0]];
    let i = 0;
    while (i < full.length - 1) {
        let next = i + 1;
        for (let j = full.length - 1; j >= i + 2; j--) {
            const segDist = Grid.distanceM(full[i][0], full[i][1], full[j][0], full[j][1]);
            const segSamples = Math.max(20, Math.min(180, Math.ceil(segDist / 25)));
            if (!segmentCrossesWater(full[i][0], full[i][1], full[j][0], full[j][1], segSamples)) {
                next = j;
                break;
            }
        }
        smoothed.push(full[next]);
        i = next;
    }
    return smoothed;
}

/**
 * Finder korteste rute på land fra [startLat, startLon] til [targetTile].
 * - Soldaten går i snorlige linjer hen over græs, marker, skov og bygninger!
 * - Ruten bøjer KUN af ved vand (langs kysten/stranden eller over en bro).
 */
async function findLandPathAsync(startLat, startLon, targetTile) {
    const [endLat, endLon] = Grid.centreOf(targetTile);

    // Sørg for at hele ruten er i kortets synsfelt, så vand-lagene er tegnet og kan aflæses
    await ensureRouteInView(startLat, startLon, endLat, endLon);

    // Hvis fugleflugtslinjen slet ikke krydser vand, går soldaten 100% lige over land/bygninger/græs!
    if (!segmentCrossesWater(startLat, startLon, endLat, endLon)) {
        return [[startLat, startLon], [endLat, endLon]];
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/foot/${startLon.toFixed(6)},${startLat.toFixed(6)};${endLon.toFixed(6)},${endLat.toFixed(6)}?overview=full&geometries=geojson`;
        const resp = await fetch(url);
        if (resp.ok) {
            const json = await resp.json();
            const coords = json?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
                const rawLatLon = coords.map(c => [c[1], c[0]]);
                const base = [
                    [startLat, startLon],
                    ...simplifyPolyline(rawLatLon, 0.00018).slice(1, -1),
                    [endLat, endLon]
                ];
                return await tightenPathAcrossLand(base);
            }
        }
    } catch (_) {}

    return await tightenPathAcrossLand(findLandPathLocal(startLat, startLon, targetTile));
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

    const addTroop = async (count, lat, lon, enemy) => {
        await ensureTroopBadge(count, enemy);
        troopFeatures.push({
            type: "Feature",
            properties: { img: troopBadgeId(count, enemy) },
            geometry: { type: "Point", coordinates: [lon, lat] }
        });
    };

    // Fjender, som du kan se lige nu (positionen er et øjebliksbillede fra serveren)
    for (const g of state.enemies.garrisons) {
        const [lat, lon] = Grid.centreOf(g);
        await addTroop(g.count, lat, lon, true);
    }
    for (const m of state.enemies.marches) {
        await addTroop(m.count, m.lat, m.lon, true);
    }

    for (const g of state.garrisons) {
        if (g.count <= 0) continue;
        const [lat, lon] = Grid.centreOf(g);
        await addTroop(g.count, lat, lon, false);
    }

    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [lat, lon] = marchCurrentPos(m, now);
        await addTroop(m.count, lat, lon, false);
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

    const [cfgRes, balRes, matRes, myBldRes, bmRes, meRes] = await Promise.all([
        sb.from("config").select("key,value"),
        sb.from("player_balance").select("balance").eq("player_id", uid).maybeSingle(),
        sb.from("player_materials").select("material,amount").eq("player_id", uid),
        sb.from("buildings").select("x,y,owner_id,kind,level,emptied_at").eq("owner_id", uid),
        sb.from("bookmarks").select("x,y,purpose,note,created_at").order("created_at", { ascending: false }),
        sb.from("players").select("is_tester,is_admin").eq("id", uid).maybeSingle()
    ]);

    state.isTester = !!meRes.data?.is_tester;
    state.isAdmin = !!meRes.data?.is_admin;
    document.getElementById("btn-admin")?.classList.toggle("hidden", !state.isAdmin);

    if (cfgRes.data) {
        for (const row of cfgRes.data) {
            if (row.key === "grid" && row.value) {
                if (row.value.tile_size_m) Grid.tileSizeM = Number(row.value.tile_size_m);
                if (row.value.reference_lat) Grid.referenceLatDeg = Number(row.value.reference_lat);
                if (mapReady && map.getLayer("lyr-buildings")) {
                    map.setLayoutProperty("lyr-buildings", "icon-size", buildingIconSizeExpression());
                }
            }
            if (row.key === "rules" && row.value) {
                const r = row.value;
                if (r.instant_soldier_steps) GAME_CONFIG.INSTANT_SOLDIER_STEPS = Number(r.instant_soldier_steps);
                if (r.reach_m) GAME_CONFIG.BUILD_RADIUS_M = Number(r.reach_m);
                if (r.vision_m) GAME_CONFIG.VISION_RADIUS_M = Number(r.vision_m);
                if (r.soldier_vision_m) GAME_CONFIG.SOLDIER_VISION_M = Number(r.soldier_vision_m);
                if (r.soldier_speed_mps) GAME_CONFIG.SOLDIER_SPEED_MPS = Number(r.soldier_speed_mps);
                if (r.building_defense_per_level) GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL = Number(r.building_defense_per_level);
                for (const [k, bcfg] of Object.entries(GAME_CONFIG.BUILDINGS)) {
                    if (r.building_prices?.[k]) bcfg.prices = r.building_prices[k];
                    if (r.building_housing?.[k]) bcfg.housing = r.building_housing[k];
                    if (r.building_materials?.[k]) bcfg.materials = r.building_materials[k];
                    if (r.building_production?.[k]) bcfg.production = r.building_production[k];
                }
            }
        }
    }

    if (balRes.data && typeof balRes.data.balance === "number") {
        state.balance = balRes.data.balance;
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

    if (bmRes.data) {
        state.bookmarks = bmRes.data;
        renderBookmarksOnMap();
    }

    updateHud();
    renderBuildingsSidebar();
    renderTroopsSidebar();
    renderBookmarksSidebar();
    await refreshViewportData();
}

function bookmarkAt(x, y) {
    return state.bookmarks.find(b => b.x === x && b.y === y) || null;
}

function renderBookmarksOnMap() {
    if (!mapReady) return;
    map.getSource("src-bookmarks")?.setData({
        type: "FeatureCollection",
        features: state.bookmarks.map(b => ({
            type: "Feature",
            properties: { purpose: b.purpose },
            geometry: { type: "Polygon", coordinates: [Grid.cornersOf(b)] }
        }))
    });
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
    const bm = bookmarkAt(tile.x, tile.y);

    let ownerBadge = `<span class="badge">Neutralt felt</span>`;
    if (isMine) ownerBadge = `<span class="badge badge-green">Dit territorium</span>`;
    else if (tileOwner) ownerBadge = `<span class="badge" style="color:#FF2E88">Fjendtligt felt</span>`;

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Terræn: ${terr.name}</strong>
            ${ownerBadge}
        </div>
    `;

    if (bm) {
        html += `
            <div class="bookmark-chip bookmark-${bm.purpose}">
                <span>📌 Bogmærket som <strong>${bm.purpose === "build" ? "byggeplads" : "mål"}</strong>${bm.note ? ` · ${escapeHtml(bm.note)}` : ""}</span>
                <button class="btn btn-small btn-muted" onclick="deleteBookmark(${tile.x}, ${tile.y})">Fjern</button>
            </div>
        `;
    }

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
    } else if (!bld && !tileOwner || (!bld && isMine)) {
        if (bm?.purpose === "build") {
            html += `<div class="muted-hint" style="margin-bottom:8px;">Du har stået her med telefonen, så du kan bygge her hjemmefra:</div>`;
            html += buildChoicesHtml(tile, terr);
        } else if (state.isTester) {
            html += `<div class="muted-hint" style="margin-bottom:8px;"><span class="badge badge-gold">Testkonto</span> Du må bygge her uden bogmærke fra telefonen:</div>`;
            html += buildChoicesHtml(tile, terr);
        } else {
            html += `<p class="muted-hint">${isMine ? "Dette felt er dit, men" : "Tomt felt —"} nye bygninger kræver et <strong>byggepladsbogmærke</strong>: gå hen til feltet med telefonen (inden for ${GAME_CONFIG.BUILD_RADIUS_M} m) og bogmærk det. Soldater kan du sende hertil når som helst.</p>`;
        }
        if (!isMine) {
            html += `<p class="muted-hint fog-hint">Fjender er skjulte. Feltet kan godt tilhøre en fjende, medmindre din telefon er inden for ${GAME_CONFIG.VISION_RADIUS_M} m.</p>`;
        }
    } else if (!isMine) {
        const enemyGar = state.enemies.garrisons.find(g => g.x === tile.x && g.y === tile.y)?.count || 0;
        const bldDef = bld ? GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL * bld.level : 0;
        const bldName = bld ? (GAME_CONFIG.BUILDINGS[bld.kind]?.name || bld.kind) + ` (trin ${bld.level})` : null;
        html += `<p class="muted-hint">Fjendtligt felt — du kan se det lige nu, fordi din telefon (${GAME_CONFIG.VISION_RADIUS_M} m) eller dine soldater (${GAME_CONFIG.SOLDIER_VISION_M} m) er tæt på. Det forsvinder igen, når de går.</p>`;
        html += `<p class="muted-hint"><strong>Forsvar:</strong> ${enemyGar} vagter${bldName ? ` + ${bldDef} fra ${bldName}` : ""}. Send mindst <strong>${enemyGar + bldDef + 1}</strong> soldater for at erobre feltet${bldName ? " (bygningen jævnes med jorden)" : ""}.</p>`;
    }

    if (!(bld && isMine) && terr.id !== "water") {
        html += `<div class="item-actions" style="margin-top:8px;"><button class="btn btn-small btn-primary" onclick="sendSoldiersTo(${tile.x}, ${tile.y})">🪖 Send soldater hertil</button></div>`;
    }

    box.innerHTML = html;
}

function buildChoicesHtml(tile, terr) {
    let html = "";
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
    return html;
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ============================================================================
// Bogmærker (sat med telefonen) & Spejder-advarsler
// ============================================================================
function renderBookmarksSidebar() {
    const list = document.getElementById("bookmarks-list");
    const badge = document.getElementById("bookmarks-summary-badge");
    if (!list) return;
    badge.textContent = `${state.bookmarks.length} gemt`;

    if (state.bookmarks.length === 0) {
        list.innerHTML = `<p class="muted-hint">Ingen bogmærker endnu. Tag telefonen med ud, tryk på et felt og gem det som <strong>byggeplads</strong> (så kan du bygge der herfra) eller som <strong>mål</strong> for dine soldater.</p>`;
        return;
    }

    list.innerHTML = state.bookmarks.map(b => {
        const isBuild = b.purpose === "build";
        const built = state.myBuildings.some(mb => mb.x === b.x && mb.y === b.y);
        return `
            <div class="item-row">
                <div class="item-row-top">
                    <div class="bookmark-icon bookmark-${b.purpose}">${isBuild ? "🔨" : "🎯"}</div>
                    <div class="item-info">
                        <div class="item-title">${isBuild ? "Byggeplads" : "Mål"} · felt ${b.x},${b.y}</div>
                        <div class="item-sub">${b.note ? escapeHtml(b.note) + " · " : ""}Gemt ${new Date(b.created_at).toLocaleDateString("da-DK")}${built ? " · bebygget" : ""}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToTile(${b.x}, ${b.y})">🎯 Hop til</button>
                    <button class="btn btn-small btn-primary" onclick="sendSoldiersTo(${b.x}, ${b.y})">🪖 Send soldater</button>
                    <button class="btn btn-small btn-muted" onclick="deleteBookmark(${b.x}, ${b.y})">Fjern</button>
                </div>
            </div>
        `;
    }).join("");
}

window.deleteBookmark = async function(x, y) {
    const { error } = await sb.from("bookmarks").delete()
        .eq("player_id", state.user.id).eq("x", x).eq("y", y);
    if (error) {
        showToast("Kunne ikke fjerne bogmærket: " + error.message);
        return;
    }
    state.bookmarks = state.bookmarks.filter(b => !(b.x === x && b.y === y));
    renderBookmarksOnMap();
    renderBookmarksSidebar();
    if (state.selectedTile) renderSelectedTileBox();
};

// Send soldater fra den nærmeste egne barrak til et felt — et bogmærke eller hvor som helst i verden.
window.sendSoldiersTo = function(x, y) {
    const barracks = state.myBuildings.filter(b => b.kind === "barracks");
    if (barracks.length === 0) {
        showToast("Du har ingen barrak at sende soldater fra.");
        return;
    }
    const avail = availableInBarracks();
    if (avail <= 0) {
        showToast("Du har ingen ledige soldater i dine barrakker.");
        return;
    }
    const [tLat, tLon] = Grid.centreOf({ x, y });
    const from = barracks.reduce((best, b) => {
        const [lat, lon] = Grid.centreOf(b);
        const d = Grid.distanceM(lat, lon, tLat, tLon);
        return !best || d < best.d ? { b, d } : best;
    }, null).b;
    window.openSendSoldiersModal(from.x, from.y, avail, false, { x, y });
};

async function pollScoutAlerts() {
    if (!state.user) return;
    const { data, error } = await sb.rpc("scout_alerts");
    if (error) return;
    state.scoutAlerts = data || [];
    renderScoutBanner();
}

function renderScoutBanner() {
    const el = document.getElementById("scout-banner");
    if (!el) return;
    if (state.scoutAlerts.length === 0) {
        el.classList.add("hidden");
        return;
    }
    const lines = state.scoutAlerts.map(a => {
        const cfg = GAME_CONFIG.BUILDINGS[a.kind];
        const name = cfg ? cfg.name : a.kind;
        const who = a.scouts === 1 ? "En fjendtlig spejder" : `${a.scouts} fjendtlige spejdere`;
        return `<div>⚠️ ${who} er inden for ca. ${GAME_CONFIG.VISION_RADIUS_M} m af din <a href="#" onclick="jumpToTile(${a.x}, ${a.y}); return false;">${name} (felt ${a.x},${a.y})</a>.</div>`;
    });
    el.innerHTML = lines.join("");
    el.classList.remove("hidden");
}

// ============================================================================
// Byg, Opgradér, Indkald, Straks-uddan & Riv ned via Supabase RPC
// ============================================================================
async function buildOrUpgrade(kindId, x, y, terrainId) {
    const [lat, lon] = Grid.centreOf({ x, y });
    const serverTerrain = terrainId === "water" ? "water" : "ground";
    const { data, error } = await sb.rpc("build", {
        p_kind: kindId,
        p_x: x,
        p_y: y,
        p_lat: lat,
        p_lon: lon,
        p_terrain: serverTerrain
    });
    if (error) {
        showToast("Kunne ikke bygge: " + error.message);
        return;
    }
    showToast(`Bygning opført/opgraderet til trin ${data?.level ?? ""}!`);
    await syncAllFromSupabase();
}

async function collectFromBuilding(x, y) {
    if (state.soldiers >= totalSoldierCapacity()) {
        showToast(`Dine barrakker er fulde (${state.soldiers}/${totalSoldierCapacity()})! Opgradér en barrak først.`);
        return;
    }
    const [lat, lon] = Grid.centreOf({ x, y });
    const { data, error } = await sb.rpc("collect", {
        p_x: x,
        p_y: y,
        p_lat: lat,
        p_lon: lon,
        p_remote: true
    });
    if (error) {
        showToast("Kunne ikke indkalde: " + error.message);
        return;
    }
    showToast(`+${data?.amount ?? 0} soldater føjet til din barrak!`);
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
    const { data, error } = await sb.rpc("recruit_soldier");
    if (!error && data) {
        showToast(`+1 Soldat uddannet straks! (${GAME_CONFIG.INSTANT_SOLDIER_STEPS} skridt)`);
        await syncAllFromSupabase();
    } else {
        showToast("Kunne ikke straks-uddanne: " + (error?.message || "Ukendt fejl"));
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
        const nextPrice = cfg && b.level < cfg.prices.length ? cfg.prices[b.level] : null;
        const nextSteel = cfg?.materials?.[b.level]?.steel || 0;
        const canAfford = nextPrice !== null && state.balance >= nextPrice && state.steel >= nextSteel;

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
                    ${nextPrice !== null
                        ? `<button class="btn btn-small" ${canAfford ? "" : `title="Du har ${state.balance} skridt${nextSteel ? ` og ${state.steel} stål` : ""}"`} onclick="buildOrUpgrade('${b.kind}', ${b.x}, ${b.y}, 'ground')">⬆️ Trin ${b.level + 1} (${nextPrice} skridt${nextSteel ? ` + ${nextSteel} stål` : ""})</button>`
                        : `<span class="badge">Fuldt udbygget</span>`}
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
        const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
        const prog = Math.max(2, Math.min(100, ((now - m.startedAtMillis) / totalMs) * 100));

        html += `
            <div class="item-row" data-march-id="${m.id}">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title item-title-green">${m.count} soldater på march</div>
                        <div class="item-sub march-eta-text">${marchEtaText(m, now)}</div>
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

// "3,2 km tilbage · Ankomst om 1t 4m" — resterende distance langs delingens rute.
function marchEtaText(m, now = Date.now()) {
    const remSec = Math.max(0, Math.ceil((m.arrivesAtMillis - now) / 1000));
    return `${formatDistance(pathDistanceM(marchRemainingPath(m, now)))} tilbage · Ankomst om ${formatSeconds(remSec)}`;
}

function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

// Opdaterer KUN nedtællingsteksten og bjælken hvert sekund uden at blinke!
function updateLiveTroopCountdowns() {
    const now = Date.now();
    for (const m of state.marches) {
        const row = document.querySelector(`.item-row[data-march-id="${m.id}"]`);
        if (!row) continue;
        const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
        const prog = Math.max(2, Math.min(100, ((now - m.startedAtMillis) / totalMs) * 100));

        const etaEl = row.querySelector(".march-eta-text");
        if (etaEl) etaEl.textContent = marchEtaText(m, now);
        const barEl = row.querySelector(".march-prog-bar");
        if (barEl) barEl.style.width = `${prog.toFixed(1)}%`;
    }
}

// ============================================================================
// Udsendelse af soldater, Omdirigering, Hjemkaldelse & Ankomst
// ============================================================================
window.openSendSoldiersModal = function(fromX, fromY, maxAvail, fromGarrison, target = null) {
    if (maxAvail <= 0) return;
    const overlay = document.getElementById("modal-overlay");
    document.getElementById("modal-title").textContent = "Send soldater på march";
    document.getElementById("modal-body").innerHTML = `
        <p>Vælg hvor mange soldater du vil sende af sted fra felt ${fromX},${fromY}${target ? ` mod felt ${target.x},${target.y}` : ""}:</p>
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
        <button class="btn btn-primary" id="btn-pick-target-confirm">${target ? "➡️ Videre" : "🎯 Vælg mål på kortet"}</button>
    `;
    document.getElementById("btn-pick-target-confirm").onclick = () => {
        const chosen = parseInt(slider.value, 10) || 1;
        closeModal();
        const order = { fromTile: { x: fromX, y: fromY }, count: chosen, fromGarrison };
        if (target) openConfirmMarchModal(order, target);
        else enterMarchTargetMode(order);
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

function showRouteCalculating(targetTile) {
    document.getElementById("modal-title").textContent = "Beregner rute…";
    document.getElementById("modal-body").innerHTML = `
        <div class="route-calculating">
            <div class="spinner"></div>
            <p>Finder vejen over land til felt ${targetTile.x},${targetTile.y}. Lange ruter langs kysten kan tage et par sekunder.</p>
        </div>
    `;
    document.getElementById("modal-actions").innerHTML = "";
    document.getElementById("modal-overlay").classList.remove("hidden");
}

async function openConfirmMarchModal(order, targetTile) {
    showRouteCalculating(targetTile);
    const now = Date.now();
    let startPos;
    if (order.redirectMarchId) {
        const old = state.marches.find(m => m.id === order.redirectMarchId);
        startPos = old ? marchCurrentPos(old, now) : Grid.centreOf(order.fromTile);
    } else {
        startPos = Grid.centreOf(order.fromTile);
    }

    const landPath = await findLandPathAsync(startPos[0], startPos[1], targetTile);
    const distM = Math.round(pathDistanceM(landPath));
    const durationSec = Math.max(2, Math.round(distM / GAME_CONFIG.SOLDIER_SPEED_MPS));

    const overlay = document.getElementById("modal-overlay");
    document.getElementById("modal-title").textContent = `Send ${order.count} soldater af sted?`;
    document.getElementById("modal-body").innerHTML = `
        <p><strong>Mål:</strong> Felt ${targetTile.x},${targetTile.y}</p>
        <p><strong>Afstand langs land/kyst:</strong> ca. ${formatDistance(distM)}</p>
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
        executeMarchOrder(order, targetTile, landPath);
    };
    overlay.classList.remove("hidden");
}

async function executeMarchOrder(order, targetTile, landPath) {
    let error;
    if (order.redirectMarchId) {
        // Delingen er gået videre, mens ruten blev beregnet og bekræftet: start fra hvor den er nu.
        const m = state.marches.find(x => x.id === order.redirectMarchId);
        const path = m ? [marchCurrentPos(m, Date.now()), ...landPath.slice(1)] : landPath;
        ({ error } = await sb.rpc("redirect_march", {
            p_march: order.redirectMarchId, p_to_x: targetTile.x, p_to_y: targetTile.y, p_path: path
        }));
    } else {
        ({ error } = await sb.rpc("start_march", {
            p_from_x: order.fromTile.x, p_from_y: order.fromTile.y,
            p_to_x: targetTile.x, p_to_y: targetTile.y,
            p_count: order.count, p_path: landPath
        }));
    }
    if (error) {
        showToast("Kunne ikke sende soldaterne: " + error.message);
        return;
    }
    await loadArmy();
    showToast(order.redirectMarchId
        ? `Ny ordre: ${order.count} soldater går nu mod felt ${targetTile.x},${targetTile.y}!`
        : `${order.count} soldater er på vej mod felt ${targetTile.x},${targetTile.y}!`);
}

// Knapperne sender id'et som tekst, serveren giver det som tal.
function findMarch(marchId) {
    return state.marches.find(x => String(x.id) === String(marchId));
}

window.startRedirectMarch = function(marchId) {
    const m = findMarch(marchId);
    if (!m) return;
    enterMarchTargetMode({
        fromTile: { x: m.homeX, y: m.homeY },
        count: m.count,
        redirectMarchId: m.id
    });
    showToast("Klik på det nye målfelt på kortet!");
};

window.recallMarch = async function(marchId) {
    const m = findMarch(marchId);
    if (!m) return;
    const cur = marchCurrentPos(m, Date.now());
    const homeTile = { x: m.homeX, y: m.homeY };
    showToast("Beregner ruten hjem…");
    const homePath = await findLandPathAsync(cur[0], cur[1], homeTile);
    const path = [marchCurrentPos(m, Date.now()), ...homePath.slice(1)];
    const { error } = await sb.rpc("redirect_march", {
        p_march: m.id, p_to_x: homeTile.x, p_to_y: homeTile.y, p_path: path
    });
    if (error) {
        showToast("Kunne ikke kalde delingen hjem: " + error.message);
        return;
    }
    await loadArmy();
    showToast(`${m.count} soldater vender om og går hjem til barrakken!`);
};

window.jumpToTile = function(x, y) {
    if (!map) return;
    const [lat, lon] = Grid.centreOf({ x, y });
    map.flyTo({ center: [lon, lat], zoom: 17.2, duration: 700 });
    onMapTileClicked({ x, y });
};

window.jumpToMarch = function(marchId) {
    const m = findMarch(marchId);
    if (!m || !map) return;
    const [lat, lon] = marchCurrentPos(m, Date.now());
    map.flyTo({ center: [lon, lat], zoom: 17.0, duration: 700 });
};

let resolvingArrivals = false;
async function tickMarches() {
    const now = Date.now();
    if (!resolvingArrivals && state.marches.some(m => now >= m.arrivesAtMillis)) {
        // Serveren afgør ankomsten (indtagelse/kamp), når nogen spørger efter verden.
        resolvingArrivals = true;
        try {
            await pollWorld();
            await loadArmy();
            await syncAllFromSupabase();
        } finally {
            resolvingArrivals = false;
        }
        return;
    }
    updateLiveTroopCountdowns();
    renderTroopsOnMap();
}

const REPORT_TEXT = {
    returned:   r => `${r.count} soldater er vendt hjem til barrakken på felt ${r.x},${r.y}.`,
    captured:   r => `Dine ${r.count} soldater har indtaget felt ${r.x},${r.y} og står nu vagt!`,
    reinforced: r => `${r.count} soldater er nået frem til felt ${r.x},${r.y} og forstærker vagten.`,
    victory:    r => `⚔️ Sejr på felt ${r.x},${r.y}! ${r.survivors} af dine ${r.count} soldater overlevede, og fjenden mistede ${r.enemy_losses}. Feltet er dit.`,
    defeat:     r => `⚔️ Angrebet på felt ${r.x},${r.y} blev slået tilbage. Alle ${r.count} soldater faldt (fjenden mistede ${r.enemy_losses}).`,
    defended:   r => `🛡️ Dit felt ${r.x},${r.y} blev angrebet af ${r.enemy_losses} soldater, men holdt! Du mistede ${r.losses}.`,
    lost:       r => `🔥 Du har mistet felt ${r.x},${r.y} til et angreb. ${r.losses} vagter faldt.`
};

// Rapporter om ankomster og kampe — også dem, der skete mens du var væk.
async function loadReports() {
    if (!state.user) return;
    const { data } = await sb.from("march_reports")
        .select("id,kind,x,y,count,survivors,losses,enemy_losses")
        .eq("seen", false)
        .order("id", { ascending: true });
    if (!data || data.length === 0) return;
    for (const r of data) {
        const text = REPORT_TEXT[r.kind];
        if (text) queueToast(text(r));
    }
    await sb.from("march_reports").update({ seen: true }).in("id", data.map(r => r.id));
}

// Henter alt fjendtligt, du kan se lige nu (telefonen + egne soldater), og melder nye fund.
let pollingWorld = false;
async function pollWorld() {
    if (!state.user || pollingWorld) return;
    pollingWorld = true;
    try {
        const { data, error } = await sb.rpc("visible_enemies");
        if (error || !data) return;
        state.enemies = {
            tiles: data.tiles || [],
            buildings: data.buildings || [],
            garrisons: data.garrisons || [],
            marches: data.marches || []
        };
        announceSightings();
        renderWorld();
        renderTroopsOnMap();
        renderContactsSidebar();
        if (state.selectedTile) renderSelectedTileBox();
    } finally {
        pollingWorld = false;
    }
}

function enemyKey(kind, o) {
    return kind === "march" ? `m${o.id}` : `${kind}${o.x},${o.y}`;
}

// "Dine soldater har fået øje på ..." — kun første gang, de ser noget.
function announceSightings() {
    const now = new Set();
    const fresh = [];
    for (const b of state.enemies.buildings.filter(b => b.by_soldiers)) {
        const k = enemyKey("b", b);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) {
            const name = GAME_CONFIG.BUILDINGS[b.kind]?.name || b.kind;
            fresh.push(`👁️ Dine soldater har fået øje på en fjendtlig ${name.toLowerCase()} (trin ${b.level}) på felt ${b.x},${b.y}.`);
        }
    }
    for (const g of state.enemies.garrisons.filter(g => g.by_soldiers)) {
        const k = enemyKey("g", g);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) fresh.push(`👁️ Dine soldater har fået øje på ${g.count} fjendtlige vagter på felt ${g.x},${g.y}.`);
    }
    for (const m of state.enemies.marches.filter(m => m.by_soldiers)) {
        const k = enemyKey("march", m);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) fresh.push(`👁️ Dine soldater har fået øje på ${m.count} fjendtlige soldater på march.`);
    }
    state.seenBySoldiers = now;
    fresh.forEach(queueToast);
}

function renderContactsSidebar() {
    const list = document.getElementById("contacts-list");
    const badge = document.getElementById("contacts-summary-badge");
    if (!list) return;
    const e = state.enemies;
    const total = e.buildings.length + e.garrisons.length + e.marches.length;
    badge.textContent = `${total} set`;

    if (total === 0) {
        list.innerHTML = `<p class="muted-hint">Ingen fjender i sigte. Du ser fjender inden for ${GAME_CONFIG.VISION_RADIUS_M} m af din telefon og ${GAME_CONFIG.SOLDIER_VISION_M} m af dine soldater.</p>`;
        return;
    }

    const who = o => o.by_soldiers ? "set af dine soldater" : "set med telefonen";
    const rows = [];
    for (const b of e.buildings) {
        const cfg = GAME_CONFIG.BUILDINGS[b.kind];
        const sprite = cfg ? cfg.sprites[Math.min(b.level, cfg.sprites.length) - 1] : "barrak_1";
        rows.push(`
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/${sprite}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title enemy-title">${cfg ? cfg.name : b.kind} (trin ${b.level})</div>
                        <div class="item-sub">Felt ${b.x},${b.y} · ${who(b)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToTile(${b.x}, ${b.y})">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${b.x}, ${b.y})">⚔️ Angrib</button>
                </div>
            </div>`);
    }
    for (const g of e.garrisons) {
        rows.push(`
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title enemy-title">${g.count} fjendtlige vagter</div>
                        <div class="item-sub">Felt ${g.x},${g.y} · ${who(g)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToTile(${g.x}, ${g.y})">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${g.x}, ${g.y})">⚔️ Angrib</button>
                </div>
            </div>`);
    }
    for (const m of e.marches) {
        rows.push(`
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title enemy-title">${m.count} fjendtlige soldater på march</div>
                        <div class="item-sub">${who(m)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="map.flyTo({ center: [${m.lon}, ${m.lat}], zoom: 17, duration: 700 })">🎯 Hop til</button>
                </div>
            </div>`);
    }
    list.innerHTML = rows.join("");
}

// ============================================================================
// Admin: spillerliste med flueben for testkonto
// ============================================================================
async function openAdminModal() {
    document.getElementById("modal-title").textContent = "Admin: spillere";
    document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Henter spillere…</p>`;
    document.getElementById("modal-actions").innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    document.getElementById("modal-overlay").classList.remove("hidden");

    const { data, error } = await sb.rpc("admin_list_players");
    if (error) {
        document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Kunne ikke hente spillerne: ${escapeHtml(error.message)}</p>`;
        return;
    }

    const rows = (data || []).map(p => `
        <tr>
            <td>
                <div>${p.email ? escapeHtml(p.email) : `<span class="muted-hint">anonym telefon-konto</span>`}</div>
                <div class="admin-sub">${escapeHtml(p.display_name)}${p.is_admin ? " · admin" : ""} · oprettet ${new Date(p.created_at).toLocaleDateString("da-DK")}</div>
            </td>
            <td class="admin-check">
                <label>
                    <input type="checkbox" ${p.is_tester ? "checked" : ""} onchange="setTester('${p.id}', this)" />
                    Testkonto
                </label>
            </td>
        </tr>
    `).join("");

    document.getElementById("modal-body").innerHTML = `
        <p class="muted-hint">En testkonto må bygge på ethvert ledigt felt uden bogmærke fra telefonen. Spilleren skal genindlæse siden, før det slår igennem.</p>
        <div class="admin-list"><table class="admin-table">${rows}</table></div>
    `;
}

window.setTester = async function(playerId, checkbox) {
    checkbox.disabled = true;
    const { error } = await sb.rpc("admin_set_tester", { p_player: playerId, p_on: checkbox.checked });
    checkbox.disabled = false;
    if (error) {
        checkbox.checked = !checkbox.checked;
        showToast("Kunne ikke gemme: " + error.message);
        return;
    }
    showToast(checkbox.checked ? "Testkonto slået til." : "Testkonto slået fra.");
    if (playerId === state.user?.id) {
        state.isTester = checkbox.checked;
        if (state.selectedTile) renderSelectedTileBox();
    }
};

// ============================================================================
// Hjælpefunktioner & Login-håndtering
// ============================================================================
window.closeModal = function() {
    document.getElementById("modal-overlay").classList.add("hidden");
};

const toastQueue = [];
let toastBusy = false;
function queueToast(msg) {
    toastQueue.push(msg);
    if (!toastBusy) nextToast();
}

function nextToast() {
    const msg = toastQueue.shift();
    if (!msg) {
        toastBusy = false;
        return;
    }
    toastBusy = true;
    showToast(msg);
    setTimeout(nextToast, 4800);
}

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
    // Tropper lå tidligere kun i browseren; nu er serveren den eneste sandhed.
    try {
        localStorage.removeItem("hf_marches");
        localStorage.removeItem("hf_garrisons");
    } catch (_) {}
    await syncAllFromSupabase();
    await loadArmy();
    await pollWorld();
    await loadReports();
    pollScoutAlerts();
}

// ---------------------------------------------------------------- log ind / opret konto
// "Opret ny konto" skifter først formularen til oprettelse (med brugernavn); næste tryk opretter.
let authMode = "login";

const AUTH_ERRORS = [
    ["Invalid login credentials", "Forkert e-mail eller kodeord."],
    ["User already registered", "Der findes allerede en konto med den e-mail. Log ind i stedet."],
    ["Password should be at least", "Kodeordet skal være mindst 6 tegn."],
    ["Unable to validate email address", "E-mailadressen ser forkert ud."],
    ["Email not confirmed", "E-mailen er ikke bekræftet endnu. Tjek din indbakke."],
    ["Anonymous sign-ins are disabled", "Udfyld e-mail og kodeord."],
    ["rate limit", "For mange forsøg. Vent et øjeblik og prøv igen."]
];

function showAuthError(message) {
    const errEl = document.getElementById("auth-error");
    const known = AUTH_ERRORS.find(([en]) => message.toLowerCase().includes(en.toLowerCase()));
    errEl.textContent = known ? known[1] : message;
    errEl.classList.remove("hidden");
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    document.getElementById("auth-username-group").classList.toggle("hidden", !signup);
    document.getElementById("auth-error").classList.add("hidden");
    document.getElementById("auth-intro").textContent = signup
        ? "Opret en konto med et brugernavn, din e-mail og et kodeord. Samme konto bruges på telefonen."
        : "Log ind med samme e-mail og kodeord som på din telefon for at se dine skridt, bygninger og soldater på stor skærm.";
    document.getElementById("btn-login").textContent = signup ? "Jeg har allerede en konto" : "Log ind i Kommandocentralen";
    document.getElementById("btn-signup").textContent = signup ? "Opret konto" : "Opret ny konto";
    // Den grønne knap er altid det, man er i gang med.
    document.getElementById("btn-login").classList.toggle("btn-primary", !signup);
    document.getElementById("btn-login").classList.toggle("btn-secondary", signup);
    document.getElementById("btn-signup").classList.toggle("btn-primary", signup);
    document.getElementById("btn-signup").classList.toggle("btn-secondary", !signup);
    document.getElementById("auth-password").autocomplete = signup ? "new-password" : "current-password";
    if (signup) document.getElementById("auth-username").focus();
}

function readAuthFields() {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    if (!email || !password) {
        showAuthError("Udfyld både e-mail og kodeord.");
        return null;
    }
    return { email, password };
}

document.getElementById("btn-login").onclick = async () => {
    if (authMode === "signup") {
        setAuthMode("login");
        return;
    }
    document.getElementById("auth-error").classList.add("hidden");
    const fields = readAuthFields();
    if (!fields) return;

    const { data, error } = await sb.auth.signInWithPassword(fields);
    if (error) {
        showAuthError(error.message);
        return;
    }
    if (data?.user) onSignedIn(data.user);
};

document.getElementById("btn-signup").onclick = async () => {
    if (authMode === "login") {
        setAuthMode("signup");
        return;
    }
    document.getElementById("auth-error").classList.add("hidden");
    const username = document.getElementById("auth-username").value.trim();
    if (!username) {
        showAuthError("Vælg et brugernavn.");
        return;
    }
    const fields = readAuthFields();
    if (!fields) return;
    if (fields.password.length < 6) {
        showAuthError("Kodeordet skal være mindst 6 tegn.");
        return;
    }

    // Brugernavnet følger med som metadata; serveren sætter det på spillerprofilen (0008).
    const { data, error } = await sb.auth.signUp({ ...fields, options: { data: { display_name: username } } });
    if (error) {
        showAuthError(error.message);
        return;
    }
    if (data?.session && data.user) {
        onSignedIn(data.user);
    } else {
        showAuthError("Kontoen er oprettet. Bekræft din e-mail, og log så ind.");
    }
};

document.getElementById("btn-logout").onclick = async () => {
    await sb.auth.signOut();
    state.user = null;
    state.scoutAlerts = [];
    state.isAdmin = false;
    state.isTester = false;
    document.getElementById("btn-admin").classList.add("hidden");
    state.marches = [];
    state.garrisons = [];
    state.enemies = { tiles: [], buildings: [], garrisons: [], marches: [] };
    state.seenBySoldiers = new Set();
    renderScoutBanner();
    document.getElementById("auth-overlay").classList.remove("hidden");
};

document.getElementById("btn-sync").onclick = () => syncAllFromSupabase();
document.getElementById("btn-admin").onclick = () => openAdminModal();
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
setInterval(pollScoutAlerts, GAME_CONFIG.SCOUT_POLL_MS);
setInterval(async () => {
    if (!state.user) return;
    await pollWorld();
    await loadReports();
}, GAME_CONFIG.WORLD_POLL_MS);
