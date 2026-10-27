// ============================================================================
// HOME FRONT — Command Center (PC Browser-udgave koblet på Supabase)
// ============================================================================

// Hjemmesidens versionsnummer. Hæves sammen med ?v=… i index.html, hver gang web/ ændres.
const APP_VERSION = 81;

const SUPABASE_URL = "https://gtajdqbqbcqqgooaqahe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vH5S1tfDep32Umb_Ofy5_A_vlq0pmH1";
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const GAME_CONFIG = {
    // Alle afstande i meter og farter i m/s. Overskrives af config.rules fra serveren.
    BUILDING_GAP_M: 10,      // mindste afstand mellem to bygningers kanter
    BUILD_BOOKMARK_M: 50,    // et byggepladsbogmærke er en firkant på 50×50 m
    BUILD_CHAIN_M: 100,      // ny bygning højst 100 m (kant til kant) fra en af dine egne
    GARRISON_MERGE_M: 25,    // soldater inden for 25 m af hinanden er én vagtstyrke
    SOLDIER_SPEED_MPS: 30 / 18,
    SOLDIER_VISION_M: 250,
    FIRE_RANGE_M: 75,        // skudafstand mellem soldater og fjendtlige patruljer
    SOLDIER_HP: 100,         // energi pr. soldat
    NPC_SPAWN_CHECK_MS: 5 * 60 * 1000, // så tit browseren ser efter, om der mangler patruljer
    WORLD_POLL_MS: 15000,
    INSTANT_SOLDIER_STEPS: 100,
    BUILDING_DEFENSE_PER_LEVEL: 2,
    BUILD_RADIUS_M: 100,
    VISION_RADIUS_M: 500,
    SCOUT_POLL_MS: 30000,
    // Let morter (0022). Overskrives af config.rules (mortar_*).
    MORTAR: {
        priceSteps: 300, priceSteel: 40,       // én morter
        shellSteps: 10, shellSteel: 5,         // én granat
        rangeM: 5000, minRangeM: 75,
        spreadBaseM: 20, spreadPct: 0.02,      // spredningscirklens radius = base + procent af afstanden
        blastM: 50,                            // soldater inden for denne afstand af nedslaget rammes af splinter
        crew: 2,                               // soldater pr. morter
        reloadS: 4, salvoMax: 10,
        flightBaseS: 8, flightMps: 150,        // flyvetid = base + afstand / fart
        craterHours: 24
    },
    // Lastbil (0028). Overskrives af config.rules (truck_*).
    TRUCK: {
        priceSteps: 100, priceSteel: 100,      // én lastbil
        capacity: 22,                          // soldater pr. lastbil
        roadMps: 22.22, fieldMps: 5.556,       // 80 km/t på vej, 20 km/t uden for vejene
        hp: 300,                               // energi pr. lastbil
        hitShare: 0.4,                         // andel af træfferne, der rammer en lastbil
        wreckHours: 24                         // så længe et udbrændt vrag kan ses
    },
    // Haubits (0032), står ved barrakken og skyder derfra. Overskrives af config.rules (howitzer_*).
    HOWITZER: {
        priceSteps: 1500, priceSteel: 400,     // én haubits
        shellSteps: 30, shellSteel: 15,        // én haubitsgranat
        rangeM: 15000, minRangeM: 500,
        spreadBaseM: 30, spreadPct: 0.01,      // spredningscirklens radius = base + procent af afstanden
        blastM: 100,                           // soldater inden for denne afstand af nedslaget rammes af splinter
        hits: 8,                               // træffere midt i nedslaget
        crew: 4,                               // ledige soldater i barrakken pr. haubits
        reloadS: 10, salvoMax: 10,
        flightBaseS: 10, flightMps: 300,       // flyvetid = base + afstand / fart
        enabled: false                         // sand, når 0032 er kørt (reglerne kender haubitsen)
    },
    // Kortets bygninger brænder, når en mortergranat lander i dem (0030). Overskrives af config.rules (map_*).
    MAP_FIRE: {
        chance: 0.3,                           // chance for at en granat sætter bygningen i brand
        fireHours: 24,                         // så længe den brænder
        ruinHours: 168                         // så længe ruinen kan ses bagefter
    },
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
            housing: [100, 250, 450, 700, 1000],
            size: 30
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
            },
            size: 30
        },
        hospital: {
            id: "hospital",
            name: "Felthospitalet",
            shortName: "felthospital",
            desc: "Heler sårede soldater lidt efter lidt. Uden hospital kan sårede ikke heles.",
            stages: ["Sanitetstelt", "Felthospital", "Lazaret", "Hospital", "Militærhospital"],
            sprites: ["hospital_1", "hospital_2", "hospital_3", "hospital_4", "hospital_5"],
            prices: [400, 700, 1200, 2000, 3200],
            materials: [{}, {}, {}, { steel: 10 }, { steel: 30 }],
            beds: [10, 25, 50, 100, 200],
            healPerHour: [20, 25, 30, 40, 50],
            size: 30
        },
        steel_mill: {
            id: "steel_mill",
            name: "Stålværket",
            shortName: "stålværk",
            desc: "Producerer stål løbende, som du henter, når du vil. Stål bruges til at opgradere andre bygninger.",
            stages: ["Smedje", "Støberi", "Valseværk", "Stålværk", "Stålkombinat"],
            sprites: ["staalvaerk_1", "staalvaerk_2", "staalvaerk_3", "staalvaerk_4", "staalvaerk_5"],
            prices: [800, 1500, 2500, 4000, 6000],
            materials: [{}, {}, {}, {}, {}],
            production: {
                material: "steel",
                per_hour: [10, 20, 35, 55, 80],
                capacity: [50, 120, 250, 450, 800]
            },
            size: 100
        },
        weapons_factory: {
            id: "weapons_factory",
            name: "Våbenfabrikken",
            shortName: "våbenfabrik",
            desc: "Sælger våben, granater og køretøjer. Højere trin låser op for tungere udstyr og giver rabat. Udstyret står på lager i barrakken.",
            stages: ["Værksted", "Våbenværksted", "Ammunitionsfabrik", "Våbenfabrik", "Rustningskombinat"],
            sprites: ["vaabenfabrik_1", "vaabenfabrik_2", "vaabenfabrik_3", "vaabenfabrik_4", "vaabenfabrik_5"],
            prices: [1000, 1800, 3000, 4500, 6500],
            materials: [{}, { steel: 50 }, { steel: 100 }, { steel: 200 }, { steel: 300 }],
            // Det trin, hvert stykke udstyr kræver, og rabatten pr. trin (config.rules factory_*).
            unlock: { mortars: 1, mortar_shells: 1, trucks: 1, howitzers: 3, howitzer_shells: 3 },
            discount: [0, 0.05, 0.10, 0.15, 0.20],
            size: 60,
            needsRules: true,      // vises først, når 0033 er kørt (reglerne kender bygningen)
            enabled: false
        }
    }
};

// "soldater" / "stål" — hvad en bygning producerer.
const MATERIAL_NAMES = { soldiers: "soldater", steel: "stål" };

// ============================================================================
// Geometri: GPS-positioner og firkanter i meter (samme formler som SQL i 0009)
// ============================================================================
// Der er ingen felter. Bygninger er firkanter i meter omkring et midtpunkt med siderne mod
// nord/syd/øst/vest, så de er kvadratiske overalt på jorden.
const EARTH_RADIUS_M = 6371008.8;
const DEG_PER_RAD = 180.0 / Math.PI;
const RAD_PER_DEG = Math.PI / 180.0;
const MIN_COS = 1e-6;

const Geo = {
    distanceM(lat1, lon1, lat2, lon2) {
        const [dx, dy] = this.offsetM(lat1, lon1, lat2, lon2);
        return Math.hypot(dx, dy);
    },
    // [øst, nord] i meter fra punkt 1 til punkt 2 (offset_m i SQL).
    offsetM(lat1, lon1, lat2, lon2) {
        const meanLat = ((lat1 + lat2) / 2.0) * RAD_PER_DEG;
        return [
            (lon2 - lon1) * RAD_PER_DEG * EARTH_RADIUS_M * Math.cos(meanLat),
            (lat2 - lat1) * RAD_PER_DEG * EARTH_RADIUS_M
        ];
    },
    // Hjørnerne af en firkant med sidelængde size meter som GeoJSON-ring [lon, lat].
    squareRing(lat, lon, size) {
        const dLat = (size / 2) / EARTH_RADIUS_M * DEG_PER_RAD;
        const dLon = dLat / Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
        return [
            [lon - dLon, lat - dLat],
            [lon + dLon, lat - dLat],
            [lon + dLon, lat + dLat],
            [lon - dLon, lat + dLat],
            [lon - dLon, lat - dLat]
        ];
    },
    pointInSquare(lat, lon, cLat, cLon, size) {
        const [dx, dy] = this.offsetM(cLat, cLon, lat, lon);
        return Math.abs(dx) <= size / 2 && Math.abs(dy) <= size / 2;
    },
    // Afstand mellem kanterne af to firkanter; 0 hvis de rører/overlapper (rect_gap_m i SQL).
    rectGapM(lat1, lon1, s1, lat2, lon2, s2) {
        const [dx, dy] = this.offsetM(lat1, lon1, lat2, lon2);
        const half = (s1 + s2) / 2;
        return Math.hypot(Math.max(Math.abs(dx) - half, 0), Math.max(Math.abs(dy) - half, 0));
    }
};

function buildingSize(kind) {
    return GAME_CONFIG.BUILDINGS[kind]?.size || 30;
}

function squareFeature(lat, lon, size, props = {}) {
    return {
        type: "Feature",
        properties: props,
        geometry: { type: "Polygon", coordinates: [Geo.squareRing(lat, lon, size)] }
    };
}

// "55,64909 N, 12,40948 Ø" — kort og læsbart.
function formatPos(lat, lon) {
    const f = v => Math.abs(v).toLocaleString("da-DK", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    return `${f(lat)} ${lat >= 0 ? "N" : "S"}, ${f(lon)} ${lon >= 0 ? "Ø" : "V"}`;
}

// ============================================================================
// Spil-tilstand
// ============================================================================
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    user: null,
    balance: 0,
    steel: 0,
    soldiers: 0,
    mortarsHome: 0,        // morterer på lager i barrakken
    shells: 0,             // mortergranater på lager
    trucksHome: 0,         // lastbiler på lager i barrakken
    howitzersHome: 0,      // haubitser, der står ved barrakken
    howitzerShells: 0,     // haubitsgranater på lager
    howitzerReadyAt: null, // haubitserne er ladt igen herfra (ISO-tid fra serveren)
    wrecks: [],            // udbrændte køretøjer fra mortar_craters(): { id, kind, lat, lon, burned_at, mine }
    mortarAim: null,       // { weapon: "mortar", garrisonId } eller { weapon: "howitzer", buildingId } mens man sigter
    craters: [],           // nedslag fra mortar_craters(): { id, lat, lon, lands_at, fire_checked, mine, from_lat, from_lon, fired_at }
    fires: [],             // kortets brændende/udbrændte bygninger fra mortar_craters(): { id, osm_id, geom, started_at }
    myBuildings: [],       // Alle spillerens egne bygninger { id, owner_id, kind, level, lat, lon, emptied_at }
    visibleBuildings: [],  // Egne + fjendtlige bygninger, du kan se
    selected: null,        // Det valgte sted på kortet { lat, lon, buildingId }
    highlight: { garrisons: new Set(), marches: new Set() }, // valgte soldater, lyser op i listen
    attackFromId: null,    // den vagtstyrke, Angrib sender fra (husket, også når man klikker på fjenden)
    pendingMarchOrder: null, // { from: { type, id, lat, lon }, count, redirectMarchId }
    marches: [],           // Egne marcher fra serveren (se marchFromRow)
    garrisons: [],         // Egne vagtstyrker fra serveren { id, owner_id, lat, lon, count }
    enemies: { buildings: [], garrisons: [], marches: [], npcs: [] }, // fra visible_enemies()
    serverOffsetMs: 0,     // serverens ur minus browserens ur (til patruljernes gang)
    inCombat: new Set(),   // patruljer, dine soldater er i kamp med lige nu
    seenBySoldiers: new Set(), // nøgler på fjender, dine soldater allerede har meldt om
    bookmarks: [],         // { id, lat, lon, purpose: "build" | "target", note } — sat med telefonen på stedet
    scoutAlerts: [],       // { id, lat, lon, kind, scouts } — grove advarsler om fjendtlige spejdere
    isTester: false,       // Testkonto: må bygge uden byggepladsbogmærke (sættes af admin)
    isAdmin: false,        // Admin: ser Admin-knappen med spillerlisten
    groupModal: null,      // åben popup for en gruppe soldater { kind, id }
    hospital: { hospitals: [], waiting: [], offsetMs: 0 }, // fra hospital_status()
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
        wounded: row.wounded || [],
        mortars: row.mortars || 0,
        shells: row.shells || 0,
        trucks: row.trucks || [],
        howitzers: row.howitzers || 0,
        howitzerShells: row.howitzer_shells || 0,
        driving: !!row.driving,
        patrolPath: row.patrol_path || null,
        homeBuildingId: row.home_building_id,
        homeLat: row.home_lat,
        homeLon: row.home_lon,
        toLat: row.to_lat,
        toLon: row.to_lon,
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
        // "*", så siden også virker, før databasen har fået kolonnen wounded (0011).
        sb.from("marches").select("*"),
        sb.from("garrisons").select("*")
    ]);
    if (mRes.data) state.marches = mRes.data.map(marchFromRow);
    if (gRes.data) state.garrisons = gRes.data;
    renderGroupModal();
    renderTroopsSidebar();
    renderBuildingsSidebar();
    renderTroopsOnMap();
    if (state.selected) renderSelectedBox();
}

// Energi: hver soldat har SOLDIER_HP. Egne grupper har listen over de såredes energi (wounded);
// fjender og patruljer kommer med den samlede energi (hp) fra serveren.
function groupHp(g) {
    if (typeof g.hp === "number") return g.hp;
    const w = g.wounded || [];
    return g.count * GAME_CONFIG.SOLDIER_HP - w.reduce((sum, x) => sum + (GAME_CONFIG.SOLDIER_HP - x), 0);
}

function energyPct(g) {
    if (!g.count) return 0;
    return Math.max(0, Math.min(100, Math.round(groupHp(g) / (g.count * GAME_CONFIG.SOLDIER_HP) * 100)));
}

// "❤️ 72 % · 3 sårede" (egne grupper ved, hvor mange der er sårede).
function energyText(g) {
    const pct = energyPct(g);
    const hurt = g.wounded ? g.wounded.length : null;
    return `❤️ ${pct} %${hurt ? ` · ${hurt} ${hurt === 1 ? "såret" : "sårede"}` : ""}`;
}

function deployedSoldierCount() {
    if (!state.user) return 0;
    const uid = state.user.id;
    const onMarch = state.marches.filter(m => m.owner_id === uid).reduce((s, m) => s + m.count, 0);
    const onGuard = state.garrisons.filter(g => g.owner_id === uid).reduce((s, g) => s + g.count, 0);
    return onMarch + onGuard;
}

function availableInBarracks() {
    return Math.max(0, state.soldiers - deployedSoldierCount() - patientCount());
}

// ============================================================================
// Felthospitalet: patienter heles lidt efter lidt; sårede uden seng venter i barrakken
// ============================================================================
function patientCount() {
    return state.hospital.hospitals.reduce((n, h) => n + patientsNow(h).length, 0);
}

async function loadHospitals() {
    if (!state.user) return;
    const { data, error } = await sb.rpc("hospital_status");
    if (error || !data) return; // før 0012 er kørt, findes funktionen ikke
    state.hospital = {
        hospitals: data.hospitals || [],
        waiting: data.waiting || [],
        offsetMs: data.now ? Date.parse(data.now) - Date.now() : 0
    };
    renderBuildingsSidebar();
    if (state.selected) renderSelectedBox();
    if (state.hospitalModal) renderHospitalModal();
}

function hospitalOf(buildingId) {
    return state.hospital.hospitals.find(h => String(h.building_id) === String(buildingId));
}

// Patienternes energi lige nu (serveren regner det samme ud, næste gang nogen spørger).
function patientsNow(h) {
    const hp = GAME_CONFIG.SOLDIER_HP;
    const hours = Math.max(0, (Date.now() + state.hospital.offsetMs - Date.parse(h.healed_at)) / 3600000);
    const gain = Math.floor(hours * h.heal_per_hour);
    return h.patients.map(e => Math.min(hp, e + gain)).filter(e => e < hp);
}

function nearestOwn(kind, lat, lon) {
    return state.myBuildings
        .filter(b => b.kind === kind)
        .map(b => ({ b, d: Geo.distanceM(lat, lon, b.lat, b.lon) }))
        .sort((a, b) => a.d - b.d)[0] || null;
}

window.openHospitalModal = function(buildingId) {
    state.groupModal = null;
    state.hospitalModal = buildingId;
    renderHospitalModal();
    document.getElementById("modal-overlay").classList.remove("hidden");
};

function renderHospitalModal() {
    const b = state.myBuildings.find(x => String(x.id) === String(state.hospitalModal));
    const h = hospitalOf(state.hospitalModal);
    if (!b) return;
    const cfg = GAME_CONFIG.BUILDINGS.hospital;
    const beds = h ? h.beds : cfg.beds[b.level - 1];
    const rate = h ? h.heal_per_hour : cfg.healPerHour[b.level - 1];
    const patients = h ? patientsNow(h) : [];
    const waiting = state.hospital.waiting.length;
    document.getElementById("modal-title").textContent = `${cfg.stages[b.level - 1]}: ${patients.length} / ${beds} senge`;
    document.getElementById("modal-body").innerHTML = `
        <p class="muted-hint">Patienterne får <strong>+${rate} energi i timen</strong>. Når de har fuld energi, er de raske og ledige i barrakken igen.
        ${waiting ? `<br>🩹 <strong>${waiting}</strong> sårede venter i barrakken på en ledig seng.` : ""}</p>
        ${patients.length
            ? soldierTilesHtml({ count: patients.length, wounded: patients })
            : `<p class="muted-hint">Ingen patienter lige nu. Send sårede hertil, eller lad dem gå hjem til barrakken — så bliver de lagt her af sig selv.</p>`}`;
    document.getElementById("modal-actions").innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
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
        renderBattlesOnMap();
        refreshViewportData();
        renderTroopsOnMap();
    });

    map.on("move", () => waterCache.clear());

    map.on("moveend", () => {
        if (!mapReady) return;
        refreshViewportData();
        loadCratersSoon();
    });

    // Når kortet er færdigt med at tegne, ses der efter kratere i kortets bygninger.
    map.on("idle", () => {
        if (mapReady) checkCraterFires();
    });

    map.on("click", (e) => onMapClicked(e.lngLat.lat, e.lngLat.lng));
    map.on("mousemove", (e) => {
        if (state.mortarAim) renderMortarAim(e.lngLat.lat, e.lngLat.lng);
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
        ["img-b-skole_5", "assets/skole_5.png", 4],
        ["img-b-hospital_1", "assets/hospital_1.png", 4],
        ["img-b-hospital_2", "assets/hospital_2.png", 4],
        ["img-b-hospital_3", "assets/hospital_3.png", 4],
        ["img-b-hospital_4", "assets/hospital_4.png", 4],
        ["img-b-hospital_5", "assets/hospital_5.png", 4],
        ["img-b-staalvaerk_1", "assets/staalvaerk_1.png", 2],
        ["img-b-staalvaerk_2", "assets/staalvaerk_2.png", 2],
        ["img-b-staalvaerk_3", "assets/staalvaerk_3.png", 2],
        ["img-b-staalvaerk_4", "assets/staalvaerk_4.png", 2],
        ["img-b-staalvaerk_5", "assets/staalvaerk_5.png", 2],
        ["img-b-vaabenfabrik_1", "assets/vaabenfabrik_1.png", 4],
        ["img-b-vaabenfabrik_2", "assets/vaabenfabrik_2.png", 4],
        ["img-b-vaabenfabrik_3", "assets/vaabenfabrik_3.png", 4],
        ["img-b-vaabenfabrik_4", "assets/vaabenfabrik_4.png", 4],
        ["img-b-vaabenfabrik_5", "assets/vaabenfabrik_5.png", 4],
        ["img-crater", "assets/krater.png", 2],
        ["img-wreck", "assets/lastbil_vrag.png", 2],
        ["img-flame-0", "assets/flamme_1.png", 2],
        ["img-flame-1", "assets/flamme_2.png", 2],
        ["img-flame-2", "assets/flamme_3.png", 2],
        ["img-ruin", "assets/ruin.png", 2],
        ["img-ruin-glow", "assets/ruin_glod.png", 2],
        ["img-shell", "assets/granat.png", 1]
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

// Bygnings-sprites er 56×56 px og indlæses med scale=4 → 224×224 px. Hver bygning har egenskaben
// "m" = sidelængde i meter / cos(breddegrad), fordi én meter fylder 1/cos(lat) gange flere
// pixels på Web Mercator-kortet, jo længere man kommer fra ækvator. Så fylder bygningen præcis
// sin firkant overalt på jorden.
function buildingIconSizeExpression() {
    const texPx = 56 * 4;
    const pxPerMeterAtZoom0 = 512 / (2 * Math.PI * EARTH_RADIUS_M);
    const k = z => (pxPerMeterAtZoom0 * Math.pow(2, z)) / texPx;
    return ["interpolate", ["exponential", 2], ["zoom"],
        0, ["*", ["get", "m"], k(0)],
        24, ["*", ["get", "m"], k(24)]];
}

function buildingFeature(b, extra = {}) {
    const cfg = GAME_CONFIG.BUILDINGS[b.kind];
    const sprite = cfg ? cfg.sprites[Math.min(b.level, cfg.sprites.length) - 1] : "barrak_1";
    const m = buildingSize(b.kind) / Math.max(Math.cos(b.lat * RAD_PER_DEG), MIN_COS);
    return {
        type: "Feature",
        properties: { sprite, m, ...extra },
        geometry: { type: "Point", coordinates: [b.lon, b.lat] }
    };
}

function installGameLayers() {
    const empty = { type: "FeatureCollection", features: [] };

    map.addSource("src-footprints", { type: "geojson", data: empty });
    map.addSource("src-selected", { type: "geojson", data: empty });
    map.addSource("src-buildings", { type: "geojson", data: empty });
    map.addSource("src-march-lines", { type: "geojson", data: empty });
    map.addSource("src-troops", { type: "geojson", data: empty });
    map.addSource("src-shots", { type: "geojson", data: empty });
    map.addSource("src-route-draft", { type: "geojson", data: empty });
    map.addSource("src-bookmarks", { type: "geojson", data: empty });
    map.addSource("src-battles", { type: "geojson", data: empty });
    map.addSource("src-craters", { type: "geojson", data: empty });
    map.addSource("src-shells", { type: "geojson", data: empty });
    map.addSource("src-wrecks", { type: "geojson", data: empty });
    map.addSource("src-mortar-aim", { type: "geojson", data: empty });
    map.addSource("src-fire-areas", { type: "geojson", data: empty });
    map.addSource("src-fire-flames", { type: "geojson", data: empty });

    // Kortets bygninger, der brænder (glødende) eller er udbrændte ruiner. Tegnes i bygningens
    // rigtige form oven på den brune bygning.
    map.addLayer({
        id: "lyr-fire-areas",
        type: "fill",
        source: "src-fire-areas",
        paint: { "fill-pattern": ["match", ["get", "state"], "burning", "img-ruin-glow", "img-ruin"] }
    });
    // Flammerne blafrer: billedet skiftes med animateFlames().
    map.addLayer({
        id: "lyr-fire-flames",
        type: "symbol",
        source: "src-fire-flames",
        minzoom: 13,
        layout: {
            "icon-image": flameImageExpression(0),
            "icon-anchor": "bottom",
            "icon-size": ["interpolate", ["exponential", 2], ["zoom"],
                13, ["*", ["get", "s"], 0.12], 16, ["*", ["get", "s"], 0.5], 19, ["*", ["get", "s"], 2.0]],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
    });

    // Kratere efter mortergranater: hullet i jorden blegner, jo ældre det er.
    map.addLayer({
        id: "lyr-craters",
        type: "symbol",
        source: "src-craters",
        layout: {
            "icon-image": "img-crater",
            "icon-size": ["interpolate", ["exponential", 2], ["zoom"],
                12, ["*", ["get", "sz"], 0.15], 16, ["*", ["get", "sz"], 0.6], 19, ["*", ["get", "sz"], 2.4]],
            "icon-rotate": ["get", "rot"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        },
        paint: { "icon-opacity": ["get", "op"] }
    });

    // Udbrændte lastbiler: blegner, jo ældre de er.
    map.addLayer({
        id: "lyr-wrecks",
        type: "symbol",
        source: "src-wrecks",
        layout: {
            "icon-image": "img-wreck",
            "icon-size": ["interpolate", ["exponential", 2], ["zoom"], 12, 0.12, 16, 0.5, 19, 2.0],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        },
        paint: { "icon-opacity": ["get", "op"] }
    });

    // Bogmærker: byggepladser er firkanter på 50×50 m, mål er små firkanter.
    map.addLayer({
        id: "lyr-bookmarks-fill",
        type: "fill",
        source: "src-bookmarks",
        paint: {
            "fill-color": ["match", ["get", "purpose"], "build", "#FFD54F", "#FF5252"],
            "fill-opacity": 0.10
        }
    });
    map.addLayer({
        id: "lyr-bookmarks",
        type: "line",
        source: "src-bookmarks",
        paint: {
            "line-color": ["match", ["get", "purpose"], "build", "#FFD54F", "#FF5252"],
            "line-width": 2,
            "line-dasharray": [1.5, 1]
        }
    });
    // Bygningernes omrids: grøn for dine, rød for fjendens.
    map.addLayer({
        id: "lyr-footprints",
        type: "line",
        source: "src-footprints",
        paint: {
            "line-color": ["case", ["get", "mine"], "#39FF14", "#FF2E88"],
            "line-width": 1.5,
            "line-opacity": 0.75
        }
    });
    // Det valgte sted: en bygning (gul) eller en byggeskitse (grøn = må bygges, rød = må ikke).
    map.addLayer({
        id: "lyr-selected-fill",
        type: "fill",
        source: "src-selected",
        paint: {
            "fill-color": ["match", ["get", "state"], "ok", "#39FF14", "no", "#FF5252", "#FFD54F"],
            "fill-opacity": ["match", ["get", "state"], "building", 0, 0.18]
        }
    });
    map.addLayer({
        id: "lyr-selected",
        type: "line",
        source: "src-selected",
        filter: ["==", ["get", "state"], "building"],
        paint: { "line-color": "#FFD54F", "line-width": 3 }
    });
    map.addLayer({
        id: "lyr-selected-sketch",
        type: "line",
        source: "src-selected",
        filter: ["!=", ["get", "state"], "building"],
        paint: {
            "line-color": ["match", ["get", "state"], "ok", "#39FF14", "#FF5252"],
            "line-width": 2.5,
            "line-dasharray": [2, 1.5]
        }
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
            "line-color": ["case", ["boolean", ["get", "patrol"], false], "#4FC3F7", "#39FF14"],
            "line-width": 3,
            "line-dasharray": [2, 2],
            "line-opacity": 0.9
        }
    });
    // Ruten, man er ved at klikke sammen: streger og nummererede punkter.
    map.addLayer({
        id: "lyr-route-draft-line",
        type: "line",
        source: "src-route-draft",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
            "line-color": ["case", ["boolean", ["get", "loop"], false], "#4FC3F7", "#FFD54F"],
            "line-width": 3,
            "line-dasharray": [1.5, 1.5]
        }
    });
    map.addLayer({
        id: "lyr-route-draft-points",
        type: "circle",
        source: "src-route-draft",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
            "circle-radius": 11,
            "circle-color": "#11161C",
            "circle-stroke-color": "#FFD54F",
            "circle-stroke-width": 2.5
        }
    });
    map.addLayer({
        id: "lyr-route-draft-labels",
        type: "symbol",
        source: "src-route-draft",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
            "text-field": ["to-string", ["get", "nr"]],
            "text-font": ["Noto Sans Bold"], // kortets server har kun Noto Sans; en ukendt skrift stopper hele laget
            "text-size": 12,
            "text-allow-overlap": true,
            "text-ignore-placement": true
        },
        paint: { "text-color": "#FFD54F" }
    });

    // Træfninger fra kamprapporten: en lille pixel-eksplosion, hvor kampen var.
    map.addImage("img-explosion", explosionImage(), { pixelRatio: 1 });
    map.addImage("img-explosion-sel", explosionImage(true), { pixelRatio: 1 });
    map.addLayer({
        id: "lyr-battles",
        type: "symbol",
        source: "src-battles",
        layout: {
            "icon-image": ["case", ["boolean", ["get", "selected"], false], "img-explosion-sel", "img-explosion"],
            "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 15, 1, 18, 1.4],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "symbol-sort-key": ["case", ["boolean", ["get", "selected"], false], 1, 0]
        }
    });

    // Geværild mellem dine soldater og fjendtlige patruljer i kamp: lysspor og mundingsglimt.
    map.addLayer({
        id: "lyr-shots",
        type: "line",
        source: "src-shots",
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "round" },
        paint: {
            "line-color": ["match", ["get", "from"], "npc", "#FF6E40", "#FFF176"],
            "line-width": 3,
            "line-blur": 1,
            "line-opacity": 0.95
        }
    });
    map.addLayer({
        id: "lyr-shot-flash",
        type: "circle",
        source: "src-shots",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
            "circle-color": "#FFE082",
            "circle-radius": ["get", "r"],
            "circle-blur": 0.6,
            "circle-opacity": 0.9
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

    // Sigte med morteren: rækkevidden (stiplet ring) og cirklen, granaterne kan lande i.
    map.addLayer({
        id: "lyr-mortar-aim-fill",
        type: "fill",
        source: "src-mortar-aim",
        filter: ["==", ["get", "kind"], "spread"],
        paint: { "fill-color": ["case", ["get", "ok"], "#FF9800", "#FF5252"], "fill-opacity": 0.18 }
    });
    map.addLayer({
        id: "lyr-mortar-aim",
        type: "line",
        source: "src-mortar-aim",
        paint: {
            "line-color": ["match", ["get", "kind"], "range", "#FFD54F", "spread",
                ["case", ["get", "ok"], "#FF9800", "#FF5252"], "#FFFFFF"],
            "line-width": ["match", ["get", "kind"], "range", 2, 2.5],
            "line-dasharray": [2, 2]
        }
    });

    // Granater i luften: en stiplet bane, en skygge på jorden og selve granaten højt oppe.
    // Nedslag: en eksplosion i et par sekunder.
    map.addLayer({
        id: "lyr-shell-trails",
        type: "line",
        source: "src-shells",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#FFF3C4", "line-width": 2, "line-dasharray": [1, 2.5], "line-opacity": 0.85 }
    });
    map.addLayer({
        id: "lyr-shell-shadows",
        type: "circle",
        source: "src-shells",
        filter: ["==", ["get", "kind"], "shadow"],
        paint: { "circle-radius": 3, "circle-color": "#000000", "circle-opacity": 0.35 }
    });
    map.addLayer({
        id: "lyr-shells",
        type: "symbol",
        source: "src-shells",
        filter: ["in", ["get", "kind"], ["literal", ["shell", "blast"]]],
        layout: {
            "icon-image": ["match", ["get", "kind"], "blast", "img-explosion", "img-shell"],
            "icon-size": ["get", "size"],
            "icon-rotate": ["get", "rot"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        },
        paint: { "icon-opacity": ["get", "op"] }
    });
}

// ============================================================================
// Kort-opdatering (Bygninger og deres omrids)
// ============================================================================
async function refreshViewportData() {
    renderWorld();
}

// Tegner dine egne bygninger og de fjender, serveren siger du kan se.
// Fjender uden for udsynet når aldrig hertil — de er skjult på serveren.
function renderWorld() {
    if (!mapReady || !state.user) return;
    const uid = state.user.id;
    state.visibleBuildings = [...state.myBuildings, ...state.enemies.buildings];

    map.getSource("src-buildings")?.setData({
        type: "FeatureCollection",
        features: state.visibleBuildings.map(b => buildingFeature(b))
    });
    map.getSource("src-footprints")?.setData({
        type: "FeatureCollection",
        features: state.visibleBuildings.map(b =>
            squareFeature(b.lat, b.lon, buildingSize(b.kind), { mine: b.owner_id === uid }))
    });

    if (state.selected) renderSelectedBox();
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

// Grupper med lastbiler tegnes som en lastbil.
let truckImg = null;
const truckImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { truckImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/lastbil.png";
});

// Lastbiler, der bugserer en haubits.
let truckHowitzerImg = null;
const truckHowitzerImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { truckHowitzerImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/lastbil_haubits.png";
});

// Fjender (patruljer og andre spilleres soldater) tegnes i rød uniform.
let npcSoldierImg = null;
const npcImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { npcSoldierImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/fjende.png";
});

// style: "own" (dine), "enemy" (andre spillere) eller "npc" (computerstyret patrulje).
// status for egne: "guard" (grøn), "patrol" (blå), "march" (orange), "combat" (rød hvis i/har været i kamp).
function troopBadgeId(count, style = "own", pct = 100, status = "guard", truck = false, facingLeft = false, hasHowitzer = false) {
    const bucket = pct >= 100 ? "100" : pct < 40 ? `red-${Math.ceil(pct / 10)}` : `orange-${Math.ceil(pct / 10)}`;
    const truckSuffix = truck ? (hasHowitzer ? (facingLeft ? "-truck-h-left" : "-truck-h") : (facingLeft ? "-truck-left" : "-truck")) : "";
    return `img-${style}-${status}-${count}-${bucket}${truckSuffix}`;
}

async function ensureTroopBadge(count, style = "own", pct = 100, status = "guard", truck = false, facingLeft = false, hasHowitzer = false) {
    const imgId = troopBadgeId(count, style, pct, status, truck, facingLeft, hasHowitzer);
    if (!mapReady || registeredTroopBadges.has(imgId)) return;
    registeredTroopBadges.add(imgId);
    await soldierImgPromise;
    // Fjender (andre spillere og patruljer) har rød uniform; kun dine egne er grønne.
    const redUniform = style === "npc" || style === "enemy";
    if (redUniform) await npcImgPromise;
    if (truck && hasHowitzer) await truckHowitzerImgPromise;
    if (truck) await truckImgPromise;
    const soldierImg = truck && hasHowitzer && truckHowitzerImg ? truckHowitzerImg : (truck && truckImg ? truckImg : (redUniform && npcSoldierImg ? npcSoldierImg : baseSoldierImg));
    if (!soldierImg) return;

    const scale = truck ? 2 : 3;
    const sw = soldierImg.width * scale;
    const sh = soldierImg.height * scale;
    const text = String(count);

    const canvas = document.createElement("canvas");
    const badgeW = Math.max(34, text.length * 10 + 16);
    const badgeH = 22;
    const barH = 5;
    canvas.width = Math.max(sw, badgeW) + 8;
    canvas.height = sh + badgeH + barH + 8;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const bx = (canvas.width - badgeW) / 2;
    ctx.fillStyle = "rgba(17, 22, 28, 0.92)";

    // Farve på cirklen/mærket om tallet over hovedet:
    // Blå hvis en gruppe går patrulje, grøn hvis den står vagt, orange hvis den er på vej et sted hen,
    // og rød hvis den har været i kamp (eller fjende).
    let strokeColor = "#39FF14"; // grøn standard (står vagt)
    if (style === "npc") {
        strokeColor = status === "combat" ? "#FF5252" : "#FF9800";
    } else if (style === "enemy") {
        strokeColor = "#FF5252";
    } else {
        if (status === "combat") strokeColor = "#FF5252";       // rød: har været i kamp
        else if (status === "patrol") strokeColor = "#4FC3F7";  // blå: patrulje
        else if (status === "march") strokeColor = "#FF9800";   // orange: på vej et sted hen
        else strokeColor = "#39FF14";                           // grøn: står vagt
    }

    ctx.strokeStyle = strokeColor;
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

    // Energibjælke under tallet: grøn → gul → rød.
    const step = Math.ceil(pct / 10) / 10;
    const by = badgeH + 5;
    ctx.fillStyle = "rgba(17, 22, 28, 0.92)";
    ctx.fillRect(bx, by, badgeW, barH);
    ctx.fillStyle = energyColor(pct);
    ctx.fillRect(bx + 1, by + 1, Math.max(1, (badgeW - 2) * step), barH - 2);

    const sx = (canvas.width - sw) / 2;
    if (truck && facingLeft) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(soldierImg, sx, badgeH + barH + 6, sw, sh);
        ctx.restore();
    } else {
        ctx.drawImage(soldierImg, sx, badgeH + barH + 6, sw, sh);
    }

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

function terrainAt(lat, lon) {
    if (!mapReady) return { id: "ground", name: "Åbent land" };
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
        const d = Geo.distanceM(a[0], a[1], b[0], b[1]);
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
function findLandPathLocal(startLat, startLon, endLat, endLon) {
    const direct = [[startLat, startLon], [endLat, endLon]];
    const distM = Geo.distanceM(startLat, startLon, endLat, endLon);
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
            const segDist = Geo.distanceM(full[i][0], full[i][1], full[j][0], full[j][1]);
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
 * Finder korteste rute på land fra [startLat, startLon] til [endLat, endLon].
 * - Soldaten går i snorlige linjer hen over græs, marker, skov og bygninger!
 * - Ruten bøjer KUN af ved vand (langs kysten/stranden eller over en bro).
 */
async function findLandPathAsync(startLat, startLon, endLat, endLon) {

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

    return await tightenPathAcrossLand(findLandPathLocal(startLat, startLon, endLat, endLon));
}

// ============================================================================
// Lastbil (0028): kører ad vejene og langsommere over marken
// ============================================================================
// Kan count soldater køre trucks lastbiler? Plads til TRUCK.capacity i hver og mindst én soldat i
// hver lastbil (samme regel som truck_can_drive på serveren).
function truckCanDrive(count, trucks) {
    return trucks > 0 && count >= trucks && count <= trucks * GAME_CONFIG.TRUCK.capacity;
}

// Antal lastbiler i en gruppe: egne grupper har energien for hver lastbil, fjender kun antallet.
function truckCount(g) {
    return Array.isArray(g?.trucks) ? g.trucks.length : (g?.trucks || 0);
}

// Rejsetid for en lastbil-rute: hvert punkt har et tredje tal for stykket hen til punktet,
// 1 = vej, 0 = mark.
function truckPathSeconds(path) {
    const T = GAME_CONFIG.TRUCK;
    let sec = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const d = Geo.distanceM(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
        sec += d / (path[i + 1][2] >= 1 ? T.roadMps : Math.min(T.fieldMps, T.roadMps));
    }
    return sec;
}

function pathSeconds(path, driving) {
    return Math.max(2, driving ? truckPathSeconds(path) : pathDistanceM(path) / GAME_CONFIG.SOLDIER_SPEED_MPS);
}

// Lastbilens rute for ét ben: ad vejene (OSRM "driving"), med stykket hen til vejen og fra vejen
// til målet over marken — eller lige over marken, hvis det går hurtigere.
async function findTruckPathAsync(startLat, startLon, endLat, endLon) {
    const field = (await findLandPathAsync(startLat, startLon, endLat, endLon))
        .map((p, i) => i === 0 ? [p[0], p[1]] : [p[0], p[1], 0]);
    let best = field;
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLon.toFixed(6)},${startLat.toFixed(6)};${endLon.toFixed(6)},${endLat.toFixed(6)}?overview=full&geometries=geojson`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
            const json = await resp.json();
            const coords = json?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
                const road = simplifyPolyline(coords.map(c => [c[1], c[0]]), 0.00012);
                best = [
                    [startLat, startLon],
                    ...road.map((p, i) => [p[0], p[1], i === 0 ? 0 : 1]),
                    [endLat, endLon, 0]
                ];
            }
        }
    } catch (e) {
        console.warn("OSRM truck route warning:", e);
    }
    return best;
}

// Meter ad vej i en lastbil-rute.
function roadDistanceM(path) {
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) {
        if (path[i + 1][2] >= 1) sum += Geo.distanceM(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    }
    return sum;
}

function pathDistanceM(path) {
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) {
        sum += Geo.distanceM(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    }
    return sum;
}

// Serverens ur lige nu. Computerens eget ur kan gå forkert (fx et minut for hurtigt), og så ville
// soldaterne stå et andet sted på kortet end på serveren og hoppe, når de får en ny ordre.
function serverNow() {
    return Date.now() + state.serverOffsetMs;
}

// Rutens stykker målt i "rejsetid": meter × langsomhed. En lastbil-rute fra serveren har et tredje
// tal pr. punkt for stykket hen til punktet (vej = 1, mark = vejfart / markfart, se 0028);
// en gårute har kun [lat, lon], og så tæller alle meter ens.
function pathTimeSegments(pts) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const w = pts[i + 1].length > 2 ? Number(pts[i + 1][2]) : 1;
        const d = Geo.distanceM(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) * w;
        segs.push(d);
        total += d;
    }
    return { segs, total };
}

function marchProgress(m, now) {
    const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
    return Math.max(0, Math.min(1, (now - m.startedAtMillis) / totalMs));
}

function marchCurrentPos(m, now = serverNow()) {
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], [m.toLat, m.toLon]];
    const p = marchProgress(m, now);
    if (p <= 0) return [pts[0][0], pts[0][1]];
    if (p >= 1) return [pts.at(-1)[0], pts.at(-1)[1]];

    const { segs, total } = pathTimeSegments(pts);
    const target = total * p;
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
    return [pts.at(-1)[0], pts.at(-1)[1]];
}

function marchRemainingPath(m, now = serverNow()) {
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], [m.toLat, m.toLon]];
    const cur = marchCurrentPos(m, now);
    if (pts.length <= 2) return [cur, pts[pts.length - 1]];

    const { segs, total } = pathTimeSegments(pts);
    const target = total * marchProgress(m, now);
    let acc = 0;
    const out = [cur];
    for (let i = 0; i < segs.length; i++) {
        acc += segs[i];
        if (acc > target) out.push(pts[i + 1]);
    }
    return out;
}

// Retning for en march: vender mod venstre hvis delingen bevæger sig mod vest (lavere længdegrad)
function marchFacingLeft(m, now = serverNow()) {
    const rem = marchRemainingPath(m, now);
    if (rem && rem.length >= 2) {
        // 1. Se på det umiddelbare næste stykke vej
        const dLon = Number(rem[1][1]) - Number(rem[0][1]);
        if (Math.abs(dLon) > 0.000001) return dLon < 0;

        // 2. Hvis vejen lige nu går stik nord/syd, se fremad på resten af ruten
        for (let i = 2; i < rem.length; i++) {
            const d = Number(rem[i][1]) - Number(rem[i - 1][1]);
            if (Math.abs(d) > 0.000001) return d < 0;
        }
    }
    // 3. Hvis intet fremad, se på start -> mål
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], [m.toLat, m.toLon]];
    if (pts && pts.length >= 2) {
        for (let i = pts.length - 1; i >= 1; i--) {
            const d = Number(pts[i][1]) - Number(pts[i - 1][1]);
            if (Math.abs(d) > 0.000001) return d < 0;
        }
    }
    return false;
}

async function renderTroopsOnMap() {
    if (!mapReady) return;
    const now = serverNow();
    const troopFeatures = [];
    const lineFeatures = [];

    // Patruljerne går jævnt videre mellem opdateringerne (strækning + tider fra serveren).
    const npcs = state.enemies.npcs.map(n => ({ n, pos: npcCurrentPos(n, now) }));
    const isFightingNear = (lat, lon) => {
        for (const { n, pos } of npcs) {
            if (Geo.distanceM(pos[0], pos[1], lat, lon) <= GAME_CONFIG.FIRE_RANGE_M) return true;
        }
        return false;
    };

    const addTroop = async (group, lat, lon, style, status = "guard", facingLeft = false) => {
        const pct = energyPct(group);
        const truck = truckCount(group) > 0;
        const hasHowitzer = (group.howitzers || 0) > 0;
        await ensureTroopBadge(group.count, style, pct, status, truck, facingLeft, hasHowitzer);
        troopFeatures.push({
            type: "Feature",
            properties: { img: troopBadgeId(group.count, style, pct, status, truck, facingLeft, hasHowitzer) },
            geometry: { type: "Point", coordinates: [lon, lat] }
        });
    };

    // Fjender, som du kan se lige nu (positionen er et øjebliksbillede fra serveren)
    for (const g of state.enemies.garrisons) {
        await addTroop(g, g.lat, g.lon, "enemy", "enemy");
    }
    for (const m of state.enemies.marches) {
        const facingLeft = truckCount(m) > 0 && m.to_lon != null && m.lon != null && m.to_lon < m.lon;
        await addTroop(m, m.lat, m.lon, "enemy", "enemy", facingLeft);
    }
    for (const { n, pos } of npcs) {
        const status = n.fighting ? "combat" : "npc";
        const facingLeft = truckCount(n) > 0 && marchFacingLeft({
            path: n.path,
            startedAtMillis: Date.parse(n.started_at),
            arrivesAtMillis: Date.parse(n.arrives_at)
        }, now);
        await addTroop(n, pos[0], pos[1], "npc", status, facingLeft);
    }

    const own = [];
    for (const g of state.garrisons) {
        if (g.count <= 0) continue;
        own.push([g.lat, g.lon]);
        const inCombat = (g.wounded && g.wounded.length > 0) || energyPct(g) < 100 || isFightingNear(g.lat, g.lon);
        const status = inCombat ? "combat" : "guard";
        await addTroop(g, g.lat, g.lon, "own", status);
    }

    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [lat, lon] = marchCurrentPos(m, now);
        own.push([lat, lon]);
        const inCombat = (m.wounded && m.wounded.length > 0) || energyPct(m) < 100 || isFightingNear(lat, lon);
        const isPatrol = !!m.patrolPath;
        const status = inCombat ? "combat" : (isPatrol ? "patrol" : "march");
        const facingLeft = truckCount(m) > 0 && marchFacingLeft(m, now);
        await addTroop(m, lat, lon, "own", status, facingLeft);

        const rem = marchRemainingPath(m, now);
        const isSelected = state.highlight?.marches?.has(String(m.id))
            || (state.groupModal?.kind === "march" && String(state.groupModal.id) === String(m.id));

        if (isPatrol) {
            // Vis KUN den blå patruljerute, når man trykker på den gruppe, der går ruten
            if (isSelected) {
                lineFeatures.push({
                    type: "Feature",
                    properties: { patrol: true },
                    geometry: { type: "LineString", coordinates: m.patrolPath.map(pt => [pt[1], pt[0]]) }
                });
                lineFeatures.push({
                    type: "Feature",
                    properties: { patrol: true },
                    geometry: {
                        type: "LineString",
                        coordinates: rem.map(pt => [pt[1], pt[0]])
                    }
                });
            }
        } else {
            // Almindelig march på vej til sit mål
            lineFeatures.push({
                type: "Feature",
                properties: { patrol: false },
                geometry: {
                    type: "LineString",
                    coordinates: rem.map(pt => [pt[1], pt[0]])
                }
            });
        }
    }

    map.getSource("src-troops")?.setData({ type: "FeatureCollection", features: troopFeatures });
    map.getSource("src-march-lines")?.setData({ type: "FeatureCollection", features: lineFeatures });
    shotPairs = findShotPairs(npcs, own);
    renderShots();
}

// Hvor en patrulje er nu. Serverens ur bruges, så den står samme sted som på serveren.
function npcCurrentPos(n, now = serverNow()) {
    return marchCurrentPos({
        path: n.path,
        startedAtMillis: Date.parse(n.started_at),
        arrivesAtMillis: Date.parse(n.arrives_at)
    }, now);
}

// Navn på en computerstyret gruppe: en enhed i den svenske hær, en invasionshær eller en patrulje.
function npcLabel(n) {
    if (n.unit_name) return `Svensk ${n.unit_name.charAt(0).toLowerCase()}${n.unit_name.slice(1)}`;
    return n.is_invasion ? "Invasionshær" : "Fjendtlig patrulje";
}

// Hærens udstyr, fx "🚚 3 lastbiler · 💣 4 morterer". Tom, hvis gruppen kun har geværer.
function npcGear(n) {
    const parts = [];
    const t = truckCount(n), m = n.mortars || 0, h = n.howitzers || 0;
    if (t) parts.push(`🚚 ${t} ${t === 1 ? "lastbil" : "lastbiler"}`);
    if (m) parts.push(`💣 ${m} ${m === 1 ? "morter" : "morterer"}`);
    if (h) parts.push(`💥 ${h} ${h === 1 ? "haubits" : "haubitser"}`);
    return parts.join(" · ");
}

function npcAbout(n) {
    if (n.fighting) return "💥 i kamp med dine soldater";
    if (n.unit_kind) {
        const gear = npcGear(n);
        return `Den svenske hær, angreb over Øresundsbroen.${gear ? ` ${gear}.` : ""}`;
    }
    return n.is_invasion ? "Invasionsstyrke fra Malmø." : "Computerstyret. Går rundt i området og angriber soldater, den får øje på.";
}

// Geværild mellem patruljer i kamp og dine soldater inden for skudafstand. Kampen afgøres
// på serveren; det her er kun til at se, hvem der skyder på hvem. Begge sider skyder på én gang.
let shotPairs = [];
let shotTimer = null;

function findShotPairs(npcs, own) {
    const out = [];
    for (const { n, pos } of npcs) {
        for (const [lat, lon] of own) {
            if (Geo.distanceM(pos[0], pos[1], lat, lon) > GAME_CONFIG.FIRE_RANGE_M) continue;
            out.push({ own: [lon, lat], npc: [pos[1], pos[0]], seed: (Number(n.id) || 0) * 0.37 });
        }
    }
    return out;
}

function pointAlong(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Tre lysspor pr. side flyver fra skytten mod målet; der blinker et glimt ved geværet, når et skud går af.
function shotFeatures(now) {
    const out = [];
    for (const p of shotPairs) {
        for (const [from, a, b, offset] of [["own", p.own, p.npc, 0], ["npc", p.npc, p.own, 0.5]]) {
            for (let k = 0; k < 3; k++) {
                const t = (now / 450 + p.seed + offset + k / 3 + Math.sin(k * 7.1 + p.seed) * 0.08) % 1;
                const t0 = Math.max(0, t - 0.15);
                out.push({ type: "Feature", properties: { from },
                    geometry: { type: "LineString", coordinates: [pointAlong(a, b, t0), pointAlong(a, b, t)] } });
                if (t < 0.12) {
                    out.push({ type: "Feature", properties: { from, r: 5 - t * 25 },
                        geometry: { type: "Point", coordinates: a } });
                }
            }
        }
    }
    return out;
}

function renderShots() {
    if (!mapReady) return;
    map.getSource("src-shots")?.setData({ type: "FeatureCollection", features: shotFeatures(Date.now()) });
    if (shotPairs.length && !shotTimer) {
        shotTimer = setInterval(() => {
            if (!shotPairs.length) { clearInterval(shotTimer); shotTimer = null; }
            renderShots();
        }, 50);
    }
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
        sb.from("buildings").select("id,owner_id,kind,level,lat,lon,emptied_at").eq("owner_id", uid).order("id"),
        sb.from("bookmarks").select("id,lat,lon,purpose,note,created_at").order("created_at", { ascending: false }),
        sb.from("players").select("is_tester,is_admin").eq("id", uid).maybeSingle()
    ]);

    state.isTester = !!meRes.data?.is_tester;
    state.isAdmin = !!meRes.data?.is_admin;
    document.getElementById("btn-admin")?.classList.toggle("hidden", !state.isAdmin);

    if (cfgRes.data) {
        for (const row of cfgRes.data) {
            if (row.key === "rules" && row.value) {
                const r = row.value;
                GAME_CONFIG.RULES = r;
                if (r.instant_soldier_steps) GAME_CONFIG.INSTANT_SOLDIER_STEPS = Number(r.instant_soldier_steps);
                if (r.reach_m) GAME_CONFIG.BUILD_RADIUS_M = Number(r.reach_m);
                if (r.vision_m) GAME_CONFIG.VISION_RADIUS_M = Number(r.vision_m);
                if (r.soldier_vision_m) GAME_CONFIG.SOLDIER_VISION_M = Number(r.soldier_vision_m);
                if (r.fire_range_m) GAME_CONFIG.FIRE_RANGE_M = Number(r.fire_range_m);
                if (r.soldier_hp) GAME_CONFIG.SOLDIER_HP = Number(r.soldier_hp);
                if (r.soldier_speed_mps) GAME_CONFIG.SOLDIER_SPEED_MPS = Number(r.soldier_speed_mps);
                if (r.building_defense_per_level) GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL = Number(r.building_defense_per_level);
                if (r.building_gap_m != null) GAME_CONFIG.BUILDING_GAP_M = Number(r.building_gap_m);
                if (r.build_bookmark_size_m) GAME_CONFIG.BUILD_BOOKMARK_M = Number(r.build_bookmark_size_m);
                if (r.build_chain_m != null) GAME_CONFIG.BUILD_CHAIN_M = Number(r.build_chain_m);
                if (r.garrison_merge_m) GAME_CONFIG.GARRISON_MERGE_M = Number(r.garrison_merge_m);
                for (const [k, bcfg] of Object.entries(GAME_CONFIG.BUILDINGS)) {
                    if (r.building_prices?.[k]) bcfg.prices = r.building_prices[k];
                    if (r.building_housing?.[k]) bcfg.housing = r.building_housing[k];
                    if (r.building_materials?.[k]) bcfg.materials = r.building_materials[k];
                    if (r.building_production?.[k]) bcfg.production = r.building_production[k];
                    if (r.building_size_m?.[k]) bcfg.size = Number(r.building_size_m[k]);
                }
                const wf = GAME_CONFIG.BUILDINGS.weapons_factory;
                wf.enabled = !!r.building_prices?.weapons_factory;
                if (r.factory_unlock) wf.unlock = r.factory_unlock;
                if (r.factory_discount) wf.discount = r.factory_discount.map(Number);
                const mortarRules = {
                    priceSteps: "mortar_price_steps", priceSteel: "mortar_price_steel",
                    shellSteps: "mortar_shell_price_steps", shellSteel: "mortar_shell_price_steel",
                    rangeM: "mortar_range_m", minRangeM: "mortar_min_range_m",
                    spreadBaseM: "mortar_spread_base_m", spreadPct: "mortar_spread_pct",
                    blastM: "mortar_blast_m", crew: "mortar_crew", reloadS: "mortar_reload_s",
                    salvoMax: "mortar_salvo_max", flightBaseS: "mortar_flight_base_s",
                    flightMps: "mortar_flight_mps", craterHours: "mortar_crater_hours"
                };
                for (const [k, key] of Object.entries(mortarRules)) {
                    if (r[key] != null) GAME_CONFIG.MORTAR[k] = Number(r[key]);
                }
                const truckRules = {
                    priceSteps: "truck_price_steps", priceSteel: "truck_price_steel",
                    capacity: "truck_capacity", roadMps: "truck_road_speed_mps",
                    fieldMps: "truck_field_speed_mps", hp: "truck_hp",
                    hitShare: "truck_hit_share", wreckHours: "truck_wreck_hours"
                };
                for (const [k, key] of Object.entries(truckRules)) {
                    if (r[key] != null) GAME_CONFIG.TRUCK[k] = Number(r[key]);
                }
                const howitzerRules = {
                    priceSteps: "howitzer_price_steps", priceSteel: "howitzer_price_steel",
                    shellSteps: "howitzer_shell_price_steps", shellSteel: "howitzer_shell_price_steel",
                    rangeM: "howitzer_range_m", minRangeM: "howitzer_min_range_m",
                    spreadBaseM: "howitzer_spread_base_m", spreadPct: "howitzer_spread_pct",
                    blastM: "howitzer_blast_m", hits: "howitzer_hits", crew: "howitzer_crew",
                    reloadS: "howitzer_reload_s", salvoMax: "howitzer_salvo_max",
                    flightBaseS: "howitzer_flight_base_s", flightMps: "howitzer_flight_mps"
                };
                for (const [k, key] of Object.entries(howitzerRules)) {
                    if (r[key] != null) GAME_CONFIG.HOWITZER[k] = Number(r[key]);
                }
                // Knapperne vises først, når 0032 er kørt i databasen.
                GAME_CONFIG.HOWITZER.enabled = r.howitzer_price_steps != null;
                const fireRules = { chance: "map_fire_chance", fireHours: "map_fire_hours", ruinHours: "map_ruin_hours" };
                for (const [k, key] of Object.entries(fireRules)) {
                    if (r[key] != null) GAME_CONFIG.MAP_FIRE[k] = Number(r[key]);
                }
                if (r.hospital_beds) GAME_CONFIG.BUILDINGS.hospital.beds = r.hospital_beds;
                if (r.hospital_heal_per_hour) GAME_CONFIG.BUILDINGS.hospital.healPerHour = r.hospital_heal_per_hour;
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
        state.mortarsHome = mapMat.mortars || 0;
        state.shells = mapMat.mortar_shells || 0;
        state.trucksHome = mapMat.trucks || 0;
        state.howitzersHome = mapMat.howitzers || 0;
        state.howitzerShells = mapMat.howitzer_shells || 0;
    }
    if (myBldRes.data) {
        state.myBuildings = myBldRes.data;
        if (!state.hasCenteredOnce && myBldRes.data.length > 0 && map) {
            state.hasCenteredOnce = true;
            const first = myBldRes.data[0];
            map.jumpTo({ center: [first.lon, first.lat], zoom: 16.5 });
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
    await loadHospitals();
}

// Bogmærker, hvis firkant (byggeplads 50×50 m, mål 20×20 m) indeholder punktet.
const TARGET_BOOKMARK_M = 20;
function bookmarkSize(b) {
    return b.purpose === "build" ? GAME_CONFIG.BUILD_BOOKMARK_M : TARGET_BOOKMARK_M;
}
function bookmarksAt(lat, lon) {
    return state.bookmarks.filter(b => Geo.pointInSquare(lat, lon, b.lat, b.lon, bookmarkSize(b)));
}

function renderBookmarksOnMap() {
    if (!mapReady) return;
    map.getSource("src-bookmarks")?.setData({
        type: "FeatureCollection",
        features: state.bookmarks.map(b => squareFeature(b.lat, b.lon, bookmarkSize(b), { purpose: b.purpose }))
    });
}

function updateHud() {
    const fmt = n => Number(n || 0).toLocaleString("da-DK");
    document.getElementById("hud-steps").textContent = fmt(state.balance);
    document.getElementById("hud-steel").textContent = fmt(state.steel);
    document.getElementById("hud-soldiers").textContent = `${fmt(state.soldiers)} / ${fmt(totalSoldierCapacity())}`;
}

// ============================================================================
// Klik på kortet & Valgt sted i sidepanelet
// ============================================================================
function buildingAt(lat, lon) {
    return state.visibleBuildings.find(b => Geo.pointInSquare(lat, lon, b.lat, b.lon, buildingSize(b.kind))) || null;
}

function findBuilding(id) {
    return state.visibleBuildings.find(b => String(b.id) === String(id))
        || state.myBuildings.find(b => String(b.id) === String(id)) || null;
}

// Vagtstyrker tæt på et punkt: inden for garrison_merge_m, eller så tæt på skærmen, at man har
// klikket på deres ikon (ikonet står oven over punktet).
function garrisonsNear(list, lat, lon) {
    const pt = mapReady ? map.project([lon, lat]) : null;
    return list.filter(g => {
        if (g.count <= 0) return false;
        if (Geo.distanceM(lat, lon, g.lat, g.lon) <= GAME_CONFIG.GARRISON_MERGE_M) return true;
        if (!pt) return false;
        const gp = map.project([g.lon, g.lat]);
        return Math.abs(pt.x - gp.x) <= 30 && pt.y >= gp.y - 85 && pt.y <= gp.y + 15;
    });
}

// Patruljer ved et klik på kortet (samme slør som for soldater: ikonet står over punktet).
function npcsNear(lat, lon) {
    return state.enemies.npcs
        .map(n => ({ n, pos: npcCurrentPos(n) }))
        .filter(({ pos }) => garrisonsNear([{ lat: pos[0], lon: pos[1], count: 1 }], lat, lon).length > 0);
}

// Byggeret (samme regler som build_right_problem i SQL): testkonto, byggepladsbogmærke eller
// højst build_chain_m fra en af dine egne bygninger.
function buildRight(lat, lon, size) {
    if (state.isTester) return "tester";
    if (state.bookmarks.some(b => b.purpose === "build"
        && Geo.pointInSquare(lat, lon, b.lat, b.lon, GAME_CONFIG.BUILD_BOOKMARK_M))) return "bookmark";
    if (state.myBuildings.some(b =>
        Geo.rectGapM(b.lat, b.lon, buildingSize(b.kind), lat, lon, size) <= GAME_CONFIG.BUILD_CHAIN_M)) return "chain";
    return null;
}

// Den bygning (du kan se), der står tættest på en ny bygning her — og afstanden mellem kanterne.
function nearestBuildingGap(lat, lon, size) {
    let best = null;
    for (const b of state.visibleBuildings) {
        const gap = Geo.rectGapM(b.lat, b.lon, buildingSize(b.kind), lat, lon, size);
        if (!best || gap < best.gap) best = { b, gap };
    }
    return best;
}

function onMapClicked(lat, lon) {
    if (state.mortarAim) {
        openFireMortarModal(lat, lon);
        return;
    }
    if (state.pendingMarchOrder) {
        // Tjek om der er klikket på en anden egne vagtstyrke (snapper præcist til dens koordinater)
        const nearGar = garrisonsNear(state.garrisons, lat, lon).find(g => {
            return !(state.pendingMarchOrder.from.type === "garrison" && String(state.pendingMarchOrder.from.id) === String(g.id));
        });
        const bld = buildingAt(lat, lon);
        let target;
        if (nearGar) {
            target = { lat: nearGar.lat, lon: nearGar.lon, label: `Slå sammen med vagt (${nearGar.count} soldater)` };
        } else if (bld) {
            target = { lat: bld.lat, lon: bld.lon, label: buildingLabel(bld) };
        } else {
            if (terrainAt(lat, lon).id === "water") {
                showToast("Stedet ligger ude i vandet! Vælg et sted på land.");
                return;
            }
            target = { lat, lon, label: formatPos(lat, lon) };
        }
        addRoutePoint(target);
        return;
    }
    selectPoint(lat, lon);
    openGroupModalAt(lat, lon);
}

function selectPoint(lat, lon) {
    const bld = buildingAt(lat, lon);
    state.selected = { lat, lon, buildingId: bld ? bld.id : null };
    highlightTroopsAt(lat, lon);
    renderSelectedBox();
    renderTroopsOnMap();
    // Sidepanelet kan være rullet ned: vis "Valgt sted" øverst, så menuen ses med det samme.
    document.querySelector(".command-sidebar")?.scrollTo({ top: 0, behavior: "auto" });
}

// Egne delinger på march, man har klikket på (deres ikon står oven over positionen).
function marchesNear(lat, lon) {
    if (!mapReady) return [];
    const pt = map.project([lon, lat]);
    const now = serverNow();
    return state.marches.filter(m => {
        if (m.count <= 0) return false;
        const [mLat, mLon] = marchCurrentPos(m, now);
        const mp = map.project([mLon, mLat]);
        return Math.abs(pt.x - mp.x) <= 30 && pt.y >= mp.y - 85 && pt.y <= mp.y + 15;
    });
}

// Får de soldater, man har klikket på, til at lyse op i listen "Soldater ude på kortet".
function highlightTroopsAt(lat, lon) {
    const garrisons = garrisonsNear(state.garrisons, lat, lon).map(g => String(g.id));
    const marches = marchesNear(lat, lon).map(m => String(m.id));
    state.highlight = { garrisons: new Set(garrisons), marches: new Set(marches) };
    // Klikker du på en af dine vagtstyrker, husker vi den, så Angrib bruger den, også når du
    // bagefter klikker på fjenden (det nulstiller ikke valget).
    if (garrisons.length === 1) state.attackFromId = garrisons[0];
    else if (marches.length > 0) state.attackFromId = null;
    renderTroopsSidebar();
    if (garrisons.length + marches.length === 0) return;
    openSidebarSection("troops");
    // Har man valgt en bygning, skal sidepanelet blive stående øverst, så "Valgt sted" ses.
    if (state.selected?.buildingId == null) {
        document.querySelector("#troops-list .item-row-selected")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

function buildingLabel(b) {
    const cfg = GAME_CONFIG.BUILDINGS[b.kind];
    const stage = cfg ? cfg.stages[Math.min(b.level, cfg.stages.length) - 1] : b.kind;
    return `${stage} (trin ${b.level})`;
}

function computeProductionContents(b) {
    const cfg = GAME_CONFIG.BUILDINGS[b.kind];
    if (!cfg || !cfg.production) return null;
    const perHour = cfg.production.per_hour[b.level - 1] || 0;
    const cap = cfg.production.capacity[b.level - 1] || 0;
    const emptiedMs = b.emptied_at ? new Date(b.emptied_at).getTime() : serverNow();
    const hours = Math.max(0, (serverNow() - emptiedMs) / 3600000.0);
    const amount = Math.min(cap, Math.floor(hours * perHour));
    const material = cfg.production.material || "soldiers";
    return { amount, capacity: cap, perHour, material, unit: MATERIAL_NAMES[material] || material };
}

function setSelectedShape(feature) {
    if (!mapReady) return;
    map.getSource("src-selected")?.setData({ type: "FeatureCollection", features: feature ? [feature] : [] });
}

function renderSelectedBox() {
    const sel = state.selected;
    const box = document.getElementById("selected-tile-box");
    const badge = document.getElementById("selected-tile-coords");
    if (!sel) return;

    const bld = sel.buildingId != null ? findBuilding(sel.buildingId) : null;
    if (sel.buildingId != null && !bld) {
        // Bygningen er væk (revet ned, erobret eller ude af syne): vis stedet i stedet.
        state.selected = { lat: sel.lat, lon: sel.lon, buildingId: null };
        return renderSelectedBox();
    }
    if (bld) renderBuildingBox(bld, box, badge);
    else renderPointBox(sel.lat, sel.lon, box, badge);
}

function renderBuildingBox(bld, box, badge) {
    const uid = state.user?.id;
    const isMine = bld.owner_id === uid;
    const cfg = GAME_CONFIG.BUILDINGS[bld.kind];
    const size = buildingSize(bld.kind);
    badge.textContent = isMine ? "Din bygning" : "Fjendtlig bygning";
    setSelectedShape(squareFeature(bld.lat, bld.lon, size, { state: "building" }));

    const stageName = cfg ? cfg.stages[bld.level - 1] : bld.kind;
    const sprite = cfg ? cfg.sprites[Math.min(bld.level, cfg.sprites.length) - 1] : "barrak_1";
    let html = "";

    if (isMine) {
        const nextPrice = cfg && bld.level < cfg.prices.length ? cfg.prices[bld.level] : null;
        const nextSteel = cfg?.materials?.[bld.level]?.steel || 0;
        const prod = computeProductionContents(bld);
        const housing = cfg?.housing ? cfg.housing[bld.level - 1] : null;
        const avail = availableInBarracks();
        const hasBarracks = state.myBuildings.some(b => b.kind === "barracks");
        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/${sprite}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title">${stageName} (Trin ${bld.level}/${cfg ? cfg.prices.length : 5})</div>
                        <div class="item-sub">${cfg ? cfg.desc : ""}</div>
                        <div class="item-sub">${size}×${size} m · ${formatPos(bld.lat, bld.lon)}</div>
                        ${housing ? `<div class="item-sub" style="color:#76FF03">Plads her: ${housing} · Ledige i barrak: ${avail}</div>` : ""}
                        ${bld.kind === "barracks" || bld.kind === "weapons_factory" ? stockLinesHtml() : ""}
                        ${bld.kind === "barracks" && factoryEnabled() ? `<div class="item-sub">Våben, granater og køretøjer købes i våbenfabrikken og står på lager her.</div>` : ""}
                        ${bld.kind === "weapons_factory" ? `<div class="item-sub" style="color:#FFB74D">${factoryLineText(bld)}</div>
                        <div class="item-sub">${hasBarracks ? "Købt udstyr leveres til din barrak. Soldater sendes ud og haubitser affyres fra barrakken." : "Du skal have en barrak for at kunne opbevare udstyr."}</div>` : ""}
                        ${prod ? `<div class="item-sub" style="color:#FFD54F">${prod.material === "steel" ? "Klar til afhentning" : "Klar til indkaldelse"}: ${prod.amount} / ${prod.capacity} ${prod.unit} (${prod.perHour}/t)</div>` : ""}
                        ${hospitalLineHtml(bld)}
                    </div>
                </div>
                <div class="item-actions">
                    ${bld.kind === "hospital" ? `<button class="btn btn-small btn-primary" onclick="openHospitalModal(${bld.id})">🏥 Patienter</button>` : ""}
                    ${bld.kind === "barracks" ? `<button class="btn btn-small btn-primary" ${avail <= 0 ? "disabled" : ""} onclick="sendFromBuilding(${bld.id})">🪖 Send soldater (${avail} klar)</button>` : ""}
                    ${bld.kind === (factoryEnabled() ? "weapons_factory" : "barracks") ? equipmentButtonsHtml(bld) : ""}
                    ${bld.kind === "barracks" && state.howitzersHome > 0 ? `<button class="btn btn-small btn-danger" onclick="startHowitzerAim(${bld.id})">💥 Skyd med haubits</button>` : ""}
                    ${prod && prod.amount > 0 ? `<button class="btn btn-small btn-primary" onclick="collectFromBuilding(${bld.id})">📥 ${prod.material === "steel" ? "Hent" : "Indkald"} ${prod.amount} ${prod.unit}</button>` : ""}
                    ${bld.kind === "academy" ? `<button class="btn btn-small btn-gold" onclick="recruitSoldierInstant()">⚡ Uddan 1 straks (${GAME_CONFIG.INSTANT_SOLDIER_STEPS} skridt)</button>` : ""}
                    ${nextPrice ? `<button class="btn btn-small" onclick="upgradeBuilding(${bld.id})">⬆️ Opgradér til trin ${bld.level + 1} (${nextPrice} skridt${nextSteel ? ` + ${nextSteel} stål` : ""})</button>` : `<span class="badge">Fuldt udbygget</span>`}
                </div>
            </div>
        `;
        html += garrisonRowsHtml(garrisonsNear(state.garrisons, bld.lat, bld.lon));
    } else {
        const radius = size / 2 + GAME_CONFIG.GARRISON_MERGE_M;
        const guards = state.enemies.garrisons
            .filter(g => g.owner_id === bld.owner_id && Geo.distanceM(g.lat, g.lon, bld.lat, bld.lon) <= radius)
            .reduce((n, g) => n + g.count, 0);
        const bldDef = GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL * bld.level;
        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/${sprite}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title enemy-title">Fjendtlig ${cfg?.shortName || bld.kind}: ${stageName} (trin ${bld.level})</div>
                        <div class="item-sub">Du kan se den lige nu, fordi din telefon (${GAME_CONFIG.VISION_RADIUS_M} m) eller dine soldater (${GAME_CONFIG.SOLDIER_VISION_M} m) er tæt på.</div>
                        <div class="item-sub"><strong>Forsvar:</strong> ${guards} vagter + ${bldDef} fra bygningen. Send mindst <strong>${guards + bldDef + 1}</strong> soldater for at jævne den med jorden.</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${bld.lat}, ${bld.lon})">⚔️ Angrib</button>
                </div>
            </div>
        `;
    }
    box.innerHTML = html;
}

// "Senge: 3 / 10 · +20 energi/t" på hospitalet, "🩹 4 sårede venter" på barrakken.
function hospitalLineHtml(b) {
    if (b.kind === "hospital") {
        const cfg = GAME_CONFIG.BUILDINGS.hospital;
        const h = hospitalOf(b.id);
        const beds = h ? h.beds : cfg.beds[b.level - 1];
        const rate = h ? h.heal_per_hour : cfg.healPerHour[b.level - 1];
        const used = h ? patientsNow(h).length : 0;
        return `<div class="item-sub" style="color:#FF8A80">Senge: ${used} / ${beds} · +${rate} energi i timen</div>`;
    }
    if (b.kind === "barracks" && state.hospital.waiting.length > 0) {
        const n = state.hospital.waiting.length;
        const why = state.myBuildings.some(x => x.kind === "hospital") ? "på en ledig seng" : "— byg et felthospital for at hele dem";
        return `<div class="item-sub" style="color:#FF8A80">🩹 ${n} ${n === 1 ? "såret venter" : "sårede venter"} ${why}</div>`;
    }
    return "";
}

function garrisonRowsHtml(list) {
    return list.map(g => `
        <div class="item-row" style="margin-top:8px;">
            <div class="item-row-top">
                <img src="assets/tropper.png" class="pixel-img item-sprite" />
                <div class="item-info">
                    <div class="item-title item-title-green">Vagtstyrke: ${g.count} soldater${mortarTag(g)}${howitzerTag(g)}${truckTag(g)}</div>
                    <div class="item-sub">Står vagt her · ${energyText(g)}</div>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-small" onclick="openGroupModal('garrison', '${g.id}')">📋 Soldater</button>
                <button class="btn btn-small btn-primary" onclick="sendFromGarrison(${g.id})">🪖 Send videre</button>
                ${g.mortars > 0 ? `<button class="btn btn-small btn-gold" onclick="startMortarAim(${g.id})">💣 Affyr morter</button>` : ""}
                ${g.howitzers > 0 ? `<button class="btn btn-small btn-danger" onclick="startHowitzerAimGarrison(${g.id})">💥 Affyr haubits</button>` : ""}
            </div>
        </div>
    `).join("");
}

function renderPointBox(lat, lon, box, badge) {
    badge.textContent = formatPos(lat, lon);
    const terr = terrainAt(lat, lon);
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Terræn: ${terr.name}</strong>
        </div>
    `;

    for (const bm of bookmarksAt(lat, lon)) {
        html += `
            <div class="bookmark-chip bookmark-${bm.purpose}">
                <span>📌 Inde i dit bogmærke: <strong>${bm.purpose === "build" ? "byggeplads" : "mål"}</strong>${bm.note ? ` · ${escapeHtml(bm.note)}` : ""}</span>
                <button class="btn btn-small btn-muted" onclick="deleteBookmark(${bm.id})">Fjern</button>
            </div>
        `;
    }

    // Har man klikket på soldater, handler panelet om dem — ikke om at bygge.
    const ownGuards = garrisonsNear(state.garrisons, lat, lon);
    const ownMarches = marchesNear(lat, lon);
    const enemyGuards = garrisonsNear(state.enemies.garrisons, lat, lon);
    const npcsHere = npcsNear(lat, lon);
    if (ownGuards.length > 0 || ownMarches.length > 0 || enemyGuards.length > 0 || npcsHere.length > 0) {
        setSelectedShape(null);
        badge.textContent = ownGuards.length + ownMarches.length > 0 ? "Dine soldater" : "Fjendtlige soldater";
        html = garrisonRowsHtml(ownGuards) + ownMarches.map(m => `
            <div class="item-row" style="margin-top:8px;">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title ${m.patrolPath ? 'item-title-blue' : 'item-title-orange'}">${m.count} soldater ${m.patrolPath ? 'på patrulje' : 'på march'}${mortarTag(m)}${howitzerTag(m)}${truckTag(m)}</div>
                        <div class="item-sub">${marchEtaText(m)}</div>
                        <div class="item-sub">${energyText(m)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="openGroupModal('march', '${m.id}')">📋 Soldater</button>
                    <button class="btn btn-small btn-danger" onclick="stopMarch('${m.id}')">🛑 Stop</button>
                    <button class="btn btn-small btn-primary" onclick="startRedirectMarch('${m.id}')">🧭 Nyt mål</button>
                    <button class="btn btn-small btn-danger" onclick="recallMarch('${m.id}')">🏠 Kald hjem</button>
                </div>
            </div>
        `).join("");
        if (enemyGuards.length > 0) {
            const n = enemyGuards.reduce((sum, g) => sum + g.count, 0);
            const g = enemyGuards[0];
            html += `
                <p class="muted-hint"><strong>Fjender her:</strong> ${n} vagter. Send mindst <strong>${n + 1}</strong> soldater for at slå dem.</p>
                <div class="item-actions"><button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${g.lat}, ${g.lon})">⚔️ Angrib</button></div>
            `;
        }
        for (const { n, pos } of npcsHere) {
            html += `
                <div class="item-row" style="margin-top:8px;">
                    <div class="item-row-top">
                        <img src="assets/fjende.png" class="pixel-img item-sprite" />
                        <div class="item-info">
                            <div class="item-title enemy-title">${npcLabel(n)}: ${n.count} soldater</div>
                            <div class="item-sub">${npcAbout(n)}</div>
                            <div class="item-sub">${energyText(n)}</div>
                        </div>
                    </div>
                    <div class="item-actions"><button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${pos[0]}, ${pos[1]})">⚔️ Angrib</button></div>
                </div>
            `;
        }
        box.innerHTML = html;
        return;
    }

    // Byggeskitse: en firkant på stedet, grøn hvis du må bygge her, rød hvis ikke.
    const size = Math.min(...Object.values(GAME_CONFIG.BUILDINGS).map(c => c.size || 30));
    const right = buildRight(lat, lon, size);
    const near = nearestBuildingGap(lat, lon, size);
    const tooClose = near && near.gap < GAME_CONFIG.BUILDING_GAP_M;
    const water = terr.id === "water";
    const canBuild = right && !tooClose && !water;
    sketchShape = squareFeature(lat, lon, size, { state: canBuild ? "ok" : "no" });
    setSelectedShape(sketchShape);

    if (canBuild) {
        const why = {
            tester: `<span class="badge badge-gold">Testkonto</span> Du må bygge her uden bogmærke fra telefonen:`,
            bookmark: "Stedet ligger i dit byggepladsbogmærke, så du kan bygge her hjemmefra:",
            chain: `Stedet er højst ${GAME_CONFIG.BUILD_CHAIN_M} m fra en af dine bygninger, så du kan bygge her:`
        }[right];
        html += `<div class="muted-hint" style="margin:8px 0;">${why}</div>`;
        html += buildChoicesHtml(lat, lon, terr);
    } else if (water) {
        html += `<p class="muted-hint">Der kan ikke bygges ude i vandet.</p>`;
    } else if (tooClose) {
        html += `<p class="muted-hint">For tæt på ${near.b.owner_id === state.user?.id ? "din" : "en anden"} bygning: der skal være mindst <strong>${GAME_CONFIG.BUILDING_GAP_M} m</strong> mellem bygningerne (her er der ${Math.floor(near.gap)} m). Klik lidt længere væk.</p>`;
    } else {
        html += `<p class="muted-hint">Her må du ikke bygge endnu. En ny bygning skal enten stå i et <strong>byggepladsbogmærke</strong> fra telefonen (${GAME_CONFIG.BUILD_BOOKMARK_M}×${GAME_CONFIG.BUILD_BOOKMARK_M} m), eller højst <strong>${GAME_CONFIG.BUILD_CHAIN_M} m</strong> fra en af dine egne bygninger. Soldater kan du sende hertil når som helst.</p>`;
    }
    html += `<p class="muted-hint fog-hint">Fjender er skjulte, medmindre din telefon er inden for ${GAME_CONFIG.VISION_RADIUS_M} m eller dine soldater inden for ${GAME_CONFIG.SOLDIER_VISION_M} m.</p>`;

    if (!water) {
        html += `<div class="item-actions" style="margin-top:8px;"><button class="btn btn-small btn-primary" onclick="sendSoldiersTo(${lat}, ${lon})">🪖 Send soldater hertil</button></div>`;
    }
    box.innerHTML = html;
}

// Byggeskitsen for det valgte sted (den mindste bygning). Når musen står over et byggevalg,
// vises i stedet den bygnings egen størrelse, så fx stålværkets 100×100 m kan ses på kortet.
let sketchShape = null;

function previewFootprint(lat, lon, size, ok) {
    setSelectedShape(squareFeature(lat, lon, size, { state: ok ? "ok" : "no" }));
}

function clearFootprintPreview() {
    setSelectedShape(sketchShape);
}

function buildChoicesHtml(lat, lon, terr) {
    let html = "";
    for (const cfg of Object.values(GAME_CONFIG.BUILDINGS)) {
        if (cfg.needsRules && !cfg.enabled) continue;
        const p = cfg.prices[0];
        const size = cfg.size || 30;
        const near = nearestBuildingGap(lat, lon, size);
        const blocked = (near && near.gap < GAME_CONFIG.BUILDING_GAP_M) || !buildRight(lat, lon, size);
        html += `
            <div class="item-row" style="margin-bottom:6px;" onmouseenter="previewFootprint(${lat}, ${lon}, ${size}, ${!blocked})" onmouseleave="clearFootprintPreview()">
                <div class="item-row-top">
                    <img src="assets/${cfg.sprites[0]}.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title">${cfg.name} (${cfg.stages[0]})</div>
                        <div class="item-sub">${cfg.desc} ${size}×${size} m.</div>
                        ${blocked ? `<div class="item-sub" style="color:#FF8A80">Ikke plads her: ${size}×${size} m skal holde ${GAME_CONFIG.BUILDING_GAP_M} m afstand til andre bygninger og ligge i dit byggeområde. Hold musen over denne boks for at se, hvor meget den fylder.</div>` : ""}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" ${blocked ? "disabled" : ""} onclick="buildAt('${cfg.id}', ${lat}, ${lon}, '${terr.id}')">🔨 Byg her (${p} skridt)</button>
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
        list.innerHTML = `<p class="muted-hint">Ingen bogmærker endnu. Tag telefonen med ud, tryk på kortet og gem stedet som <strong>byggeplads</strong> (så kan du bygge i en ${GAME_CONFIG.BUILD_BOOKMARK_M}×${GAME_CONFIG.BUILD_BOOKMARK_M} m firkant der herfra) eller som <strong>mål</strong> for dine soldater.</p>`;
        return;
    }

    list.innerHTML = state.bookmarks.map(b => {
        const isBuild = b.purpose === "build";
        const built = isBuild && state.myBuildings.some(mb =>
            Geo.pointInSquare(mb.lat, mb.lon, b.lat, b.lon, GAME_CONFIG.BUILD_BOOKMARK_M));
        const home = nearestOwnBuilding(b.lat, b.lon);
        const where = home ? `${formatDistance(home.d)} fra din nærmeste bygning` : formatPos(b.lat, b.lon);
        return `
            <div class="item-row">
                <div class="item-row-top">
                    <div class="bookmark-icon bookmark-${b.purpose}">${isBuild ? "🔨" : "🎯"}</div>
                    <div class="item-info">
                        <div class="item-title">${isBuild ? "Byggeplads" : "Mål"}${b.note ? ` · ${escapeHtml(b.note)}` : ""}</div>
                        <div class="item-sub">${where} · gemt ${new Date(b.created_at).toLocaleDateString("da-DK")}${built ? " · bebygget" : ""}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToPoint(${b.lat}, ${b.lon})">🎯 Hop til</button>
                    <button class="btn btn-small btn-primary" onclick="sendSoldiersTo(${b.lat}, ${b.lon})">🪖 Send soldater</button>
                    <button class="btn btn-small btn-muted" onclick="deleteBookmark(${b.id})">Fjern</button>
                </div>
            </div>
        `;
    }).join("");
}

function nearestOwnBuilding(lat, lon, kind = null) {
    let best = null;
    for (const b of state.myBuildings) {
        if (kind && b.kind !== kind) continue;
        const d = Geo.distanceM(lat, lon, b.lat, b.lon);
        if (!best || d < best.d) best = { b, d };
    }
    return best;
}

window.deleteBookmark = async function(id) {
    const { error } = await sb.from("bookmarks").delete().eq("id", id);
    if (error) {
        showToast("Kunne ikke fjerne bogmærket: " + error.message);
        return;
    }
    state.bookmarks = state.bookmarks.filter(b => String(b.id) !== String(id));
    renderBookmarksOnMap();
    renderBookmarksSidebar();
    if (state.selected) renderSelectedBox();
};

// Send soldater fra den nærmeste egne barrak til et punkt — et bogmærke eller hvor som helst i verden.
// Ligger punktet i en bygning, er bygningen målet.
window.sendSoldiersTo = function(lat, lon) {
    const bld = buildingAt(lat, lon);
    const target = bld
        ? { lat: bld.lat, lon: bld.lon, label: buildingLabel(bld) }
        : { lat, lon, label: formatPos(lat, lon) };

    // Hvem kan angribe: alle dine vagtstyrker med soldater, og din nærmeste barrak med ledige soldater.
    const choices = state.garrisons
        .filter(g => g.count > 0)
        .map(g => ({ d: Geo.distanceM(g.lat, g.lon, lat, lon), label: `Vagtstyrke · ${g.count} soldater`,
                     garrisonId: g.id,
                     open: t => openSendSoldiersModal({ type: "garrison", id: g.id, lat: g.lat, lon: g.lon }, g.count, t) }));
    // Grupper på march (også patruljer) kan ændre kurs direkte mod målet, ligesom "Nyt mål".
    const now = serverNow();
    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [mLat, mLon] = marchCurrentPos(m, now);
        choices.push({ d: Geo.distanceM(mLat, mLon, lat, lon), label: `På march · ${m.count} soldater`,
                       garrisonId: null,
                       open: t => openConfirmMarchModal({ from: { type: "march", id: m.id, lat: mLat, lon: mLon },
                                                          count: m.count, redirectMarchId: m.id }, t) });
    }
    choices.sort((a, b) => a.d - b.d);
    const from = nearestOwnBuilding(lat, lon, "barracks");
    const avail = availableInBarracks();
    if (from && avail > 0) {
        choices.push({ d: Infinity, label: `Barrak · ${avail} ledige soldater`, garrisonId: null,
                       open: t => openSendSoldiersModal({ type: "building", id: from.b.id, lat: from.b.lat, lon: from.b.lon }, avail, t) });
    }
    if (choices.length === 0) {
        showToast("Du har ingen soldater, der kan angribe herfra.");
        return;
    }
    if (choices.length === 1) {
        choices[0].open(target);
        return;
    }
    openAttackSourceModal(choices, target);
};

// Lader spilleren vælge, hvilken af hans grupper der angriber. Den sidst valgte vagtstyrke står øverst.
function openAttackSourceModal(choices, target) {
    const overlay = document.getElementById("modal-overlay");
    document.getElementById("modal-title").textContent = "Hvem skal angribe?";
    const rows = choices.map((c, i) => {
        const dist = Number.isFinite(c.d) ? ` · ${formatDistance(c.d)} væk` : "";
        const picked = c.garrisonId != null && String(c.garrisonId) === String(state.attackFromId);
        return `<button class="btn ${picked ? "btn-primary" : ""}" data-choice="${i}" style="width:100%;margin-bottom:6px;text-align:left;">${c.label}${dist}${picked ? " (valgt)" : ""}</button>`;
    }).join("");
    document.getElementById("modal-body").innerHTML = `
        <p>Vælg hvilken af dine grupper der skal angribe ${escapeHtml(target.label)}:</p>
        ${rows}
    `;
    document.getElementById("modal-actions").innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    document.querySelectorAll("#modal-body [data-choice]").forEach(btn => {
        btn.onclick = () => {
            const c = choices[Number(btn.dataset.choice)];
            if (c.garrisonId != null) state.attackFromId = c.garrisonId;
            c.open(target);
        };
    });
    overlay.classList.remove("hidden");
}

window.sendFromBuilding = function(id) {
    const b = state.myBuildings.find(x => String(x.id) === String(id));
    if (!b) return;
    openSendSoldiersModal({ type: "building", id: b.id, lat: b.lat, lon: b.lon }, availableInBarracks());
};

window.sendFromGarrison = function(id) {
    const g = state.garrisons.find(x => String(x.id) === String(id));
    if (!g) return;
    openSendSoldiersModal({ type: "garrison", id: g.id, lat: g.lat, lon: g.lon }, g.count);
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
        const name = cfg ? cfg.name.toLowerCase() : a.kind;
        const who = a.scouts === 1 ? "En fjendtlig spejder" : `${a.scouts} fjendtlige spejdere`;
        return `<div>⚠️ ${who} er inden for ca. ${GAME_CONFIG.VISION_RADIUS_M} m af din <a href="#" onclick="jumpToPoint(${a.lat}, ${a.lon}); return false;">${name}</a>.</div>`;
    });
    el.innerHTML = lines.join("");
    el.classList.remove("hidden");
}

// ============================================================================
// Byg, Opgradér, Indkald, Straks-uddan via Supabase RPC
// ============================================================================
async function buildAt(kindId, lat, lon, terrainId) {
    const serverTerrain = terrainId === "water" ? "water" : "ground";
    const { data, error } = await sb.rpc("build", {
        p_kind: kindId,
        p_lat: lat,
        p_lon: lon,
        p_terrain: serverTerrain
    });
    if (error) {
        showToast("Kunne ikke bygge: " + error.message);
        return;
    }
    showToast(`${GAME_CONFIG.BUILDINGS[kindId]?.name || "Bygningen"} er opført!`);
    state.selected = { lat, lon, buildingId: data?.id ?? null };
    await syncAllFromSupabase();
}

window.upgradeBuilding = async function(id) {
    const { data, error } = await sb.rpc("upgrade_building", { p_building: id });
    if (error) {
        showToast("Kunne ikke opgradere: " + error.message);
        return;
    }
    showToast(`Bygningen er opgraderet til trin ${data?.level ?? ""}!`);
    await syncAllFromSupabase();
};

async function collectFromBuilding(id) {
    const b = state.myBuildings.find(x => String(x.id) === String(id));
    const prod = b ? computeProductionContents(b) : null;
    if (prod?.material === "steel") {
        const { data, error } = await sb.rpc("collect", { p_building: id, p_remote: true });
        if (error) {
            showToast("Kunne ikke hente stål: " + error.message);
            return;
        }
        showToast(`🔩 +${data?.amount ?? 0} stål hentet fra stålværket!`);
        await syncAllFromSupabase();
        return;
    }
    if (state.soldiers >= totalSoldierCapacity()) {
        showToast(`Dine barrakker er fulde (${state.soldiers}/${totalSoldierCapacity()})! Opgradér en barrak først.`);
        return;
    }
    const { data, error } = await sb.rpc("collect", { p_building: id, p_remote: true });
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
        list.innerHTML = `<p class="muted-hint">Du har ingen bygninger endnu. Tag telefonen med ud og sæt et byggepladsbogmærke — så kan du bygge der herfra.</p>`;
        return;
    }

    list.innerHTML = state.myBuildings.map(b => {
        const cfg = GAME_CONFIG.BUILDINGS[b.kind];
        const stageName = cfg ? cfg.stages[b.level - 1] : b.kind;
        const sprite = cfg ? cfg.sprites[Math.min(b.level, cfg.sprites.length) - 1] : "barrak_1";
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
                        <div class="item-sub">${housing ? `Plads: ${housing} soldater` : (cfg?.name || "")}</div>
                        ${prod ? `<div class="item-sub" style="color:#FFD54F">Klar: ${prod.amount}/${prod.capacity} ${prod.unit} (${prod.perHour}/t)</div>` : ""}
                        ${hospitalLineHtml(b)}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToBuilding(${b.id})">🎯 Hop til</button>
                    ${b.kind === "hospital" ? `<button class="btn btn-small btn-primary" onclick="openHospitalModal(${b.id})">🏥 Patienter</button>` : ""}
                    ${b.kind === "barracks" ? `<button class="btn btn-small btn-primary" ${avail <= 0 ? "disabled" : ""} onclick="sendFromBuilding(${b.id})">🪖 Send soldater (${avail})</button>` : ""}
                    ${prod && prod.amount > 0 ? `<button class="btn btn-small btn-primary" onclick="collectFromBuilding(${b.id})">📥 ${prod.material === "steel" ? "Hent" : "Indkald"} ${prod.amount} ${prod.unit}</button>` : ""}
                    ${b.kind === "academy" ? `<button class="btn btn-small btn-gold" onclick="recruitSoldierInstant()">⚡ +1 Soldat (${GAME_CONFIG.INSTANT_SOLDIER_STEPS})</button>` : ""}
                    ${nextPrice !== null
                        ? `<button class="btn btn-small" ${canAfford ? "" : `title="Du har ${state.balance} skridt${nextSteel ? ` og ${state.steel} stål` : ""}"`} onclick="upgradeBuilding(${b.id})">⬆️ Trin ${b.level + 1} (${nextPrice} skridt${nextSteel ? ` + ${nextSteel} stål` : ""})</button>`
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

    const now = serverNow();
    let html = "";

    for (const m of myMarches) {
        const totalMs = Math.max(1, m.arrivesAtMillis - m.startedAtMillis);
        const prog = Math.max(2, Math.min(100, ((now - m.startedAtMillis) / totalMs) * 100));

        const isPatrol = !!m.patrolPath;
        html += `
            <div class="item-row${state.highlight.marches.has(String(m.id)) ? " item-row-selected" : ""}" data-march-id="${m.id}" onclick="selectMarchRow('${m.id}')" style="cursor:pointer">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title ${isPatrol ? "item-title-blue" : "item-title-orange"}">${m.count} soldater ${isPatrol ? "på patrulje" : "på march"}${mortarTag(m)}${howitzerTag(m)}${truckTag(m)}</div>
                        <div class="item-sub march-eta-text">${marchEtaText(m, now)}</div>
                        <div class="item-sub">${energyText(m)}</div>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill march-prog-bar" style="width:${prog.toFixed(1)}%"></div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); openGroupModal('march', '${m.id}')">📋 Soldater</button>
                    <button class="btn btn-small" onclick="event.stopPropagation(); jumpToMarch('${m.id}')">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); stopMarch('${m.id}')">🛑 Stop</button>
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); startRedirectMarch('${m.id}')">🧭 Nyt mål</button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); recallMarch('${m.id}')">🏠 Kald hjem</button>
                </div>
            </div>
        `;
    }

    for (const g of myGarrisons) {
        const home = nearestOwnBuilding(g.lat, g.lon);
        const where = home && home.d < 60 ? `Står vagt ved din ${buildingLabel(home.b).toLowerCase()}`
            : home ? `Står vagt ${formatDistance(home.d)} fra din nærmeste bygning` : "Står vagt";
        html += `
            <div class="item-row${state.highlight.garrisons.has(String(g.id)) ? " item-row-selected" : ""}" data-garrison-id="${g.id}" onclick="selectGarrisonRow('${g.id}')" style="cursor:pointer">
                <div class="item-row-top">
                    <img src="assets/tropper.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title item-title-green">${g.count} soldater på vagt${mortarTag(g)}${howitzerTag(g)}${truckTag(g)}</div>
                        <div class="item-sub">${where}</div>
                        <div class="item-sub">${energyText(g)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); openGroupModal('garrison', '${g.id}')">📋 Soldater</button>
                    <button class="btn btn-small" onclick="event.stopPropagation(); jumpToPoint(${g.lat}, ${g.lon})">🎯 Hop til</button>
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); sendFromGarrison(${g.id})">🪖 Send videre</button>
                    ${g.mortars > 0 ? `<button class="btn btn-small btn-gold" onclick="event.stopPropagation(); startMortarAim(${g.id})">💣 Affyr</button>` : ""}
                    ${g.howitzers > 0 ? `<button class="btn btn-small btn-danger" onclick="event.stopPropagation(); startHowitzerAimGarrison(${g.id})">💥 Affyr haubits</button>` : ""}
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

// "3,2 km tilbage · Ankomst om 1t 4m" — resterende distance langs delingens rute.
function marchEtaText(m, now = serverNow()) {
    const remSec = Math.max(0, Math.ceil((m.arrivesAtMillis - now) / 1000));
    const left = formatDistance(pathDistanceM(marchRemainingPath(m, now)));
    if (m.patrolPath) {
        const onLoop = JSON.stringify(m.path) === JSON.stringify(m.patrolPath);
        return onLoop
            ? `🔁 Patruljerer · ${left} tilbage af runden · ny runde om ${formatSeconds(remSec)}`
            : `🔁 På vej til patruljeruten · ${left} · fremme om ${formatSeconds(remSec)}`;
    }
    return `${left} tilbage · Ankomst om ${formatSeconds(remSec)}`;
}

function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

// Opdaterer KUN nedtællingsteksten og bjælken hvert sekund uden at blinke!
function updateLiveTroopCountdowns() {
    const now = serverNow();
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
// from = { type: "building" | "garrison", id, lat, lon }; target = { lat, lon, label } eller null.
window.openSendSoldiersModal = function(from, maxAvail, target = null) {
    if (maxAvail <= 0) return;
    state.groupModal = null;
    const overlay = document.getElementById("modal-overlay");
    const fromText = from.type === "building" ? "din barrak" : "vagtstyrken";
    document.getElementById("modal-title").textContent = "Send soldater på march";
    document.getElementById("modal-body").innerHTML = `
        <p>Vælg hvor mange soldater du vil sende af sted fra ${fromText}${target ? ` mod ${escapeHtml(target.label)}` : ""}:</p>
        <div style="text-align:center;font-size:20px;font-weight:800;color:#39FF14;" id="slider-val-label">${maxAvail} / ${maxAvail} soldater</div>
        <input type="range" min="1" max="${maxAvail}" value="${maxAvail}" class="range-slider" id="soldier-range-input" />
        <div id="mortar-pick" class="mortar-pick hidden">
            <div id="mortar-val-label" class="mortar-pick-label"></div>
            <input type="range" min="0" max="0" value="0" class="range-slider" id="mortar-range-input" />
            <p id="mortar-pick-hint" class="muted-hint"></p>
            <div id="shell-val-label" class="mortar-pick-label"></div>
            <input type="range" min="0" max="0" value="0" class="range-slider" id="shell-range-input" />
        </div>
        <div id="truck-pick" class="mortar-pick hidden">
            <div id="truck-val-label" class="mortar-pick-label"></div>
            <input type="range" min="0" max="0" value="0" class="range-slider" id="truck-range-input" />
            <p id="truck-pick-hint" class="muted-hint"></p>
        </div>
        <div id="howitzer-pick" class="mortar-pick hidden">
            <div id="howitzer-val-label" class="mortar-pick-label"></div>
            <input type="range" min="0" max="0" value="0" class="range-slider" id="howitzer-range-input" />
            <p id="howitzer-pick-hint" class="muted-hint"></p>
            <div id="howitzer-shell-val-label" class="mortar-pick-label"></div>
            <input type="range" min="0" max="0" value="0" class="range-slider" id="howitzer-shell-range-input" />
        </div>
    `;
    const slider = document.getElementById("soldier-range-input");
    const label = document.getElementById("slider-val-label");

    // Morterer, der kan gå med: fra barrakkens lager eller vagtstyrkens egne. Hver morter kræver
    // MORTAR.crew soldater. Går hele vagtstyrken, går alle dens morterer med.
    const crew = GAME_CONFIG.MORTAR.crew;
    const garrison = from.type === "garrison" ? state.garrisons.find(x => String(x.id) === String(from.id)) : null;
    const mortarsHere = garrison ? (garrison.mortars || 0) : state.mortarsHome;
    const mSlider = document.getElementById("mortar-range-input");
    const mLabel = document.getElementById("mortar-val-label");
    const mHint = document.getElementById("mortar-pick-hint");
    // Granater: soldaterne bærer dem. Fra barrakkens lager eller vagtstyrkens egne; kun med en morter.
    const shellsHere = garrison ? (garrison.shells || 0) : state.shells;
    const sSlider = document.getElementById("shell-range-input");
    const sLabel = document.getElementById("shell-val-label");
    let shellsTouched = false;
    document.getElementById("mortar-pick").classList.toggle("hidden", mortarsHere <= 0);
    const updateMortars = () => {
        const n = parseInt(slider.value, 10) || 1;
        const all = garrison && n >= garrison.count;
        const max = all ? mortarsHere : Math.min(mortarsHere, Math.floor(n / crew));
        mSlider.max = String(max);
        mSlider.disabled = all;
        if (all || Number(mSlider.value) > max) mSlider.value = String(all ? mortarsHere : max);
        mLabel.textContent = `🧨 ${mSlider.value} / ${mortarsHere} morterer med`;
        mHint.textContent = all
            ? "Hele vagtstyrken går, så alle dens morterer og granater går med."
            : `Der skal ${crew} soldater til hver morter. ${garrison ? "Resten bliver stående hos vagten." : "Resten bliver på lager i barrakken."}`;

        const withMortar = Number(mSlider.value) > 0;
        const sMax = withMortar ? shellsHere : 0;
        sSlider.max = String(sMax);
        sSlider.disabled = all || !withMortar;
        if (all) sSlider.value = String(shellsHere);
        else if (!shellsTouched || Number(sSlider.value) > sMax) sSlider.value = String(sMax);
        sLabel.textContent = withMortar
            ? `💣 ${sSlider.value} / ${shellsHere} granater med`
            : `💣 Granater kan kun gå med en morter (${shellsHere} ${garrison ? "hos vagten" : "på lager"})`;
    };
    sSlider.oninput = () => { shellsTouched = true; updateMortars(); };

    // Lastbiler: fra barrakkens lager eller vagtstyrkens egne. Som udgangspunkt så mange, at alle
    // kan køre. Går hele vagtstyrken, kører alle dens lastbiler med.
    const T = GAME_CONFIG.TRUCK;
    const trucksHere = garrison ? truckCount(garrison) : state.trucksHome;
    const tSlider = document.getElementById("truck-range-input");
    const tLabel = document.getElementById("truck-val-label");
    const tHint = document.getElementById("truck-pick-hint");
    let trucksTouched = false;
    document.getElementById("truck-pick").classList.toggle("hidden", trucksHere <= 0);
    const updateTrucks = () => {
        const n = parseInt(slider.value, 10) || 1;
        const all = garrison && n >= garrison.count;
        const max = all ? trucksHere : Math.min(trucksHere, n);
        tSlider.max = String(max);
        tSlider.disabled = all;
        if (all) tSlider.value = String(trucksHere);
        else if (!trucksTouched) tSlider.value = String(Math.min(max, Math.ceil(n / T.capacity)));
        else if (Number(tSlider.value) > max) tSlider.value = String(max);
        const k = Number(tSlider.value);
        tLabel.textContent = `🚚 ${k} / ${trucksHere} ${trucksHere === 1 ? "lastbil" : "lastbiler"} med`;
        tHint.textContent = k === 0
            ? `Soldaterne går (${fmtKmh(GAME_CONFIG.SOLDIER_SPEED_MPS)}).`
            : truckCanDrive(n, k)
                ? `Kører ${fmtKmh(T.roadMps)} på vej og ${fmtKmh(T.fieldMps)} uden for vejene. Plads til ${k * T.capacity} soldater.${all ? " Hele vagtstyrken går, så alle lastbilerne kører med." : ""}`
                : n < k
                    ? "⚠️ Der skal mindst 1 soldat i hver lastbil, så alle går i gåtempo."
                    : `⚠️ Der er kun plads til ${k * T.capacity} soldater i ${k} ${k === 1 ? "lastbil" : "lastbiler"}, så alle går i gåtempo, og lastbilerne følger med.`;
    };
    // Haubitser: skal trækkes af lastbil (1 lastbil pr. haubits) og kræver HOWITZER.crew soldater.
    const hCrew = GAME_CONFIG.HOWITZER.crew;
    const howitzersHere = garrison ? (garrison.howitzers || 0) : state.howitzersHome;
    const howitzerShellsHere = garrison ? (garrison.howitzer_shells || 0) : state.howitzerShells;
    const hSlider = document.getElementById("howitzer-range-input");
    const hLabel = document.getElementById("howitzer-val-label");
    const hHint = document.getElementById("howitzer-pick-hint");
    const hsSlider = document.getElementById("howitzer-shell-range-input");
    const hsLabel = document.getElementById("howitzer-shell-val-label");
    let howitzerShellsTouched = false;
    document.getElementById("howitzer-pick").classList.toggle("hidden", howitzersHere <= 0);

    const updateHowitzers = () => {
        const n = parseInt(slider.value, 10) || 1;
        const trucks = parseInt(tSlider.value, 10) || 0;
        const all = garrison && n >= garrison.count;
        const max = all ? howitzersHere : Math.min(howitzersHere, Math.floor(n / hCrew), trucks);
        hSlider.max = String(max);
        hSlider.disabled = all;
        if (all || Number(hSlider.value) > max) hSlider.value = String(all ? howitzersHere : max);
        hLabel.textContent = `💥 ${hSlider.value} / ${howitzersHere} haubitser med`;
        hHint.textContent = all
            ? "Hele vagtstyrken går, så alle dens haubitser og granater går med."
            : trucks < howitzersHere && Math.floor(n / hCrew) >= howitzersHere
                ? `Hver haubits kræver 1 lastbil til bugsering (${trucks} lastbiler valgt).`
                : `Hver haubits trækkes af 1 lastbil og kræver ${hCrew} soldater. ${garrison ? "Resten bliver hos vagten." : "Resten bliver på lager i barrakken."}`;

        const withHowitzer = Number(hSlider.value) > 0;
        const sMax = withHowitzer ? howitzerShellsHere : 0;
        hsSlider.max = String(sMax);
        hsSlider.disabled = all || !withHowitzer;
        if (all) hsSlider.value = String(howitzerShellsHere);
        else if (!howitzerShellsTouched || Number(hsSlider.value) > sMax) hsSlider.value = String(sMax);
        hsLabel.textContent = withHowitzer
            ? `🎯 ${hsSlider.value} / ${howitzerShellsHere} haubitsgranater med`
            : `🎯 Haubitsgranater kan kun gå med en haubits (${howitzerShellsHere} ${garrison ? "hos vagten" : "på lager"})`;
    };
    hsSlider.oninput = () => { howitzerShellsTouched = true; updateHowitzers(); };
    hSlider.oninput = updateHowitzers;

    tSlider.oninput = () => { trucksTouched = true; updateTrucks(); updateHowitzers(); };

    slider.oninput = () => {
        label.textContent = `${slider.value} / ${maxAvail} soldater`;
        updateMortars();
        updateTrucks();
        updateHowitzers();
    };
    mSlider.oninput = updateMortars;
    updateMortars();
    updateTrucks();
    updateHowitzers();

    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal()">Luk</button>
        <button class="btn btn-primary" id="btn-pick-target-confirm">${target ? "➡️ Videre" : "🎯 Vælg mål på kortet"}</button>
    `;
    document.getElementById("btn-pick-target-confirm").onclick = () => {
        const chosen = parseInt(slider.value, 10) || 1;
        const mortars = parseInt(mSlider.value, 10) || 0;
        const shells = mortars > 0 ? (parseInt(sSlider.value, 10) || 0) : 0;
        const trucks = parseInt(tSlider.value, 10) || 0;
        const howitzers = parseInt(hSlider.value, 10) || 0;
        const howitzer_shells = howitzers > 0 ? (parseInt(hsSlider.value, 10) || 0) : 0;
        closeModal();
        const order = { from, count: chosen, mortars, shells, trucks, howitzers, howitzer_shells };
        if (target) openConfirmMarchModal(order, target);
        else enterMarchTargetMode(order);
    };
    overlay.classList.remove("hidden");
};

function enterMarchTargetMode(order) {
    if (state.mortarAim) exitMortarAim();
    state.pendingMarchOrder = { ...order, waypoints: [] };
    document.getElementById("banner-soldier-count").textContent = order.count;
    document.getElementById("march-target-banner").classList.remove("hidden");
    renderRouteDraft();
}

function exitMarchTargetMode() {
    state.pendingMarchOrder = null;
    document.getElementById("march-target-banner").classList.add("hidden");
    renderRouteDraft();
}

// ---------------------------------------------------------------- rute med flere punkter
function addRoutePoint(target) {
    const order = state.pendingMarchOrder;
    const prev = order.waypoints.at(-1) || routeStart(order);
    if (Geo.distanceM(prev[0] ?? prev.lat, prev[1] ?? prev.lon, target.lat, target.lon) < 5) {
        showToast("Vælg et punkt et stykke fra det forrige.");
        return;
    }
    order.waypoints.push(target);
    renderRouteDraft();
}

// Hvor soldaterne står nu (en deling på vej er gået videre siden ordren startede).
function routeStart(order) {
    if (order.redirectMarchId) {
        const m = findMarch(order.redirectMarchId);
        if (m) return marchCurrentPos(m, serverNow());
    }
    return [order.from.lat, order.from.lon];
}

function renderRouteDraft() {
    const order = state.pendingMarchOrder;
    const wps = order ? order.waypoints : [];
    const features = [];
    if (order && wps.length > 0) {
        const start = routeStart(order);
        const coords = [[start[1], start[0]], ...wps.map(w => [w.lon, w.lat])];
        features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
        if (wps.length >= 2) {
            features.push({ type: "Feature", properties: { loop: true }, geometry: { type: "LineString",
                coordinates: [[wps.at(-1).lon, wps.at(-1).lat], [wps[0].lon, wps[0].lat]] } });
        }
        wps.forEach((w, i) => features.push({ type: "Feature", properties: { nr: i + 1 },
            geometry: { type: "Point", coordinates: [w.lon, w.lat] } }));
    }
    if (mapReady) map.getSource("src-route-draft")?.setData({ type: "FeatureCollection", features });

    const info = document.getElementById("banner-route-info");
    if (info) {
        info.textContent = wps.length === 0 ? "Ingen punkter valgt endnu."
            : wps.length === 1 ? "1 punkt valgt. Klik flere for en rute, eller send dem af sted."
            : `${wps.length} punkter valgt. Den blå streg viser, hvordan en patrulje går tilbage til punkt 1.`;
    }
    const set = (id, on) => { const b = document.getElementById(id); if (b) b.disabled = !on; };
    set("btn-route-undo", wps.length > 0);
    set("btn-route-go", wps.length > 0);
    set("btn-route-patrol", wps.length >= 2);
}

function finishRoute(patrol) {
    const order = state.pendingMarchOrder;
    if (!order || order.waypoints.length === 0) return;
    if (patrol && order.waypoints.length < 2) {
        showToast("En patrulje skal have mindst 2 punkter.");
        return;
    }
    openConfirmMarchModal({ ...order, patrol }, order.waypoints.at(-1));
}

function showRouteCalculating(target) {
    state.groupModal = null;
    document.getElementById("modal-title").textContent = "Beregner rute…";
    document.getElementById("modal-body").innerHTML = `
        <div class="route-calculating">
            <div class="spinner"></div>
            <p>Finder vejen over land til ${escapeHtml(target.label)}. Lange ruter langs kysten kan tage et par sekunder.</p>
        </div>
    `;
    document.getElementById("modal-actions").innerHTML = "";
    document.getElementById("modal-overlay").classList.remove("hidden");
}

// Ruten over land gennem flere punkter: ét ben ad gangen, lagt sammen.
async function landPathThrough(points, driving = false) {
    let out = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const find = driving ? findTruckPathAsync : findLandPathAsync;
        const leg = await find(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
        out = out.concat(leg.slice(1));
    }
    return out;
}

// Lastbiler, der kører med ordren. Går hele gruppen (eller får en deling nyt mål), går alle dens
// lastbiler med; ellers dem, man har valgt (order.trucks).
function orderTrucks(order) {
    if (order.redirectMarchId) return truckCount(findMarch(order.redirectMarchId));
    if (order.from.type === "march") {
        const m = findMarch(order.from.id);
        return m && order.count >= m.count ? truckCount(m) : 0;
    }
    if (order.from.type === "garrison") {
        const g = state.garrisons.find(x => String(x.id) === String(order.from.id));
        if (g && order.count >= g.count) return truckCount(g);
    }
    return order.trucks || 0;
}

// order.waypoints (fra rute-tilstand) eller kun target. order.patrol = gå ringen igen og igen.
async function openConfirmMarchModal(order, target) {
    const startPos = routeStart(order);
    const wps = (order.waypoints && order.waypoints.length > 0 ? order.waypoints : [target]).map(w => [w.lat, w.lon]);
    if (Geo.distanceM(startPos[0], startPos[1], wps[0][0], wps[0][1]) < 5 && !order.patrol) {
        showToast("Vælg et mål et andet sted end der, hvor soldaterne står!");
        return;
    }
    const trucks = orderTrucks(order);
    const driving = truckCanDrive(order.count, trucks);
    if (order.patrol && trucks > 0) {
        showToast("Lastbiler kan ikke gå patrulje endnu. Send soldaterne uden lastbilerne.");
        return;
    }
    showRouteCalculating(target);

    let landPath, loopPath = null;
    if (order.patrol) {
        // Hen til punkt 1, derefter ringen 1 → 2 → … → sidste → 1.
        landPath = await landPathThrough([startPos, wps[0]]);
        loopPath = await landPathThrough([...wps, wps[0]]);
    } else {
        landPath = await landPathThrough([startPos, ...wps], driving);
    }
    const distM = Math.round(pathDistanceM(landPath));
    const durationSec = Math.round(pathSeconds(landPath, driving));
    const T = GAME_CONFIG.TRUCK;
    const truckWord = n => n === 1 ? "lastbil" : "lastbiler";
    const truckInfo = trucks === 0 ? "" : driving
        ? `<p>🚚 <strong>Kører i ${trucks} ${truckWord(trucks)}:</strong> ${fmtKmh(T.roadMps)} på vej (ca. ${formatDistance(Math.round(roadDistanceM(landPath)))}), ${fmtKmh(T.fieldMps)} uden for vejene.</p>`
        : `<p style="color:#FFB74D">🚚 ${trucks} ${truckWord(trucks)} følger med, men ${order.count < trucks ? "der skal mindst 1 soldat i hver lastbil" : `der er kun plads til ${trucks * T.capacity} soldater`}, så alle går i gåtempo.</p>`;
    const loopM = loopPath ? Math.round(pathDistanceM(loopPath)) : 0;
    const loopSec = Math.max(2, Math.round(loopM / GAME_CONFIG.SOLDIER_SPEED_MPS));
    const via = wps.length > 1 ? ` via ${wps.length - 1} punkt${wps.length > 2 ? "er" : ""}` : "";

    const overlay = document.getElementById("modal-overlay");
    const withMortars = (order.mortars > 0 ? ` med ${order.mortars} ${order.mortars === 1 ? "morter" : "morterer"}${order.shells > 0 ? ` og ${order.shells} granater` : ""}` : "")
        + (trucks > 0 ? `${order.mortars > 0 ? " og" : " med"} ${trucks} ${truckWord(trucks)}` : "")
        + (order.howitzers > 0 ? ` samt ${order.howitzers} ${order.howitzers === 1 ? "haubits" : "haubitser"}${order.howitzer_shells > 0 ? ` og ${order.howitzer_shells} haubitsgranater` : ""}` : "");
    document.getElementById("modal-title").textContent = order.patrol
        ? `Send ${order.count} soldater${withMortars} på patrulje?`
        : `Send ${order.count} soldater${withMortars} af sted?`;
    document.getElementById("modal-body").innerHTML = order.patrol ? `
        <p><strong>Patrulje:</strong> ${wps.length} punkter i ring (1 → … → ${wps.length} → 1), indtil du giver en ny ordre.</p>
        <p><strong>Hen til punkt 1:</strong> ca. ${formatDistance(distM)} · ${formatSeconds(durationSec)}</p>
        <p><strong>Én runde:</strong> ca. ${formatDistance(loopM)} · ${formatSeconds(loopSec)}</p>
        <p style="color:#90A4AE;font-size:13px;">Patruljen skyder på fjender, den møder. Brug "Stop", "Nyt mål" eller "Kald hjem" for at stoppe den.</p>
    ` : `
        <p><strong>Mål:</strong> ${escapeHtml(target.label)}${via}</p>
        <p><strong>Afstand langs land/kyst:</strong> ca. ${formatDistance(distM)}</p>
        <p><strong>Rejsetid:</strong> ${formatSeconds(durationSec)}</p>
        ${truckInfo}
        <p style="color:#90A4AE;font-size:13px;">Er du sikker på, at du vil sende soldaterne hertil?</p>
    `;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal(); exitMarchTargetMode();">Annullér</button>
        <button class="btn" onclick="closeModal();">${state.pendingMarchOrder ? "Ret ruten" : "Tilbage"}</button>
        <button class="btn btn-primary" id="btn-confirm-march-go">${order.patrol ? "🔁 Ja, gå patrulje" : "✅ Ja, send af sted"}</button>
    `;
    document.getElementById("btn-confirm-march-go").onclick = () => {
        closeModal();
        exitMarchTargetMode();
        executeMarchOrder(order, target, landPath, loopPath);
    };
    overlay.classList.remove("hidden");
}

async function executeMarchOrder(order, target, landPath, loopPath = null) {
    let error;
    if (order.patrol && order.redirectMarchId) {
        const m = findMarch(order.redirectMarchId);
        const path = m ? [marchCurrentPos(m, serverNow()), ...landPath.slice(1)] : landPath;
        ({ error } = await sb.rpc("redirect_patrol", { p_march: order.redirectMarchId, p_path: path, p_loop: loopPath }));
    } else if (order.patrol) {
        ({ error } = await sb.rpc("start_patrol", {
            p_from_building: order.from.type === "building" ? order.from.id : null,
            p_from_garrison: order.from.type === "garrison" ? order.from.id : null,
            p_count: order.count, p_path: landPath, p_loop: loopPath,
            ...(order.mortars > 0 ? { p_mortars: order.mortars } : {}),
            ...(order.shells > 0 ? { p_shells: order.shells } : {})
        }));
    } else if (order.redirectMarchId) {
        // Delingen er gået videre, mens ruten blev beregnet og bekræftet: start fra hvor den er nu.
        const m = findMarch(order.redirectMarchId);
        const path = m ? [marchCurrentPos(m, serverNow()), ...landPath.slice(1)] : landPath;
        ({ error } = await sb.rpc("redirect_march", {
            p_march: order.redirectMarchId, p_to_lat: target.lat, p_to_lon: target.lon, p_path: path
        }));
    } else if (order.woundedOnly && order.from.type === "march") {
        const m = findMarch(order.from.id);
        const path = m ? [marchCurrentPos(m, serverNow()), ...landPath.slice(1)] : landPath;
        ({ error } = await sb.rpc("send_wounded_from_march", {
            p_march: order.from.id, p_to_lat: target.lat, p_to_lon: target.lon, p_path: path
        }));
    } else if (order.woundedOnly) {
        ({ error } = await sb.rpc("send_wounded", {
            p_from_garrison: order.from.id, p_to_lat: target.lat, p_to_lon: target.lon, p_path: landPath
        }));
    } else {
        ({ error } = await sb.rpc("start_march", {
            p_from_building: order.from.type === "building" ? order.from.id : null,
            p_from_garrison: order.from.type === "garrison" ? order.from.id : null,
            p_to_lat: target.lat, p_to_lon: target.lon,
            p_count: order.count, p_path: landPath,
            ...(order.mortars > 0 ? { p_mortars: order.mortars } : {}),
            ...(order.shells > 0 ? { p_shells: order.shells } : {}),
            ...(order.trucks > 0 ? { p_trucks: order.trucks } : {}),
            ...(order.howitzers > 0 ? { p_howitzers: order.howitzers } : {}),
            ...(order.howitzer_shells > 0 ? { p_howitzer_shells: order.howitzer_shells } : {})
        }));
    }
    if (error) {
        showToast("Kunne ikke sende soldaterne: " + error.message);
        return;
    }
    await loadArmy();
    if ((order.mortars > 0 || order.trucks > 0 || order.howitzers > 0) && order.from.type === "building") await syncAllFromSupabase();
    showToast(order.patrol
        ? `🔁 ${order.count} soldater går nu patrulje mellem ${order.waypoints.length} punkter!`
        : order.redirectMarchId
            ? `Ny ordre: ${order.count} soldater går nu mod ${target.label}!`
            : `${order.count} soldater er på vej mod ${target.label}!`);
}

// Knapperne sender id'et som tekst, serveren giver det som tal.
function findMarch(marchId) {
    return state.marches.find(x => String(x.id) === String(marchId));
}

window.startRedirectMarch = function(marchId) {
    const m = findMarch(marchId);
    if (!m) return;
    const [lat, lon] = marchCurrentPos(m, serverNow());
    enterMarchTargetMode({
        from: { type: "march", id: m.id, lat, lon },
        count: m.count,
        redirectMarchId: m.id
    });
    showToast("Klik på det nye mål på kortet — eller flere punkter for en rute eller patrulje!");
};

window.recallMarch = async function(marchId) {
    const m = findMarch(marchId);
    if (!m) return;
    const cur = marchCurrentPos(m, serverNow());
    showToast("Beregner ruten hjem…");
    const find = truckCanDrive(m.count, truckCount(m)) ? findTruckPathAsync : findLandPathAsync;
    const homePath = await find(cur[0], cur[1], m.homeLat, m.homeLon);
    const path = [marchCurrentPos(m, serverNow()), ...homePath.slice(1)];
    const { error } = await sb.rpc("redirect_march", {
        p_march: m.id, p_to_lat: m.homeLat, p_to_lon: m.homeLon, p_path: path
    });
    if (error) {
        showToast("Kunne ikke kalde delingen hjem: " + error.message);
        return;
    }
    await loadArmy();
    showToast(`${m.count} soldater vender om og går hjem til barrakken!`);
};

window.stopMarch = async function(marchId) {
    const m = findMarch(marchId);
    if (!m) return;
    showToast("Stopper delingen…");
    const { data, error } = await sb.rpc("stop_march", { p_march: m.id });
    if (error) {
        if (error.message && (error.message.includes("stop_march") || error.code === "PGRST202")) {
            showToast("Kør venligst 0035_stop_march.sql i Supabase for at aktivere stop-knappen.");
        } else {
            showToast("Kunne ikke stoppe delingen: " + error.message);
        }
        return;
    }
    await loadArmy();
    await syncAllFromSupabase();
    if (data && data.lat != null && data.lon != null) {
        const near = garrisonsNear(state.garrisons, data.lat, data.lon);
        if (near.length > 0) {
            state.highlight = { garrisons: new Set([String(near[0].id)]), marches: new Set() };
            renderTroopsSidebar();
            renderTroopsOnMap();
        }
    }
    showToast(`🛑 ${m.count} soldater er stoppet og står nu vagt!`);
};

window.jumpToPoint = function(lat, lon) {
    if (!map) return;
    map.flyTo({ center: [lon, lat], zoom: 17.2, duration: 700 });
    selectPoint(lat, lon);
};

window.jumpToBuilding = function(id) {
    const b = findBuilding(id);
    if (!b) return;
    window.jumpToPoint(b.lat, b.lon);
};

window.jumpToMarch = function(marchId) {
    const m = findMarch(marchId);
    if (!m || !map) return;
    state.highlight = { garrisons: new Set(), marches: new Set([String(marchId)]) };
    renderTroopsSidebar();
    renderTroopsOnMap();
    const [lat, lon] = marchCurrentPos(m, serverNow());
    map.flyTo({ center: [lon, lat], zoom: 17.0, duration: 700 });
};

window.selectMarchRow = function(marchId) {
    state.highlight = { garrisons: new Set(), marches: new Set([String(marchId)]) };
    renderTroopsSidebar();
    renderTroopsOnMap();
};

window.selectGarrisonRow = function(garrisonId) {
    state.attackFromId = String(garrisonId);
    state.highlight = { garrisons: new Set([String(garrisonId)]), marches: new Set() };
    renderTroopsSidebar();
    renderTroopsOnMap();
};

// ============================================================================
// Popup for en gruppe soldater: hver soldats energi og alt, man kan gøre med gruppen
// ============================================================================
// state.groupModal = { kind: "garrison" | "march" | "enemy-garrison" | "enemy-march" | "npc", id }
const GROUP_MODAL_MAX_TILES = 60; // større grupper: de sårede enkeltvis, de raske samlet

// Har man klikket på præcis én gruppe, åbnes dens popup. Flere grupper: se listen i sidepanelet.
function openGroupModalAt(lat, lon) {
    const hits = [
        ...garrisonsNear(state.garrisons, lat, lon).map(g => ({ kind: "garrison", id: g.id })),
        ...marchesNear(lat, lon).map(m => ({ kind: "march", id: m.id })),
        ...garrisonsNear(state.enemies.garrisons, lat, lon).map(g => ({ kind: "enemy-garrison", id: g.id })),
        ...npcsNear(lat, lon).map(({ n }) => ({ kind: "npc", id: n.id }))
    ];
    if (hits.length === 1) openGroupModal(hits[0].kind, hits[0].id);
}

function findGroup(kind, id) {
    const same = x => String(x.id) === String(id);
    switch (kind) {
        case "garrison": return state.garrisons.find(same);
        case "march": return state.marches.find(same);
        case "enemy-garrison": return state.enemies.garrisons.find(same);
        case "enemy-march": return state.enemies.marches.find(same);
        case "npc": return state.enemies.npcs.find(same);
    }
    return null;
}

function groupPos(kind, g) {
    if (kind === "march") return marchCurrentPos(g, serverNow());
    if (kind === "npc") return npcCurrentPos(g);
    return [g.lat, g.lon];
}

function energyColor(pct) {
    if (pct >= 100) return "#39FF14"; // grøn ved 100 %
    if (pct >= 40) return "#FF9800";  // orange når under 100 %
    return "#FF5252";                 // rød når under 40 %
}

// Én brik pr. soldat med hans energi. Svageste først.
function soldierTilesHtml(g) {
    const hp = GAME_CONFIG.SOLDIER_HP;
    const wounded = [...(g.wounded || [])].sort((a, b) => a - b);
    const healthy = Math.max(0, g.count - wounded.length);
    const tile = (e, nr) => {
        const pct = Math.round(e / hp * 100);
        return `
            <div class="soldier-tile" title="Soldat ${nr}: ${e} af ${hp} energi">
                <img src="assets/tropper.png" class="pixel-img" />
                <div class="soldier-hp">${e}</div>
                <div class="soldier-bar"><div style="width:${pct}%;background:${energyColor(pct)}"></div></div>
            </div>`;
    };
    let nr = 0;
    let html = wounded.map(e => tile(e, ++nr)).join("");
    const showHealthy = g.count <= GROUP_MODAL_MAX_TILES ? healthy : 0;
    for (let i = 0; i < showHealthy; i++) html += tile(hp, ++nr);
    let more = "";
    if (showHealthy < healthy) more = `<p class="muted-hint">+ ${healthy} raske soldater med fuld energi (${hp}).</p>`;
    return `<div class="soldier-grid">${html}</div>${more}`;
}

function openGroupModal(kind, id) {
    state.hospitalModal = null;
    state.groupModal = { kind, id };
    renderGroupModal();
    document.getElementById("modal-overlay").classList.remove("hidden");
}

// Tegnes igen, når soldaterne er hentet på ny (fx under kamp), så tallene følger med.
function renderGroupModal() {
    const gm = state.groupModal;
    if (!gm) return;
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const actions = document.getElementById("modal-actions");
    const g = findGroup(gm.kind, gm.id);
    if (!g || g.count <= 0) {
        title.textContent = "Gruppen findes ikke længere";
        body.innerHTML = `<p class="muted-hint">Soldaterne er nået frem, gået hjem, slået sammen med andre eller faldet i kamp.</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }
    const [lat, lon] = groupPos(gm.kind, g);
    const pct = energyPct(g);
    const own = gm.kind === "garrison" || gm.kind === "march";
    const bar = `
        <div class="group-energy">
            <span>❤️ Samlet energi: <strong>${pct} %</strong></span>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${energyColor(pct)}"></div></div>
        </div>`;

    if (own) {
        const hurt = (g.wounded || []).length;
        const where = gm.kind === "march" ? marchEtaText(g) : "Står vagt";
        title.textContent = gm.kind === "march" ? `Deling på march: ${g.count} soldater` : `Vagtstyrke: ${g.count} soldater`;
        body.innerHTML = `
            <p class="muted-hint">${where} · ${g.count - hurt} raske, ${hurt} ${hurt === 1 ? "såret" : "sårede"}. Sårede heles kun på et felthospital.</p>
            ${mortarLineHtml(gm.kind, g)}
            ${howitzerLineHtml(gm.kind, g)}
            ${truckLineHtml(gm.kind, g)}
            ${bar}
            ${soldierTilesHtml(g)}`;
        actions.innerHTML = gm.kind === "march" ? `
            <button class="btn" onclick="closeModal(); jumpToMarch('${g.id}')">🎯 Hop til</button>
            <button class="btn btn-danger" onclick="closeModal(); stopMarch('${g.id}')">🛑 Stop</button>
            <button class="btn btn-primary" onclick="closeModal(); startRedirectMarch('${g.id}')">🧭 Nyt mål</button>
            ${hurt && (!g.driving || hurt >= g.count) ? `<button class="btn btn-primary" onclick="closeModal(); sendWoundedFromMarch('${g.id}')">🏥 Send ${hurt} ${hurt === 1 ? "såret" : "sårede"} til hospitalet</button>` : ""}
            <button class="btn btn-danger" onclick="closeModal(); recallMarch('${g.id}')">🏠 Kald hjem</button>
            <button class="btn" onclick="closeModal()">Luk</button>` : `
            <button class="btn" onclick="closeModal(); jumpToPoint(${lat}, ${lon})">🎯 Hop til</button>
            <button class="btn btn-primary" onclick="closeModal(); sendFromGarrison(${g.id})">🪖 Send soldater</button>
            ${g.mortars > 0 ? `<button class="btn btn-gold" onclick="closeModal(); startMortarAim(${g.id})">💣 Affyr morter</button>` : ""}
            ${g.howitzers > 0 ? `<button class="btn btn-danger" onclick="closeModal(); startHowitzerAimGarrison(${g.id})">💥 Affyr haubits</button>` : ""}
            ${hurt ? `<button class="btn btn-primary" onclick="closeModal(); sendWoundedToHospital(${g.id})">🏥 Send ${hurt} ${hurt === 1 ? "såret" : "sårede"} til hospitalet</button>` : ""}
            <button class="btn btn-danger" onclick="closeModal(); sendGarrisonHome(${g.id})">🏠 Send hjem</button>
            <button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }

    // Fjender: kun det, man kan se på afstand — antal, lastbiler og samlet energi.
    title.textContent = gm.kind === "npc" ? `${g.unit_name ? npcLabel(g) : (g.is_invasion ? "Fjendtlig invasionshær" : "Fjendtlig patrulje")}: ${g.count} soldater`
        : gm.kind === "enemy-march" ? `Fjendtlige soldater på march: ${g.count}` : `Fjendtlige vagter: ${g.count}`;
    body.innerHTML = `
        <p class="muted-hint">${gm.kind === "npc"
            ? (g.fighting ? `💥 I kamp med dine soldater lige nu.${npcGear(g) ? ` ${npcGear(g)}.` : ""}` : npcAbout(g))
            : `En anden spillers soldater.${truckCount(g) ? ` 🚚 ${truckCount(g)} ${truckCount(g) === 1 ? "lastbil" : "lastbiler"}${g.driving ? ", kører" : ""}.` : ""}`} Du kan ikke se den enkelte fjendes energi, kun gruppens samlede.</p>
        ${bar}`;
    actions.innerHTML = `
        <button class="btn" onclick="closeModal(); jumpToPoint(${lat}, ${lon})">🎯 Hop til</button>
        <button class="btn btn-danger" onclick="closeModal(); sendSoldiersTo(${lat}, ${lon})">⚔️ Angrib</button>
        <button class="btn" onclick="closeModal()">Luk</button>`;
}

// Hele vagtstyrken går hjem til den nærmeste barrak (og bliver rask dér).
// Læg to vagtstyrker sammen til én styrke (0021).
window.mergeWithGarrison = async function(fromId, toId) {
    const { data, error } = await sb.rpc("merge_garrisons", { p_from: fromId, p_to: toId });
    if (error) {
        showToast("Kunne ikke slå vagtstyrkerne sammen: " + error.message);
        return;
    }
    showToast(`✅ Vagtstyrkerne er lagt sammen (${data.new_count} soldater i alt)!`);
    await syncAllFromSupabase();
    await pollWorld();
    renderTroopsOnMap();
    if (state.selected) renderSelectedBox();
};

window.sendGarrisonHome = function(id) {
    const g = state.garrisons.find(x => String(x.id) === String(id));
    if (!g) return;
    const home = state.myBuildings
        .filter(b => b.kind === "barracks")
        .map(b => ({ b, d: Geo.distanceM(g.lat, g.lon, b.lat, b.lon) }))
        .sort((a, b) => a.d - b.d)[0];
    if (!home) {
        showToast("Du har ingen barrak, soldaterne kan gå hjem til.");
        return;
    }
    openConfirmMarchModal(
        { from: { type: "garrison", id: g.id, lat: g.lat, lon: g.lon }, count: g.count },
        { lat: home.b.lat, lon: home.b.lon, label: buildingLabel(home.b) });
};

window.openGroupModal = openGroupModal;

// Kun de sårede går til det nærmeste hospital; de raske bliver stående.
window.sendWoundedToHospital = function(id) {
    const g = state.garrisons.find(x => String(x.id) === String(id));
    const n = (g?.wounded || []).length;
    if (!g || n === 0) return;
    const near = nearestOwn("hospital", g.lat, g.lon);
    if (!near) {
        showToast("Du har intet felthospital. Uden hospital kan sårede ikke heles — byg et først.");
        return;
    }
    openConfirmMarchModal(
        { from: { type: "garrison", id: g.id, lat: g.lat, lon: g.lon }, count: n, woundedOnly: true },
        { lat: near.b.lat, lon: near.b.lon, label: buildingLabel(near.b) });
};

// Som ovenfor, men fra en deling på march eller patrulje: de raske fortsætter deres rute.
window.sendWoundedFromMarch = function(marchId) {
    const m = findMarch(marchId);
    const n = (m?.wounded || []).length;
    if (!m || n === 0) return;
    const [lat, lon] = marchCurrentPos(m, serverNow());
    const near = nearestOwn("hospital", lat, lon);
    if (!near) {
        showToast("Du har intet felthospital. Uden hospital kan sårede ikke heles — byg et først.");
        return;
    }
    openConfirmMarchModal(
        { from: { type: "march", id: m.id, lat, lon }, count: n, woundedOnly: true },
        { lat: near.b.lat, lon: near.b.lon, label: buildingLabel(near.b) });
};

// ============================================================================
// Let morter (0022): køb, sigt, skyd, granater i luften og kratere
// ============================================================================
// Morterne følger soldaterne, men kun en vagtstyrke (soldater, der står stille) kan skyde.
// Serveren vælger, hvor hver granat lander inde i spredningscirklen, og afgør nedslaget.
function truckTag(g) {
    const n = truckCount(g);
    return n > 0 ? ` · 🚚 ${n}` : "";
}

function mortarTag(g) {
    return g.mortars > 0 ? ` · 🧨 ${g.mortars} · 💣 ${g.shells || 0}` : "";
}

function howitzerTag(g) {
    const h = g.howitzers || 0;
    const s = g.howitzer_shells ?? g.howitzerShells ?? 0;
    return h > 0 ? ` · 💥 ${h} · 🎯 ${s}` : "";
}

// Morteren og haubitsen skyder på samme måde, men med hver sine tal.
function weaponCfg(weapon) {
    return weapon === "howitzer" ? GAME_CONFIG.HOWITZER : GAME_CONFIG.MORTAR;
}

function mortarSpreadM(dist, weapon) {
    const M = weaponCfg(weapon);
    return M.spreadBaseM + M.spreadPct * dist;
}

function mortarFlightS(dist, weapon) {
    const M = weaponCfg(weapon);
    return M.flightBaseS + dist / Math.max(M.flightMps, 1);
}

// Haubitser, der kan betjenes lige nu (HOWITZER.crew ledige soldater i barrakken pr. haubits).
function usableHowitzers() {
    return Math.min(state.howitzersHome, Math.floor(availableInBarracks() / GAME_CONFIG.HOWITZER.crew));
}

function howitzerReadyInS() {
    if (!state.howitzerReadyAt) return 0;
    return Math.max(0, Math.ceil((Date.parse(state.howitzerReadyAt) - serverNow()) / 1000));
}

// Hvorfra der sigtes: vagtstyrken med morteren, barrakken med haubitserne eller vagtstyrken med fremskudt haubits.
function aimSource(aim) {
    if (!aim) return null;
    if (aim.weapon === "howitzer") {
        if (aim.garrisonId) {
            const g = state.garrisons.find(x => String(x.id) === String(aim.garrisonId));
            if (!g) return null;
            const usable = Math.min(g.howitzers || 0, Math.floor(g.count / GAME_CONFIG.HOWITZER.crew));
            return { weapon: "howitzer", fromType: "garrison", id: g.id, lat: g.lat, lon: g.lon, shells: g.howitzer_shells || 0,
                     usable, wait: howitzerReadyInS(),
                     one: "haubits", many: "haubitser", where: "Vagten har" };
        }
        const b = state.myBuildings.find(x => String(x.id) === String(aim.buildingId));
        if (!b) return null;
        return { weapon: "howitzer", fromType: "building", id: b.id, lat: b.lat, lon: b.lon, shells: state.howitzerShells,
                 usable: usableHowitzers(), wait: howitzerReadyInS(),
                 one: "haubits", many: "haubitser", where: "Du har" };
    }
    const g = state.garrisons.find(x => String(x.id) === String(aim.garrisonId));
    if (!g) return null;
    return { weapon: "mortar", id: g.id, lat: g.lat, lon: g.lon, shells: g.shells || 0,
             usable: usableMortars(g), wait: mortarReadyInS(g),
             one: "morter", many: "morterer", where: "Vagten har" };
}

// Morterer, vagten kan betjene lige nu (MORTAR.crew soldater pr. morter).
function usableMortars(g) {
    return Math.min(g.mortars || 0, Math.floor(g.count / GAME_CONFIG.MORTAR.crew));
}

function mortarReadyInS(g) {
    if (!g.mortar_ready_at) return 0;
    return Math.max(0, Math.ceil((Date.parse(g.mortar_ready_at) - serverNow()) / 1000));
}

function howitzerLineHtml(kind, g) {
    const h = g.howitzers || 0;
    if (h <= 0) return "";
    const H = GAME_CONFIG.HOWITZER;
    const word = h === 1 ? "haubits" : "haubitser";
    const shells = kind === "march" ? (g.howitzerShells || 0) : (g.howitzer_shells || 0);
    if (kind === "march") {
        return `<p class="muted-hint">💥 Bugserer ${h} ${word} · 🎯 ${shells} granater. Kan skyde, når soldaterne står vagt.</p>`;
    }
    const usable = Math.min(h, Math.floor(g.count / H.crew));
    const wait = howitzerReadyInS();
    return `<p class="muted-hint">💥 ${h} ${word} i stilling · 🎯 ${shells} granater · rækkevidde ${formatDistance(H.rangeM)}${
        usable < h ? ` · kun ${usable} kan betjenes (${H.crew} soldater pr. haubits)` : ""}${
        wait ? ` · lades, klar om ${wait} s` : ""}</p>`;
}

function mortarLineHtml(kind, g) {
    if (!(g.mortars > 0)) return "";
    const M = GAME_CONFIG.MORTAR;
    const name = g.mortars === 1 ? "morter" : "morterer";
    if (kind === "march") {
        return `<p class="muted-hint">🧨 Bærer ${g.mortars} ${name} · 💣 ${g.shells || 0} granater med. Morteren kan kun skyde, når soldaterne står vagt.</p>`;
    }
    const usable = usableMortars(g);
    const wait = mortarReadyInS(g);
    return `<p class="muted-hint">🧨 ${g.mortars} ${name} · 💣 ${g.shells || 0} granater med · skyder op til ${formatDistance(M.rangeM)}${
        usable < g.mortars ? ` · kun ${usable} kan betjenes (${M.crew} soldater pr. morter)` : ""}${
        wait ? ` · lades, klar om ${wait} s` : ""}</p>`;
}

// "🚚 Kører i 2 lastbiler" og hver lastbils energi.
function truckLineHtml(kind, g) {
    const t = g.trucks || [];
    if (!t.length) return "";
    const T = GAME_CONFIG.TRUCK;
    const word = t.length === 1 ? "lastbil" : "lastbiler";
    const how = kind === "march"
        ? (g.driving ? `Kører i ${t.length} ${word}: ${fmtKmh(T.roadMps)} på vej, ${fmtKmh(T.fieldMps)} uden for vejene.`
                     : `${t.length} ${word} følger med, men alle kan ikke køre, så de går i gåtempo.`)
        : `${t.length} ${word} holder hos vagten (plads til ${t.length * T.capacity} soldater).`;
    const cards = [...t].sort((a, b) => a - b).map(hp => {
        const pct = Math.max(0, Math.min(100, Math.round(hp / T.hp * 100)));
        return `<div class="truck-card" title="${hp} / ${T.hp} energi">
            <img src="assets/lastbil.png" class="pixel-img" alt="" />
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${energyColor(pct)}"></div></div>
            <span>${pct} %</span>
        </div>`;
    }).join("");
    return `<p class="muted-hint">🚚 ${how}</p><div class="truck-list">${cards}</div>`;
}

// En cirkel med radius r meter som GeoJSON-ring [lon, lat].
function circleRing(lat, lon, r, n = 72) {
    const dLat = r / EARTH_RADIUS_M * DEG_PER_RAD;
    const dLon = dLat / Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const ring = [];
    for (let i = 0; i <= n; i++) {
        const a = i / n * 2 * Math.PI;
        ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
    }
    return ring;
}

// ---------------------------------------------------------------- køb
// Våbenfabrikken (0033): udstyr købes der, tungt udstyr kræver et højere trin, og højere trin giver rabat.
const EQUIPMENT_ITEMS = [
    ["mortars", "🧨 Køb morter"],
    ["mortar_shells", "💣 Køb granater"],
    ["trucks", "🚚 Køb lastbil"],
    ["howitzers", "💥 Køb haubits"],
    ["howitzer_shells", "🎯 Køb haubitsgranater"]
];
const EQUIPMENT_NAMES = {
    mortars: "morter", mortar_shells: "mortergranater", trucks: "lastbil",
    howitzers: "haubits", howitzer_shells: "haubitsgranater"
};

function factoryEnabled() {
    return GAME_CONFIG.BUILDINGS.weapons_factory.enabled;
}

// Højeste trin blandt dine våbenfabrikker (0 = ingen).
function factoryLevel() {
    return state.myBuildings.filter(b => b.kind === "weapons_factory").reduce((m, b) => Math.max(m, b.level), 0);
}

function factoryUnlockLevel(item) {
    return Number(GAME_CONFIG.BUILDINGS.weapons_factory.unlock?.[item] || 1);
}

function factoryDiscount() {
    if (!factoryEnabled()) return 0;
    const lvl = factoryLevel();
    return lvl > 0 ? Math.min(0.9, Math.max(0, Number(GAME_CONFIG.BUILDINGS.weapons_factory.discount?.[lvl - 1] || 0))) : 0;
}

// Prisen efter rabat, regnet ud som på serveren.
function discounted(n) {
    return Math.round(n * (1 - factoryDiscount()));
}

function equipmentAvailable(item) {
    if (!factoryEnabled()) return item.startsWith("howitzer") ? GAME_CONFIG.HOWITZER.enabled : true;
    if (item.startsWith("howitzer") && !GAME_CONFIG.HOWITZER.enabled) return false;
    return true;
}

function equipmentButtonsHtml(bld) {
    const lvl = factoryEnabled() ? bld.level : Infinity;
    return EQUIPMENT_ITEMS.filter(([item]) => equipmentAvailable(item)).map(([item, label]) => {
        const need = factoryEnabled() ? factoryUnlockLevel(item) : 1;
        return lvl >= need
            ? `<button class="btn btn-small btn-gold" onclick="openBuyEquipmentModal('${item}')">${label}</button>`
            : `<button class="btn btn-small" disabled title="Opgradér våbenfabrikken til trin ${need}">🔒 ${label.replace(/^\S+ /, "")} (trin ${need})</button>`;
    }).join("\n");
}

// Din nærmeste barrak (eller null).
function nearestOwnBarracks(lat, lon) {
    return state.myBuildings.filter(b => b.kind === "barracks")
        .sort((a, b) => Geo.distanceM(lat, lon, a.lat, a.lon) - Geo.distanceM(lat, lon, b.lat, b.lon))[0] || null;
}

// Lageret i barrakken: morterer, granater, lastbiler og haubitser.
function stockLinesHtml() {
    return `<div class="item-sub" style="color:#FFB74D">🧨 Morterer på lager: ${state.mortarsHome} · 💣 Granater: ${state.shells} · 🚚 Lastbiler: ${state.trucksHome}</div>
        ${GAME_CONFIG.HOWITZER.enabled ? `<div class="item-sub" style="color:#FFB74D">💥 Haubitser: ${state.howitzersHome} · 🎯 Haubitsgranater: ${state.howitzerShells}</div>` : ""}`;
}

function factoryLineText(bld) {
    const F = GAME_CONFIG.BUILDINGS.weapons_factory;
    const disc = Number(F.discount?.[bld.level - 1] || 0);
    const locked = EQUIPMENT_ITEMS.map(([i]) => i).filter(i => equipmentAvailable(i) && factoryUnlockLevel(i) > bld.level);
    return `🏭 Rabat på udstyr: ${Math.round(disc * 100)} %${locked.length
        ? ` · Låses op senere: ${locked.map(i => `${EQUIPMENT_NAMES[i]} (trin ${factoryUnlockLevel(i)})`).join(", ")}` : ""}`;
}

// "købes i våbenfabrikken (trin 3)" til Oversigten.
function buyWhere(item) {
    if (!factoryEnabled()) return "købes i barrakken";
    const need = factoryUnlockLevel(item);
    return need > 1 ? `købes i våbenfabrikken (trin ${need})` : "købes i våbenfabrikken";
}

// Udstyr, der købes i våbenfabrikken: navn, billede, pris før rabat og forklaring.
function equipmentInfo(item) {
    const M = GAME_CONFIG.MORTAR, T = GAME_CONFIG.TRUCK;
    if (item === "mortars") return {
        title: "🧨 Køb let morter", img: "morter", steps: M.priceSteps, steel: M.priceSteel, max: 10,
        one: "morter", many: "morterer", done: n => `🧨 ${n} ${n === 1 ? "morter" : "morterer"} står nu i barrakken.`,
        desc: `En let morter, som soldaterne bærer med. Den kan skyde op til <strong>${formatDistance(M.rangeM)}</strong>, når soldaterne står vagt, og kræver ${M.crew} soldater. Den står på lager i barrakken, til du sender den ud med soldater.`
    };
    const H = GAME_CONFIG.HOWITZER;
    if (item === "howitzers") return {
        title: "💥 Køb haubits", img: "haubits", steps: H.priceSteps, steel: H.priceSteel, max: 10,
        one: "haubits", many: "haubitser", done: n => `💥 ${n} ${n === 1 ? "haubits står" : "haubitser står"} nu ved barrakken.`,
        desc: `Et tungt feltartilleri, der står ved barrakken og skyder derfra op til <strong>${formatDistance(H.rangeM)}</strong>. Hver haubits kræver ${H.crew} ledige soldater i barrakken. Splinterne rækker ${formatDistance(H.blastM)} fra nedslaget.`
    };
    if (item === "howitzer_shells") return {
        title: "🎯 Køb haubitsgranater", img: "haubitsgranat", steps: H.shellSteps, steel: H.shellSteel, max: 100,
        one: "haubitsgranat", many: "haubitsgranater", done: n => `🎯 +${n} haubitsgranater på lager.`,
        desc: "Granater til dine haubitser. De ligger på lager ved barrakken, hvor haubitserne står."
    };
    if (item === "trucks") return {
        title: "🚚 Køb lastbil", img: "lastbil", steps: T.priceSteps, steel: T.priceSteel, max: 20,
        one: "lastbil", many: "lastbiler", done: n => `🚚 ${n} ${n === 1 ? "lastbil" : "lastbiler"} holder nu ved barrakken.`,
        desc: `En militærlastbil med presenning til <strong>${fmtNum(T.capacity)} soldater</strong>. Den kører ${fmtKmh(T.roadMps)} på vej og ${fmtKmh(T.fieldMps)} uden for vejene, og der skal mindst 1 soldat med for at køre den. Den er ikke skudsikker: træffere skader både lastbilen og soldaterne, og ved 0 energi bryder den i brand.`
    };
    return {
        title: "💣 Køb mortergranater", img: "granat", steps: M.shellSteps, steel: M.shellSteel, max: 100,
        one: "granat", many: "granater", done: n => `💣 +${n} granater på lager.`,
        desc: "Granater til dine morterer. Soldaterne bærer dem med ud fra barrakken."
    };
}

window.openBuyEquipmentModal = function(item) {
    const E = equipmentInfo(item);
    const steps = discounted(E.steps);
    const steel = discounted(E.steel);
    const disc = factoryDiscount();
    const afford = Math.floor(Math.min(state.balance / Math.max(steps, 1), steel > 0 ? state.steel / steel : Infinity));
    const max = Math.max(1, Math.min(E.max, afford));
    state.groupModal = null;
    document.getElementById("modal-title").textContent = E.title;
    document.getElementById("modal-body").innerHTML = `
        <div class="item-row-top" style="margin-bottom:8px;">
            <img src="assets/${E.img}.png" class="pixel-img item-sprite" />
            <p class="muted-hint" style="margin:0;">${E.desc}</p>
        </div>
        <p>Pris pr. stk.: <strong>${steps} skridt + ${steel} stål</strong>${disc > 0 ? ` (${Math.round(disc * 100)} % rabat fra våbenfabrikken)` : ""}. Du har ${state.balance.toLocaleString("da-DK")} skridt og ${state.steel.toLocaleString("da-DK")} stål.</p>
        <div style="text-align:center;font-size:20px;font-weight:800;color:#FFD54F;" id="buy-val-label"></div>
        <input type="range" min="1" max="${max}" value="1" class="range-slider" id="buy-range-input" ${afford < 1 ? "disabled" : ""} />
        ${afford < 1 ? `<p class="muted-hint" style="color:#FF8A80">Du har ikke skridt og stål nok til at købe en ${E.one}.</p>` : ""}
    `;
    const slider = document.getElementById("buy-range-input");
    const label = document.getElementById("buy-val-label");
    const update = () => {
        const n = parseInt(slider.value, 10) || 1;
        label.textContent = `${n} ${n === 1 ? E.one : E.many} · ${n * steps} skridt + ${n * steel} stål`;
    };
    slider.oninput = update;
    update();
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal()">Luk</button>
        <button class="btn btn-gold" id="btn-buy-confirm" ${afford < 1 ? "disabled" : ""}>🛒 Køb</button>`;
    document.getElementById("btn-buy-confirm").onclick = async () => {
        const n = parseInt(slider.value, 10) || 1;
        const { error } = await sb.rpc("buy_equipment", { p_item: item, p_count: n });
        if (error) {
            showToast("Kunne ikke købe: " + error.message);
            return;
        }
        closeModal();
        showToast(E.done(n));
        await syncAllFromSupabase();
    };
    document.getElementById("modal-overlay").classList.remove("hidden");
};

// ---------------------------------------------------------------- sigt og skyd
window.startMortarAim = function(garrisonId) {
    const g = state.garrisons.find(x => String(x.id) === String(garrisonId));
    if (!g || !(g.mortars > 0)) return;
    if (usableMortars(g) < 1) {
        showToast(`Der skal mindst ${GAME_CONFIG.MORTAR.crew} soldater til at betjene morteren.`);
        return;
    }
    if (!(g.shells > 0)) {
        showToast("Vagtstyrken har ingen granater med. Send granater ud fra barrakken sammen med soldater og en morter.");
        return;
    }
    if (state.pendingMarchOrder) exitMarchTargetMode();
    state.mortarAim = { weapon: "mortar", garrisonId: g.id };
    document.getElementById("mortar-banner-title").textContent = "VÆLG MÅL FOR MORTEREN:";
    document.getElementById("mortar-banner").classList.remove("hidden");
    map.getCanvas().style.cursor = "crosshair";
    renderMortarAim(null, null);
    // Vis hele rækkevidden, hvis man er zoomet tættere ind.
    const ring = circleRing(g.lat, g.lon, GAME_CONFIG.MORTAR.rangeM, 8);
    const lons = ring.map(p => p[0]), lats = ring.map(p => p[1]);
    if (!map.getBounds().contains([Math.min(...lons), Math.min(...lats)])) {
        map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 60, duration: 700 });
    }
};

window.startHowitzerAim = async function(buildingId) {
    const b = state.myBuildings.find(x => String(x.id) === String(buildingId));
    if (!b || !(state.howitzersHome > 0)) return;
    const H = GAME_CONFIG.HOWITZER;
    if (usableHowitzers() < 1) {
        showToast(`Der skal være mindst ${H.crew} ledige soldater i barrakken til at betjene haubitsen.`);
        return;
    }
    if (!(state.howitzerShells > 0)) {
        showToast(`Du har ingen haubitsgranater. Køb dem i ${factoryEnabled() ? "våbenfabrikken" : "barrakken"}.`);
        return;
    }
    closeModal();
    if (state.pendingMarchOrder) exitMarchTargetMode();
    state.mortarAim = { weapon: "howitzer", buildingId: b.id };
    const { data } = await sb.rpc("howitzer_ready_at");
    if (data !== undefined) state.howitzerReadyAt = data;
    document.getElementById("mortar-banner-title").textContent = "VÆLG MÅL FOR HAUBITSEN:";
    document.getElementById("mortar-banner").classList.remove("hidden");
    map.getCanvas().style.cursor = "crosshair";
    renderMortarAim(null, null);
    const ring = circleRing(b.lat, b.lon, H.rangeM, 8);
    const lons = ring.map(p => p[0]), lats = ring.map(p => p[1]);
    if (!map.getBounds().contains([Math.min(...lons), Math.min(...lats)])) {
        map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 60, duration: 700 });
    }
};

function exitMortarAim() {
    state.mortarAim = null;
    document.getElementById("mortar-banner").classList.add("hidden");
    if (!mapReady) return;
    map.getCanvas().style.cursor = "";
    map.getSource("src-mortar-aim")?.setData({ type: "FeatureCollection", features: [] });
}

// Rækkevidden om morteren og spredningscirklen der, hvor musen står (eller det valgte mål).
function renderMortarAim(lat, lon) {
    const aim = state.mortarAim;
    if (!aim || !mapReady) return;
    const g = aimSource(aim);
    if (!g) {
        exitMortarAim();
        return;
    }
    const M = weaponCfg(g.weapon);
    const line = (coords, props) => ({ type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } });
    const features = [
        line(circleRing(g.lat, g.lon, M.rangeM, 180), { kind: "range" }),
        line(circleRing(g.lat, g.lon, M.minRangeM), { kind: "range" })
    ];
    const info = document.getElementById("mortar-banner-info");
    if (lat != null) {
        const d = Geo.distanceM(g.lat, g.lon, lat, lon);
        const ok = d <= M.rangeM && d >= M.minRangeM;
        const r = mortarSpreadM(d, g.weapon);
        features.push({ type: "Feature", properties: { kind: "spread", ok },
            geometry: { type: "Polygon", coordinates: [circleRing(lat, lon, r)] } });
        if (info) {
            info.textContent = d > M.rangeM ? `${formatDistance(d)} — for langt væk (højst ${formatDistance(M.rangeM)}).`
                : d < M.minRangeM ? `${formatDistance(d)} — for tæt på (mindst ${M.minRangeM} m).`
                : `${formatDistance(d)} væk · granaterne lander inden for ${Math.round(r)} m af målet · flyvetid ca. ${Math.round(mortarFlightS(d, g.weapon))} s`;
        }
    } else if (info) {
        info.textContent = `Den gule ring viser rækkevidden (${formatDistance(M.rangeM)}). ${g.where} ${g.shells} granater.`;
    }
    map.getSource("src-mortar-aim")?.setData({ type: "FeatureCollection", features });
}

// Egne soldater (vagter og delinger) inden for r meter af et punkt.
function ownSoldiersNear(lat, lon, r) {
    const now = serverNow();
    const pts = [
        ...state.garrisons.map(g => [g.lat, g.lon, g.count]),
        ...state.marches.map(m => [...marchCurrentPos(m, now), m.count])
    ];
    return pts.filter(([a, b]) => Geo.distanceM(a, b, lat, lon) <= r).reduce((s, p) => s + p[2], 0);
}

function openFireMortarModal(lat, lon) {
    const g = aimSource(state.mortarAim);
    if (!g) {
        exitMortarAim();
        return;
    }
    const M = weaponCfg(g.weapon);
    const d = Geo.distanceM(g.lat, g.lon, lat, lon);
    if (d > M.rangeM) {
        showToast(`Målet er ${formatDistance(d)} væk — ${g.one}en skyder højst ${formatDistance(M.rangeM)}.`);
        return;
    }
    if (d < M.minRangeM) {
        showToast(`Målet er for tæt på (${Math.round(d)} m) — ${g.one}en skal skyde mindst ${M.minRangeM} m.`);
        return;
    }
    renderMortarAim(lat, lon);
    const r = mortarSpreadM(d, g.weapon);
    const usable = Math.max(1, g.usable);
    const maxShells = Math.max(1, Math.min(M.salvoMax, g.shells));
    const danger = r + M.blastM;
    const ownNear = ownSoldiersNear(lat, lon, danger);
    const wait = g.wait;

    state.groupModal = null;
    document.getElementById("modal-title").textContent = g.weapon === "howitzer" ? "💥 Affyr haubitsen?" : "💣 Affyr morteren?";
    document.getElementById("modal-body").innerHTML = `
        <p><strong>Mål:</strong> ${formatPos(lat, lon)} · ${formatDistance(d)} væk</p>
        <p><strong>Usikkerhed:</strong> hver granat lander et tilfældigt sted inden for <strong>${Math.round(r)} m</strong> af målet (den orange cirkel). Granatsplinter inden for ${M.blastM} m af et nedslag kan ramme soldater.</p>
        <p><strong>Flyvetid:</strong> ca. ${Math.round(mortarFlightS(d, g.weapon))} s · ${usable} ${usable === 1 ? g.one : g.many} skyder</p>
        ${ownNear > 0 ? `<p style="color:#FF8A80"><strong>⚠️ ${ownNear} af dine egne soldater</strong> står inden for ${Math.round(danger)} m af målet og kan blive ramt!</p>` : ""}
        ${wait ? `<p style="color:#FFB74D">${g.weapon === "howitzer" ? "Haubitsen" : "Morteren"} lades stadig — klar om ${wait} s.</p>` : ""}
        <div style="text-align:center;font-size:20px;font-weight:800;color:#FFD54F;" id="shell-val-label"></div>
        <input type="range" min="1" max="${maxShells}" value="${Math.min(3, maxShells)}" class="range-slider" id="shell-range-input" />
        <p class="muted-hint">Du ser kun virkningen, hvis dine soldater eller din telefon kan se nedslaget. Krateret kan alle se.</p>
    `;
    const slider = document.getElementById("shell-range-input");
    const label = document.getElementById("shell-val-label");
    const update = () => {
        const n = parseInt(slider.value, 10) || 1;
        const secs = Math.ceil(n / usable) * M.reloadS;
        label.textContent = `${n} ${n === 1 ? "granat" : "granater"} af ${g.shells} · ${secs} s at skyde`;
    };
    slider.oninput = update;
    update();
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal(); exitMortarAim();">Annullér</button>
        <button class="btn" onclick="closeModal();">Vælg et andet mål</button>
        <button class="btn btn-gold" id="btn-fire-mortar">💣 Skyd</button>`;
    document.getElementById("btn-fire-mortar").onclick = () => {
        const n = parseInt(slider.value, 10) || 1;
        closeModal();
        if (g.weapon === "howitzer") fireHowitzer(g, lat, lon, n);
        else fireMortar(g.id, lat, lon, n);
    };
    document.getElementById("modal-overlay").classList.remove("hidden");
}

async function fireMortar(garrisonId, lat, lon, n) {
    const { data, error } = await sb.rpc("fire_mortar", { p_garrison: garrisonId, p_lat: lat, p_lon: lon, p_shells: n });
    if (error) {
        showToast("Morteren kunne ikke skyde: " + error.message);
        return;
    }
    exitMortarAim();
    const g = state.garrisons.find(x => String(x.id) === String(garrisonId));
    if (g) {
        g.mortar_ready_at = data.ready_at;
        g.shells = data.left;
    }
    data.impacts.forEach((imp, i) => state.craters.push({
        id: `ny-${Date.now()}-${i}`, lat: imp.lat, lon: imp.lon, lands_at: imp.lands_at,
        mine: true, from_lat: g?.lat, from_lon: g?.lon, fired_at: data.fired_at
    }));
    startShellAnimation();
    showToast(`💣 ${n} ${n === 1 ? "granat er" : "granater er"} affyret! ${n === 1 ? "Den lander" : "De lander"} om ca. ${data.flight_s} s inden for ${data.spread_m} m af målet.`);

    // Når den sidste granat er landet, hentes verden igen, så man ser virkningen.
    const last = Math.max(...data.impacts.map(x => Date.parse(x.lands_at)));
    setTimeout(async () => {
        await pollWorld();
        await loadArmy();
        await loadReports();
    }, Math.max(0, last - serverNow()) + 1500);
}

window.startHowitzerAimGarrison = async function(garrisonId) {
    const g = state.garrisons.find(x => String(x.id) === String(garrisonId));
    if (!g || !(g.howitzers > 0)) return;
    const H = GAME_CONFIG.HOWITZER;
    const usable = Math.min(g.howitzers, Math.floor(g.count / H.crew));
    if (usable < 1) {
        showToast(`Der skal være mindst ${H.crew} soldater i vagtstyrken til at betjene haubitsen.`);
        return;
    }
    if (!(g.howitzer_shells > 0)) {
        showToast("Vagtstyrken har ingen haubitsgranater med.");
        return;
    }
    closeModal();
    if (state.pendingMarchOrder) exitMarchTargetMode();
    state.mortarAim = { weapon: "howitzer", garrisonId: g.id };
    const { data } = await sb.rpc("howitzer_ready_at");
    if (data !== undefined) state.howitzerReadyAt = data;
    document.getElementById("mortar-banner-title").textContent = "VÆLG MÅL FOR HAUBITSEN:";
    document.getElementById("mortar-banner").classList.remove("hidden");
    map.getCanvas().style.cursor = "crosshair";
    renderMortarAim(null, null);
    const ring = circleRing(g.lat, g.lon, H.rangeM, 8);
    const lons = ring.map(p => p[0]), lats = ring.map(p => p[1]);
    if (!map.getBounds().contains([Math.min(...lons), Math.min(...lats)])) {
        map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 60, duration: 700 });
    }
};

async function fireHowitzer(source, lat, lon, n) {
    const isGarrison = typeof source === "object" && source.fromType === "garrison";
    const garrisonId = isGarrison ? source.id : null;
    const buildingId = isGarrison ? null : (typeof source === "object" ? source.id : source);
    const { data, error } = await sb.rpc("fire_howitzer", {
        p_building: buildingId,
        p_garrison: garrisonId,
        p_lat: lat,
        p_lon: lon,
        p_shells: n
    });
    if (error) {
        showToast("Haubitsen kunne ikke skyde: " + error.message);
        return;
    }
    exitMortarAim();
    state.howitzerReadyAt = data.ready_at;
    if (isGarrison) {
        const g = state.garrisons.find(x => String(x.id) === String(garrisonId));
        if (g) g.howitzer_shells = data.left;
    } else {
        state.howitzerShells = data.left;
    }
    const fromPoint = isGarrison
        ? state.garrisons.find(x => String(x.id) === String(garrisonId))
        : state.myBuildings.find(x => String(x.id) === String(buildingId));
    data.impacts.forEach((imp, i) => state.craters.push({
        id: `ny-${Date.now()}-${i}`, lat: imp.lat, lon: imp.lon, lands_at: imp.lands_at, weapon: "howitzer",
        mine: true, from_lat: fromPoint?.lat, from_lon: fromPoint?.lon, fired_at: data.fired_at
    }));
    startShellAnimation();
    showToast(`💥 ${n} ${n === 1 ? "haubitsgranat er" : "haubitsgranater er"} affyret! ${n === 1 ? "Den lander" : "De lander"} om ca. ${data.flight_s} s inden for ${data.spread_m} m af målet.`);

    const last = Math.max(...data.impacts.map(x => Date.parse(x.lands_at)));
    setTimeout(async () => {
        await pollWorld();
        await loadArmy();
        await loadReports();
        await syncAllFromSupabase();
    }, Math.max(0, last - serverNow()) + 1500);
}

// ---------------------------------------------------------------- kratere og granater i luften
let loadingCraters = false;
async function loadCraters() {
    if (!state.user || !mapReady || loadingCraters) return;
    loadingCraters = true;
    try {
        const c = map.getCenter();
        const b = map.getBounds();
        const r = Math.min(30000, Math.max(3000, Geo.distanceM(c.lat, c.lng, b.getNorth(), b.getEast())));
        const { data, error } = await sb.rpc("mortar_craters", { p_lat: c.lat, p_lon: c.lng, p_r: r });
        if (error || !data) return; // før 0022 er kørt, findes funktionen ikke
        // Serverens ur også herfra, så granaterne flyver rigtigt, selvom visible_enemies fejler.
        if (data.now) state.serverOffsetMs = Date.parse(data.now) - Date.now();
        state.craters = data.craters || [];
        state.wrecks = data.wrecks || [];
        state.fires = data.fires || [];
        startShellAnimation();
        renderMapFires();
    } finally {
        loadingCraters = false;
    }
    checkCraterFires();
}

// ---------------------------------------------------------------- kortets bygninger brænder
// Serveren kan ikke se kortet. Når et krater ligger inde i en af kortets brune bygninger, sender
// browseren bygningens nummer og omrids, og serveren kaster terningen (én gang pr. granat).
const fireCheckedCraters = new Set();   // kratere, denne browser har set på
let checkingFires = false;

async function checkCraterFires() {
    if (!mapReady || checkingFires || !map.getLayer("building") || map.getZoom() < 14 || !map.areTilesLoaded()) return;
    const now = serverNow();
    const bounds = map.getBounds();
    const due = state.craters.filter(c =>
        typeof c.id === "number" && !c.fire_checked && !fireCheckedCraters.has(c.id)
        && Date.parse(c.lands_at) <= now && bounds.contains([c.lon, c.lat]));
    if (!due.length) return;

    checkingFires = true;
    let lit = false;
    try {
        for (const c of due) {
            fireCheckedCraters.add(c.id);
            const hit = map.queryRenderedFeatures(map.project([c.lon, c.lat]), { layers: ["building"] })
                .find(f => f.id != null);
            if (!hit) { console.info(`Brand: granat ${c.id} ramte ingen bygning på kortet.`); continue; }
            if (state.fires.some(f => (f.geom || []).some(poly => pointInRings(c.lon, c.lat, poly)))) {
                console.info(`Brand: bygningen ved granat ${c.id} brænder allerede.`);
                continue;
            }
            const geom = mapBuildingPolygons(hit, c.lon, c.lat);
            if (!geom.length) { console.info(`Brand: granat ${c.id} ligger ikke inde i en bygning.`); continue; }
            const key = buildingKey(geom);
            const { data, error } = await sb.rpc("ignite_map_building", { p_impact: c.id, p_osm_id: key, p_geom: geom });
            if (error) {
                console.warn("Brand i bygning:", error.message);
                continue;
            }
            console.info(`Brand: granat ${c.id} i bygning ${key}, svar fra serveren:`, data);
            if (data?.burning) lit = true;
        }
    } finally {
        checkingFires = false;
    }
    if (lit) {
        showToast("🔥 En bygning er gået i brand!");
        loadCraters();
    }
}

// Kortets bygning, granaten ligger i, som [[ring, …]] med ringe af [lon, lat]. På de fleste
// zoomniveauer slår kortet mange bygninger sammen til én figur med ét nummer, så kun den
// polygon, der indeholder nedslaget, sendes med.
function mapBuildingPolygons(hit, lon, lat) {
    const parts = [hit, ...map.querySourceFeatures(hit.source, {
        sourceLayer: hit.sourceLayer || "building",
        filter: ["==", ["id"], hit.id]
    })];
    const round = ring => ring.map(([x, y]) => [Math.round(x * 1e7) / 1e7, Math.round(y * 1e7) / 1e7]);
    for (const f of parts) {
        const g = f.geometry;
        const list = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
        for (const poly of list) {
            const rings = poly.map(round);
            const points = rings.reduce((n, r) => n + r.length, 0);
            if (points <= 5000 && pointInRings(lon, lat, rings)) return [rings];
        }
    }
    return [];
}

// Bygningens eget nummer ud fra midten af dens omrids (kortets nummer deles af mange bygninger).
function buildingKey(geom) {
    const ring = geom[0][0];
    let lon = 0, lat = 0;
    for (const [x, y] of ring) { lon += x; lat += y; }
    lon /= ring.length; lat /= ring.length;
    return Math.round((lat + 90) * 1e4) * 1e7 + Math.round((lon + 180) * 1e4);
}

// Lige-ulige-reglen over alle ringe, så gårde i bygningen ikke tæller med.
function pointInRings(lon, lat, rings) {
    let inside = false;
    for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i], [xj, yj] = ring[j];
            if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
        }
    }
    return inside;
}

// Flammerne i en bygning: faste, tilfældige steder inde i omridset, ca. én pr. 150 m².
const flameCache = new Map();
function flamePoints(fire) {
    if (flameCache.has(fire.id)) return flameCache.get(fire.id);
    let seed = (Number(fire.id) * 2654435761) % 4294967296 || 1;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const all = fire.geom.flat(2);
    const lons = all.map(p => p[0]), lats = all.map(p => p[1]);
    const w = Math.min(...lons), e = Math.max(...lons), s = Math.min(...lats), n = Math.max(...lats);
    const boxM2 = Geo.distanceM(s, w, s, e) * Geo.distanceM(s, w, n, w);
    const inside = [];
    const tries = 400;
    for (let i = 0; i < tries; i++) {
        const lon = w + rnd() * (e - w), lat = s + rnd() * (n - s);
        if (fire.geom.some(poly => pointInRings(lon, lat, poly))) inside.push([lon, lat]);
    }
    const want = Math.max(2, Math.min(50, Math.round(boxM2 * inside.length / tries / 150)));
    const pts = inside.slice(0, want).map(c => ({ c, ph: Math.floor(rnd() * 3), s: 0.75 + rnd() * 0.5 }));
    flameCache.set(fire.id, pts);
    return pts;
}

function flameImageExpression(frame) {
    return ["concat", "img-flame-", ["to-string", ["%", ["+", ["get", "ph"], frame], 3]]];
}

let flameTimer = null;
let flameFrame = 0;
function renderMapFires() {
    if (!mapReady) return;
    const now = serverNow();
    const F = GAME_CONFIG.MAP_FIRE;
    const areas = [];
    const flames = [];
    for (const f of state.fires) {
        const ageH = (now - Date.parse(f.started_at)) / 3600000;
        if (ageH < 0 || ageH > F.fireHours + F.ruinHours) continue;
        const burning = ageH < F.fireHours;
        areas.push({
            type: "Feature",
            properties: { state: burning ? "burning" : "ruin" },
            geometry: { type: "MultiPolygon", coordinates: f.geom }
        });
        if (burning) {
            for (const p of flamePoints(f)) {
                flames.push({ type: "Feature", properties: { ph: p.ph, s: p.s }, geometry: { type: "Point", coordinates: p.c } });
            }
        }
    }
    map.getSource("src-fire-areas")?.setData({ type: "FeatureCollection", features: areas });
    map.getSource("src-fire-flames")?.setData({ type: "FeatureCollection", features: flames });

    // Flammerne blafrer, så længe noget brænder; hvert minut ses der efter, om en brand er gået ud.
    clearInterval(flameTimer);
    flameTimer = null;
    if (flames.length) {
        let ticks = 0;
        flameTimer = setInterval(() => {
            flameFrame = (flameFrame + 1) % 3;
            if (map.getLayer("lyr-fire-flames")) map.setLayoutProperty("lyr-fire-flames", "icon-image", flameImageExpression(flameFrame));
            if (++ticks >= 375) renderMapFires();
        }, 160);
    }
}

let cratersTimer = null;
function loadCratersSoon() {
    clearTimeout(cratersTimer);
    cratersTimer = setTimeout(loadCraters, 600);
}

let shellAnimRunning = false;
function startShellAnimation() {
    renderCratersAndShells();
    if (shellAnimRunning) return;
    shellAnimRunning = true;
    const step = () => {
        if (renderCratersAndShells()) requestAnimationFrame(step);
        else shellAnimRunning = false;
    };
    requestAnimationFrame(step);
}

// Samme krater drejes altid ens, så de ikke ser ens ud.
function craterRotation(id) {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

const BLAST_MS = 2500;

// Tegner kratere, eksplosioner og egne granater i luften. Returnerer true, så længe noget bevæger sig.
function renderCratersAndShells() {
    if (!mapReady) return false;
    const now = serverNow();
    const M = GAME_CONFIG.MORTAR;
    const point = (lat, lon, props) => ({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [lon, lat] } });
    const craters = [];
    const shells = [];
    let busy = false;

    for (const c of state.craters) {
        const land = Date.parse(c.lands_at);
        if (now >= land) {
            const ageH = (now - land) / 3600000;
            const big = c.weapon === "howitzer" ? 2 : 1;
            craters.push(point(c.lat, c.lon, { op: Math.max(0.3, 1 - ageH / M.craterHours * 0.7), rot: craterRotation(c.id), sz: big }));
            const age = now - land;
            if (age < BLAST_MS) {
                busy = true;
                const k = age / BLAST_MS;
                shells.push(point(c.lat, c.lon, { kind: "blast", size: big * (0.6 + 0.9 * Math.sin(Math.PI * Math.min(1, k * 1.6))), rot: 0, op: 1 - k * k }));
            }
            continue;
        }
        if (!c.mine || c.from_lat == null) continue;
        busy = true;

        // Granaten flyver i en bue: positionen langs jorden + en højde, der løfter den op på skærmen.
        const dist = Geo.distanceM(c.from_lat, c.from_lon, c.lat, c.lon);
        const flightMs = mortarFlightS(dist, c.weapon) * 1000;
        const launch = land - flightMs;
        const t = (now - launch) / flightMs;
        if (t < 0) continue; // salve: venter på sin tur
        const apexPx = Math.min(260, 50 + dist / 25);
        const lifted = (tt) => {
            const la = c.from_lat + (c.lat - c.from_lat) * tt;
            const lo = c.from_lon + (c.lon - c.from_lon) * tt;
            const p = map.project([lo, la]);
            p.y -= 4 * apexPx * tt * (1 - tt);
            const ll = map.unproject(p);
            return [ll.lng, ll.lat, p];
        };
        const arc = [];
        for (let i = 0; i <= 24; i++) arc.push(lifted(i / 24).slice(0, 2));
        shells.push({ type: "Feature", properties: { kind: "trail" }, geometry: { type: "LineString", coordinates: arc } });

        const [lon, lat, p] = lifted(t);
        const [, , p2] = lifted(Math.min(1, t + 0.01));
        const rot = Math.atan2(p2.x - p.x, -(p2.y - p.y)) * 180 / Math.PI;
        shells.push(point(c.from_lat + (c.lat - c.from_lat) * t, c.from_lon + (c.lon - c.from_lon) * t, { kind: "shadow" }));
        shells.push(point(lat, lon, { kind: "shell", size: 1.6, rot, op: 1 }));
    }

    const T = GAME_CONFIG.TRUCK;
    const wrecks = state.wrecks.map(w => {
        const ageH = (now - Date.parse(w.burned_at)) / 3600000;
        return point(w.lat, w.lon, { op: Math.max(0.35, 1 - ageH / T.wreckHours * 0.65) });
    });
    map.getSource("src-wrecks")?.setData({ type: "FeatureCollection", features: wrecks });
    map.getSource("src-craters")?.setData({ type: "FeatureCollection", features: craters });
    map.getSource("src-shells")?.setData({ type: "FeatureCollection", features: shells });
    return busy;
}

let resolvingArrivals = false;
async function tickMarches() {
    const now = serverNow();
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
    pollDuringCombat();
}

const REPORT_TEXT = {
    stopped:    r => `🛑 ${r.count} soldater er stoppet og står nu vagt.`,
    returned:   r => `${r.count} soldater er vendt hjem til barrakken.`,
    arrived:    r => `Dine ${r.count} soldater er nået frem og står nu vagt.`,
    captured:   r => `Dine ${r.count} soldater er nået frem og står nu vagt.`,
    reinforced: r => `${r.count} soldater er nået frem og forstærker vagten.`,
    victory:    r => `⚔️ Sejr! ${r.survivors} af dine ${r.count} soldater overlevede, og fjenden mistede ${r.enemy_losses}.`,
    defeat:     r => `⚔️ Angrebet blev slået tilbage. Alle ${r.count} soldater faldt (fjenden mistede ${r.enemy_losses}).`,
    defended:   r => `🛡️ Din stilling blev angrebet af ${r.enemy_losses} soldater, men holdt! Du mistede ${r.losses}.`,
    lost:       r => `🔥 Du har tabt et slag. ${r.losses} vagter faldt, og en bygning kan være jævnet med jorden.`,
    patrol_defeated: r => `🏅 Dine soldater nedkæmpede en fjendtlig patrulje på ${r.enemy_losses} soldater.`,
    patrol_won: r => `💀 En fjendtlig patrulje nedkæmpede ${r.count} af dine soldater.`,
    shelled: r => r.survivors <= 0
        ? `💥 En granat ramte dine ${r.count} soldater — ingen overlevede.`
        : `💥 En granat ramte dine soldater: ${r.enemy_losses} træffere${r.losses ? `, ${r.losses} faldt` : ""}.`,
    mortar_hit: r => `💣 Din granat ramte fjenden: ${r.count} træffere${r.enemy_losses ? `, ${r.enemy_losses} faldt` : ""}.`,
    truck_burned: r => `🔥 ${r.count === 1 ? "En af dine lastbiler er" : `${r.count} af dine lastbiler er`} skudt i brand og kan ikke køre mere${r.survivors > 0 ? "" : " — ingen af soldaterne overlevede"}.`,
    truck_stopped: r => `🚚 Delingen kan ikke køre videre: ${r.survivors} soldater er steget af og står nu vagt.`
};

// ---------------------------------------------------------------- kamprapporter
// Træfninger fra serveren (0018): hvor og hvornår dine soldater har været i kamp. Vises i menuen
// "Kamprapporter" og som eksplosioner på kortet for det valgte tidsrum.
const BATTLE_WINDOWS = [
    { h: 1, label: "1 t" }, { h: 4, label: "4 t" }, { h: 12, label: "12 t" },
    { h: 24, label: "24 t" }, { h: 168, label: "Uge" }
];
const BATTLE_WINDOW_KEY = "hf_battle_window_h";
let battleWindowH = 24;
try { battleWindowH = Number(localStorage.getItem(BATTLE_WINDOW_KEY)) || 24; } catch (_) {}
let battles = [];
let battlesMissing = false;  // databasen har ikke fået 0018 endnu
let selectedBattleId = null;

async function loadBattles() {
    if (!state.user) return;
    const since = new Date(serverNow() - battleWindowH * 3600000).toISOString();
    const { data, error } = await sb.from("battles")
        .select("id,lat,lon,enemy,started_at,last_at,own_killed,own_hits,enemy_killed,enemy_wiped,own_wiped")
        .gte("last_at", since)
        .order("last_at", { ascending: false })
        .limit(300);
    battlesMissing = !!error;
    battles = (data || []).slice().sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    renderBattlesSidebar();
    renderBattlesOnMap();
}

window.setBattleWindow = function(h) {
    battleWindowH = h;
    try { localStorage.setItem(BATTLE_WINDOW_KEY, String(h)); } catch (_) {}
    loadBattles();
};

window.showBattle = function(id) {
    const b = battles.find(x => String(x.id) === String(id));
    if (!b) return;
    selectedBattleId = b.id;
    renderBattlesSidebar();
    renderBattlesOnMap();
    jumpToPoint(b.lat, b.lon);
};

function battleTimeText(iso) {
    const d = new Date(Date.parse(iso) - state.serverOffsetMs);
    const today = new Date();
    const time = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return `I dag kl. ${time}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `I går kl. ${time}`;
    return `${d.toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" })} kl. ${time}`;
}

function battleOutcome(b) {
    if (b.enemy_wiped && !b.own_wiped) return { text: "🏅 Sejr: fjenden blev nedkæmpet", color: "#39FF14" };
    if (b.own_wiped && !b.enemy_wiped) return { text: "💀 Nederlag: en af dine grupper faldt", color: "#FF5252" };
    if (b.own_wiped && b.enemy_wiped) return { text: "⚔️ Blodig kamp: begge sider mistede en gruppe", color: "#FF9800" };
    return { text: "⚔️ Træfning", color: "#FFD54F" };
}

function renderBattlesSidebar() {
    const list = document.getElementById("battles-list");
    const badge = document.getElementById("battles-summary-badge");
    if (!list) return;
    if (badge) badge.textContent = `${battles.length} kampe`;

    const buttons = BATTLE_WINDOWS.map(w =>
        `<button class="btn btn-small ${w.h === battleWindowH ? "btn-primary" : ""}" onclick="setBattleWindow(${w.h})">${w.label}</button>`
    ).join("");
    let html = `<div class="item-actions" style="margin-bottom:8px;">${buttons}</div>`;

    if (battlesMissing) {
        html += `<p class="muted-hint">Kamprapporterne kræver, at <strong>0018_kamprapporter.sql</strong> er kørt i Supabase.</p>`;
    } else if (battles.length === 0) {
        html += `<p class="muted-hint">Ingen kampe ${battleWindowH === 168 ? "den sidste uge" : `de sidste ${battleWindowH === 1 ? "time" : `${battleWindowH} timer`}`}.</p>`;
    } else {
        for (const b of battles) {
            const o = battleOutcome(b);
            const enemy = b.enemy === "player" ? "mod en anden spiller"
                : b.enemy === "mortar" ? "mortergranater"
                : b.enemy === "howitzer" ? "haubitsgranater" : "mod en fjendtlig patrulje";
            const sel = String(b.id) === String(selectedBattleId);
            html += `
                <div class="item-row ${sel ? "item-row-selected" : ""}" style="cursor:pointer;" onclick="showBattle(${b.id})">
                    <div class="item-row-top">
                        <div class="item-info">
                            <div class="item-title" style="color:${o.color}">${o.text}</div>
                            <div class="item-sub">${battleTimeText(b.last_at)} · ${enemy}</div>
                            <div class="item-sub">📍 ${formatPos(b.lat, b.lon)}</div>
                            <div class="item-sub">Dine tab: ${b.own_killed} faldne${b.own_hits > b.own_killed ? ` (${b.own_hits} ramt)` : ""} · Fjendens tab: ${b.enemy_killed}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    list.innerHTML = html;
}

function renderBattlesOnMap() {
    if (!mapReady) return;
    map.getSource("src-battles")?.setData({
        type: "FeatureCollection",
        features: battles.map(b => ({
            type: "Feature",
            properties: { id: b.id, selected: String(b.id) === String(selectedBattleId) },
            geometry: { type: "Point", coordinates: [b.lon, b.lat] }
        }))
    });
}

// En lille eksplosion i pixel-stil (16×16, tegnet 3× stor). Den valgte får en hvid ramme.
function explosionImage(selected = false) {
    const art = [
        "......Y....Y....",
        ".Y.....Y..Y...Y.",
        "..Y..OOOYOO..Y..",
        "....OOYYYYOO....",
        "...OYYWWWYYOO...",
        "..OOYWWWWWYYO...",
        "YOOYYWWWWWWYOO.Y",
        "..OYYWWWWWWYYO..",
        "..ROYWWWWWYYOR..",
        "...ROYYWWYYOR...",
        "..Y.ROOYYOORR...",
        ".....RROORRR..Y.",
        "...Y..RRRR......",
        ".......DD.......",
        "......DDDD..Y...",
        ".....DDDDDD....."
    ];
    const colors = { Y: "#FFEB3B", O: "#FF9800", R: "#E53935", W: "#FFFDE7", D: "#5D4037" };
    const px = 3, pad = 2, size = 16 * px + pad * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (selected) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, size - 2, size - 2);
    }
    art.forEach((row, y) => [...row].forEach((c, x) => {
        if (!colors[c]) return;
        ctx.fillStyle = colors[c];
        ctx.fillRect(pad + x * px, pad + y * px, px, px);
    }));
    return ctx.getImageData(0, 0, size, size);
}

// Rapporter om ankomster og kampe — også dem, der skete mens du var væk.
async function loadReports() {
    if (!state.user) return;
    const { data } = await sb.from("march_reports")
        .select("id,kind,lat,lon,count,survivors,losses,enemy_losses")
        .eq("seen", false)
        .order("id", { ascending: true });
    if (!data || data.length === 0) return;
    for (const r of data) {
        const text = REPORT_TEXT[r.kind];
        if (text) queueToast(text(r));
    }
    await sb.from("march_reports").update({ seen: true }).in("id", data.map(r => r.id));
    // Kamp mod patruljer ændrer antallet af soldater; hjemkomne sårede lægges på hospitalet.
    if (data.some(r => r.kind !== "returned" && r.kind !== "arrived" && r.kind !== "stopped")) loadBattles();
    if (data.some(r => r.kind.startsWith("patrol_") || r.kind.startsWith("truck_") || r.kind === "returned" || r.kind === "shelled" || r.kind === "stopped")) {
        await loadArmy();
        await syncAllFromSupabase();
    }
}

// Henter alt fjendtligt, du kan se lige nu (telefonen + egne soldater), og melder nye fund.
let pollingWorld = false;
let lastWorldPoll = 0;
async function pollWorld() {
    if (!state.user || pollingWorld) return;
    pollingWorld = true;
    try {
        const { data, error } = await sb.rpc("visible_enemies");
        if (error) console.warn("visible_enemies fejlede:", error.message || error);
        if (error || !data) return;
        state.enemies = {
            buildings: data.buildings || [],
            garrisons: data.garrisons || [],
            marches: data.marches || [],
            npcs: data.npcs || []
        };
        if (data.now) state.serverOffsetMs = Date.parse(data.now) - Date.now();
        lastWorldPoll = Date.now();
        announceSightings();
        announceCombat();
        if (state.groupModal && !["garrison", "march"].includes(state.groupModal.kind)) renderGroupModal();
        renderWorld();
        renderTroopsOnMap();
        renderContactsSidebar();
        if (state.selected) renderSelectedBox();
    } finally {
        pollingWorld = false;
    }
    loadCraters();
}

function enemyKey(kind, o) {
    return `${kind}${o.id}`;
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
            fresh.push(`👁️ Dine soldater har fået øje på en fjendtlig ${name.toLowerCase()} (trin ${b.level}).`);
        }
    }
    for (const g of state.enemies.garrisons.filter(g => g.by_soldiers)) {
        const k = enemyKey("g", g);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) fresh.push(`👁️ Dine soldater har fået øje på ${g.count} fjendtlige vagter.`);
    }
    for (const m of state.enemies.marches.filter(m => m.by_soldiers)) {
        const k = enemyKey("march", m);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) fresh.push(`👁️ Dine soldater har fået øje på ${m.count} fjendtlige soldater på march.`);
    }
    for (const n of state.enemies.npcs.filter(n => n.by_soldiers)) {
        const k = enemyKey("npc", n);
        now.add(k);
        if (!state.seenBySoldiers.has(k)) fresh.push(n.unit_name
            ? `👁️ Dine soldater har fået øje på et ${npcLabel(n).toLowerCase()} på ${n.count} soldater${npcGear(n) ? ` (${npcGear(n)})` : ""}.`
            : `👁️ Dine soldater har fået øje på en ${n.is_invasion ? "fjendtlig invasionshær" : "fjendtlig patrulje"} på ${n.count} soldater.`);
    }
    state.seenBySoldiers = now;
    fresh.forEach(queueToast);
}

// "Dine soldater er i kamp!" — når en patrulje er kommet inden for skudafstand.
function announceCombat() {
    const fighting = new Set(state.enemies.npcs.filter(n => n.fighting).map(n => n.id));
    for (const id of fighting) {
        if (!state.inCombat.has(id)) {
            const n = state.enemies.npcs.find(x => x.id === id);
            queueToast(n.unit_name
                ? `💥 Dine soldater er i kamp med et ${npcLabel(n).toLowerCase()} på ${n.count} soldater!`
                : `💥 Dine soldater er i kamp med en ${n.is_invasion ? "fjendtlig invasionshær" : "fjendtlig patrulje"} på ${n.count} soldater!`);
        }
    }
    state.inCombat = fighting;
}

// Under kamp henter vi oftere, så tabene kan ses, mens det sker.
const COMBAT_POLL_MS = 5000;
async function pollDuringCombat() {
    if (state.inCombat.size === 0 || pollingWorld || Date.now() - lastWorldPoll < COMBAT_POLL_MS) return;
    await pollWorld();
    await loadArmy();
    await loadReports();
}

function renderContactsSidebar() {
    const list = document.getElementById("contacts-list");
    const badge = document.getElementById("contacts-summary-badge");
    if (!list) return;
    const e = state.enemies;
    const total = e.buildings.length + e.garrisons.length + e.marches.length + e.npcs.length;
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
                        <div class="item-sub">${who(b)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToPoint(${b.lat}, ${b.lon})">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${b.lat}, ${b.lon})">⚔️ Angrib</button>
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
                        <div class="item-sub">${who(g)} · ${energyText(g)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToPoint(${g.lat}, ${g.lon})">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${g.lat}, ${g.lon})">⚔️ Angrib</button>
                </div>
            </div>`);
    }
    for (const n of e.npcs) {
        const [lat, lon] = npcCurrentPos(n);
        rows.push(`
            <div class="item-row">
                <div class="item-row-top">
                    <img src="assets/fjende.png" class="pixel-img item-sprite" />
                    <div class="item-info">
                        <div class="item-title enemy-title">${npcLabel(n)}: ${n.count} soldater</div>
                        <div class="item-sub">${n.fighting ? "💥 i kamp med dine soldater" : who(n)} · ${energyText(n)}${npcGear(n) ? ` · ${npcGear(n)}` : ""}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="jumpToPoint(${lat}, ${lon})">🎯 Hop til</button>
                    <button class="btn btn-small btn-danger" onclick="sendSoldiersTo(${lat}, ${lon})">⚔️ Angrib</button>
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
                        <div class="item-sub">${who(m)} · ${energyText(m)}</div>
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
// Computerstyrede patruljer: nye sættes ud på land omkring din første bygning
// ============================================================================
// Serveren kender ikke kortets vand. Browseren vælger derfor tilfældige steder og flytter dem
// hen til nærmeste vej (OSRM), så patruljerne ikke starter ude i havet. Serveren tjekker selv
// afstand og antal (npc_spawn).
const NPC_SNAP_MAX_M = 300;
let spawningNpcs = false;
async function maybeSpawnNpcs() {
    if (!state.user || spawningNpcs) return;
    spawningNpcs = true;
    try {
        const { data: info, error } = await sb.rpc("npc_spawn_info");
        if (error || !info || !(info.missing > 0)) return;
        const points = [];
        for (let tries = 0; tries < info.missing * 4 && points.length < info.missing; tries++) {
            const a = Math.random() * 2 * Math.PI;
            const d = info.radius_m * Math.sqrt(Math.random());
            const lat = info.lat + (d * Math.sin(a)) / EARTH_RADIUS_M * DEG_PER_RAD;
            const lon = info.lon + (d * Math.cos(a)) / (EARTH_RADIUS_M * Math.cos(info.lat * RAD_PER_DEG)) * DEG_PER_RAD;
            const snapped = await nearestRoadPoint(lat, lon);
            if (snapped && Geo.distanceM(lat, lon, snapped[0], snapped[1]) <= NPC_SNAP_MAX_M) points.push(snapped);
        }
        if (points.length > 0) await sb.rpc("npc_spawn", { p_points: points });
    } finally {
        spawningNpcs = false;
    }
}

async function nearestRoadPoint(lat, lon) {
    try {
        const url = `https://router.project-osrm.org/nearest/v1/foot/${lon.toFixed(6)},${lat.toFixed(6)}?number=1`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const json = await resp.json();
        const loc = json?.waypoints?.[0]?.location;
        return loc ? [loc[1], loc[0]] : null;
    } catch (_) {
        return null;
    }
}

// ============================================================================
// Admin: spillerliste, login-log og regler
// ============================================================================
function formatDateTime(iso) {
    if (!iso) return "Aldrig";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const date = d.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${date} kl. ${time}`;
}

function timeAgo(iso) {
    if (!iso) return "";
    const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "lige nu";
    if (diff < 3600) return `${Math.floor(diff / 60)} min. siden`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} t. siden`;
    const days = Math.floor(diff / 86400);
    return `${days} dag${days === 1 ? "" : "e"} siden`;
}

function adminTabs(active) {
    return `<div class="admin-tabs">
        <button class="btn btn-small ${active === "players" ? "btn-gold" : ""}" onclick="openAdminModal()">Spillere</button>
        <button class="btn btn-small ${active === "rules" ? "btn-gold" : ""}" onclick="openRulesModal()">Regler</button>
        <button class="btn btn-small ${active === "log" ? "btn-gold" : ""}" onclick="openAdminLogModal()">Login-log</button>
        <button class="btn btn-small ${active === "invasion" ? "btn-gold" : ""}" onclick="openInvasionModal()">Invasion</button>
    </div>`;
}

// Admin: den svenske hær. Viser hvad der er tilbage og kan starte invasionen forfra.
window.openInvasionModal = async function() {
    document.querySelector(".modal-box")?.classList.add("modal-wide");
    document.getElementById("modal-title").innerHTML = `Admin: invasion ${adminTabs("invasion")}`;
    document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Henter hæren…</p>`;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn btn-danger" onclick="startInvasion()">🇸🇪 Start den svenske invasion</button>
        <button class="btn" onclick="closeModal()">Luk</button>`;
    document.getElementById("modal-overlay").classList.remove("hidden");

    const { data, error } = await sb.rpc("invasion_status");
    if (error || !data) {
        document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Kunne ikke hente hæren: ${escapeHtml(error?.message || "intet svar")}. Er 0036_svensk_invasion.sql kørt i Supabase?</p>`;
        return;
    }
    const d = data;
    document.getElementById("modal-body").innerHTML = `
        <p>Den svenske hær har <strong>${fmtNum(d.soldiers)}</strong> af ${fmtNum(d.started)} soldater tilbage i <strong>${fmtNum(d.units)}</strong> enheder. ${fmtNum(d.arrived)} enheder er nået frem.</p>
        ${codexStats([
            ["Lastbiler", fmtNum(d.trucks)],
            ["Morterer", `${fmtNum(d.mortars)} (${fmtNum(d.shells)} granater)`],
            ["Haubitser", `${fmtNum(d.howitzers)} (${fmtNum(d.howitzer_shells)} granater)`]
        ])}
        <p class="muted-hint">Knappen fjerner den nuværende invasion og stiller en ny hær op ved Lernacken på den svenske side efter tallene under Regler → Den svenske hær.</p>`;
};

window.startInvasion = async function() {
    if (!confirm("Fjerne den nuværende invasion og starte en ny svensk hær ved Lernacken?")) return;
    const { data, error } = await sb.rpc("start_invasion");
    if (error) {
        showToast(`Kunne ikke starte invasionen: ${error.message}`);
        return;
    }
    showToast(data || "Invasionen er startet.");
    await pollWorld();
    openInvasionModal();
};

async function openAdminModal() {
    document.querySelector(".modal-box")?.classList.add("modal-wide");
    document.getElementById("modal-title").innerHTML = `Admin: spillere ${adminTabs("players")}`;
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
                <div class="admin-sub">${escapeHtml(p.display_name)}${p.is_admin ? " · admin" : ""} · oprettet ${new Date(p.created_at).toLocaleDateString("da-DK")}${p.last_sign_in_at ? ` · logget ind ${formatDateTime(p.last_sign_in_at)}` : ""}</div>
            </td>
            <td class="admin-res">
                <label>Skridt <input type="number" min="0" step="1" id="adm-steps-${p.id}" value="${p.steps ?? 0}" /></label>
                <label>Stål <input type="number" min="0" step="1" id="adm-steel-${p.id}" value="${p.steel ?? 0}" /></label>
                <button class="btn btn-small" onclick="saveResources('${p.id}', this)">Gem</button>
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
        <p class="muted-hint">En testkonto må bygge hvor som helst uden bogmærke fra telefonen (dog stadig med ${GAME_CONFIG.BUILDING_GAP_M} m til andre bygninger). Spilleren skal genindlæse siden, før det slår igennem.</p>
        <p class="muted-hint">Skridt og stål: skriv de nye tal ud for spilleren, og tryk Gem. Tallene viser, hvad spilleren har lige nu.</p>
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
        if (state.selected) renderSelectedBox();
    }
};

window.saveResources = async function(playerId, button) {
    const steps = Number(document.getElementById(`adm-steps-${playerId}`).value);
    const steel = Number(document.getElementById(`adm-steel-${playerId}`).value);
    if (!Number.isInteger(steps) || steps < 0 || !Number.isInteger(steel) || steel < 0) {
        showToast("Skridt og stål skal være hele tal, 0 eller mere.");
        return;
    }
    button.disabled = true;
    const { error } = await sb.rpc("admin_set_resources", { p_player: playerId, p_steps: steps, p_steel: steel });
    button.disabled = false;
    if (error) {
        showToast("Kunne ikke gemme: " + error.message);
        return;
    }
    showToast(`Gemt: ${steps} skridt og ${steel} stål.`);
    if (playerId === state.user?.id) syncAllFromSupabase();
};

window.openAdminLogModal = async function() {
    document.querySelector(".modal-box")?.classList.add("modal-wide");
    document.getElementById("modal-title").innerHTML = `Admin: login-log ${adminTabs("log")}`;
    document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Henter login-log…</p>`;
    document.getElementById("modal-actions").innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    document.getElementById("modal-overlay").classList.remove("hidden");

    const [playersRes, histRes] = await Promise.all([
        sb.rpc("admin_login_log"),
        sb.rpc("admin_login_history", { p_limit: 50 })
    ]);

    if (playersRes.error) {
        document.getElementById("modal-body").innerHTML = `
            <p class="muted-hint">Kunne ikke hente login-log: ${escapeHtml(playersRes.error.message)}</p>
            <p class="muted-hint">Kør SQL-migrationen <code>0029_admin_login_log.sql</code> i Supabase for at aktivere login-loggen.</p>
        `;
        return;
    }

    const players = playersRes.data || [];
    const history = histRes.data || [];

    const playerRows = players.map(p => {
        const lastLogin = p.last_sign_in_at ? formatDateTime(p.last_sign_in_at) : `<span class="muted-hint">Ikke registreret endnu</span>`;
        const lastSeen = p.last_seen_at ? formatDateTime(p.last_seen_at) : `<span class="muted-hint">—</span>`;
        const statusBadge = p.is_online
            ? `<span style="color: #81C784; font-weight: bold; font-size: 11px;">● Online</span>`
            : `<span style="color: #78909C; font-size: 11px;">Offline</span>`;
        return `
            <tr>
                <td>
                    <div><strong>${escapeHtml(p.display_name)}</strong> ${statusBadge}</div>
                    <div class="admin-sub">${escapeHtml(p.email || "anonym")}${p.is_admin ? " · admin" : ""}${p.is_tester ? " · testkonto" : ""} · oprettet ${new Date(p.created_at).toLocaleDateString("da-DK")}</div>
                </td>
                <td style="white-space: nowrap;">
                    <div>${lastLogin}</div>
                    ${p.last_sign_in_at ? `<div class="admin-sub">${timeAgo(p.last_sign_in_at)}</div>` : ""}
                </td>
                <td style="white-space: nowrap;">
                    <div>${lastSeen}</div>
                    ${p.last_seen_at ? `<div class="admin-sub">${timeAgo(p.last_seen_at)}</div>` : ""}
                </td>
            </tr>
        `;
    }).join("");

    const histRows = history.map(h => `
        <tr>
            <td style="white-space: nowrap;">${formatDateTime(h.logged_in_at)} <span class="admin-sub">(${timeAgo(h.logged_in_at)})</span></td>
            <td><strong>${escapeHtml(h.display_name)}</strong> <span class="admin-sub">${escapeHtml(h.email || "")}</span></td>
        </tr>
    `).join("");

    document.getElementById("modal-body").innerHTML = `
        <p class="muted-hint">Her kan du se, hvornår hver spiller sidst er logget ind med dato og klokkeslæt, samt hvornår de sidst har været aktive i spillet.</p>
        <div class="admin-list">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Spiller</th>
                        <th>Sidst logget ind</th>
                        <th>Sidst aktiv</th>
                    </tr>
                </thead>
                <tbody>
                    ${playerRows.length > 0 ? playerRows : `<tr><td colspan="3" class="muted-hint">Ingen spillere fundet.</td></tr>`}
                </tbody>
            </table>
        </div>
        ${history.length > 0 ? `
            <details class="rule-group" style="margin-top: 14px;">
                <summary>Loginhistorik (seneste ${history.length} logins)</summary>
                <div style="max-height: 250px; overflow-y: auto; margin-top: 6px;">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tidspunkt</th>
                                <th>Spiller</th>
                            </tr>
                        </thead>
                        <tbody>${histRows}</tbody>
                    </table>
                </div>
            </details>
        ` : ""}
    `;
};

// ============================================================================
// Admin: regler (alle tal i config → rules). Serveren læser dem ved hvert kald,
// så en ændring virker med det samme. Hver gemning lægger den gamle udgave i historikken.
// ============================================================================
const RULE_GROUPS = [
    ["vision", "Udsyn og bevægelse"],
    ["fire", "Kamp: geværild og energi"],
    ["mortar", "Let morter"],
    ["howitzer", "Haubits"],
    ["truck", "Lastbil"],
    ["mapfire", "Brændende bygninger på kortet"],
    ["npc", "Fjendtlige patruljer"],
    ["sweden", "Den svenske hær (invasion)"],
    ["build", "Bygninger og byggeri"],
    ["economy", "Skridt og økonomi"],
    ["gps", "Telefon og GPS"],
    ["other", "Andet"]
];

// Nøgle → [gruppe, forklaring, enhed]. Nøgler, der ikke står her, vises under "Andet".
const RULE_INFO = {
    vision_m:                   ["vision", "Telefonens udsyn (fjender ses så langt fra telefonen)", "m"],
    soldier_vision_m:           ["vision", "Soldaternes udsyn", "m"],
    soldier_speed_mps:          ["vision", "Soldaternes gå-fart", "km/t"],
    garrison_merge_m:           ["vision", "Soldater så tæt på hinanden er én vagtstyrke", "m"],
    march_snap_m:               ["vision", "Tilladt afvigelse for rutens ender", "m"],
    march_max_points:           ["vision", "Flest punkter i en rute", "stk."],
    fire_range_m:               ["fire", "Skudafstand", "m"],
    fire_round_s:               ["fire", "Sekunder pr. skudrunde", "s"],
    hit_chance_near:            ["fire", "Chance for at ramme helt tæt på (0,30 = 30 %)", "0–1"],
    hit_chance_far:             ["fire", "Chance for at ramme ved største skudafstand", "0–1"],
    hit_damage_min:             ["fire", "Mindste skade pr. træffer", "energi"],
    hit_damage_max:             ["fire", "Største skade pr. træffer", "energi"],
    hit_kill_chance:            ["fire", "Chance for at et træffer dræber med det samme", "0–1"],
    soldier_hp:                 ["fire", "Energi pr. soldat", "energi"],
    building_defense_per_level: ["fire", "Forsvar pr. bygningstrin", ""],
    battle_merge_m:             ["fire", "Kamprapporter: slå kampe sammen inden for", "m"],
    battle_merge_s:             ["fire", "Kamprapporter: slå kampe sammen inden for", "s"],
    fire_hit_chance:            ["fire", "(Bruges ikke længere – erstattet af chance tæt på/langt væk)", "0–1"],
    mortar_price_steps:         ["mortar", "Pris for én morter", "skridt"],
    mortar_price_steel:         ["mortar", "Pris for én morter", "stål"],
    mortar_shell_price_steps:   ["mortar", "Pris for én granat", "skridt"],
    mortar_shell_price_steel:   ["mortar", "Pris for én granat", "stål"],
    mortar_range_m:             ["mortar", "Længste skud", "m"],
    mortar_min_range_m:         ["mortar", "Korteste skud", "m"],
    mortar_spread_base_m:       ["mortar", "Spredning: grundværdi", "m"],
    mortar_spread_pct:          ["mortar", "Spredning: andel af afstanden (0,02 = 2 %)", "0–1"],
    mortar_blast_m:             ["mortar", "Granatsplinter rækker så langt fra nedslaget", "m"],
    mortar_hits:                ["mortar", "Træffere midt i nedslaget (færre længere ude)", "træffere"],
    mortar_crew:                ["mortar", "Soldater pr. morter", "stk."],
    mortar_reload_s:            ["mortar", "Tid mellem to granater fra samme morter", "s"],
    mortar_salvo_max:           ["mortar", "Flest granater pr. ordre", "stk."],
    mortar_flight_base_s:       ["mortar", "Flyvetid: grundværdi", "s"],
    mortar_flight_mps:          ["mortar", "Flyvetid: granatens fart", "km/t"],
    mortar_crater_hours:        ["mortar", "Så længe et krater kan ses", "timer"],
    howitzer_price_steps:       ["howitzer", "Pris for én haubits", "skridt"],
    howitzer_price_steel:       ["howitzer", "Pris for én haubits", "stål"],
    howitzer_shell_price_steps: ["howitzer", "Pris for én haubitsgranat", "skridt"],
    howitzer_shell_price_steel: ["howitzer", "Pris for én haubitsgranat", "stål"],
    howitzer_range_m:           ["howitzer", "Længste skud", "m"],
    howitzer_min_range_m:       ["howitzer", "Korteste skud", "m"],
    howitzer_spread_base_m:     ["howitzer", "Spredning: grundværdi", "m"],
    howitzer_spread_pct:        ["howitzer", "Spredning: andel af afstanden (0,01 = 1 %)", "0–1"],
    howitzer_blast_m:           ["howitzer", "Granatsplinter rækker så langt fra nedslaget", "m"],
    howitzer_hits:              ["howitzer", "Træffere midt i nedslaget (færre længere ude)", "træffere"],
    howitzer_crew:              ["howitzer", "Ledige soldater i barrakken pr. haubits", "stk."],
    howitzer_reload_s:          ["howitzer", "Tid mellem to granater fra samme haubits", "s"],
    howitzer_salvo_max:         ["howitzer", "Flest granater pr. ordre", "stk."],
    howitzer_flight_base_s:     ["howitzer", "Flyvetid: grundværdi", "s"],
    howitzer_flight_mps:        ["howitzer", "Flyvetid: granatens fart", "km/t"],
    truck_price_steps:          ["truck", "Pris for én lastbil", "skridt"],
    truck_price_steel:          ["truck", "Pris for én lastbil", "stål"],
    truck_capacity:             ["truck", "Soldater pr. lastbil", "soldater"],
    truck_road_speed_mps:       ["truck", "Fart på vej", "km/t"],
    truck_field_speed_mps:      ["truck", "Fart uden for vejene", "km/t"],
    truck_hp:                   ["truck", "Energi pr. lastbil", "energi"],
    truck_hit_share:            ["truck", "Andel af træfferne, der rammer en lastbil (0,4 = 40 %)", "0–1"],
    truck_wreck_hours:          ["truck", "Så længe et udbrændt vrag kan ses", "timer"],
    map_fire_chance:            ["mapfire", "Chance for at en mortergranat sætter kortets bygning i brand (0,3 = 30 %)", "0–1"],
    map_fire_hours:             ["mapfire", "Så længe bygningen brænder", "timer"],
    map_ruin_hours:             ["mapfire", "Så længe den udbrændte ruin kan ses bagefter (168 = en uge)", "timer"],
    npc_per_player:             ["npc", "Patruljer omkring hver spiller", "stk."],
    npc_spawn_radius_m:         ["npc", "Så langt fra spillerens første bygning de opstår", "m"],
    npc_spawn_clear_m:          ["npc", "Opstår ikke tættere på en bygning end", "m"],
    npc_size_min:               ["npc", "Mindst antal soldater i en ny patrulje", "stk."],
    npc_size_max:               ["npc", "Højst antal soldater i en ny patrulje", "stk."],
    npc_wander_m:               ["npc", "Så langt fra hjemstedet de strejfer", "m"],
    npc_speed_mps:              ["npc", "Gå-fart på patrulje", "km/t"],
    npc_vision_m:               ["npc", "Så langt de ser dine soldater", "m"],
    npc_chase_leash_m:          ["npc", "Længst væk fra hjemstedet de forfølger", "m"],
    sweden_hq_size:             ["sweden", "Stab: soldater (kører i lastbil)", "soldater"],
    sweden_motor_groups:        ["sweden", "Motoriserede kompagnier", "stk."],
    sweden_motor_size:          ["sweden", "Motoriseret kompagni: soldater", "soldater"],
    sweden_motor_trucks:        ["sweden", "Motoriseret kompagni: lastbiler", "stk."],
    sweden_infantry_groups:     ["sweden", "Infanterikompagnier til fods", "stk."],
    sweden_infantry_size:       ["sweden", "Infanterikompagni: soldater", "soldater"],
    sweden_mortar_groups:       ["sweden", "Morterdelinger", "stk."],
    sweden_mortar_size:         ["sweden", "Morterdeling: soldater", "soldater"],
    sweden_mortar_mortars:      ["sweden", "Morterdeling: morterer", "stk."],
    sweden_mortar_shells:       ["sweden", "Morterdeling: mortergranater", "stk."],
    sweden_artillery_groups:    ["sweden", "Haubitsbatterier", "stk."],
    sweden_artillery_size:      ["sweden", "Haubitsbatteri: soldater", "soldater"],
    sweden_artillery_howitzers: ["sweden", "Haubitsbatteri: haubitser (1 lastbil pr. haubits)", "stk."],
    sweden_artillery_shells:    ["sweden", "Haubitsbatteri: haubitsgranater", "stk."],
    sweden_column_gap_s:        ["sweden", "Tid mellem to enheder, der kører ud fra Lernacken", "s"],
    sweden_salvo_per_gun:       ["sweden", "Granater pr. kanon pr. salve", "stk."],
    sweden_fire_pause_s:        ["sweden", "Mindst så lang tid mellem to salver fra samme enhed", "s"],
    building_gap_m:             ["build", "Mindste afstand mellem to bygningers kanter", "m"],
    build_bookmark_size_m:      ["build", "Et byggepladsbogmærke er en firkant på", "m"],
    build_chain_m:              ["build", "Ny bygning højst så langt fra en af dine egne", "m"],
    reach_m:                    ["build", "Telefonens rækkevidde for byggepladsbogmærker", "m"],
    building_size_m:            ["build", "Bygningernes størrelse (side i firkanten)", "m"],
    building_prices:            ["build", "Byggepris pr. trin", "skridt"],
    building_materials:         ["build", "Stål pr. trin", "stål"],
    building_housing:           ["build", "Sengepladser pr. trin", "soldater"],
    building_production:        ["build", "Produktion pr. trin", ""],
    hospital_beds:              ["build", "Felthospitalet: senge pr. trin", "sårede"],
    hospital_heal_per_hour:     ["build", "Felthospitalet: heling pr. time pr. trin", "energi"],
    factory_unlock:             ["build", "Våbenfabrikken: trin, som hvert stykke udstyr kræver", "trin"],
    factory_discount:           ["build", "Våbenfabrikken: rabat på udstyr pr. trin (0,05 = 5 %)", "0–1"],
    building_terrain:           ["build", "Terræn, man må bygge på (adskilt med komma)", ""],
    starting_steps:             ["economy", "Skridt ved start", "skridt"],
    instant_soldier_steps:      ["economy", "Pris for at straks-uddanne én soldat", "skridt"],
    remote_empty_steps:         ["economy", "Pris for at tømme en bygning på afstand", "skridt"],
    tile_price_steps:           ["economy", "(Fra den gamle udgave med felter – bruges ikke)", "skridt"],
    online_window_s:            ["economy", "Spiller tæller som online så længe efter sidste livstegn", "s"],
    location_max_age_s:         ["gps", "Telefonens position gælder så længe", "s"],
    location_max_speed_mps:     ["gps", "Højeste tilladte fart mellem to positioner", "km/t"],
    location_jitter_m:          ["gps", "Tilladt GPS-uro", "m"],
    location_max_accuracy_m:    ["gps", "Dårligste GPS-nøjagtighed, der godtages", "m"]
};

const RULE_SUBLABELS = {
    per_hour: "pr. time", capacity: "lager", material: "materiale",
    soldiers: "soldater", steel: "stål",
    mortars: "morter", mortar_shells: "mortergranater", trucks: "lastbil",
    howitzers: "haubits", howitzer_shells: "haubitsgranater"
};

let adminRules = null;   // reglerne, som de så ud, da fanen blev åbnet

function ruleSubLabel(k) {
    return GAME_CONFIG.BUILDINGS[k]?.name || RULE_SUBLABELS[k] || k;
}

// Ét eller flere inputfelter for en værdi. path er stien i rules-objektet.
// Farter står i m/s i reglerne, men vises og rettes i km/t (enheden "km/t" i RULE_INFO).
function ruleIsKmh(path) {
    return path.length === 1 && RULE_INFO[path[0]]?.[2] === "km/t";
}

function ruleInputs(value, path) {
    const p = escapeHtml(JSON.stringify(path));
    if (typeof value === "number" && ruleIsKmh(path)) {
        const kmh = Math.round(value * 3.6 * 10) / 10;
        return `<input type="number" step="any" class="rule-input" data-path="${p}" data-type="kmh" data-orig="${value}" value="${kmh}" />`;
    }
    if (typeof value === "number") {
        return `<input type="number" step="any" class="rule-input" data-path="${p}" data-type="number" value="${value}" />`;
    }
    if (typeof value === "boolean") {
        return `<input type="checkbox" data-path="${p}" data-type="boolean" ${value ? "checked" : ""} />`;
    }
    if (typeof value === "string") {
        return `<span class="muted-hint">${escapeHtml(value)}</span>`;
    }
    if (Array.isArray(value)) {
        if (value.every(v => typeof v === "string")) {
            return `<input type="text" class="rule-input rule-wide" data-path="${p}" data-type="strings" value="${escapeHtml(value.join(", "))}" />`;
        }
        // Lister pr. trin: tal, eller materialer som {steel: 15}
        return `<div class="rule-steps">${value.map((v, i) => {
            const field = (v && typeof v === "object" && !Array.isArray(v))
                ? `<input type="number" step="any" class="rule-input" data-path="${escapeHtml(JSON.stringify([...path, i]))}" data-type="material" value="${Number(v.steel || 0)}" />`
                : ruleInputs(v, [...path, i]);
            return `<label class="rule-step"><span>Trin ${i + 1}</span>${field}</label>`;
        }).join("")}</div>`;
    }
    if (value && typeof value === "object") {
        return `<div class="rule-sub">${Object.entries(value).map(([k, v]) => `
            <div class="rule-subrow"><span class="rule-sublabel">${escapeHtml(ruleSubLabel(k))}</span>${ruleInputs(v, [...path, k])}</div>
        `).join("")}</div>`;
    }
    return `<span class="muted-hint">${escapeHtml(JSON.stringify(value))}</span>`;
}

window.openRulesModal = async function() {
    document.querySelector(".modal-box")?.classList.add("modal-wide");
    document.getElementById("modal-title").innerHTML = `Admin: regler ${adminTabs("rules")}`;
    document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Henter regler…</p>`;
    document.getElementById("modal-actions").innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    document.getElementById("modal-overlay").classList.remove("hidden");

    const [cfgRes, histRes] = await Promise.all([
        sb.from("config").select("value").eq("key", "rules").maybeSingle(),
        sb.rpc("admin_rules_history")
    ]);
    if (cfgRes.error || !cfgRes.data) {
        document.getElementById("modal-body").innerHTML = `<p class="muted-hint">Kunne ikke hente reglerne: ${escapeHtml(cfgRes.error?.message || "ingen regler")}</p>`;
        return;
    }
    adminRules = cfgRes.data.value;

    const groups = {};
    for (const [key, value] of Object.entries(adminRules)) {
        const info = RULE_INFO[key] || ["other", "", ""];
        (groups[info[0]] ||= []).push(`
            <div class="rule-row">
                <div class="rule-label">
                    <div>${escapeHtml(info[1] || key)}${info[2] ? ` <span class="rule-unit">(${escapeHtml(info[2])})</span>` : ""}</div>
                    <div class="admin-sub">${escapeHtml(key)}</div>
                </div>
                <div class="rule-value">${ruleInputs(value, [key])}</div>
            </div>`);
    }

    const sections = RULE_GROUPS.filter(([g]) => groups[g]).map(([g, title]) => `
        <details class="rule-group">
            <summary>${escapeHtml(title)}</summary>
            ${groups[g].join("")}
        </details>`).join("");

    const hist = histRes.error
        ? `<p class="muted-hint">Historikken kunne ikke hentes: ${escapeHtml(histRes.error.message)}</p>`
        : (histRes.data || []).length === 0
            ? `<p class="muted-hint">Ingen tidligere udgaver endnu.</p>`
            : `<table class="admin-table">${histRes.data.map(h => `
                <tr>
                    <td>${new Date(h.changed_at).toLocaleString("da-DK")}<div class="admin-sub">udgaven før ${escapeHtml(h.changed_by || "ukendt")} gemte</div></td>
                    <td class="admin-check"><button class="btn btn-small" onclick="restoreRules(${Number(h.id)})">Gendan</button></td>
                </tr>`).join("")}</table>`;

    document.getElementById("modal-body").innerHTML = `
        <p class="muted-hint">Ændringerne gælder for alle spillere med det samme, når du trykker Gem. Andre spillere ser de nye tal i browseren, når de genindlæser siden. Den gamle udgave gemmes, så du altid kan gå tilbage.</p>
        <div class="admin-list rules-list">
            ${sections}
            <details class="rule-group">
                <summary>Tidligere udgaver (fortryd)</summary>
                ${hist}
            </details>
        </div>`;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal()">Luk</button>
        <button class="btn btn-gold" onclick="saveRules(this)">Gem regler</button>`;
};

function setAtPath(obj, path, value) {
    let o = obj;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
    o[path[path.length - 1]] = value;
}

window.saveRules = async function(btn) {
    if (!adminRules) return;
    const rules = structuredClone(adminRules);
    for (const el of document.querySelectorAll("#modal-body [data-path]")) {
        const path = JSON.parse(el.dataset.path);
        const type = el.dataset.type;
        let v;
        if (type === "boolean") v = el.checked;
        else if (type === "strings") v = el.value.split(",").map(s => s.trim()).filter(Boolean);
        else {
            v = Number(String(el.value).replace(",", "."));
            if (el.value === "" || !Number.isFinite(v)) {
                el.classList.add("rule-bad");
                el.closest("details")?.setAttribute("open", "");
                el.focus();
                showToast("Ugyldigt tal ved " + path.join(" → "));
                return;
            }
            if (type === "material") v = v > 0 ? { steel: v } : {};
            // km/t → m/s. Er tallet ikke rettet, beholdes det gamle præcist.
            if (type === "kmh") {
                const orig = Number(el.dataset.orig);
                v = Math.round(orig * 3.6 * 10) / 10 === v ? orig : v / 3.6;
            }
        }
        el.classList.remove("rule-bad");
        setAtPath(rules, path, v);
    }
    if (JSON.stringify(rules) === JSON.stringify(adminRules)) {
        showToast("Ingen ændringer at gemme.");
        return;
    }
    btn.disabled = true;
    const { error } = await sb.rpc("admin_set_rules", { p_rules: rules });
    btn.disabled = false;
    if (error) {
        showToast("Kunne ikke gemme: " + error.message);
        return;
    }
    showToast("Reglerne er gemt.");
    await syncAllFromSupabase();
    await openRulesModal();
};

window.restoreRules = async function(id) {
    if (!confirm("Sæt reglerne tilbage til denne udgave? Den nuværende gemmes i historikken.")) return;
    const { error } = await sb.rpc("admin_restore_rules", { p_id: id });
    if (error) {
        showToast("Kunne ikke gendanne: " + error.message);
        return;
    }
    showToast("Reglerne er gendannet.");
    await syncAllFromSupabase();
    await openRulesModal();
};

// ============================================================================
// Hjælpefunktioner & Login-håndtering
// ============================================================================
window.closeModal = function() {
    document.querySelector(".modal-box")?.classList.remove("modal-wide");
    state.groupModal = null;
    state.hospitalModal = null;
    document.getElementById("modal-overlay").classList.add("hidden");
    renderTroopsOnMap();
};

document.getElementById("modal-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
});

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
    updatePresence();
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
    await loadBattles();
    pollScoutAlerts();
    maybeSpawnNpcs();
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
    state.enemies = { buildings: [], garrisons: [], marches: [], npcs: [] };
    state.seenBySoldiers = new Set();
    state.inCombat = new Set();
    state.craters = [];
    state.fires = [];
    renderMapFires();
    exitMortarAim();
    renderScoutBanner();
    document.getElementById("auth-overlay").classList.remove("hidden");
};

document.getElementById("btn-sync").onclick = () => syncAllFromSupabase();
document.getElementById("btn-admin").onclick = () => openAdminModal();

// ============================================================================
// Oversigt: soldaten, bygningerne, våbnene og fjenderne med de tal, der gælder lige nu.
// Alle tal kommer fra config → rules (GAME_CONFIG.RULES), så de følger Admin → Regler.
// ============================================================================
function codexRule(key, fallback) {
    const v = Number(GAME_CONFIG.RULES?.[key]);
    return Number.isFinite(v) ? v : fallback;
}

function fmtNum(n) {
    return Number(n).toLocaleString("da-DK", { maximumFractionDigits: 2 });
}

function fmtPct(x) {
    return `${fmtNum(Math.round(x * 1000) / 10)} %`;
}

function fmtKmh(mps) {
    return `${fmtNum(Math.round(mps * 3.6 * 10) / 10)} km/t`;
}

function codexStats(rows) {
    return `<dl class="codex-stats">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function codexPrice(steps, steel) {
    const parts = [];
    if (steps > 0) parts.push(`<span class="codex-steps">${fmtNum(steps)} skridt</span>`);
    if (steel > 0) parts.push(`<span class="codex-steel">${fmtNum(steel)} stål</span>`);
    return parts.join(" + ") || "gratis";
}

// Hvad et bygningstrin giver (sengepladser, produktion, senge og heling).
function codexStageEffect(b, i) {
    const lines = [];
    if (b.housing) lines.push(`🛏 ${fmtNum(b.housing[i])} sengepladser`);
    if (b.production) {
        const mat = MATERIAL_NAMES[b.production.material] || b.production.material;
        lines.push(`⚙ ${fmtNum(b.production.per_hour[i])} ${mat}/time`);
        lines.push(`📦 lager ${fmtNum(b.production.capacity[i])}`);
    }
    if (b.beds) lines.push(`🩹 ${fmtNum(b.beds[i])} senge`);
    if (b.healPerHour) lines.push(`💚 ${fmtNum(b.healPerHour[i])} energi/time`);
    if (b.unlock) {
        const items = EQUIPMENT_ITEMS.map(([it]) => it).filter(it => factoryUnlockLevel(it) === i + 1);
        if (items.length) lines.push(`🔓 ${items.map(it => EQUIPMENT_NAMES[it]).join(", ")}`);
        lines.push(`🏷 ${Math.round(Number(b.discount?.[i] || 0) * 100)} % rabat`);
    }
    return lines.map(l => `<div>${l}</div>`).join("");
}

function codexSoldierHtml() {
    const C = GAME_CONFIG;
    const dmgMin = codexRule("hit_damage_min", 15), dmgMax = codexRule("hit_damage_max", 40);
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">🪖 Soldater</span><span class="codex-sum-sub">infanteri i brug + 5 kommende specialsoldater</span></summary>
            
            <p class="muted-hint" style="margin-bottom: 12px;">Infanteriet er i brug nu. De øvrige specialiserede soldaterroller er under forberedelse. De kan ikke uddannes endnu, men deres egenskaber, våben og taktiske roller i spillet er fastlagt herunder.</p>

            <div class="codex-grid codex-grid-3">
                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Infanteri (Riffelsoldat)</h3>
                        <span class="badge badge-green">I brug nu</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/figur.png" class="pixel-img" alt="Infanteri" /></div>
                    <p class="muted-hint">Spillets grundenhed. Soldater uddannes i militærskolen og bor i barrakkerne. De går i realistisk tempo, ser fjender omkring sig og skyder automatisk, når fjenden er inden for skudafstand. Sårede soldater heles i felthospitalet.</p>
                    ${codexStats([
                        ["Rolle", "Grundenhed"],
                        ["Energi", `${fmtNum(C.SOLDIER_HP)}`],
                        ["Gå-fart", `${fmtKmh(C.SOLDIER_SPEED_MPS)} (${fmtNum(C.SOLDIER_SPEED_MPS)} m/s)`],
                        ["Udsyn", formatDistance(C.SOLDIER_VISION_M)],
                        ["Rækkevidde", "100 m (Gevær M/95)"],
                        ["Skade", `${fmtNum(dmgMin)}–${fmtNum(dmgMax)} (${fmtPct(codexRule("hit_kill_chance", 0.05))} øjeblikkelig død)`],
                        ["Uddannes straks for", codexPrice(C.INSTANT_SOLDIER_STEPS, 0)],
                        ["Bliver én vagtstyrke inden for", formatDistance(C.GARRISON_MERGE_M)]
                    ])}
                </div>

                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Snigskytte</h3>
                        <span class="badge badge-pending">Kommer senere</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/snigskytte.png" class="pixel-img" alt="Snigskytte" /></div>
                    <p class="muted-hint">Holder en lang præcisionsriffel i hænderne med et stort optisk kikkertsigte og tofod. Rækker dobbelt så langt som almindeligt infanteri og ses først på klos hold. Ideel til at udtynde fjendtlige patruljer fra skjul.</p>
                    ${codexStats([
                        ["Rolle", "Langtrækkende snigmorder"],
                        ["Energi", "80"],
                        ["Gå-fart", "4,5 km/t (sniger sig)"],
                        ["Udsyn", "350 m (præcisionssigte)"],
                        ["Rækkevidde", "200 m (dobbelt af infanteri)"],
                        ["Skade", "35–60 (20 % øjeblikkelig død)"],
                        ["Skjul", "Synlig for fjenden under 100 m"],
                        ["Forventet pris", codexPrice(2500, 50)]
                    ])}
                </div>

                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Panserværnssoldat</h3>
                        <span class="badge badge-pending">Kommer senere</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/panservaern.png" class="pixel-img" alt="Panserværnssoldat" /></div>
                    <p class="muted-hint">Står med en stor bazooka på skulderen klar til skud, iført beskyttelsesbriller og pansret udrustning. Knuser lastbiler, pansrede mål og bygninger, men taber i nærkamp mod hurtigt infanteri.</p>
                    ${codexStats([
                        ["Rolle", "Køretøjs- & bygningsknuser"],
                        ["Energi", "110 (pansret vest & hjelm)"],
                        ["Gå-fart", "3,8 km/t (tung last)"],
                        ["Udsyn", "200 m"],
                        ["Rækkevidde", "120 m"],
                        ["Mod køretøjer/bygninger", "150–250 skade"],
                        ["Mod infanteri", "15–25 skade (langsom genladning)"],
                        ["Forventet pris", codexPrice(2000, 100)]
                    ])}
                </div>

                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Spejder</h3>
                        <span class="badge badge-pending">Kommer senere</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/spejder.png" class="pixel-img" alt="Spejder" /></div>
                    <p class="muted-hint">Let og lynhurtig rekognosceringssoldat i boonie hat med militærkikkert og håndleds-GPS. Ser over dobbelt så langt som andre soldater og fungerer som fremskudt lyttepost for basen.</p>
                    ${codexStats([
                        ["Rolle", "Hurtigt udsyn & lyttepost"],
                        ["Energi", "75 (let udrustning)"],
                        ["Gå-fart", "7,0 km/t (hurtig march)"],
                        ["Udsyn", "600 m (ekstrem rækkevidde)"],
                        ["Rækkevidde", "50 m (selvforsvar)"],
                        ["Skade", "10–20"],
                        ["Speciale", "Afslører miner & snigskytter"],
                        ["Forventet pris", codexPrice(1500, 10)]
                    ])}
                </div>

                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Sanitetssoldat</h3>
                        <span class="badge badge-pending">Kommer senere</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/sanitet.png" class="pixel-img" alt="Sanitetssoldat" /></div>
                    <p class="muted-hint">Feltlæge med Røde Kors på hjelm og armbind. Heler sårede soldater direkte ude i felten under march eller vagttjeneste, så gruppen kan kæmpe videre uden at skulle tilbage til felthospitalet.</p>
                    ${codexStats([
                        ["Rolle", "Mobil heling i felten"],
                        ["Energi", "90"],
                        ["Gå-fart", "5,0 km/t"],
                        ["Udsyn", "250 m"],
                        ["Felt-heling", "25 energi/minut til delingen"],
                        ["Rækkevidde", "80 m (let selvforsvar)"],
                        ["Skade", "15–30"],
                        ["Forventet pris", codexPrice(2000, 40)]
                    ])}
                </div>

                <div class="codex-card">
                    <div class="codex-card-head">
                        <h3>Ingeniør</h3>
                        <span class="badge badge-pending">Kommer senere</span>
                    </div>
                    <div class="codex-soldier-img"><img src="assets/ingenioer.png" class="pixel-img" alt="Ingeniør" /></div>
                    <p class="muted-hint">Pionersoldat med feltskovl, pansermine og værktøjsbælte. Kan udlægge og fjerne minefelter, etablere pigtrådsspærringer, reparere køretøjer og slukke brændende bygninger på en tredjedel af tiden.</p>
                    ${codexStats([
                        ["Rolle", "Pioner, miner & brandslukning"],
                        ["Energi", "100"],
                        ["Gå-fart", "4,5 km/t"],
                        ["Udsyn", "250 m"],
                        ["Brandslukning", "Slukker brande 3x hurtigere"],
                        ["Speciale", "Miner, pigtråd & reparation"],
                        ["Skade", "15–35 (+ sprængladninger)"],
                        ["Forventet pris", codexPrice(2200, 80)]
                    ])}
                </div>
            </div>
        </details>`;
}

function codexBuildingsHtml() {
    const cards = Object.values(GAME_CONFIG.BUILDINGS).map(b => `
        <div class="codex-card">
            <div class="codex-card-head">
                <h3>${escapeHtml(b.name)}</h3>
                <span class="badge">${fmtNum(b.size)} × ${fmtNum(b.size)} m</span>
            </div>
            <p class="muted-hint">${escapeHtml(b.desc)}</p>
            <div class="codex-stages">
                ${b.stages.map((stage, i) => `
                    <div class="codex-stage">
                        <div class="codex-stage-img"><img src="assets/${b.sprites[i]}.png" class="pixel-img" alt="" /></div>
                        <div class="codex-stage-name">Trin ${i + 1}: ${escapeHtml(stage)}</div>
                        <div class="codex-stage-price">${codexPrice(b.prices?.[i] || 0, b.materials?.[i]?.steel || 0)}</div>
                        <div class="codex-stage-effect">${codexStageEffect(b, i)}</div>
                    </div>`).join("")}
            </div>
        </div>`).join("");
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">🏰 Bygninger</span><span class="codex-sum-sub">${Object.keys(GAME_CONFIG.BUILDINGS).length} bygninger med 5 trin hver: priser og hvad de giver</span></summary>
            <p class="muted-hint">Priserne gælder for at bygge eller opgradere til trinnet. En ny bygning skal stå i et byggepladsbogmærke fra telefonen eller højst ${formatDistance(GAME_CONFIG.BUILD_CHAIN_M)} fra en af dine egne, og mindst ${formatDistance(GAME_CONFIG.BUILDING_GAP_M)} fra andre bygninger. Når fjenden angriber en bygning, forsvarer den sig som ${fmtNum(GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL)} ekstra soldater pr. trin.</p>
            <div class="codex-grid">${cards}</div>
        </details>`;
}

function codexWeaponsHtml() {
    const C = GAME_CONFIG, M = C.MORTAR, H = C.HOWITZER;
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">🔫 Våben</span><span class="codex-sum-sub">gevær, let morter, haubits og deres granater</span></summary>
            <div class="codex-grid codex-grid-3">
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Gevær</h3><span class="badge">alle soldater</span></div>
                    <div class="codex-weapon-img"><img src="assets/gevaer.png" class="pixel-img" alt="Gevær" /></div>
                    <p class="muted-hint">Hver soldat har et gevær. Skud udveksles automatisk, når fjenden er inden for skudafstand.</p>
                    ${codexStats([
                        ["Skudafstand", formatDistance(C.FIRE_RANGE_M)],
                        ["Tid pr. skudrunde", `${fmtNum(codexRule("fire_round_s", 5))} s`],
                        ["Chance for at ramme", `${fmtPct(codexRule("hit_chance_near", 0.3))} tæt på → ${fmtPct(codexRule("hit_chance_far", 0.1))} ved ${formatDistance(C.FIRE_RANGE_M)}`],
                        ["Skade pr. træffer", `${fmtNum(codexRule("hit_damage_min", 15))}–${fmtNum(codexRule("hit_damage_max", 40))} energi`]
                    ])}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Let morter</h3><span class="badge">${buyWhere("mortars")}</span></div>
                    <div class="codex-weapon-img"><img src="assets/morter.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Bæres af soldaterne og skyder, når de står vagt. Granaterne lander et sted inde i spredningscirklen.</p>
                    ${codexStats([
                        ["Pris", codexPrice(M.priceSteps, M.priceSteel)],
                        ["Betjenes af", `${fmtNum(M.crew)} soldater`],
                        ["Rækkevidde", `${formatDistance(M.minRangeM)} – ${formatDistance(M.rangeM)}`],
                        ["Spredning", `${formatDistance(M.spreadBaseM)} + ${fmtPct(M.spreadPct)} af afstanden`],
                        ["Granatsplinter", `op til ${formatDistance(M.blastM)} fra nedslaget`],
                        ["Træffere midt i nedslaget", `${fmtNum(codexRule("mortar_hits", 4))} (færre længere ude)`],
                        ["Ladetid", `${fmtNum(M.reloadS)} s`],
                        ["Flest granater pr. ordre", fmtNum(M.salvoMax)],
                        ["Flyvetid", `${fmtNum(M.flightBaseS)} s + afstand / ${fmtNum(M.flightMps)} m/s`]
                    ])}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Mortergranat</h3><span class="badge">${buyWhere("mortar_shells")}</span></div>
                    <div class="codex-weapon-img"><img src="assets/granat.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Ammunition til morteren. Soldaterne bærer granaterne med ud, og et krater kan ses i ${fmtNum(M.craterHours)} timer. Lander en granat i en af kortets brune bygninger, går den i brand med ${fmtNum(Math.round(GAME_CONFIG.MAP_FIRE.chance * 100))} % chance: den brænder i ${fmtNum(GAME_CONFIG.MAP_FIRE.fireHours)} timer og står derefter som udbrændt ruin i ${fmtNum(GAME_CONFIG.MAP_FIRE.ruinHours)} timer.</p>
                    ${codexStats([
                        ["Pris", codexPrice(M.shellSteps, M.shellSteel)]
                    ])}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Haubits</h3><span class="badge">${buyWhere("howitzers")}</span></div>
                    <div class="codex-weapon-img"><img src="assets/haubits.png" class="pixel-img" alt="Haubits" /></div>
                    <p class="muted-hint">Tungt feltartilleri, der står ved barrakken og skyder derfra. Vælg barrakken og tryk <em>Skyd med haubits</em>. Granaterne lander et sted inde i spredningscirklen og kan også ramme dine egne soldater.</p>
                    ${codexStats([
                        ["Pris", codexPrice(H.priceSteps, H.priceSteel)],
                        ["Betjenes af", `${fmtNum(H.crew)} ledige soldater i barrakken`],
                        ["Rækkevidde", `${formatDistance(H.minRangeM)} – ${formatDistance(H.rangeM)}`],
                        ["Spredning", `${formatDistance(H.spreadBaseM)} + ${fmtPct(H.spreadPct)} af afstanden`],
                        ["Granatsplinter", `op til ${formatDistance(H.blastM)} fra nedslaget`],
                        ["Træffere midt i nedslaget", `${fmtNum(H.hits)} (færre længere ude)`],
                        ["Ladetid", `${fmtNum(H.reloadS)} s`],
                        ["Flest granater pr. ordre", fmtNum(H.salvoMax)],
                        ["Flyvetid", `${fmtNum(H.flightBaseS)} s + afstand / ${fmtNum(H.flightMps)} m/s`]
                    ])}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Haubitsgranat</h3><span class="badge">${buyWhere("howitzer_shells")}</span></div>
                    <div class="codex-weapon-img"><img src="assets/haubitsgranat.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Ammunition til haubitsen. Granaterne ligger på lager ved barrakken. Krateret er dobbelt så stort som mortergranatens, og granaten kan også sætte kortets brune bygninger i brand.</p>
                    ${codexStats([
                        ["Pris", codexPrice(H.shellSteps, H.shellSteel)]
                    ])}
                </div>
            </div>
        </details>`;
}

function codexVehiclesHtml() {
    const T = GAME_CONFIG.TRUCK;
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">🚚 Køretøjer</span><span class="codex-sum-sub">lastbil til troppetransport</span></summary>
            <div class="codex-grid codex-grid-3">
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Lastbil</h3><span class="badge">${buyWhere("trucks")}</span></div>
                    <div class="codex-weapon-img"><img src="assets/lastbil.png" class="pixel-img" alt="Lastbil" /></div>
                    <p class="muted-hint">Grøn militærlastbil med presenning over ladet, hvor soldaterne sidder. Vælg lastbiler, når du sender soldater. Der skal mindst 1 soldat i hver lastbil for at køre den, og er der flere soldater, end der er plads til, går alle. Kommer den hjem til barrakken, bliver den repareret.</p>
                    ${codexStats([
                        ["Pris", codexPrice(T.priceSteps, T.priceSteel)],
                        ["Plads til", `${fmtNum(T.capacity)} soldater`],
                        ["Fart på vej", fmtKmh(T.roadMps)],
                        ["Fart uden for vejene", fmtKmh(T.fieldMps)],
                        ["Energi", fmtNum(T.hp)],
                        ["Træffere, der rammer lastbilen", fmtPct(T.hitShare)]
                    ])}
                    <p class="muted-hint">Ikke skudsikker: bliver den beskudt, kan både lastbilen og soldaterne på ladet blive ramt. Ved 0 energi bryder den i brand og kan ikke køre mere. Kan delingen ikke længere køre, stiger soldaterne af og står vagt, hvor de er. Lastbiler kan ikke gå patrulje endnu.</p>
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Udbrændt lastbil</h3><span class="badge">vrag</span></div>
                    <div class="codex-weapon-img"><img src="assets/lastbil_vrag.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Sådan ser en lastbil ud, når den er skudt i brand. Vraget kan ses af alle i ${fmtNum(T.wreckHours)} timer.</p>
                </div>
            </div>
        </details>`;
}

// Den svenske hær: sammensætningen efter reglerne (sweden_*).
function codexSwedenCardHtml() {
    const r = k => codexRule(k, 0);
    const cap = Math.max(codexRule("truck_capacity", 22), 1);
    const hq = r("sweden_hq_size");
    // [antal enheder, soldater, lastbiler, morterer, haubitser] pr. enhed
    const units = [
        hq > 0 ? [1, hq, Math.ceil(hq / cap), 0, 0] : null,
        [r("sweden_motor_groups"), r("sweden_motor_size"), r("sweden_motor_trucks"), 0, 0],
        [r("sweden_infantry_groups"), r("sweden_infantry_size"), 0, 0, 0],
        [r("sweden_mortar_groups"), r("sweden_mortar_size"), 0, r("sweden_mortar_mortars"), 0],
        [r("sweden_artillery_groups"), r("sweden_artillery_size"), r("sweden_artillery_howitzers"), 0, r("sweden_artillery_howitzers")]
    ].filter(Boolean);
    const sum = i => units.reduce((a, u) => a + u[0] * u[i], 0);
    const groups = units.reduce((a, u) => a + u[0], 0);
    return `
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Den svenske hær</h3><span class="badge">invasion</span></div>
                    <div class="codex-weapon-img"><img src="assets/lastbil_haubits.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Angriber over Øresundsbroen fra Lernacken på den svenske side med samme våben og køretøjer som dig. Fodfolket går, køretøjerne kører med lastbilens fart. Ved målet patruljerer infanteriet, mens stab, morterer og haubitser går i stilling og skyder på de af dine soldater, som hæren kan se (${formatDistance(codexRule("npc_vision_m", 250))}). De skyder ikke, hvis deres egne står i farezonen, og granaterne slipper op.</p>
                    ${codexStats([
                        ["Soldater i alt", `${fmtNum(sum(1))} i ${fmtNum(groups)} enheder`],
                        ["Stab", hq > 0 ? `${fmtNum(hq)} soldater i lastbil` : "ingen"],
                        ["Motoriserede kompagnier", `${fmtNum(r("sweden_motor_groups"))} × ${fmtNum(r("sweden_motor_size"))} soldater, ${fmtNum(r("sweden_motor_trucks"))} lastbiler`],
                        ["Infanterikompagnier", `${fmtNum(r("sweden_infantry_groups"))} × ${fmtNum(r("sweden_infantry_size"))} soldater til fods`],
                        ["Morterdelinger", `${fmtNum(r("sweden_mortar_groups"))} × ${fmtNum(r("sweden_mortar_size"))} soldater, ${fmtNum(r("sweden_mortar_mortars"))} morterer, ${fmtNum(r("sweden_mortar_shells"))} granater`],
                        ["Haubitsbatterier", `${fmtNum(r("sweden_artillery_groups"))} × ${fmtNum(r("sweden_artillery_size"))} soldater, ${fmtNum(r("sweden_artillery_howitzers"))} haubitser på slæb, ${fmtNum(r("sweden_artillery_shells"))} granater`],
                        ["Udstyr i alt", `${fmtNum(sum(2))} lastbiler, ${fmtNum(sum(3))} morterer, ${fmtNum(sum(4))} haubitser`]
                    ])}
                </div>`;
}

function codexEnemiesHtml() {
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">☠ Fjender</span><span class="codex-sum-sub">patruljer, den svenske hær og andre spillere</span></summary>
            <div class="codex-grid codex-grid-3">
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Fjendtlig patrulje</h3><span class="badge">computerstyret</span></div>
                    <div class="codex-weapon-img"><img src="assets/fjende.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Strejfer rundt omkring spillerne og angriber dine soldater, når de ser dem. Har gevær ligesom dine soldater.</p>
                    ${codexStats([
                        ["Soldater pr. patrulje", `${fmtNum(codexRule("npc_size_min", 3))}–${fmtNum(codexRule("npc_size_max", 12))}`],
                        ["Gå-fart på patrulje", fmtKmh(codexRule("npc_speed_mps", 1.2))],
                        ["Udsyn", formatDistance(codexRule("npc_vision_m", 250))],
                        ["Forfølger op til", `${formatDistance(codexRule("npc_chase_leash_m", 1500))} fra hjemstedet`]
                    ])}
                </div>
                ${codexSwedenCardHtml()}
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Andre spillere</h3><span class="badge">rød uniform</span></div>
                    <div class="codex-weapon-img"><img src="assets/fjende.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Andre spilleres soldater har samme tal som dine. Du ser dem kun inden for ${formatDistance(GAME_CONFIG.SOLDIER_VISION_M)} af dine soldater eller ${formatDistance(GAME_CONFIG.VISION_RADIUS_M)} af din telefon.</p>
                </div>
            </div>
        </details>`;
}

window.openCodex = function() {
    document.getElementById("codex-body").innerHTML =
        codexSoldierHtml() + codexBuildingsHtml() + codexWeaponsHtml() + codexVehiclesHtml() + codexEnemiesHtml();
    document.getElementById("codex-overlay").classList.remove("hidden");
    document.getElementById("codex-body").scrollTop = 0;
};

window.closeCodex = function() {
    document.getElementById("codex-overlay").classList.add("hidden");
};

document.getElementById("btn-codex").onclick = () => openCodex();
document.getElementById("codex-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "codex-overlay") closeCodex();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("codex-overlay").classList.contains("hidden")) closeCodex();
});
document.getElementById("btn-cancel-march-mode").onclick = () => exitMarchTargetMode();
document.getElementById("btn-cancel-mortar").onclick = () => exitMortarAim();
document.getElementById("btn-route-undo").onclick = () => {
    state.pendingMarchOrder?.waypoints.pop();
    renderRouteDraft();
};
document.getElementById("btn-route-go").onclick = () => finishRoute(false);
document.getElementById("btn-route-patrol").onclick = () => finishRoute(true);
document.getElementById("btn-jump-home").onclick = () => {
    if (state.myBuildings.length > 0) {
        const b = state.myBuildings[0];
        window.jumpToBuilding(b.id);
    } else {
        showToast("Ingen bygninger fundet endnu.");
    }
};

// Start kortet og 1-sekunds march-løkke
// ============================================================================
// Sammenfoldelige sektioner i sidepanelet (én åben ad gangen, huskes i browseren)
// ============================================================================
const OPEN_SECTION_KEY = "hf_open_section";

function openSidebarSection(key) {
    document.querySelectorAll(".panel-section.collapsible").forEach(sec => {
        const open = sec.dataset.section === key;
        sec.classList.toggle("collapsed", !open);
        sec.querySelector(".section-header")?.setAttribute("aria-expanded", String(open));
    });
    try { localStorage.setItem(OPEN_SECTION_KEY, key || ""); } catch (_) {}
}

function initCollapsibleSections() {
    document.querySelectorAll(".panel-section.collapsible").forEach(sec => {
        const header = sec.querySelector(".section-header");
        const toggle = () => openSidebarSection(sec.classList.contains("collapsed") ? sec.dataset.section : null);
        header.addEventListener("click", toggle);
        header.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
        });
    });
    let saved = "troops";
    try { saved = localStorage.getItem(OPEN_SECTION_KEY) ?? "troops"; } catch (_) {}
    openSidebarSection(saved);
}

// ============================================================================
// Synligt versionsnummer
// ============================================================================
// Viser APP_VERSION fra den game.js, browseren faktisk kører. Peger index.html på et andet
// nummer, er en af filerne en gammel udgave fra browserens lager — så bliver mærket orange.
function showAppVersion() {
    const src = document.querySelector('script[src*="game.js"]')?.getAttribute("src") || "";
    const pageVersion = Number(new URL(src, location.href).searchParams.get("v"));
    const stale = pageVersion && pageVersion !== APP_VERSION;
    document.querySelectorAll("[data-app-version]").forEach(el => {
        const short = el.classList.contains("app-version-badge");
        el.textContent = short ? `v${APP_VERSION}` : `version ${APP_VERSION}`;
        if (stale && short) {
            el.classList.add("stale");
            el.textContent = `v${APP_VERSION} ⟳`;   // kort, så toppen ikke skubbes
            el.title = `Siden er version ${pageVersion}, men spillet kører version ${APP_VERSION}. Klik for at genindlæse.`;
            el.onclick = () => location.reload();
        }
    });
}

showAppVersion();
initCollapsibleSections();
initMap();
checkAuthSession();
setInterval(() => {
    if (state.user) tickMarches();
}, 1000);
setInterval(pollScoutAlerts, GAME_CONFIG.SCOUT_POLL_MS);
setInterval(maybeSpawnNpcs, GAME_CONFIG.NPC_SPAWN_CHECK_MS);
setInterval(loadHospitals, 60000);
setInterval(async () => {
    if (!state.user) return;
    await pollWorld();
    await loadReports();
}, GAME_CONFIG.WORLD_POLL_MS);
setInterval(loadBattles, 60000);

// Spillere online: meld dig hvert halve minut og hent antallet.
async function updatePresence() {
    if (!state.user) return;
    await sb.rpc("touch_presence");
    const { data, error } = await sb.rpc("online_players");
    const pill = document.querySelector(".online-pill");
    const el = document.getElementById("hud-online");
    if (error || typeof data !== "number") {
        pill?.classList.add("offline");
        return;
    }
    pill?.classList.remove("offline");
    el.textContent = data === 1 ? "1 spiller" : `${data} spillere`;
}
setInterval(updatePresence, 30000);
