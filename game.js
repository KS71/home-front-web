// ============================================================================
// HOME FRONT — Command Center (PC Browser-udgave koblet på Supabase)
// ============================================================================

// Hjemmesidens versionsnummer. Hæves sammen med ?v=… i index.html, hver gang web/ ændres.
const APP_VERSION = 130;

// Fra zoom 16 skifter kortet fra store overbliks-ikoner til små gadesoldater og køretøjer i formation
const STREET_TACTICAL_ZOOM = 16;

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
    FIRE_RANGE_M: 75,        // skudafstand mellem soldater og fjender (patruljer og andre spillere)
    FIRE_CLOSE_M: 60,        // nærkamp: så tæt på skydes der altid, også uden fri skudlinje
    SOLDIER_HP: 100,         // energi pr. soldat
    NPC_SPAWN_CHECK_MS: 5 * 60 * 1000, // så tit browseren ser efter, om der mangler patruljer
    WORLD_POLL_MS: 15000,
    CRATER_POLL_MS: 5000,      // granater i luften: så allierede når at se skuddet
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
        wreckHours: 24,                        // så længe et udbrændt vrag kan ses
        boardM: 50                             // så tæt skal soldaterne stå for at stige på (0038)
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
            name: "Barrak",
            shortName: "barrak",
            desc: "Giver sengepladser til dine soldater: 100 på trin 1 og op til 1.000 på trin 5.",
            stages: ["Barrak", "Barrak", "Barrak", "Barrak", "Barrak"],
            sprites: ["barrak_1", "barrak_2", "barrak_3", "barrak_4", "barrak_5"],
            prices: [500, 600, 700, 800, 900],
            materials: [{}, {}, {}, {}, {}],
            housing: [100, 250, 450, 700, 1000],
            size: 30
        },
        academy: {
            id: "academy",
            name: "Militærskole",
            shortName: "militærskole",
            desc: "Uddanner nye soldater over tid — og lader dig straks-uddanne soldater for skridt.",
            stages: ["Militærskole", "Militærskole", "Militærskole", "Militærskole", "Militærskole"],
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
            name: "Felthospital",
            shortName: "felthospital",
            desc: "Heler sårede soldater lidt efter lidt. Uden hospital kan sårede ikke heles.",
            stages: ["Felthospital", "Felthospital", "Felthospital", "Felthospital", "Felthospital"],
            sprites: ["hospital_1", "hospital_2", "hospital_3", "hospital_4", "hospital_5"],
            prices: [400, 700, 1200, 2000, 3200],
            materials: [{}, {}, {}, { steel: 10 }, { steel: 30 }],
            beds: [10, 25, 50, 100, 200],
            healPerHour: [20, 25, 30, 40, 50],
            size: 30
        },
        steel_mill: {
            id: "steel_mill",
            name: "Stålværk",
            shortName: "stålværk",
            desc: "Producerer stål løbende, som du henter, når du vil. Stål bruges til at opgradere andre bygninger.",
            stages: ["Stålværk", "Stålværk", "Stålværk", "Stålværk", "Stålværk"],
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
            name: "Våbenfabrik",
            shortName: "våbenfabrik",
            desc: "Sælger våben, granater og køretøjer. Højere trin låser op for tungere udstyr og giver rabat. Udstyret står på lager i barrakken.",
            stages: ["Våbenfabrik", "Våbenfabrik", "Våbenfabrik", "Våbenfabrik", "Våbenfabrik"],
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
    parkedTrucks: [],      // tomme lastbiler, soldaterne er steget af (0038): { id, lat, lon, trucks }
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
    allies: { players: [], buildings: [], garrisons: [], marches: [] }, // allierede (0040), altid synlige
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
// Allierede (0040): hver ven har sin egen farve. Dine egne er altid grønne, fjender røde.
const ALLY_COLORS = ["#B388FF", "#FFD54F", "#18FFFF", "#FF80AB", "#FFFFFF", "#FFAB40"];

function allyInfo(ownerId) {
    return state.allies.players.find(p => p.id === ownerId) || null;
}

function allyColor(ownerId) {
    const p = allyInfo(ownerId);
    return ALLY_COLORS[(p ? p.idx : 0) % ALLY_COLORS.length];
}

function allyName(ownerId) {
    return allyInfo(ownerId)?.name || "en allieret";
}

function isAlly(ownerId) {
    return !!ownerId && ownerId !== state.user?.id && !!allyInfo(ownerId);
}

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
    const [mRes, gRes, pRes] = await Promise.all([
        // "*", så siden også virker, før databasen har fået kolonnen wounded (0011).
        sb.from("marches").select("*"),
        sb.from("garrisons").select("*"),
        sb.from("parked_trucks").select("*")
    ]);
    if (mRes.data) state.marches = mRes.data.map(marchFromRow);
    if (gRes.data) state.garrisons = gRes.data;
    if (pRes.data) state.parkedTrucks = pRes.data;
    await loadNamedSoldiers();
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
const PIXEL_TEXTURE_LIST = [
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
    ["img-roof-red", "assets/tag_roed.png", 1],
    ["img-roof-darkred", "assets/tag_moerkroed.png", 1],
    ["img-roof-yellow", "assets/tag_gul.png", 1],
    ["img-roof-brown", "assets/tag_brun.png", 1],
    ["img-roof-grey", "assets/tag_graa.png", 1],
    ["img-roof-flat", "assets/tag_flad.png", 1],
    ["img-wall-light", "assets/mur_lys.png", 2],
    ["img-wall-grey", "assets/mur_graa.png", 2],
    ["img-wood-floor", "assets/land_skovbund.png", 2],
    ["img-tree-1", "assets/trae_1.png", 2],
    ["img-tree-2", "assets/trae_2.png", 2],
    ["img-tree-3", "assets/trae_3.png", 2],
    ["img-pine-1", "assets/gran_1.png", 2],
    ["img-pine-2", "assets/gran_2.png", 2],
    ["img-bush-1", "assets/busk_1.png", 2],
    ["img-bush-2", "assets/busk_2.png", 2],
    ["img-chimney", "assets/skorsten.png", 2],
    ["img-road-cobble", "assets/vej_brosten.png", 1],
    ["img-road-cobble-light", "assets/vej_brosten_lys.png", 1],
    ["img-road-gravel", "assets/vej_grus.png", 1],
    ["img-road-path", "assets/vej_sti.png", 1],
    ["img-crater", "assets/krater.png", 2],
    ["img-wreck", "assets/lastbil_vrag.png", 2],
    ["img-parked-truck", "assets/lastbil.png", 2],
    ["img-parked-truck-h", "assets/lastbil_haubits.png", 2],
    ["img-flame-0", "assets/flamme_1.png", 2],
    ["img-flame-1", "assets/flamme_2.png", 2],
    ["img-flame-2", "assets/flamme_3.png", 2],
    ["img-ruin", "assets/ruin.png", 2],
    ["img-ruin-glow", "assets/ruin_glod.png", 2],
    ["img-shell", "assets/granat.png", 1]
];

let pixelTexturesPromise = null;

function preloadPixelTextures() {
    if (!pixelTexturesPromise) {
        pixelTexturesPromise = Promise.all(
            PIXEL_TEXTURE_LIST.map(([id, url, scale]) =>
                loadPixelTexture(url, scale).then(tex => [id, tex])
            )
        );
    }
    return pixelTexturesPromise;
}

function getInitialMapView() {
    try {
        const raw = localStorage.getItem("hf_start_pos");
        if (raw) {
            const p = JSON.parse(raw);
            if (typeof p?.lon === "number" && typeof p?.lat === "number") {
                return { center: [p.lon, p.lat], zoom: 16.5 };
            }
        }
    } catch (_) {}
    return { center: [12.43, 55.65], zoom: 16.2 };
}

function initMap() {
    // Start hentning af alle 66 pixel-teksturer parallelt med det samme (i stedet for én ad gangen efter 'load')
    preloadPixelTextures();
    const startView = getInitialMapView();

    map = new maplibregl.Map({
        container: "map",
        style: STYLE_URL,
        center: startView.center,
        zoom: startView.zoom,
        pitchWithRotate: false,
        dragRotate: false
    });

    // 'style.load' kører straks stil-JSON er hentet — FØR første hvide Positron-frame tegnes på skærmen!
    map.once("style.load", async () => {
        // Sæt grøn græs-baggrund, veje, fortove og bygninger synkront med det samme, så kortet aldrig blinker hvidt
        if (map.getLayer("background")) {
            map.setPaintProperty("background", "background-color", "#739e48");
        }
        if (map.getLayer("water")) {
            map.setPaintProperty("water", "fill-color", "#3f7fb5");
        }
        styleWorldLikeGame();
        styleBuildingsLikeGame();
        installHouseLayer();

        await installPixelLandscape();
        installGameLayers();
        mapReady = true;
        refreshLandscape3D(true);
        renderBookmarksOnMap();
        renderBattlesOnMap();
        refreshViewportData();
        renderTroopsOnMap();
    });

    // Indeksér nye z14-vektorfliser straks når de ankommer, så 3D-bygninger og træer
    // tegnes med det samme uden at vente på 'idle'.
    map.on("sourcedata", (e) => {
        if (!mapReady || e.sourceId !== "openmaptiles") return;
        if (e.tile || e.isSourceLoaded) scheduleLandscapeTileSync();
    });

    map.on("move", () => {
        waterCache.clear();
        if (mapReady) onMapMoveLandscape3D();
    });

    map.on("moveend", () => {
        if (!mapReady) return;
        refreshLandscape3D(false);
        refreshViewportData();
        loadCratersSoon();
    });

    // Når kortet er færdigt med at tegne, ses der efter kratere i kortets bygninger.
    map.on("idle", () => {
        if (!mapReady) return;
        checkCraterFires();
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
        // Versionsnummeret på adressen sikrer, at browseren henter nye teksturer efter en opdatering.
        img.src = url + "?v=" + APP_VERSION;
    });
}

async function installPixelLandscape() {
    const loaded = await preloadPixelTextures();
    for (let i = 0; i < loaded.length; i++) {
        const [id, tex] = loaded[i];
        if (tex && !map.hasImage(id)) {
            map.addImage(id, tex);
        }
    }

    if (map.getLayer("background") && map.hasImage("img-ground")) {
        map.setPaintProperty("background", "background-pattern", "img-ground");
    }
    installTreeLayer();

    const beforeLayer = map.getLayer("waterway") ? "waterway" : undefined;
    const surfaces = [
        // Marker: ensfarvet pløjejord langt væk, afgrøderækker tæt på (ellers bliver det striber).
        { id: "land-farm", sourceLayer: "landcover", filter: ["==", ["get", "class"], "farmland"], pattern: ["step", ["zoom"], "img-farm-1", 14, "img-farm-0"] },
        { id: "land-park", sourceLayer: "park", filter: null, pattern: "img-grass" },
        { id: "land-grass", sourceLayer: "landcover", filter: ["==", ["get", "class"], "grass"], pattern: "img-grass" },
        // Skov: trækrone-tekstur langt væk, skovbund med rigtige træer (sprites) tæt på.
        { id: "land-wood", sourceLayer: "landcover", filter: ["==", ["get", "class"], "wood"], pattern: ["step", ["zoom"], "img-wood", TREE_MIN_ZOOM, "img-wood-floor"] },
        // Villakvarterer ligger over 'land-wood', så bebyggede haveforeninger/villakvarterer med OSM-'wood' får lys græsplæne.
        { id: "land-town", sourceLayer: "landuse", filter: ["==", ["get", "class"], "residential"], pattern: "img-town" },
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
    installShoresAndHedges(beforeLayer);
}

// Kyster: en sandstribe uden for vandkanten og lavt, lysere vand inden for. Marker får en hæk
// langs kanten. (line-offset: positiv = ind i fladen, negativ = ud af fladen.)
function installShoresAndHedges(beforeLayer) {
    const isPoly = ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false];
    const w = ["interpolate", ["exponential", 1.5], ["zoom"], 13, 1.2, 15, 3, 17, 7, 19, 14];
    const half = ["interpolate", ["exponential", 1.5], ["zoom"], 13, 0.6, 15, 1.5, 17, 3.5, 19, 7];
    const negHalf = ["interpolate", ["exponential", 1.5], ["zoom"], 13, -0.6, 15, -1.5, 17, -3.5, 19, -7];
    if (!map.getLayer("hf-shore-sand")) {
        map.addLayer({
            id: "hf-shore-sand", type: "line", source: "openmaptiles", "source-layer": "water", minzoom: 13,
            filter: ["all", isPoly, ["!=", ["get", "brunnel"], "tunnel"]],
            layout: { "line-join": "round" },
            paint: { "line-color": "#dccb93", "line-width": w, "line-offset": negHalf }
        }, beforeLayer);
    }
    if (!map.getLayer("hf-shore-shallow")) {
        map.addLayer({
            id: "hf-shore-shallow", type: "line", source: "openmaptiles", "source-layer": "water", minzoom: 13,
            filter: ["all", isPoly, ["!=", ["get", "brunnel"], "tunnel"]],
            layout: { "line-join": "round" },
            paint: { "line-color": "#6aa6d8", "line-width": w, "line-offset": half, "line-opacity": 0.85 }
        }, beforeLayer);
    }
    if (!map.getLayer("hf-field-hedge")) {
        map.addLayer({
            id: "hf-field-hedge", type: "line", source: "openmaptiles", "source-layer": "landcover", minzoom: 14,
            filter: ["all", isPoly, ["==", ["get", "class"], "farmland"]],
            layout: { "line-join": "round" },
            paint: { "line-color": "#3d6b31", "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 14, 1, 16, 2.5, 19, 7],
                     "line-offset": ["interpolate", ["exponential", 1.5], ["zoom"], 14, 0.5, 16, 1.25, 19, 3.5] }
        }, beforeLayer);
    }
}

// Gør kortgrundlaget mindre "Google Maps" og mere computerspil: grænser, togbaner, vejnavne og
// ruteskilte slukkes, vejene bliver asfalt med mørk kant (motorveje får gul midterstribe), og
// kun by-, bydels- og landsbynavne bliver stående, skrevet i spillets stil.
const MAP_HIDDEN_LAYERS = [
    "boundary_2", "boundary_3", "boundary_disputed",
    "railway", "railway_dashline", "railway_service", "railway_service_dashline",
    "railway_transit", "railway_transit_dashline",
    "aeroway-taxiway", "aeroway-runway-casing", "aeroway-area", "aeroway-runway", "airport",
    "highway-name-path", "highway-name-minor", "highway-name-major",
    "highway-shield-non-us", "highway-shield-us-interstate", "road_shield_us",
    "waterway_line_label", "water_name_point_label", "water_name_line_label",
    "label_other", "label_state", "label_country_1", "label_country_2", "label_country_3",
    "landcover_ice_shelf", "landcover_glacier"
];

const ROAD_ASPHALT = "#6e676a";
const ROAD_ASPHALT_LIGHT = "#7b7376";
const ROAD_EDGE = "#434047";
const SIDEWALK_FILL = "#e8e1d5";
const SIDEWALK_EDGE = "#343843";
const ROAD_STRIPE = "#eae3d8";
const ROAD_DIRT = "#c6b79c";

function styleWorldLikeGame() {
    for (const id of MAP_HIDDEN_LAYERS) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
    }

    const setPaint = (id, props) => {
        if (!map.getLayer(id)) return;
        for (const [k, v] of Object.entries(props)) map.setPaintProperty(id, k, v);
    };
    const setLayout = (id, props) => {
        if (!map.getLayer(id)) return;
        for (const [k, v] of Object.entries(props)) map.setLayoutProperty(id, k, v);
    };

    const roadLineFilter = ["all",
        ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
        ["!=", ["get", "brunnel"], "tunnel"],
        ["match", ["get", "class"], ["minor", "service", "primary", "secondary", "tertiary", "trunk"], true, false]
    ];

    // Fortove (lys stenbelægning med mørk yderkant mod græsset og mørk kantsten mod asfalten)
    if (map.getLayer("highway_minor") && !map.getLayer("hf-sidewalk-edge")) {
        map.addLayer({
            id: "hf-sidewalk-edge",
            type: "line",
            source: "openmaptiles",
            "source-layer": "transportation",
            minzoom: 14,
            filter: roadLineFilter,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": SIDEWALK_EDGE,
                "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 14, 4.8, 16, 13.8, 18, 37, 20, 98]
            }
        }, "highway_minor");
    }
    if (map.getLayer("highway_minor") && !map.getLayer("hf-sidewalk-fill")) {
        map.addLayer({
            id: "hf-sidewalk-fill",
            type: "line",
            source: "openmaptiles",
            "source-layer": "transportation",
            minzoom: 14,
            filter: roadLineFilter,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": SIDEWALK_FILL,
                "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 14, 3.8, 16, 11.4, 18, 31.5, 20, 84]
            }
        }, "highway_minor");
    }
    if (map.getLayer("highway_minor") && !map.getLayer("hf-minor-casing")) {
        map.addLayer({
            id: "hf-minor-casing",
            type: "line",
            source: "openmaptiles",
            "source-layer": "transportation",
            minzoom: 13,
            filter: roadLineFilter,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": ROAD_EDGE,
                "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 13, 2.2, 14, 2.9, 16, 8.2, 18, 22.8, 20, 62]
            }
        }, "highway_minor");
    }

    // Glat, varm grå asfalt (uden brostensmønster) og tydelig bredde på villaveje
    setPaint("highway_motorway_casing", { "line-color": ROAD_EDGE, "line-dasharray": [1, 0] });
    setPaint("highway_motorway_inner", { "line-color": ROAD_ASPHALT });
    setPaint("highway_motorway_bridge_casing", { "line-color": ROAD_EDGE });
    setPaint("highway_motorway_bridge_inner", { "line-color": ROAD_ASPHALT });
    setPaint("tunnel_motorway_casing", { "line-color": ROAD_EDGE, "line-opacity": 0.35 });
    setPaint("tunnel_motorway_inner", { "line-color": ROAD_ASPHALT, "line-opacity": 0.35 });
    setPaint("highway_motorway_subtle", { "line-color": ROAD_ASPHALT });
    setPaint("highway_major_casing", { "line-color": ROAD_EDGE, "line-dasharray": [1, 0] });
    setPaint("highway_major_inner", { "line-color": ROAD_ASPHALT });
    setPaint("highway_major_subtle", { "line-color": ROAD_ASPHALT });
    setPaint("highway_minor", {
        "line-color": ROAD_ASPHALT_LIGHT,
        "line-opacity": 1,
        "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 13, 1.4, 14, 2.1, 16, 6.8, 18, 19.6, 20, 54]
    });
    if (map.getLayer("highway_path") && !map.getLayer("hf-path-casing")) {
        map.addLayer({
            id: "hf-path-casing",
            type: "line",
            source: "openmaptiles",
            "source-layer": "transportation",
            minzoom: 14,
            filter: ["all",
                ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
                ["!=", ["get", "brunnel"], "tunnel"],
                ["==", ["get", "class"], "path"]
            ],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": "#584f42",
                "line-opacity": 0.85,
                "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 14, 2.0, 16, 3.8, 18, 7.6, 20, 15]
            }
        }, "highway_path");
    }
    setPaint("highway_path", {
        "line-color": "#d4c4a6",
        "line-opacity": 0.95,
        "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 14, 1.2, 16, 2.5, 18, 5.2, 20, 11]
    });
    setPaint("road_pier", { "line-color": "#8c6b45" });
    setPaint("road_area_pier", { "fill-color": "#8c6b45" });
    setPaint("waterway", { "line-color": "#3f7fb5" });

    // Hvid stiplet midterlinje på vejene fra zoom 15
    const afterRoadLayer = map.getLayer("highway_motorway_bridge_casing") ? "highway_motorway_bridge_casing" : undefined;
    if (!map.getLayer("hf-road-stripe")) {
        map.addLayer({
            id: "hf-road-stripe",
            type: "line",
            source: "openmaptiles",
            "source-layer": "transportation",
            minzoom: 15,
            filter: ["all",
                ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
                ["!=", ["get", "brunnel"], "tunnel"],
                ["match", ["get", "class"], ["minor", "primary", "secondary", "tertiary", "trunk", "motorway"], true, false]
            ],
            layout: { "line-cap": "butt", "line-join": "round" },
            paint: {
                "line-color": ROAD_STRIPE,
                "line-dasharray": [2.2, 2.6],
                "line-opacity": 0.82,
                "line-width": ["interpolate", ["exponential", 1.45], ["zoom"], 15, 0.65, 17, 1.35, 20, 3.4]
            }
        }, afterRoadLayer);
    }

    // Stednavne i spillets stil: store bogstaver, lys skrift med mørk kant, ingen prikker.
    const labelLayout = {
        "text-font": ["Noto Sans Bold"],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.12,
        "icon-image": "",
        "text-anchor": "center",
        "text-offset": [0, 0]
    };
    const labelPaint = {
        "text-color": "#f6e9c4",
        "text-halo-color": "#241a10",
        "text-halo-width": 2,
        "text-halo-blur": 0
    };
    for (const id of ["label_city", "label_city_capital", "label_town", "label_village"]) {
        setLayout(id, labelLayout);
        setPaint(id, labelPaint);
    }
    setLayout("label_city", { "text-size": ["interpolate", ["exponential", 1.2], ["zoom"], 4, 12, 7, 14, 11, 20] });
    setLayout("label_city_capital", { "text-size": ["interpolate", ["exponential", 1.2], ["zoom"], 4, 13, 7, 16, 11, 22] });
    setLayout("label_town", { "text-size": ["interpolate", ["exponential", 1.2], ["zoom"], 7, 11, 11, 14] });
    setLayout("label_village", { "text-size": ["interpolate", ["exponential", 1.2], ["zoom"], 9, 10, 12, 12] });
}

// ---------------------------------------------------------------------------
// 3D-taglandskab set ovenfra (som i moderne top-down byspil):
// Under zoom 15 vises bygninger i rene tagfarver med mørk slagskygge.
// Fra zoom 15 (HOUSE_MIN_ZOOM) beregnes 3D-tagflader med solside (nordvest) og skyggeside (sydøst),
// lys tagkant/gesims, rygning, ovenlysvinduer/solceller, skorstene, sydfacade og dyb slagskygge
// i hver bygnings præcise placering og vinkel — samt fodgængerfelter ved vejkryds.
// ---------------------------------------------------------------------------
const HOUSE_MIN_ZOOM = 15;
const LANDSCAPE_TILE_ZOOM = 14; // kortets fineste vektorfliser; kun dem indekseres til felter
const HOUSE_MIN_AREA = 28; // m² (små skure og drivhuse under 28 m² udelades)

const BUILDING_PALETTES = [
    // 0: Varmt terrakotta-tegltag
    { type: "pitched", light: "#eb9668", midL: "#df8355", midD: "#c86c41", dark: "#a8502c", trim: "#f3ebdd", wallL: "#e8dfd0", wallM: "#d6ccb9", wallD: "#b8ae9c" },
    // 1: Klassisk rødbrunt tegltag
    { type: "pitched", light: "#e07e58", midL: "#ce6b46", midD: "#b65634", dark: "#963f22", trim: "#f0e7d8", wallL: "#e5dccb", wallM: "#d2c8b6", wallD: "#b5ab99" },
    // 2: Mørkt skifertag (antracit/blågrå)
    { type: "pitched", light: "#6f7484", midL: "#5d6270", midD: "#4b4f5d", dark: "#393c48", trim: "#ebe7df", wallL: "#eae3d7", wallM: "#d6cfc2", wallD: "#b8b1a4" },
    // 3: Varmt brunt tag
    { type: "pitched", light: "#9c7e6d", midL: "#886a5a", midD: "#725647", dark: "#584034", trim: "#efe7da", wallL: "#e4dbc9", wallM: "#d1c7b4", wallD: "#b4aa97" },
    // 4: Støvet salvie-/kobbergrønt tag
    { type: "pitched", light: "#93ae6c", midL: "#7f9b59", midD: "#6b8647", dark: "#536b35", trim: "#ece8dc", wallL: "#e4dfd2", wallM: "#d0cabe", wallD: "#b2aca0" },
    // 5: Moderne fladt tag med lys cremefarvet parapet
    { type: "flat", parapet: "#f2ece2", deck: "#d2cabe", innerShade: "#9e968a", trim: "#f2ece2", wallL: "#e4dccf", wallM: "#cfc7b9", wallD: "#b2aa9c" },
    // 6: Moderne fladt tag i kølig arkitektgrå
    { type: "flat", parapet: "#e1e5ea", deck: "#aeb5be", innerShade: "#7d848e", trim: "#e1e5ea", wallL: "#d4d9df", wallM: "#bec4cb", wallD: "#a0a6ae" },
    // 7: Moderne fladt tag med mørk tagflade og lys kant
    { type: "flat", parapet: "#e6e0d6", deck: "#4e525e", innerShade: "#333640", trim: "#e6e0d6", wallL: "#e2dbce", wallM: "#cec7ba", wallD: "#b0a99c" }
];

function styleBuildingsLikeGame() {
    if (!map.getLayer("building")) return;
    const h = ["coalesce", ["get", "render_height"], 6];
    const pick = ["%", ["floor", ["/", ["coalesce", ["id"], 0], 4]], 4];
    const roofColor = ["case",
        ["<", h, 10], ["match", pick, 0, "#d87d52", 1, "#585d6b", 2, "#836757", "#769152"],
        ["<", h, 18], ["match", pick, 0, "#c86c44", 1, "#4e525f", "#c9c2b6"],
        "#b4bcc4"];

    if (!map.getLayer("hf-building-shadow-low")) {
        map.addLayer({
            id: "hf-building-shadow-low",
            type: "fill",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 12,
            maxzoom: HOUSE_MIN_ZOOM,
            paint: {
                "fill-color": "#1a202e",
                "fill-opacity": 0.55,
                "fill-translate": ["interpolate", ["linear"], ["zoom"], 12, ["literal", [1, 1.2]], 15, ["literal", [3.5, 4.2]]],
                "fill-translate-anchor": "viewport"
            }
        }, "building");
    }

    map.setPaintProperty("building", "fill-color", roofColor);
    map.setPaintProperty("building", "fill-outline-color", "#2b2f3a");
    // Fra HOUSE_MIN_ZOOM er selve kortets bygningslag usynligt (men kan stadig aflæses ved granatnedslag).
    map.setPaintProperty("building", "fill-opacity", ["step", ["zoom"], 1, HOUSE_MIN_ZOOM, 0]);
}

function metreIconSize(texPx, minSize) {
    const pxPerMeterAtZoom0 = 512 / (2 * Math.PI * EARTH_RADIUS_M);
    const k = z => (pxPerMeterAtZoom0 * Math.pow(2, z)) / texPx;
    const lo = minSize ? ["+", ["*", ["get", "m"], k(0)], minSize] : ["*", ["get", "m"], k(0)];
    const hi = minSize ? ["+", ["*", ["get", "m"], k(24)], minSize] : ["*", ["get", "m"], k(24)];
    return ["interpolate", ["exponential", 2], ["zoom"], 0, lo, 24, hi];
}

function installChimneys() {}

function installHouseLayer() {
    if (map.getSource("src-houses")) return;
    const empty = { type: "FeatureCollection", features: [] };
    // tolerance: 0 og buffer: 32 gør MapLibres Web Worker-klipning markant hurtigere,
    // fordi vores 3D-bygningspolygoner allerede er forenklede til skarpe hjørner.
    map.addSource("src-houses", { type: "geojson", data: empty, tolerance: 0, buffer: 24, maxzoom: 16 });
    const before = map.getLayer("waterway_line_label") ? "waterway_line_label" : undefined;

    // 1. Fodgængerfelter på vejene ved vejkryds
    map.addLayer({
        id: "lyr-b3d-crosswalk",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "xwalk"],
        paint: { "fill-color": "#ece6dc", "fill-opacity": 0.92 }
    }, before);

    // 2. Terrasser / flisebelægning ved husene
    map.addLayer({
        id: "lyr-b3d-patio",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "patio"],
        paint: { "fill-color": ["get", "c"], "fill-outline-color": "#948d80" }
    }, before);

    // 3. Dyb mørkeblå/grå slagskygge mod sydøst
    map.addLayer({
        id: "lyr-b3d-shadow",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "shadow"],
        paint: { "fill-color": "#1a202e", "fill-opacity": 0.68 }
    }, before);

    // 4. Sydfacade under taget (med skarp mørk underkant direkte i WebGL)
    map.addLayer({
        id: "lyr-b3d-wall",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "wall"],
        paint: { "fill-color": ["get", "c"], "fill-outline-color": "#252934" }
    }, before);

    // 5. Lys tagkant / udhæng / parapet (med skarp mørk yderkontur direkte i WebGL)
    map.addLayer({
        id: "lyr-b3d-eave",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "eave"],
        paint: { "fill-color": ["get", "c"], "fill-outline-color": "#262a34" }
    }, before);

    // 6. 3D-tagflader (solside, mellemtone, skyggeside og forsænket fladt tag)
    map.addLayer({
        id: "lyr-b3d-slope",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "slope"],
        paint: {
            "fill-color": ["get", "c"],
            "fill-outline-color": ["case", ["==", ["get", "o"], 1], "#555862", "rgba(0,0,0,0)"]
        }
    }, before);

    // 7. Små slagskygger fra skorstene og tagopbygninger
    map.addLayer({
        id: "lyr-b3d-dshadow",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "dshadow"],
        paint: { "fill-color": "#1a202e", "fill-opacity": 0.62 }
    }, before);

    // 8. Ovenlysvinduer, solceller og skorstene (med lys ramme om vinduer og mørk kant om skorstene)
    map.addLayer({
        id: "lyr-b3d-detail",
        type: "fill",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "detail"],
        paint: {
            "fill-color": ["get", "c"],
            "fill-outline-color": ["match", ["get", "c"], "#e6ddd0", "#262a34", "#dce4ec"]
        }
    }, before);

    // 9. Rygningslinjer og gratlinjer på skrå tage
    map.addLayer({
        id: "lyr-b3d-line",
        type: "line",
        source: "src-houses",
        minzoom: HOUSE_MIN_ZOOM,
        filter: ["==", ["get", "k"], "line"],
        layout: { "line-join": "bevel", "line-cap": "butt" },
        paint: {
            "line-color": ["get", "c"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 15, ["*", ["get", "w"], 0.55], 17, ["get", "w"], 20, ["*", ["get", "w"], 2.2]],
            "line-opacity": 0.9
        }
    }, before);
}

const TREE_MIN_ZOOM = 15;
const TREE_GRID_M = 8.5;
const TREE_MAX = 14000;

function hash2(i, j) {
    let h = (i * 374761393 + j * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}

function pointInRings(lon, lat, rings) {
    let inside = false;
    for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
            if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
        }
    }
    return inside;
}

const TREE_KINDS = {
    wood: { density: 0.88, pick: r => r < 0.22 ? "img-pine-1" : r < 0.38 ? "img-pine-2" : r < 0.62 ? "img-tree-1" : r < 0.84 ? "img-tree-2" : r < 0.95 ? "img-tree-3" : "img-bush-1" },
    park: { density: 0.14, pick: r => r < 0.38 ? "img-tree-1" : r < 0.68 ? "img-tree-2" : r < 0.88 ? "img-tree-3" : "img-bush-2" },
    town: { density: 0.035, pick: r => r < 0.32 ? "img-tree-1" : r < 0.60 ? "img-tree-2" : r < 0.80 ? "img-tree-3" : r < 0.90 ? "img-bush-1" : "img-bush-2" },
    grass: { density: 0.055, pick: r => r < 0.45 ? "img-tree-2" : r < 0.75 ? "img-tree-3" : "img-bush-1" }
};

function installTreeLayer() {
    if (map.getSource("src-trees")) return;
    map.addSource("src-trees", { type: "geojson", data: { type: "FeatureCollection", features: [] }, tolerance: 0, maxzoom: 16 });
    map.addLayer({
        id: "lyr-trees", type: "symbol", source: "src-trees", minzoom: TREE_MIN_ZOOM,
        layout: {
            "icon-image": ["get", "sprite"], "icon-anchor": "center",
            "icon-allow-overlap": true, "icon-ignore-placement": true,
            "icon-size": metreIconSize(56, 0.06),
            "symbol-sort-key": ["get", "sort"]
        }
    }, map.getLayer("waterway_line_label") ? "waterway_line_label" : undefined);
}

function slopeColorForNormal(nx, ny, pal) {
    // Sollys kommer fra nordvest: (-0.68, +0.73)
    const dot = nx * -0.68 + ny * 0.73;
    if (dot > 0.32) return pal.light;
    if (dot > 0.0) return pal.midL;
    if (dot > -0.34) return pal.midD;
    return pal.dark;
}

function insetPolygonCCW(pts, insetM) {
    const n = pts.length;
    const out = [];
    for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const curr = pts[i];
        const next = pts[(i + 1) % n];
        const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
        const l1 = Math.hypot(dx1, dy1) || 1;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const l2 = Math.hypot(dx2, dy2) || 1;
        // Indadrettede normaler for CCW polygon: (-dy, dx)
        const n1x = -dy1 / l1, n1y = dx1 / l1;
        const n2x = -dy2 / l2, n2y = dx2 / l2;
        let bx = n1x + n2x, by = n1y + n2y;
        const bl = Math.hypot(bx, by);
        if (bl < 1e-4) {
            bx = n1x; by = n1y;
        } else {
            bx /= bl; by /= bl;
        }
        const cosHalf = Math.max(0.45, Math.abs(bx * n1x + by * n1y));
        const d = Math.min(insetM / cosHalf, insetM * 1.65, l1 * 0.42, l2 * 0.42);
        out.push({ x: curr.x + bx * d, y: curr.y + by * d });
    }
    return out;
}

// ---------------------------------------------------------------------------
// Lynhurtig chunk-cache og forudindlæsning (overscan) til 3D-bygninger og træer (v104):
//  1) Hver z14-vektorflise fra OpenMapTiles afkodes KUN én gang og fordeles i ~335×335 m felter (chunks).
//  2) Hvert felt beregner og gemmer sine 3D-tage, mure, skygger, fodgængerfelter og træer i hukommelsen,
//     samlet i få MultiPolygon/MultiLineString-grupper pr. 670×670 m stor-felt (~90 features i stedet for 25.000).
//  3) En bred buffer uden for skærmkanten tegnes på forhånd og opdateres løbende under panorering,
//     så bygninger og træer allerede står klar, når man trækker kortet.
// ---------------------------------------------------------------------------
const CHUNK_LAT = 0.0016; // ~178 m nord-syd
const CHUNK_LON = 0.0028; // ~176 m øst-vest i Danmark
const LANDSCAPE_DETAIL_ZOOM = 15.65;

const indexedSourceTiles = new Set();
const seenRawBuildings = new Set();
const seenRawRoadSegs = new Set();
const rawRoadNodes = new Map();
const rawChunks = new Map();       // "cx:cy" -> { rawBlds, roadSegs, roadNodes, lands }
const bldChunkCache = new Map();   // "cx:cy" -> { corePolys, detailPolys, lines, blds }
const fullChunkCache = new Map();  // "cx:cy" -> { corePolys, detailPolys, lines, treesLo, treesHi }

let landscapeTileGen = 0;
let landscapeTileTimer = null;
let lastLandscapeMovePushMs = 0;
let renderedLandscapeWin = {
    valid: false,
    cx0: 0, cx1: -1, cy0: 0, cy1: -1,
    south: 0, north: 0, west: 0, east: 0,
    detailHi: false,
    tileGen: -1
};

function getOrCreateRawChunk(cx, cy) {
    const ck = cx + ":" + cy;
    let ch = rawChunks.get(ck);
    if (!ch) {
        ch = { rawBlds: [], roadSegs: [], roadNodes: [], lands: [] };
        rawChunks.set(ck, ch);
    }
    return ch;
}

function invalidateChunkAndNeighbors(cx, cy) {
    const ck = cx + ":" + cy;
    bldChunkCache.delete(ck);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            fullChunkCache.delete((cx + dx) + ":" + (cy + dy));
        }
    }
}

function resetLandscapeCachesIfHuge() {
    if (rawChunks.size <= 8000) return;
    indexedSourceTiles.clear();
    seenRawBuildings.clear();
    seenRawRoadSegs.clear();
    rawRoadNodes.clear();
    rawChunks.clear();
    bldChunkCache.clear();
    fullChunkCache.clear();
    renderedLandscapeWin.valid = false;
}

function syncVectorTilesToChunks() {
    if (!map || !map.getSource("openmaptiles")) return false;
    // Zoomet langt ud bruges felterne ikke (huse og træer tegnes først fra zoom 15), og de grove
    // oversigtsfliser indeholder skove og marker på mange kilometer, som ville fylde titusindvis
    // af felter og få kortet til at hakke. Spring over.
    if (map.getZoom() < HOUSE_MIN_ZOOM - 1) return false;
    resetLandscapeCachesIfHuge();

    let addedAny = false;
    const dirtyChunks = new Set();
    const markDirty = (cx, cy) => dirtyChunks.add(cx + ":" + cy);

    // Hjælper: hent kun nye z14-vektorfliser pr. kildelag uden at røre f.geometry på allerede kendte fliser
    const collectNewLayerFeatures = (sourceLayer, filterObj) => {
        const feats = map.querySourceFeatures("openmaptiles", filterObj ? { sourceLayer, filter: filterObj } : { sourceLayer });
        const fresh = [];
        const newTileIds = new Set();
        for (let i = 0; i < feats.length; i++) {
            const f = feats[i];
            const vtf = f._vectorTileFeature;
            if (vtf && vtf._z !== undefined) {
                // Kun de fine fliser (zoom 14) – aldrig grove oversigtsfliser fra lavere zoom.
                if (vtf._z < LANDSCAPE_TILE_ZOOM) continue;
                const tid = sourceLayer + ":" + vtf._z + "/" + vtf._x + "/" + vtf._y;
                if (indexedSourceTiles.has(tid)) continue;
                newTileIds.add(tid);
            }
            fresh.push(f);
        }
        for (const tid of newTileIds) indexedSourceTiles.add(tid);
        return fresh;
    };

    // 1. Bygninger
    const newBlds = collectNewLayerFeatures("building", null);
    for (let idx = 0; idx < newBlds.length; idx++) {
        const f = newBlds[idx];
        const h = f.properties?.render_height || 6;
        const g = f.geometry;
        if (!g) continue;
        const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
        for (let p = 0; p < polys.length; p++) {
            const rings = polys[p];
            const raw = rings[0];
            if (!raw || raw.length < 4) continue;
            let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
            for (let k = 0; k < raw.length; k++) {
                const x = raw[k][0], y = raw[k][1];
                if (x < minLon) minLon = x; if (x > maxLon) maxLon = x;
                if (y < minLat) minLat = y; if (y > maxLat) maxLat = y;
            }
            const lat0 = (minLat + maxLat) * 0.5, lon0 = (minLon + maxLon) * 0.5;
            const bKey = Math.round(lat0 * 5e4) + ":" + Math.round(lon0 * 3e4);
            if (seenRawBuildings.has(bKey)) continue;
            seenRawBuildings.add(bKey);
            const cx = Math.floor(lon0 / CHUNK_LON);
            const cy = Math.floor(lat0 / CHUNK_LAT);
            getOrCreateRawChunk(cx, cy).rawBlds.push({
                raw, h, multi: rings.length > 1,
                minLon, maxLon, minLat, maxLat, lon0, lat0
            });
            markDirty(cx, cy);
            addedAny = true;
        }
    }

    // 2. Vejnet (til træ-afstand i både by og skov samt fodgængerfelter ved vejkryds)
    const newRoads = collectNewLayerFeatures("transportation", null);
    const roadClearanceM = {
        motorway: 16.0, trunk: 14.5, primary: 13.5, secondary: 12.5, tertiary: 11.5,
        minor: 9.0, service: 7.8, track: 8.6, path: 7.2
    };
    const xwalkClasses = new Set(["trunk", "primary", "secondary", "tertiary", "minor"]);
    for (let idx = 0; idx < newRoads.length; idx++) {
        const rf = newRoads[idx];
        const props = rf.properties;
        if (!props || props.brunnel === "tunnel") continue;
        const cls = props.class;
        const clearM = roadClearanceM[cls];
        if (!clearM) continue;
        const clearM2 = clearM * clearM;
        const padSegLon = (clearM * 1.22) / (111320 * 0.54) + 0.00004;
        const padSegLat = (clearM * 1.22) / 111320 + 0.00003;
        const g = rf.geometry;
        if (!g) continue;
        const lines = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
        const forXwalk = xwalkClasses.has(cls);

        for (let l = 0; l < lines.length; l++) {
            const line = lines[l];
            for (let i = 0; i < line.length - 1; i++) {
                const p1 = line[i], p2 = line[i + 1];
                const k1 = Math.round(p1[1] * 2e4) + ":" + Math.round(p1[0] * 1.4e4);
                const k2 = Math.round(p2[1] * 2e4) + ":" + Math.round(p2[0] * 1.4e4);
                if (k1 === k2) continue;
                const sk = k1 < k2 ? k1 + "|" + k2 : k2 + "|" + k1;
                if (seenRawRoadSegs.has(sk)) continue;
                seenRawRoadSegs.add(sk);

                const seg = {
                    x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1],
                    clearM2,
                    minX: Math.min(p1[0], p2[0]) - padSegLon,
                    maxX: Math.max(p1[0], p2[0]) + padSegLon,
                    minY: Math.min(p1[1], p2[1]) - padSegLat,
                    maxY: Math.max(p1[1], p2[1]) + padSegLat
                };
                const cx0 = Math.floor(seg.minX / CHUNK_LON), cx1 = Math.floor(seg.maxX / CHUNK_LON);
                const cy0 = Math.floor(seg.minY / CHUNK_LAT), cy1 = Math.floor(seg.maxY / CHUNK_LAT);
                for (let cy = cy0; cy <= cy1; cy++) {
                    for (let cx = cx0; cx <= cx1; cx++) {
                        getOrCreateRawChunk(cx, cy).roadSegs.push(seg);
                        markDirty(cx, cy);
                    }
                }
                addedAny = true;

                if (forXwalk) {
                    let n1 = rawRoadNodes.get(k1);
                    if (!n1) {
                        const ncx = Math.floor(p1[0] / CHUNK_LON), ncy = Math.floor(p1[1] / CHUNK_LAT);
                        n1 = { lon: p1[0], lat: p1[1], cx: ncx, cy: ncy, dirs: [] };
                        rawRoadNodes.set(k1, n1);
                        getOrCreateRawChunk(ncx, ncy).roadNodes.push(n1);
                    }
                    n1.dirs.push(p2);
                    markDirty(n1.cx, n1.cy);

                    let n2 = rawRoadNodes.get(k2);
                    if (!n2) {
                        const ncx = Math.floor(p2[0] / CHUNK_LON), ncy = Math.floor(p2[1] / CHUNK_LAT);
                        n2 = { lon: p2[0], lat: p2[1], cx: ncx, cy: ncy, dirs: [] };
                        rawRoadNodes.set(k2, n2);
                        getOrCreateRawChunk(ncx, ncy).roadNodes.push(n2);
                    }
                    n2.dirs.push(p1);
                    markDirty(n2.cx, n2.cy);
                }
            }
        }
    }

    // 3. Arealtyper til skov-, park- og havetræer (prioritet: wood=0, park=1, town=2, grass=3)
    const addLandPolys = (feats, getKind) => {
        for (let idx = 0; idx < feats.length; idx++) {
            const f = feats[idx];
            const kindKey = getKind(f);
            if (!kindKey) continue;
            const g = f.geometry;
            if (!g) continue;
            const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
            const prio = kindKey === "wood" ? 0 : kindKey === "park" ? 1 : kindKey === "town" ? 2 : 3;
            for (let p = 0; p < polys.length; p++) {
                const rings = polys[p];
                const outer = rings[0];
                if (!outer || outer.length < 4) continue;
                let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
                for (let k = 0; k < outer.length; k++) {
                    const x = outer[k][0], y = outer[k][1];
                    if (x < minLon) minLon = x; if (x > maxLon) maxLon = x;
                    if (y < minLat) minLat = y; if (y > maxLat) maxLat = y;
                }
                const item = { kindKey, prio, isWood: kindKey === "wood", rings, minLon, maxLon, minLat, maxLat };
                const cx0 = Math.floor(minLon / CHUNK_LON), cx1 = Math.floor(maxLon / CHUNK_LON);
                const cy0 = Math.floor(minLat / CHUNK_LAT), cy1 = Math.floor(maxLat / CHUNK_LAT);
                for (let cy = cy0; cy <= cy1; cy++) {
                    for (let cx = cx0; cx <= cx1; cx++) {
                        getOrCreateRawChunk(cx, cy).lands.push(item);
                        markDirty(cx, cy);
                    }
                }
                addedAny = true;
            }
        }
    };

    addLandPolys(collectNewLayerFeatures("landcover", null), f => {
        const c = f.properties?.class;
        return c === "wood" ? "wood" : c === "grass" ? "grass" : null;
    });
    addLandPolys(collectNewLayerFeatures("park", null), () => "park");
    addLandPolys(collectNewLayerFeatures("landuse", null), f => f.properties?.class === "residential" ? "town" : null);

    if (dirtyChunks.size > 0) {
        for (const ck of dirtyChunks) {
            const sep = ck.indexOf(":");
            invalidateChunkAndNeighbors(Number(ck.slice(0, sep)), Number(ck.slice(sep + 1)));
        }
        landscapeTileGen++;
    }
    return addedAny;
}

function buildChunkBuildings(cx, cy) {
    const ck = cx + ":" + cy;
    let cached = bldChunkCache.get(ck);
    if (cached) return cached;

    const corePolys = new Map();   // "k|c|o" -> Array<[ring]>
    const detailPolys = new Map(); // "k|c|o" -> Array<[ring]>
    const lines = new Map();       // "c|w"   -> Array<coords>
    const blds = [];

    const pushPoly = (targetMap, ring, k, c = "", o = 0) => {
        const key = k + "|" + c + "|" + o;
        let arr = targetMap.get(key);
        if (!arr) { arr = []; targetMap.set(key, arr); }
        arr.push([ring]);
    };
    const pushLine = (coords, c, w = 1.1) => {
        const key = c + "|" + w;
        let arr = lines.get(key);
        if (!arr) { arr = []; lines.set(key, arr); }
        arr.push(coords);
    };

    const rawCh = rawChunks.get(ck);
    if (rawCh) {
        // 1. Fodgængerfelter ved vejkryds i dette felt
        const cSouth = cy * CHUNK_LAT, cNorth = (cy + 1) * CHUNK_LAT;
        const cWest = cx * CHUNK_LON, cEast = (cx + 1) * CHUNK_LON;
        const cosChunk = Math.max(Math.cos(((cSouth + cNorth) * 0.5) * RAD_PER_DEG), MIN_COS);
        let xwCount = 0;
        for (let nIdx = 0; nIdx < rawCh.roadNodes.length && xwCount < 14; nIdx++) {
            const node = rawCh.roadNodes[nIdx];
            if (node.dirs.length < 3) continue;
            if (node.lat < cSouth || node.lat >= cNorth || node.lon < cWest || node.lon >= cEast) continue;
            for (let dIdx = 0; dIdx < node.dirs.length && xwCount < 14; dIdx++) {
                const target = node.dirs[dIdx];
                const dx = (target[0] - node.lon) * 111320 * cosChunk;
                const dy = (target[1] - node.lat) * 111320;
                const len = Math.hypot(dx, dy);
                if (len < 18) continue;
                const ux = dx / len, uy = dy / len;
                const nx = -uy, ny = ux;
                const cxM = ux * 7.8, cyM = uy * 7.8;
                const stripeHalfLen = 1.25, stripeHalfW = 0.28;
                const invLon = 1 / (111320 * cosChunk), invLat = 1 / 111320;
                for (const off of [-2.1, -1.05, 0, 1.05, 2.1]) {
                    const sx = cxM + nx * off, sy = cyM + ny * off;
                    const c0 = [node.lon + (sx - ux * stripeHalfLen - nx * stripeHalfW) * invLon, node.lat + (sy - uy * stripeHalfLen - ny * stripeHalfW) * invLat];
                    const c1 = [node.lon + (sx + ux * stripeHalfLen - nx * stripeHalfW) * invLon, node.lat + (sy + uy * stripeHalfLen - ny * stripeHalfW) * invLat];
                    const c2 = [node.lon + (sx + ux * stripeHalfLen + nx * stripeHalfW) * invLon, node.lat + (sy + uy * stripeHalfLen + ny * stripeHalfW) * invLat];
                    const c3 = [node.lon + (sx - ux * stripeHalfLen + ny * stripeHalfW) * invLon, node.lat + (sy - uy * stripeHalfLen + ny * stripeHalfW) * invLat];
                    pushPoly(detailPolys, [c0, c1, c2, c3, c0], "xwalk");
                }
                xwCount++;
            }
        }

        // 2. 3D-bygninger i dette felt
        for (let bIdx = 0; bIdx < rawCh.rawBlds.length; bIdx++) {
            const rb = rawCh.rawBlds[bIdx];
            const { raw, h, multi, minLon, maxLon, minLat, maxLat, lon0, lat0 } = rb;
            if (bboxCleared(minLat, maxLat, minLon, maxLon)) continue; // revet ned: en spillers bygning står her
            const cosLat = Math.max(Math.cos(lat0 * RAD_PER_DEG), MIN_COS);
            const mPerLon = 111320 * cosLat;
            const mPerLat = 111320;
            const invMLon = 1 / mPerLon, invMLat = 1 / mPerLat;
            const toLL = (x, y) => [lon0 + x * invMLon, lat0 + y * invMLat];

            let pts = [];
            for (let i = 0; i < raw.length - 1; i++) {
                const px = (raw[i][0] - lon0) * mPerLon;
                const py = (raw[i][1] - lat0) * mPerLat;
                if (!pts.length || Math.hypot(px - pts[pts.length - 1].x, py - pts[pts.length - 1].y) > 0.35) {
                    pts.push({ x: px, y: py });
                }
            }
            if (pts.length > 2 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) <= 0.35) {
                pts.pop();
            }
            if (pts.length < 3) continue;

            let signed2 = 0;
            for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
                signed2 += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
            }
            const polyArea = Math.abs(signed2) * 0.5;
            if (polyArea < HOUSE_MIN_AREA) continue;
            if (signed2 < 0) pts.reverse();

            const clean = [];
            for (let i = 0; i < pts.length; i++) {
                const p0 = pts[(i - 1 + pts.length) % pts.length];
                const p1 = pts[i];
                const p2 = pts[(i + 1) % pts.length];
                const v1x = p1.x - p0.x, v1y = p1.y - p0.y, l1 = Math.hypot(v1x, v1y) || 1;
                const v2x = p2.x - p1.x, v2y = p2.y - p1.y, l2 = Math.hypot(v2x, v2y) || 1;
                const cross = Math.abs((v1x * v2y - v1y * v2x) / (l1 * l2));
                if (cross > 0.08) clean.push(p1);
            }
            if (clean.length >= 3) pts = clean;

            let sC = 0, sS = 0;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i], bPt = pts[(i + 1) % pts.length];
                const dx = bPt.x - a.x, dy = bPt.y - a.y;
                const len = Math.hypot(dx, dy);
                const ang4 = 4 * Math.atan2(dy, dx);
                sC += len * Math.cos(ang4);
                sS += len * Math.sin(ang4);
            }
            let theta = 0.25 * Math.atan2(sS, sC);
            let ux = Math.cos(theta), uy = Math.sin(theta);
            let vx = -uy, vy = ux;

            const projBounds = (ux_, uy_, vx_, vy_) => {
                let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
                for (let i = 0; i < pts.length; i++) {
                    const p = pts[i];
                    const u = p.x * ux_ + p.y * uy_;
                    const v = p.x * vx_ + p.y * vy_;
                    if (u < u0) u0 = u; if (u > u1) u1 = u;
                    if (v < v0) v0 = v; if (v > v1) v1 = v;
                }
                return { u0, u1, v0, v1, L: u1 - u0, W: v1 - v0 };
            };
            let obb = projBounds(ux, uy, vx, vy);
            if (obb.W > obb.L) {
                theta += Math.PI * 0.5;
                ux = Math.cos(theta); uy = Math.sin(theta);
                vx = -uy; vy = ux;
                obb = projBounds(ux, uy, vx, vy);
            }
            const uMid = 0.5 * (obb.u0 + obb.u1);
            const vMid = 0.5 * (obb.v0 + obb.v1);
            const uvToXY = (u, v) => ({ x: u * ux + v * vx, y: u * uy + v * vy });
            const uvToLL = (u, v) => toLL(u * ux + v * vx, u * uy + v * vy);

            const hSeed = hash2(Math.round(lat0 * 1e5), Math.round(lon0 * 1e5));
            let styleIdx;
            if (h >= 14 || polyArea > 900) {
                const bigChoices = [0, 2, 5, 6, 7, 2, 6];
                styleIdx = bigChoices[hSeed % bigChoices.length];
            } else {
                const houseChoices = [0, 0, 1, 2, 2, 3, 4, 5, 6, 7];
                styleIdx = houseChoices[hSeed % houseChoices.length];
            }
            const pal = BUILDING_PALETTES[styleIdx];

            const obbArea = Math.max(1, obb.L * obb.W);
            const isRect = !multi && polyArea <= 680 && (polyArea / obbArea) >= 0.72;
            const scale = isRect ? Math.sqrt(polyArea / obbArea) : 1.0;
            const hl = Math.max(2.2, 0.5 * obb.L * scale);
            const hw = Math.max(2.0, 0.5 * obb.W * scale);

            const bPts = isRect ? [
                uvToXY(uMid - hl, vMid - hw),
                uvToXY(uMid + hl, vMid - hw),
                uvToXY(uMid + hl, vMid + hw),
                uvToXY(uMid - hl, vMid + hw)
            ] : pts;

            const padM = 1.7;
            blds.push({
                minLon: minLon - padM * invMLon, maxLon: maxLon + padM * invMLon,
                minLat: minLat - (padM + 1.4) * invMLat, maxLat: maxLat + padM * invMLat,
                lon0, lat0
            });

            // 1. Lille terrasse / gårdflise ved parcelhuse
            if (isRect && polyArea < 360 && (hSeed & 3) !== 0) {
                const pSide = (hSeed & 4) ? 1 : -1;
                const pU0 = uMid - hl * 0.55, pU1 = uMid + hl * 0.45;
                const pV0 = pSide > 0 ? vMid + hw : vMid - hw - 2.6;
                const pV1 = pSide > 0 ? vMid + hw + 2.6 : vMid - hw;
                const patioCoords = [uvToLL(pU0, pV0), uvToLL(pU1, pV0), uvToLL(pU1, pV1), uvToLL(pU0, pV1), uvToLL(pU0, pV0)];
                pushPoly(detailPolys, patioCoords, "patio", "#cbc3b4");
            }

            // 2. Dyb slagskygge mod sydøst og 3D-sydfacade
            const wallH = Math.min(9.5, Math.max(2.5, h * 0.40));
            const shDx = wallH * 1.15;
            const shDy = -wallH * 1.25;
            const shOffY = -wallH * 0.55 + shDy;

            if (isRect) {
                // Eksakt konveks 6-punkts slagskygge for rektangulære huse (3× færre skyggepolygoner)
                const front = [false, false, false, false];
                for (let i = 0; i < 4; i++) {
                    const A = bPts[i], B = bPts[(i + 1) & 3];
                    front[i] = ((B.y - A.y) * shDx - (B.x - A.x) * shOffY) > 0;
                }
                const hull = [];
                for (let i = 0; i < 4; i++) {
                    const pf = front[(i + 3) & 3], cf = front[i];
                    const P = bPts[i];
                    if (!pf && !cf) {
                        hull.push(toLL(P.x, P.y));
                    } else if (!pf && cf) {
                        hull.push(toLL(P.x, P.y), toLL(P.x + shDx, P.y + shOffY));
                    } else if (pf && cf) {
                        hull.push(toLL(P.x + shDx, P.y + shOffY));
                    } else {
                        hull.push(toLL(P.x + shDx, P.y + shOffY), toLL(P.x, P.y));
                    }
                }
                if (hull.length >= 3) {
                    hull.push(hull[0]);
                    pushPoly(corePolys, hull, "shadow");
                }
            } else {
                const shRing = bPts.map(p => toLL(p.x + shDx, p.y + shOffY));
                shRing.push(shRing[0]);
                pushPoly(corePolys, shRing, "shadow");
            }

            for (let i = 0; i < bPts.length; i++) {
                const A = bPts[i], B = bPts[(i + 1) % bPts.length];
                const edx = B.x - A.x, edy = B.y - A.y;
                const elen = Math.hypot(edx, edy);
                if (elen < 0.4) continue;
                const nx = edy / elen, ny = -edx / elen;

                if (!isRect && (nx * shDx + ny * shDy > 0)) {
                    const sq = [
                        toLL(A.x, A.y),
                        toLL(B.x, B.y),
                        toLL(B.x + shDx, B.y + shOffY),
                        toLL(A.x + shDx, A.y + shOffY),
                        toLL(A.x, A.y)
                    ];
                    pushPoly(corePolys, sq, "shadow");
                }

                if (ny < -0.10) {
                    const wColor = nx < -0.18 ? pal.wallL : nx > 0.18 ? pal.wallD : pal.wallM;
                    const wq = [
                        toLL(A.x, A.y),
                        toLL(B.x, B.y),
                        toLL(B.x, B.y - wallH),
                        toLL(A.x, A.y - wallH),
                        toLL(A.x, A.y)
                    ];
                    pushPoly(corePolys, wq, "wall", wColor);
                }
            }

            // 3. Ydre tagkant / gesims / parapet
            const outerRing = bPts.map(p => toLL(p.x, p.y));
            outerRing.push(outerRing[0]);
            pushPoly(corePolys, outerRing, "eave", pal.trim);

            // 4. Tagflader (3D-valmtag, saddeltag eller forsænket fladt tag)
            if (isRect) {
                const trimM = Math.min(0.55, hw * 0.12);
                const il = Math.max(1.2, hl - trimM);
                const iw = Math.max(1.0, hw - trimM);

                if (pal.type === "flat") {
                    const pM = Math.min(1.05, iw * 0.22);
                    const dl = Math.max(0.8, il - pM);
                    const dw = Math.max(0.7, iw - pM);
                    const deckCoords = [
                        uvToLL(uMid - dl, vMid - dw),
                        uvToLL(uMid + dl, vMid - dw),
                        uvToLL(uMid + dl, vMid + dw),
                        uvToLL(uMid - dl, vMid + dw),
                        uvToLL(uMid - dl, vMid - dw)
                    ];
                    pushPoly(corePolys, deckCoords, "slope", pal.deck, 1);

                    const shW = Math.min(0.75, dw * 0.35);
                    const edgesUV = [
                        { c: [[-dl, dw - shW], [dl, dw - shW], [dl, dw], [-dl, dw]], nx: vx, ny: vy },
                        { c: [[-dl, -dw], [dl, -dw], [dl, -dw + shW], [-dl, -dw + shW]], nx: -vx, ny: -vy },
                        { c: [[-dl, -dw], [-dl + shW, -dw], [-dl + shW, dw], [-dl, dw]], nx: -ux, ny: -uy },
                        { c: [[dl - shW, -dw], [dl, -dw], [dl, dw], [dl - shW, dw]], nx: ux, ny: uy }
                    ];
                    for (let eIdx = 0; eIdx < edgesUV.length; eIdx++) {
                        const e = edgesUV[eIdx];
                        if (e.nx * -0.68 + e.ny * 0.73 > 0.05) {
                            const sc = e.c.map(([u, v]) => uvToLL(uMid + u, vMid + v));
                            sc.push(sc[0]);
                            pushPoly(corePolys, sc, "slope", pal.innerShade, 0);
                        }
                    }

                    if (dl > 2.4 && dw > 2.0) {
                        const cols = dl > 5.0 ? 3 : 2;
                        const paneW = Math.min(1.5, (dl * 0.9) / cols);
                        const paneH = Math.min(1.6, dw * 0.65);
                        const startU = uMid - ((cols - 1) * (paneW + 0.35)) * 0.5;
                        const baseV = vMid + dw * 0.12;
                        for (let c = 0; c < cols; c++) {
                            const cu = startU + c * (paneW + 0.35);
                            const pCoords = [
                                uvToLL(cu - paneW * 0.5, baseV - paneH * 0.5),
                                uvToLL(cu + paneW * 0.5, baseV - paneH * 0.5),
                                uvToLL(cu + paneW * 0.5, baseV + paneH * 0.5),
                                uvToLL(cu - paneW * 0.5, baseV + paneH * 0.5),
                                uvToLL(cu - paneW * 0.5, baseV - paneH * 0.5)
                            ];
                            pushPoly(detailPolys, pCoords, "detail", "#2e4154");
                        }
                    }
                } else {
                    const isGabled = (hSeed % 3) === 0;
                    const hipInset = isGabled ? Math.min(0.6, il * 0.12) : Math.min(iw * 0.88, il * 0.72);
                    const rU = Math.max(0.2, il - hipInset);

                    const NW = [uMid - il, vMid + iw];
                    const NE = [uMid + il, vMid + iw];
                    const SE = [uMid + il, vMid - iw];
                    const SW = [uMid - il, vMid - iw];
                    const R1 = [uMid - rU, vMid];
                    const R2 = [uMid + rU, vMid];

                    const facets = [
                        { pts: [NW, R1, R2, NE], nx: vx, ny: vy },
                        { pts: [SW, SE, R2, R1], nx: -vx, ny: -vy },
                        { pts: [SW, R1, NW], nx: -ux, ny: -uy },
                        { pts: [SE, NE, R2], nx: ux, ny: uy }
                    ];
                    for (let fIdx = 0; fIdx < facets.length; fIdx++) {
                        const fc = facets[fIdx];
                        const coords = fc.pts.map(([u, v]) => uvToLL(u, v));
                        coords.push(coords[0]);
                        pushPoly(corePolys, coords, "slope", slopeColorForNormal(fc.nx, fc.ny, pal), 0);
                    }

                    pushLine([uvToLL(R1[0], R1[1]), uvToLL(R2[0], R2[1])], pal.trim, 1.35);
                    pushLine([uvToLL(NW[0], NW[1]), uvToLL(R1[0], R1[1]), uvToLL(SW[0], SW[1])], pal.trim, 0.9);
                    pushLine([uvToLL(NE[0], NE[1]), uvToLL(R2[0], R2[1]), uvToLL(SE[0], SE[1])], pal.trim, 0.9);

                    if (il > 2.6 && iw > 2.2) {
                        const numWin = (hSeed & 1) && il > 4.2 ? 2 : 1;
                        const winSide = (hSeed & 2) ? 1 : -1;
                        const winV = vMid + winSide * iw * 0.46;
                        const wU = 0.65, wV = Math.min(0.55, iw * 0.22);
                        for (let wIdx = 0; wIdx < numWin; wIdx++) {
                            const wu = uMid - il * 0.25 + wIdx * 1.65;
                            if (Math.abs(wu - uMid) + wU > rU + 0.3) continue;
                            const wc = [
                                uvToLL(wu - wU, winV - wV),
                                uvToLL(wu + wU, winV - wV),
                                uvToLL(wu + wU, winV + wV),
                                uvToLL(wu - wU, winV + wV),
                                uvToLL(wu - wU, winV - wV)
                            ];
                            pushPoly(detailPolys, wc, "detail", "#2c3f52");
                        }
                    }

                    if ((hSeed % 5) < 3 && il > 2.5) {
                        const cu = uMid + ((hSeed & 8) ? 0.32 : -0.32) * rU;
                        const cv = vMid + ((hSeed & 16) ? 0.22 : -0.22) * iw;
                        const cs = 0.52;
                        const chXY = uvToXY(cu, cv);
                        const shCoords = [
                            toLL(chXY.x - cs, chXY.y - cs),
                            toLL(chXY.x + cs + 0.9, chXY.y - cs - 1.0),
                            toLL(chXY.x + cs + 0.9, chXY.y + cs - 1.0),
                            toLL(chXY.x - cs, chXY.y + cs),
                            toLL(chXY.x - cs, chXY.y - cs)
                        ];
                        pushPoly(detailPolys, shCoords, "dshadow");
                        const chCoords = [
                            toLL(chXY.x - cs, chXY.y - cs),
                            toLL(chXY.x + cs, chXY.y - cs),
                            toLL(chXY.x + cs, chXY.y + cs),
                            toLL(chXY.x - cs, chXY.y + cs),
                            toLL(chXY.x - cs, chXY.y - cs)
                        ];
                        pushPoly(detailPolys, chCoords, "detail", "#e6ddd0");
                    }
                }
            } else {
                const trimPts = insetPolygonCCW(bPts, 0.48);
                const slopeW = pal.type === "flat" ? 1.15 : Math.min(4.5, Math.max(2.0, obb.W * 0.28));
                const innerPts = insetPolygonCCW(trimPts, slopeW);

                if (pal.type === "flat") {
                    const innerRing = innerPts.map(p => toLL(p.x, p.y));
                    innerRing.push(innerRing[0]);
                    pushPoly(corePolys, innerRing, "slope", pal.deck, 1);
                    for (let i = 0; i < trimPts.length; i++) {
                        const A = trimPts[i], B = trimPts[(i + 1) % trimPts.length];
                        const A2 = innerPts[i], B2 = innerPts[(i + 1) % innerPts.length];
                        const edx = B.x - A.x, edy = B.y - A.y, elen = Math.hypot(edx, edy) || 1;
                        const nx = edy / elen, ny = -edx / elen;
                        if (nx * -0.68 + ny * 0.73 < -0.05) {
                            const sc = [toLL(A.x, A.y), toLL(B.x, B.y), toLL(B2.x, B2.y), toLL(A2.x, A2.y), toLL(A.x, A.y)];
                            pushPoly(corePolys, sc, "slope", pal.innerShade, 0);
                        }
                    }
                } else {
                    for (let i = 0; i < trimPts.length; i++) {
                        const A = trimPts[i], B = trimPts[(i + 1) % trimPts.length];
                        const A2 = innerPts[i], B2 = innerPts[(i + 1) % innerPts.length];
                        const edx = B.x - A.x, edy = B.y - A.y, elen = Math.hypot(edx, edy) || 1;
                        const nx = edy / elen, ny = -edx / elen;
                        const quad = [toLL(A.x, A.y), toLL(B.x, B.y), toLL(B2.x, B2.y), toLL(A2.x, A2.y), toLL(A.x, A.y)];
                        pushPoly(corePolys, quad, "slope", slopeColorForNormal(nx, ny, pal), 0);
                        pushLine([toLL(A.x, A.y), toLL(A2.x, A2.y)], pal.trim, 0.8);
                    }
                    const innerRing = innerPts.map(p => toLL(p.x, p.y));
                    innerRing.push(innerRing[0]);
                    pushPoly(corePolys, innerRing, "slope", pal.midL, 0);
                    pushLine(innerRing, pal.trim, 1.15);
                }
            }
        }
    }

    cached = { corePolys, detailPolys, lines, blds };
    bldChunkCache.set(ck, cached);
    return cached;
}

function buildFullChunk3D(cx, cy) {
    const ck = cx + ":" + cy;
    let full = fullChunkCache.get(ck);
    if (full) return full;

    const centerBld = buildChunkBuildings(cx, cy);
    const cSouth = cy * CHUNK_LAT, cNorth = (cy + 1) * CHUNK_LAT;
    const cWest = cx * CHUNK_LON, cEast = (cx + 1) * CHUNK_LON;
    const cosLat0 = Math.max(Math.cos(((cSouth + cNorth) * 0.5) * RAD_PER_DEG), MIN_COS);
    const mPerLon0 = 111320 * cosLat0;

    // Byg et lokalt ~20 m rumligt gitter (spatial hash) over bygninger og veje i dette felt + nabokanten,
    // så hvert træs kollisionstjek klares i O(1) tid i stedet for lineær søgning.
    const CELL_LAT = 0.00018; // ~20 m
    const CELL_LON = 0.00032; // ~20 m
    const padLon = 0.00025, padLat = 0.00018;
    const gWest = cWest - padLon, gEast = cEast + padLon;
    const gSouth = cSouth - padLat, gNorth = cNorth + padLat;
    const gxCols = Math.max(1, Math.ceil((gEast - gWest) / CELL_LON) + 1);
    const gyRows = Math.max(1, Math.ceil((gNorth - gSouth) / CELL_LAT) + 1);
    const bldGrid = new Array(gxCols * gyRows);
    const roadGrid = new Array(gxCols * gyRows);

    const clampI = (v, hi) => v < 0 ? 0 : v >= hi ? hi - 1 : v;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nb = buildChunkBuildings(cx + dx, cy + dy);
            for (let i = 0; i < nb.blds.length; i++) {
                const sb = nb.blds[i];
                if (sb.maxLon < gWest || sb.minLon > gEast || sb.maxLat < gSouth || sb.minLat > gNorth) continue;
                const x0 = clampI(Math.floor((sb.minLon - gWest) / CELL_LON), gxCols);
                const x1 = clampI(Math.floor((sb.maxLon - gWest) / CELL_LON), gxCols);
                const y0 = clampI(Math.floor((sb.minLat - gSouth) / CELL_LAT), gyRows);
                const y1 = clampI(Math.floor((sb.maxLat - gSouth) / CELL_LAT), gyRows);
                for (let gy = y0; gy <= y1; gy++) {
                    const rowOff = gy * gxCols;
                    for (let gx = x0; gx <= x1; gx++) {
                        let cell = bldGrid[rowOff + gx];
                        if (!cell) { cell = []; bldGrid[rowOff + gx] = cell; }
                        cell.push(sb);
                    }
                }
            }
        }
    }

    const rawCh = rawChunks.get(ck);
    const seenGridSegs = new Set();
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nRaw = rawChunks.get((cx + dx) + ":" + (cy + dy));
            if (!nRaw) continue;
            for (let i = 0; i < nRaw.roadSegs.length; i++) {
                const seg = nRaw.roadSegs[i];
                if (seg.maxX < gWest || seg.minX > gEast || seg.maxY < gSouth || seg.minY > gNorth) continue;
                if (seenGridSegs.has(seg)) continue;
                seenGridSegs.add(seg);
                const x0 = clampI(Math.floor((seg.minX - gWest) / CELL_LON), gxCols);
                const x1 = clampI(Math.floor((seg.maxX - gWest) / CELL_LON), gxCols);
                const y0 = clampI(Math.floor((seg.minY - gSouth) / CELL_LAT), gyRows);
                const y1 = clampI(Math.floor((seg.maxY - gSouth) / CELL_LAT), gyRows);
                for (let gy = y0; gy <= y1; gy++) {
                    const rowOff = gy * gxCols;
                    for (let gx = x0; gx <= x1; gx++) {
                        let cell = roadGrid[rowOff + gx];
                        if (!cell) { cell = []; roadGrid[rowOff + gx] = cell; }
                        cell.push(seg);
                    }
                }
            }
        }
    }

    const hitsBuildingOrRoad = (lon, lat, roadClearScale2 = 1.0) => {
        if (lon < gWest || lon > gEast || lat < gSouth || lat > gNorth) return false;
        const idx = clampI(Math.floor((lat - gSouth) / CELL_LAT), gyRows) * gxCols + clampI(Math.floor((lon - gWest) / CELL_LON), gxCols);
        const bCell = bldGrid[idx];
        if (bCell) {
            for (let i = 0; i < bCell.length; i++) {
                const sb = bCell[i];
                if (lon >= sb.minLon && lon <= sb.maxLon && lat >= sb.minLat && lat <= sb.maxLat) return true;
            }
        }
        const rCell = roadGrid[idx];
        if (rCell) {
            for (let i = 0; i < rCell.length; i++) {
                const seg = rCell[i];
                if (lon < seg.minX || lon > seg.maxX || lat < seg.minY || lat > seg.maxY) continue;
                const vx = (seg.x2 - seg.x1) * mPerLon0, vy = (seg.y2 - seg.y1) * 111320;
                const wx = (lon - seg.x1) * mPerLon0, wy = (lat - seg.y1) * 111320;
                const l2 = vx * vx + vy * vy;
                const t = l2 > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / l2)) : 0;
                const dx = wx - t * vx, dy = wy - t * vy;
                if (dx * dx + dy * dy < seg.clearM2 * roadClearScale2) return true;
            }
        }
        return false;
    };

    const isBuiltUpChunk = centerBld.blds.length >= 6;
    const isNearAnyHouse = (lon, lat) => {
        if (isBuiltUpChunk) return true;
        const cxI = clampI(Math.floor((lon - gWest) / CELL_LON), gxCols);
        const cyI = clampI(Math.floor((lat - gSouth) / CELL_LAT), gyRows);
        for (let gy = Math.max(0, cyI - 1); gy <= Math.min(gyRows - 1, cyI + 1); gy++) {
            const rowOff = gy * gxCols;
            for (let gx = Math.max(0, cxI - 1); gx <= Math.min(gxCols - 1, cxI + 1); gx++) {
                const bCell = bldGrid[rowOff + gx];
                if (bCell && bCell.length) return true;
            }
        }
        return false;
    };

    const treeSpacingGrid = new Array(gxCols * gyRows);
    const registerTreePos = (lon, lat) => {
        const idx = clampI(Math.floor((lat - gSouth) / CELL_LAT), gyRows) * gxCols + clampI(Math.floor((lon - gWest) / CELL_LON), gxCols);
        let cell = treeSpacingGrid[idx];
        if (!cell) { cell = []; treeSpacingGrid[idx] = cell; }
        cell.push(lon, lat);
    };
    const tooCloseToTree = (lon, lat, minDist2) => {
        const cxI = clampI(Math.floor((lon - gWest) / CELL_LON), gxCols);
        const cyI = clampI(Math.floor((lat - gSouth) / CELL_LAT), gyRows);
        for (let gy = Math.max(0, cyI - 1); gy <= Math.min(gyRows - 1, cyI + 1); gy++) {
            const rowOff = gy * gxCols;
            for (let gx = Math.max(0, cxI - 1); gx <= Math.min(gxCols - 1, cxI + 1); gx++) {
                const cell = treeSpacingGrid[rowOff + gx];
                if (!cell) continue;
                for (let k = 0; k < cell.length; k += 2) {
                    const dx = (lon - cell[k]) * mPerLon0;
                    const dy = (lat - cell[k + 1]) * 111320;
                    if (dx * dx + dy * dy < minDist2) return true;
                }
            }
        }
        return false;
    };

    const treesLo = [];
    const treesHi = [];

    if (rawCh && rawCh.lands.length) {
        const lands = rawCh.lands.slice().sort((a, b) => a.prio - b.prio);
        const seenGrid = new Set();
        const dLat = TREE_GRID_M / 111320;
        const dLon = dLat / cosLat0;

        for (let lIdx = 0; lIdx < lands.length; lIdx++) {
            const land = lands[lIdx];
            const minLon = Math.max(land.minLon, cWest), maxLon = Math.min(land.maxLon, cEast);
            const minLat = Math.max(land.minLat, cSouth), maxLat = Math.min(land.maxLat, cNorth);
            if (minLon >= maxLon || minLat >= maxLat) continue;
            const kind = TREE_KINDS[land.kindKey];
            const i0 = Math.floor(minLat / dLat), i1 = Math.floor(maxLat / dLat);
            const j0 = Math.floor(minLon / dLon), j1 = Math.floor(maxLon / dLon);

            for (let i = i0; i <= i1; i++) {
                for (let j = j0; j <= j1; j++) {
                    const key = i * 4000000 + j;
                    if (seenGrid.has(key)) continue;
                    const h = hash2(i, j);
                    const lat = (i + 0.18 + ((h >>> 10) & 63) / 100) * dLat;
                    const lon = (j + 0.18 + ((h >>> 16) & 63) / 100) * dLon;
                    if (lon < cWest || lon >= cEast || lat < cSouth || lat >= cNorth) continue;
                    const effectiveWood = land.isWood && !isNearAnyHouse(lon, lat);
                    const effKind = (land.isWood && !effectiveWood) ? TREE_KINDS.town : kind;
                    if ((h & 1023) / 1024 > effKind.density) continue;
                    if (!pointInRings(lon, lat, land.rings)) continue;
                    // Også i skov holdes alle veje, stier og bygninger helt fri for træer (med ekstra margin for store skovkroner)
                    if (hitsBuildingOrRoad(lon, lat, effectiveWood ? 1.35 : 1.0)) continue;
                    if (bboxCleared(lat, lat, lon, lon)) continue;
                    if (!effectiveWood && tooCloseToTree(lon, lat, 160)) continue; // mindst ~12,6 m mellem by-/parktræer
                    seenGrid.add(key);
                    registerTreePos(lon, lat);
                    const r = ((h >>> 22) & 1023) / 1024;
                    const sprite = effKind.pick(r);
                    const baseSize = effectiveWood ? 12.2 : 10.4;
                    const size = sprite.startsWith("img-bush") ? 6.8 : sprite.startsWith("img-pine") ? 11.4 : (baseSize + (h & 3) * 0.8);
                    const feat = {
                        type: "Feature",
                        properties: { sprite, m: size / cosLat0, sort: -lat },
                        geometry: { type: "Point", coordinates: [lon, lat] }
                    };
                    if ((i & 1) === 0 && (j & 1) === 0) treesLo.push(feat);
                    else treesHi.push(feat);
                }
            }
        }
    }

    // Enkelte, luftige havetræer ved husene (1-2 træer i haven, god afstand til naboer, huse og veje)
    for (let bIdx = 0; bIdx < centerBld.blds.length; bIdx++) {
        const sb = centerBld.blds[bIdx];
        const h0 = hash2(Math.round(sb.lat0 * 1e5), Math.round(sb.lon0 * 1e5));
        if ((h0 % 5) === 0) continue; // Nogle grunde har helt åben græsplæne
        const bw = (sb.maxLon - sb.minLon) * mPerLon0;
        const bh = (sb.maxLat - sb.minLat) * 111320;
        const count = bw * bh > 600 ? 3 : 2;
        for (let k = 0; k < count; k++) {
            const hk = hash2(h0 + k * 97, k * 131 + 17);
            const side = (h0 + k) & 3;
            const along = (((hk & 1023) / 1023) - 0.5) * 0.95;
            const outDist = 1.6 + ((hk >>> 10) & 255) / 255 * 3.8;
            let rx, ry;
            if (side === 0) { rx = along * bw; ry = bh * 0.5 + outDist; }
            else if (side === 1) { rx = along * bw; ry = -bh * 0.5 - outDist; }
            else if (side === 2) { rx = bw * 0.5 + outDist; ry = along * bh; }
            else { rx = -bw * 0.5 - outDist; ry = along * bh; }
            const lon = sb.lon0 + rx / mPerLon0;
            const lat = sb.lat0 + ry / 111320;
            if (lon < gWest || lon > gEast || lat < gSouth || lat > gNorth) continue;
            if (hitsBuildingOrRoad(lon, lat) || bboxCleared(lat, lat, lon, lon)) continue;
            if (tooCloseToTree(lon, lat, 156)) continue; // mindst ~12,5 m mellem havetræer
            registerTreePos(lon, lat);
            const r = ((hk >>> 18) & 1023) / 1024;
            const sprite = TREE_KINDS.town.pick(r);
            const size = sprite.startsWith("img-bush") ? 6.8 : (10.6 + (hk & 3) * 0.75);
            const feat = {
                type: "Feature",
                properties: { sprite, m: size / cosLat0, sort: -lat },
                geometry: { type: "Point", coordinates: [lon, lat] }
            };
            if (k === 0) treesLo.push(feat);
            else treesHi.push(feat);
        }
    }

    full = {
        corePolys: centerBld.corePolys,
        detailPolys: centerBld.detailPolys,
        lines: centerBld.lines,
        treesLo,
        treesHi
    };
    fullChunkCache.set(ck, full);
    return full;
}

function scheduleLandscapeTileSync() {
    if (landscapeTileTimer) return;
    if (map && map.getZoom() < HOUSE_MIN_ZOOM - 1) return;
    landscapeTileTimer = setTimeout(() => {
        landscapeTileTimer = null;
        if (!mapReady) return;
        const prevGen = landscapeTileGen;
        syncVectorTilesToChunks();
        if (!renderedLandscapeWin.valid || landscapeTileGen !== prevGen) {
            refreshLandscape3D(true);
            if (landscapeTileGen !== prevGen && map && map.getZoom() >= STREET_TACTICAL_ZOOM - 0.5) {
                renderTroopsOnMap();
            }
        }
    }, 35);
}

function onMapMoveLandscape3D() {
    const z = map.getZoom();
    if (z < HOUSE_MIN_ZOOM) {
        if (renderedLandscapeWin.valid) refreshLandscape3D(true);
        return;
    }
    const now = performance.now();
    if (now - lastLandscapeMovePushMs < 110) return;

    if (!renderedLandscapeWin.valid) {
        lastLandscapeMovePushMs = now;
        refreshLandscape3D(true);
        return;
    }

    const b = map.getBounds();
    const vLat = b.getNorth() - b.getSouth();
    const vLon = b.getEast() - b.getWest();
    const lookLat = Math.max(vLat * 0.22, CHUNK_LAT * 0.35);
    const lookLon = Math.max(vLon * 0.22, CHUNK_LON * 0.35);
    const detailHi = z >= LANDSCAPE_DETAIL_ZOOM;

    if (detailHi !== renderedLandscapeWin.detailHi ||
        b.getSouth() - lookLat < renderedLandscapeWin.south ||
        b.getNorth() + lookLat > renderedLandscapeWin.north ||
        b.getWest() - lookLon < renderedLandscapeWin.west ||
        b.getEast() + lookLon > renderedLandscapeWin.east) {
        lastLandscapeMovePushMs = now;
        refreshLandscape3D(false);
    }
}

function refreshLandscape3D(force) {
    if (!mapReady || !map.getSource("src-houses") || !map.getSource("src-trees")) return;
    const z = map.getZoom();
    const empty = { type: "FeatureCollection", features: [] };
    if (z < HOUSE_MIN_ZOOM) {
        if (renderedLandscapeWin.valid || force) {
            renderedLandscapeWin.valid = false;
            map.getSource("src-houses").setData(empty);
            map.getSource("src-trees").setData(empty);
        }
        return;
    }

    syncVectorTilesToChunks();

    const b = map.getBounds();
    const vLat = b.getNorth() - b.getSouth();
    const vLon = b.getEast() - b.getWest();
    const detailHi = z >= LANDSCAPE_DETAIL_ZOOM;

    // Tjek om nuværende skærm + sikkerhedsmargin allerede ligger trygt inde i den tegnede buffer
    if (!force && renderedLandscapeWin.valid &&
        renderedLandscapeWin.detailHi === detailHi &&
        renderedLandscapeWin.tileGen === landscapeTileGen) {
        const safeLat = Math.max(vLat * 0.32, CHUNK_LAT * 0.45);
        const safeLon = Math.max(vLon * 0.32, CHUNK_LON * 0.45);
        if (b.getSouth() - safeLat >= renderedLandscapeWin.south &&
            b.getNorth() + safeLat <= renderedLandscapeWin.north &&
            b.getWest() - safeLon >= renderedLandscapeWin.west &&
            b.getEast() + safeLon <= renderedLandscapeWin.east) {
            return;
        }
    }

    // Tilpas forudindlæsnings-buffer rundt om skærmen (~65% skærmbredde uden for alle kanter)
    const padFactor = z >= 16.8 ? 0.68 : z >= 15.8 ? 0.50 : 0.34;
    const padLat = Math.max(vLat * padFactor, CHUNK_LAT * 0.95);
    const padLon = Math.max(vLon * padFactor, CHUNK_LON * 0.95);

    let cx0 = Math.floor((b.getWest() - padLon) / CHUNK_LON);
    let cx1 = Math.floor((b.getEast() + padLon) / CHUNK_LON);
    let cy0 = Math.floor((b.getSouth() - padLat) / CHUNK_LAT);
    let cy1 = Math.floor((b.getNorth() + padLat) / CHUNK_LAT);

    // Sikr rimeligt loft ved lavt zoom (~15.0)
    const maxSpanX = 17, maxSpanY = 15;
    if (cx1 - cx0 > maxSpanX) {
        const midX = (cx0 + cx1) >> 1;
        cx0 = midX - (maxSpanX >> 1);
        cx1 = cx0 + maxSpanX;
    }
    if (cy1 - cy0 > maxSpanY) {
        const midY = (cy0 + cy1) >> 1;
        cy0 = midY - (maxSpanY >> 1);
        cy1 = cy0 + maxSpanY;
    }

    if (!force && renderedLandscapeWin.valid &&
        renderedLandscapeWin.cx0 === cx0 && renderedLandscapeWin.cx1 === cx1 &&
        renderedLandscapeWin.cy0 === cy0 && renderedLandscapeWin.cy1 === cy1 &&
        renderedLandscapeWin.detailHi === detailHi &&
        renderedLandscapeWin.tileGen === landscapeTileGen) {
        return;
    }

    // Saml 2×2 nabofelter (~670×670 m stor-felter) i MultiPolygon / MultiLineString,
    // så MapLibres Web Worker kun skal indeksere ~80-220 samlede objekter i stedet for 15.000-40.000.
    const superBuckets = new Map();
    const treeFeatures = [];

    const mergePolysInto = (srcMap, dstPolys) => {
        for (const [key, polyArr] of srcMap.entries()) {
            let acc = dstPolys.get(key);
            if (!acc) { acc = []; dstPolys.set(key, acc); }
            for (let i = 0; i < polyArr.length; i++) acc.push(polyArr[i]);
        }
    };

    for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
            const ch = buildFullChunk3D(cx, cy);
            const sk = (cx >> 2) + ":" + (cy >> 2);
            let sb = superBuckets.get(sk);
            if (!sb) {
                sb = { polys: new Map(), lines: new Map() };
                superBuckets.set(sk, sb);
            }
            mergePolysInto(ch.corePolys, sb.polys);
            if (detailHi) mergePolysInto(ch.detailPolys, sb.polys);

            for (const [lKey, lineArr] of ch.lines.entries()) {
                let acc = sb.lines.get(lKey);
                if (!acc) { acc = []; sb.lines.set(lKey, acc); }
                for (let i = 0; i < lineArr.length; i++) acc.push(lineArr[i]);
            }

            if (treeFeatures.length < TREE_MAX) {
                for (let i = 0; i < ch.treesLo.length && treeFeatures.length < TREE_MAX; i++) {
                    treeFeatures.push(ch.treesLo[i]);
                }
                if (detailHi) {
                    for (let i = 0; i < ch.treesHi.length && treeFeatures.length < TREE_MAX; i++) {
                        treeFeatures.push(ch.treesHi[i]);
                    }
                }
            }
        }
    }

    const houseFeatures = [];
    for (const sb of superBuckets.values()) {
        for (const [key, coords] of sb.polys.entries()) {
            const p1 = key.indexOf("|");
            const p2 = key.indexOf("|", p1 + 1);
            const k = key.slice(0, p1);
            const c = key.slice(p1 + 1, p2);
            const o = Number(key.slice(p2 + 1));
            const props = { k };
            if (c) props.c = c;
            if (o) props.o = o;
            houseFeatures.push({
                type: "Feature",
                properties: props,
                geometry: { type: "MultiPolygon", coordinates: coords }
            });
        }
        for (const [lKey, coords] of sb.lines.entries()) {
            const p1 = lKey.indexOf("|");
            houseFeatures.push({
                type: "Feature",
                properties: { k: "line", c: lKey.slice(0, p1), w: Number(lKey.slice(p1 + 1)) },
                geometry: { type: "MultiLineString", coordinates: coords }
            });
        }
    }

    renderedLandscapeWin = {
        valid: true,
        cx0, cx1, cy0, cy1,
        south: cy0 * CHUNK_LAT,
        north: (cy1 + 1) * CHUNK_LAT,
        west: cx0 * CHUNK_LON,
        east: (cx1 + 1) * CHUNK_LON,
        detailHi,
        tileGen: landscapeTileGen
    };
    lastLandscapeMovePushMs = performance.now();

    map.getSource("src-houses").setData({ type: "FeatureCollection", features: houseFeatures });
    map.getSource("src-trees").setData({ type: "FeatureCollection", features: treeFeatures });
}

function refreshHouses() { refreshLandscape3D(false); }
function refreshTrees() { refreshLandscape3D(false); }

// ============================================================================
// Spillernes bygninger: tegnes direkte på græsset i samme stil som kortets huse
// (sol fra nordvest, slagskygge mod sydøst, mur mod syd, valm-/sadel-/flade tage).
// Alt tegnes i lokale meter fra pladsens nordvesthjørne (x mod øst, y mod syd) og
// lægges i ét fill-lag, hvor "z" bestemmer rækkefølgen (jord → skygge → mur → tag → røg).
// ============================================================================
const CP_SHADOW = "#1a202e";
const CP_APRON = "#cbc3b4";
const CP_PAL = {
    olive: { light: "#a7ae76", midL: "#8f9862", midD: "#79814f", dark: "#5d643a", trim: "#e6e2d0", wallM: "#c4bea8" },
    tent:  { light: "#c2b98a", midL: "#aea574", midD: "#958d60", dark: "#7a7249", trim: "#d6cfae", wallM: "#9d9572" },
    wtent: { light: "#ecebe4", midL: "#dcd9ce", midD: "#c7c3b5", dark: "#ada899", trim: "#ffffff", wallM: "#bdb8a8" },
    slate: { light: "#6f7484", midL: "#5d6270", midD: "#4b4f5d", dark: "#393c48", trim: "#ebe7df", wallM: "#d6cfc2" },
    white: { deck: "#f1f2ef", inner: "#bfc3c0", trim: "#ffffff", wallM: "#d9dcd8" },
    steel: { deck: "#7d8391", inner: "#5c616d", trim: "#cfd3d9", wallM: "#a7adb6" },
    conc:  { deck: "#b3b8bf", inner: "#868c95", trim: "#e3e6ea", wallM: "#c1c6cc" },
    crate: { deck: "#7b8450", inner: "#5f673b", trim: "#9aa36a", wallM: "#626a3d" }
};

// Tegneværktøj: k skalerer tegningens enheder (designet til 30/60/100 m) til bygningens rigtige størrelse.
function makeCompoundPainter(k) {
    const out = [];
    const P = {
        out,
        poly(z, pts, c, o = "", a = 1) { out.push({ z, c, o, a, ring: pts.map(([x, y]) => [x * k, y * k]) }); },
        rect(z, x, y, w, h, c, o, a) { P.poly(z, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c, o, a); },
        // En streg tegnes som smalle firkanter (så alt kan ligge i samme lag og rækkefølge).
        seg(z, pts, w, c, a = 1) {
            for (let i = 0; i + 1 < pts.length; i++) {
                const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
                const len = Math.hypot(x2 - x1, y2 - y1) || 1;
                const nx = -(y2 - y1) / len * w / 2, ny = (x2 - x1) / len * w / 2;
                P.poly(z, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], c, "", a);
            }
        },
        circ(z, x, y, r, c, o, a, n = 18) {
            const pts = [];
            for (let i = 0; i < n; i++) { const t = i / n * 2 * Math.PI; pts.push([x + Math.cos(t) * r, y + Math.sin(t) * r]); }
            P.poly(z, pts, c, o, a);
        },
        // Som kortets huse: murhøjde = 40 % af højden, skygge 1,15 × den mod øst og 1,8 × den mod syd.
        shadow(x, y, w, h, ht) {
            const wh = ht * 0.4, dx = wh * 1.15, dy = wh * 1.8;
            P.poly(2, [[x, y + h], [x, y], [x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + dx, y + h + dy]], CP_SHADOW, "", 0.62);
        },
        // Et hus: slagskygge, sydmur med døre, tagkant og tag (hip/gable/flat/saw).
        // Belagt areal (som terrasserne ved kortets huse) – overlappende arealer flyder sammen.
        apron(x, y, w, h) { P.rect(0, x, y, w, h, CP_APRON, "#948d80"); },
        box(x, y, w, h, opt) {
            const ht = opt.ht || 6, pal = opt.pal, wh = Math.min(ht * 0.3, 2.5);
            if (!opt.bare) { const m = Math.min(2.5, Math.max(0.8, ht * 0.25)); P.apron(x - m, y - m, w + 2 * m, h + wh + 2 * m); }
            P.shadow(x, y, w, h, ht);
            P.rect(3, x, y + h, w, wh, pal.wallM, "#252934");
            for (let i = 0; i < (opt.doors || 0); i++) {
                const dx = x + w * (i + 0.5) / opt.doors;
                P.rect(3.5, dx - 0.7, y + h + wh * 0.3, 1.4, wh * 0.7, "#4a4d55");
            }
            P.rect(4, x, y, w, h, pal.trim, "#262a34");
            const t = 0.5, X0 = x + t, X1 = x + w - t, Y0 = y + t, Y1 = y + h - t;
            if (opt.roof === "flat") {
                P.rect(5, X0 + 0.4, Y0 + 0.4, X1 - X0 - 0.8, Y1 - Y0 - 0.8, pal.deck, "#555862");
                P.rect(6, X0 + 0.4, Y0 + 0.4, X1 - X0 - 0.8, 0.7, pal.inner);
                P.rect(6, X0 + 0.4, Y0 + 0.4, 0.7, Y1 - Y0 - 0.8, pal.inner);
                if (opt.sky) {
                    const n = Math.floor((X1 - X0 - 3) / 4);
                    for (let i = 0; i < n; i++) P.rect(6, X0 + 2 + i * 4, (Y0 + Y1) / 2 - 1.2, 2.2, 2.4, "#7fa0b8", "#dce4ec");
                }
                return;
            }
            if (opt.roof === "saw") {
                P.rect(5, X0, Y0, X1 - X0, Y1 - Y0, "#6b7080", "#3a3d46");
                for (let yy = Y0; yy < Y1 - 0.5; yy += 3.6) {
                    const hh = Math.min(2.8, Y1 - yy - 0.8);
                    if (hh <= 0) break;
                    P.rect(6, X0, yy + 0.8, X1 - X0, hh * 0.5, "#9096a3");
                    P.rect(6, X0, yy + 0.8 + hh * 0.5, X1 - X0, hh * 0.5, "#6b7080");
                    P.rect(6, X0, yy, X1 - X0, 0.8, "#8fb3cc");
                    P.seg(6.5, [[X0, yy + 0.8], [X1, yy + 0.8]], 0.18, "#3a3d46");
                }
                return;
            }
            const gable = opt.roof === "gable";
            if (w >= h) {
                const cy = (Y0 + Y1) / 2, hip = gable ? 0.15 : (Y1 - Y0) / 2 * 0.9, R1 = X0 + hip, R2 = X1 - hip;
                P.poly(5, [[X0, Y0], [X1, Y0], [R2, cy], [R1, cy]], pal.light);
                P.poly(5, [[X0, Y1], [R1, cy], [R2, cy], [X1, Y1]], pal.midD);
                P.poly(5, [[X0, Y0], [R1, cy], [X0, Y1]], pal.midL);
                P.poly(5, [[X1, Y0], [X1, Y1], [R2, cy]], pal.dark);
                P.seg(6, [[R1, cy], [R2, cy]], 0.35, pal.trim);
                if (!gable) {
                    P.seg(6, [[X0, Y0], [R1, cy], [X0, Y1]], 0.22, pal.trim);
                    P.seg(6, [[X1, Y0], [R2, cy], [X1, Y1]], 0.22, pal.trim);
                }
            } else {
                const cx = (X0 + X1) / 2, hip = gable ? 0.15 : (X1 - X0) / 2 * 0.9, R1 = Y0 + hip, R2 = Y1 - hip;
                P.poly(5, [[X0, Y0], [cx, R1], [cx, R2], [X0, Y1]], pal.midL);
                P.poly(5, [[X1, Y0], [X1, Y1], [cx, R2], [cx, R1]], pal.dark);
                P.poly(5, [[X0, Y0], [X1, Y0], [cx, R1]], pal.light);
                P.poly(5, [[X0, Y1], [cx, R2], [X1, Y1]], pal.midD);
                P.seg(6, [[cx, R1], [cx, R2]], 0.35, pal.trim);
                if (!gable) {
                    P.seg(6, [[X0, Y0], [cx, R1], [X1, Y0]], 0.22, pal.trim);
                    P.seg(6, [[X0, Y1], [cx, R2], [X1, Y1]], 0.22, pal.trim);
                }
            }
        },
        tent(x, y, w, h, pal) { P.box(x, y, w, h, { ht: 2.2, pal: pal || CP_PAL.tent, roof: "gable" }); },
        crates(x, y, n, m) {
            P.apron(x - 0.8, y - 0.8, n * 2.2 + 1.3, m * 2.2 + 1.3);
            for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
                P.box(x + i * 2.2, y + j * 2.2, 1.9, 1.9, { ht: 1.3, pal: CP_PAL.crate, roof: "flat", bare: true });
            }
        },
        truck(x, y) {
            P.apron(x - 0.8, y - 0.8, 8.6, 4.2);
            P.shadow(x, y, 7, 2.6, 1.6);
            P.rect(5, x, y, 5.2, 2.6, "#6d7646", "#2b2e22");
            P.rect(5, x + 5.2, y + 0.2, 1.8, 2.2, "#59613a", "#2b2e22");
            P.rect(6, x + 6.2, y + 0.4, 0.6, 1.8, "#8fb3cc");
        },
        pile(x, y, r, c) {
            P.circ(0, x + 0.4, y + 0.4, r + 1.6, "#a89c80");
            P.circ(2, x + 1.2, y + 1.6, r, CP_SHADOW, "", 0.62);
            P.circ(5, x, y, r, c);
            P.circ(6, x - r * 0.3, y - r * 0.3, r * 0.5, "#ffffff", "", 0.18);
        },
        smoke(x, y, size) {
            for (let i = 0; i < 4; i++) {
                P.circ(8, x + (2 + i * 2.6) * size, y - (2 + i * 2.2) * size, (1.4 + i * 0.6) * size, "#eeeeee", "", 0.72 - i * 0.15);
            }
        },
        chimney(x, y, r, ht) {
            P.seg(2, [[x, y], [x + ht * 0.46, y + ht * 0.72]], r * 2, CP_SHADOW, 0.62);
            P.circ(7, x, y, r, "#a0968a", "#3b3a38");
            P.circ(7.5, x, y, r * 0.55, "#2a2a2a");
            P.smoke(x, y, 1);
        },
        flag(x, y, team) {
            P.seg(2, [[x, y], [x + 1.6, y + 2.2]], 0.35, CP_SHADOW, 0.62);
            P.rect(7, x, y - 2.6, 2.6, 1.6, team, "#1e2a12");
            P.seg(7.5, [[x, y], [x, y - 2.6]], 0.25, "#e8e8e8");
            P.circ(7.5, x, y, 0.35, "#dddddd", "#333333");
        }
    };
    return P;
}

function drawBarracksCompound(P, lv, team) {
    const pal = CP_PAL.olive;
    if (lv <= 1) {
        P.tent(5, 6, 5, 3.6); P.tent(13, 6, 5, 3.6); P.tent(21, 6, 5, 3.6);
        P.circ(1.5, 15, 18, 1.1, "#5b4636"); P.circ(1.6, 15, 18, 0.6, "#f2a541");
        P.crates(5, 20, 2, 1);
    } else if (lv === 2) {
        for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) P.tent(4 + i * 8, 5 + r * 10, 6.5, 4.5);
        P.crates(5, 24, 3, 1); P.truck(17, 24);
    } else if (lv === 3) {
        P.box(4, 4, 22, 6.5, { ht: 5, pal, doors: 3 });
        P.box(4, 16, 22, 6.5, { ht: 5, pal, doors: 3 });
    } else if (lv === 4) {
        P.box(3, 3, 24, 7, { ht: 6, pal, doors: 4 });
        P.box(19, 11, 8, 15, { ht: 6, pal });
        P.tent(4, 15, 6, 4); P.crates(4, 23, 3, 1);
    } else {
        P.rect(1, 11, 13, 8, 12, "#a6a08b");
        P.box(3, 3, 24, 6.5, { ht: 7, pal, doors: 4 });
        P.box(3, 10, 6.5, 16, { ht: 7, pal });
        P.box(20.5, 10, 6.5, 16, { ht: 7, pal });
    }
    P.flag(3, 28.5, team);
}

function drawRedCross(P, cx, cy, s) {
    P.rect(6.5, cx - s * 0.25, cy - s * 0.5, s * 0.5, s, "#d8322f");
    P.rect(6.5, cx - s * 0.5, cy - s * 0.25, s, s * 0.5, "#d8322f");
}

function drawHelipad(P, cx, cy) {
    P.circ(1, cx, cy, 4, "#8d8f8a", "#e8e8e8");
    P.rect(1.5, cx - 1.4, cy - 1.6, 0.6, 3.2, "#f0f0f0");
    P.rect(1.5, cx + 0.8, cy - 1.6, 0.6, 3.2, "#f0f0f0");
    P.rect(1.5, cx - 0.8, cy - 0.3, 1.6, 0.6, "#f0f0f0");
}

function drawHospitalCompound(P, lv, team) {
    if (lv <= 2) {
        P.tent(4, 5, 9, 5.5, CP_PAL.wtent); drawRedCross(P, 8.5, 7.75, 2.6);
        P.tent(17, 5, 9, 5.5, CP_PAL.wtent); drawRedCross(P, 21.5, 7.75, 2.6);
        if (lv === 2) { P.tent(4, 16, 9, 5.5, CP_PAL.wtent); drawRedCross(P, 8.5, 18.75, 2.6); P.truck(17, 19); }
    } else {
        if (lv >= 4) P.box(4, 4, 22, 11, { ht: 7, pal: CP_PAL.white, roof: "flat", doors: 3 });
        else P.box(4, 4, 22, 11, { ht: 6, pal: CP_PAL.white, roof: "flat", doors: 2 });
        drawRedCross(P, 15, 9.5, 7);
        if (lv >= 5) P.box(4, 18, 10, 8, { ht: 6, pal: CP_PAL.white, roof: "flat", doors: 1 });
        else P.tent(4, 20, 7, 4.5, CP_PAL.wtent);
        drawHelipad(P, 21, 23);
    }
    P.flag(3, 28.5, team);
}

function drawAcademyCompound(P, lv, team) {
    // Skydebane: en lille skydeplads, smalle slidte baner i græsset, skiver og en jordvold bagved.
    P.apron(3.5, 14, 3, 12);
    for (let i = 0; i < 4; i++) {
        const y = 15.5 + i * 3;
        P.rect(1, 6.5, y - 0.45, 17.5, 0.9, "#b9b08a", "", 0.75);
        P.rect(5, 4.4, y - 0.5, 1.2, 1, "#5d643a"); // skytte-måtte
        P.circ(6, 24.6, y, 0.9, "#ffffff", "#cc3333");
        P.circ(6.5, 24.6, y, 0.35, "#cc3333");
    }
    P.poly(2, [[27.4, 14.4], [28.4, 15.8], [28.4, 28.4], [25.8, 27.4]], CP_SHADOW, "", 0.45);
    P.poly(5, [[25.8, 13.6], [27.4, 14.4], [27.4, 26.6], [25.8, 27.4]], "#8a7550", "#5e4f36");
    if (lv <= 1) {
        P.tent(4, 4, 6, 4); P.crates(13, 4, 2, 1);
    } else if (lv === 2) {
        P.tent(4, 4, 6, 4); P.tent(12, 4, 6, 4); P.crates(21, 4, 2, 2);
    } else {
        P.box(4, 3, 15, 6, { ht: 5, pal: CP_PAL.olive, doors: 2 });
        if (lv >= 4) P.box(21, 3, 6, 7, { ht: 5, pal: CP_PAL.slate, doors: 1 });
        else P.box(21, 3, 6, 6, { ht: 3, pal: CP_PAL.tent, roof: "gable" });
    }
    if (lv >= 5) P.crates(4, 10.5, 4, 1);
    P.flag(3, 28.5, team);
}

function drawSteelCompound(P, lv, team) {
    if (lv <= 1) {
        P.box(30, 30, 24, 16, { ht: 7, pal: CP_PAL.slate, doors: 2 });
        P.chimney(56, 32, 1.2, 14);
        P.pile(36, 62, 4, "#3a3a3d"); P.pile(48, 64, 3.5, "#5a4434");
    } else {
        P.box(8, 10, 44, 26, { ht: 12, pal: CP_PAL.steel, roof: "saw", doors: 3 });
        P.chimney(56, 16, 1.6, 26);
        if (lv >= 3) {
            P.box(8, 46, 44, 22, { ht: 12, pal: CP_PAL.steel, roof: "saw", doors: 3 });
            P.box(62, 12, 26, 16, { ht: 9, pal: CP_PAL.conc, roof: "flat", doors: 2 });
            P.chimney(56, 52, 1.6, 22);
        } else {
            P.box(62, 14, 20, 12, { ht: 7, pal: CP_PAL.slate, doors: 1 });
        }
        P.pile(64, 75, 5, "#5a4434"); P.pile(75, 77, 4, "#3a3a3d");
        if (lv >= 3) P.pile(86, 74, 4.5, "#8b5a3c");
        if (lv >= 4) {
            // Køletårn med damp
            P.circ(2, 79, 49, 9.5, CP_SHADOW, "", 0.62);
            P.circ(5, 77, 46, 9, "#c9c4ba", "#3b3a38");
            P.circ(6, 77, 46, 6.5, "#9b968c");
            P.smoke(76, 40, 1.8);
        }
        P.truck(20, 76);
        if (lv >= 5) { P.truck(30, 76); P.chimney(56, 34, 1.4, 24); }
    }
    P.flag(3, 98, team);
}

function drawFactoryCompound(P, lv, team) {
    if (lv <= 1) {
        P.box(8, 8, 20, 12, { ht: 6, pal: CP_PAL.slate, doors: 2 });
        P.crates(32, 10, 3, 2);
    } else {
        P.box(5, 5, lv >= 3 ? 40 : 28, 16, { ht: 9, pal: CP_PAL.conc, roof: "flat", sky: true, doors: lv >= 3 ? 4 : 3 });
        P.box(5, 30, 18, 12, { ht: 6, pal: CP_PAL.slate, doors: 1 });
    }
    P.crates(28, 30, lv >= 3 ? 5 : 3, lv >= 2 ? 3 : 1);
    if (lv >= 3) P.crates(28, 40, 3, 2);
    if (lv >= 2) P.truck(44, 48);
    if (lv >= 4) { P.truck(44, 42); P.box(48, 6, 8, 8, { ht: 5, pal: CP_PAL.olive }); }
    if (lv >= 5) P.box(5, 46, 18, 10, { ht: 6, pal: CP_PAL.olive, doors: 2 });
    P.flag(3, 58, team);
}

const COMPOUND_DRAW = {
    barracks: [drawBarracksCompound, 30],
    hospital: [drawHospitalCompound, 30],
    academy: [drawAcademyCompound, 30],
    steel_mill: [drawSteelCompound, 100],
    weapons_factory: [drawFactoryCompound, 60]
};

// Tegningen afhænger kun af type, trin og farve: gem den i meter, og flyt den bare til hver bygning.
const compoundShapeCache = new Map();
function compoundShapes(kind, level, team, size) {
    const key = kind + "|" + level + "|" + team + "|" + size;
    let shapes = compoundShapeCache.get(key);
    if (shapes) return shapes;
    const [draw, base] = COMPOUND_DRAW[kind] || COMPOUND_DRAW.barracks;
    const P = makeCompoundPainter(size / base);
    draw(P, Math.max(1, Math.min(5, level || 1)), team);
    shapes = P.out;
    compoundShapeCache.set(key, shapes);
    return shapes;
}

// Samler alle synlige bygningers figurer i få MultiPolygon-objekter (ét pr. lag/farve).
function compoundFeatures(buildings, teamColor) {
    const groups = new Map();
    const mPerLat = EARTH_RADIUS_M * RAD_PER_DEG;
    for (const b of buildings) {
        const size = buildingSize(b.kind);
        const mPerLon = mPerLat * Math.max(Math.cos(b.lat * RAD_PER_DEG), MIN_COS);
        const half = size / 2;
        const toLL = ([x, y]) => [b.lon + (x - half) / mPerLon, b.lat + (half - y) / mPerLat];
        for (const s of compoundShapes(b.kind, b.level, teamColor(b), size)) {
            const gk = s.z + "|" + s.c + "|" + s.o + "|" + s.a;
            let g = groups.get(gk);
            if (!g) { g = { s, polys: [] }; groups.set(gk, g); }
            const ring = s.ring.map(toLL);
            ring.push(ring[0]);
            g.polys.push([ring]);
        }
    }
    const features = [];
    for (const { s, polys } of groups.values()) {
        const props = { z: s.z, c: s.c, a: s.a };
        if (s.o) props.o = s.o;
        features.push({ type: "Feature", properties: props, geometry: { type: "MultiPolygon", coordinates: polys } });
    }
    return features;
}

// Grøn = din, allieret farve, ellers fjendens pink (samme som omridset på kortet).
function buildingOwnerColor(b) {
    if (state.user && b.owner_id === state.user.id) return "#39FF14";
    return isAlly(b.owner_id) ? allyColor(b.owner_id) : "#FF2E88";
}

// Samme tegning som på kortet, som billede til oversigten og infovinduerne (gemmes pr. type/trin/farve).
const buildingImageCache = new Map();
function buildingImageUrl(kind, level, team = "#39FF14") {
    const key = kind + "|" + level + "|" + team;
    let url = buildingImageCache.get(key);
    if (url) return url;
    const px = 160, pad = 10, size = buildingSize(kind);
    const k = (px - 2 * pad) / size;
    const cv = document.createElement("canvas");
    cv.width = cv.height = px;
    const g = cv.getContext("2d");
    g.fillStyle = "#739e48";
    g.fillRect(0, 0, px, px);
    const shapes = compoundShapes(kind, level, team, size).map((sh, i) => [sh, i]).sort((a, b) => a[0].z - b[0].z || a[1] - b[1]);
    for (const [sh] of shapes) {
        g.beginPath();
        sh.ring.forEach(([x, y], i) => i ? g.lineTo(pad + x * k, pad + y * k) : g.moveTo(pad + x * k, pad + y * k));
        g.closePath();
        g.globalAlpha = sh.a;
        g.fillStyle = sh.c;
        g.fill();
        if (sh.o) { g.strokeStyle = sh.o; g.lineWidth = 0.8; g.stroke(); }
    }
    g.globalAlpha = 1;
    url = cv.toDataURL("image/png");
    buildingImageCache.set(key, url);
    return url;
}

// ----------------------------------------------------------------------------
// Kortets huse og træer ryddes inden for spillernes bygninger.
// ----------------------------------------------------------------------------
let clearedSquares = [];          // [{ minLat, maxLat, minLon, maxLon }]
let clearedSquaresSig = "";

function bboxCleared(minLat, maxLat, minLon, maxLon) {
    for (let i = 0; i < clearedSquares.length; i++) {
        const q = clearedSquares[i];
        if (maxLon >= q.minLon && minLon <= q.maxLon && maxLat >= q.minLat && minLat <= q.maxLat) return true;
    }
    return false;
}

function updateClearedSquares(buildings) {
    const sig = buildings.map(b => b.kind + "@" + b.lat.toFixed(6) + "," + b.lon.toFixed(6)).sort().join(";");
    if (sig === clearedSquaresSig) return;
    const touched = [...clearedSquares];
    clearedSquares = buildings.map(b => {
        const ring = Geo.squareRing(b.lat, b.lon, buildingSize(b.kind));
        return { minLon: ring[0][0], maxLon: ring[1][0], minLat: ring[0][1], maxLat: ring[2][1] };
    });
    clearedSquaresSig = sig;
    touched.push(...clearedSquares);
    for (const q of touched) {
        const cx0 = Math.floor(q.minLon / CHUNK_LON) - 1, cx1 = Math.floor(q.maxLon / CHUNK_LON) + 1;
        const cy0 = Math.floor(q.minLat / CHUNK_LAT) - 1, cy1 = Math.floor(q.maxLat / CHUNK_LAT) + 1;
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) invalidateChunkAndNeighbors(cx, cy);
    }
    if (mapReady) refreshLandscape3D(true);
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
    map.addSource("src-parked-trucks", { type: "geojson", data: empty });
    map.addSource("src-mortar-aim", { type: "geojson", data: empty });
    map.addSource("src-fire-areas", { type: "geojson", data: empty });
    map.addSource("src-fire-flames", { type: "geojson", data: empty });
    map.addSource("src-street-rings", { type: "geojson", data: empty });
    map.addSource("src-los-blocked", { type: "geojson", data: empty });
    map.addSource("src-street-units", { type: "geojson", data: empty });
    map.addSource("src-street-badges", { type: "geojson", data: empty });

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

    // Udbrændte lastbiler: overbliks-størrelse når zoomet ud (< 16), gade-størrelse tæt på (>= 16).
    map.addLayer({
        id: "lyr-wrecks",
        type: "symbol",
        source: "src-wrecks",
        maxzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": "img-wreck",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        },
        paint: { "icon-opacity": ["get", "op"] }
    });
    map.addLayer({
        id: "lyr-wrecks-street",
        type: "symbol",
        source: "src-wrecks",
        minzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": "img-wreck",
            "icon-size": ["interpolate", ["exponential", 2], ["zoom"], 16, 0.64, 17, 0.73, 18, 0.88, 20, 1.82, 22, 7.3], // v118: samme størrelse som lastbilerne (streetUnitScaleProps)
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        },
        paint: { "icon-opacity": ["get", "op"] }
    });

    // Tomme lastbiler, som soldaterne er steget af (0038): overbliks-ikon under zoom 16.
    map.addLayer({
        id: "lyr-parked-trucks",
        type: "symbol",
        source: "src-parked-trucks",
        maxzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": ["get", "img"],
            "icon-anchor": "bottom-left",
            "icon-offset": ["get", "off"],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
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
            "line-color": ["get", "c"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1.5, 16, 1],
            // Tydelig i overblikket, diskret tæt på, så bygningerne ikke ligner firkanter på kortet.
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.75, 16, 0.3, 18, 0.2]
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
    // Spillernes bygninger: tegnet som anlæg i kortets egen stil (se compoundFeatures).
    // Ligger under bogmærker og omrids, så de stadig kan ses oven på pladsen.
    map.addLayer({
        id: "lyr-buildings",
        type: "fill",
        source: "src-buildings",
        layout: { "fill-sort-key": ["get", "z"] },
        paint: {
            "fill-color": ["get", "c"],
            "fill-opacity": ["get", "a"],
            "fill-outline-color": ["coalesce", ["get", "o"], ["get", "c"]]
        }
    }, "lyr-bookmarks-fill");
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

    // Taktisk markering på gadeniveau (zoom 16+): ring om valgte/kæmpende grupper og spærrede skudlinjer ved huse
    map.addLayer({
        id: "lyr-street-rings",
        type: "line",
        source: "src-street-rings",
        minzoom: STREET_TACTICAL_ZOOM,
        paint: {
            "line-color": ["get", "c"],
            "line-width": ["case", ["boolean", ["get", "sel"], false], 2.4, 1.6],
            "line-dasharray": [2, 1.6],
            "line-opacity": ["case", ["boolean", ["get", "sel"], false], 0.9, 0.55]
        }
    });
    map.addLayer({
        id: "lyr-los-blocked",
        type: "line",
        source: "src-los-blocked",
        minzoom: STREET_TACTICAL_ZOOM,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
            "line-color": "#FFB74D",
            "line-width": 1.6,
            "line-dasharray": [2, 2.5],
            "line-opacity": 0.62
        }
    });
    map.addLayer({
        id: "lyr-los-blocked-dot",
        type: "circle",
        source: "src-los-blocked",
        minzoom: STREET_TACTICAL_ZOOM,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
            "circle-color": "#FF7043",
            "circle-stroke-color": "#11161C",
            "circle-stroke-width": 1.5,
            "circle-radius": 3.5,
            "circle-opacity": 0.85
        }
    });

    // Geværild mellem dine soldater og fjender med fri skudlinje: lysspor og mundingsglimt.
    map.addLayer({
        id: "lyr-shots",
        type: "line",
        source: "src-shots",
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "round" },
        paint: {
            "line-color": ["match", ["get", "from"], "npc", "#FF6E40", "#FFF176"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 13, 3, 16, 2.6, 17.5, 2.1, 20, 3.0],
            "line-blur": 0.8,
            "line-opacity": 0.95
        }
    });
    map.addLayer({
        id: "lyr-shot-smoke",
        type: "circle",
        source: "src-shots",
        minzoom: STREET_TACTICAL_ZOOM,
        filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "smoke"]],
        paint: {
            "circle-color": "#D2D0C6",
            "circle-radius": ["interpolate", ["linear"], ["zoom"],
                16, ["*", ["get", "r"], 0.7],
                18, ["get", "r"],
                20, ["*", ["get", "r"], 1.6]
            ],
            "circle-blur": 0.7,
            "circle-opacity": ["get", "o"]
        }
    }, "lyr-shots");
    map.addLayer({
        id: "lyr-shot-flash",
        type: "circle",
        source: "src-shots",
        filter: ["all", ["==", ["geometry-type"], "Point"], ["!", ["has", "smoke"]]],
        paint: {
            "circle-color": "#FFE082",
            "circle-radius": ["get", "r"],
            "circle-blur": 0.5,
            "circle-opacity": 0.92
        }
    });

    // Overbliks-ikoner (store soldater og køretøjer) når man er zoomet ud (< zoom 16)
    map.addLayer({
        id: "lyr-troops",
        type: "symbol",
        source: "src-troops",
        maxzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": ["get", "img"],
            "icon-anchor": "bottom",
            "icon-offset": ["coalesce", ["get", "off"], ["literal", [0, 0]]],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
    });

    // Gade-niveau (zoom 16+): individuelle små soldater og køretøjer i formation nede på gaderne
    map.addLayer({
        id: "lyr-street-units",
        type: "symbol",
        source: "src-street-units",
        minzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": ["get", "img"],
            "icon-anchor": "center",
            "icon-size": ["interpolate", ["exponential", 2], ["zoom"],
                16, ["get", "s16"],
                17, ["get", "s17"],
                18, ["get", "s18"],
                20, ["get", "s20"],
                22, ["get", "s22"]
            ],
            "icon-rotate": ["coalesce", ["get", "rot"], 0],
            "icon-rotation-alignment": "map",
            "icon-pitch-alignment": "map",
            "symbol-sort-key": ["coalesce", ["get", "sort"], 0],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
        }
    });

    // Kompakt svævende tal- og energimærke over hver deling på gadeniveau (zoom 16+)
    map.addLayer({
        id: "lyr-street-badges",
        type: "symbol",
        source: "src-street-badges",
        minzoom: STREET_TACTICAL_ZOOM,
        layout: {
            "icon-image": ["get", "img"],
            "icon-anchor": "bottom",
            "icon-offset": ["coalesce", ["get", "off"], ["literal", [0, -14]]],
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

    try {
        installFlagLayers();
    } catch (err) {
        console.warn("Flag-lagene kunne ikke tilføjes:", err);
    }
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
    state.visibleBuildings = [...state.myBuildings, ...state.allies.buildings, ...state.enemies.buildings];

    updateClearedSquares(state.visibleBuildings);
    map.getSource("src-buildings")?.setData({
        type: "FeatureCollection",
        features: compoundFeatures(state.visibleBuildings, buildingOwnerColor)
    });
    map.getSource("src-footprints")?.setData({
        type: "FeatureCollection",
        features: state.visibleBuildings.map(b =>
            squareFeature(b.lat, b.lon, buildingSize(b.kind), { c: buildingOwnerColor(b) }))
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

// En haubits i stilling uden lastbil tegnes ved siden af soldaten.
let howitzerImg = null;
const howitzerImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { howitzerImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/haubits.png";
});

// Fjender (patruljer og andre spilleres soldater) tegnes i rød uniform.
let npcSoldierImg = null;
const npcImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { npcSoldierImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/fjende.png";
});

// Computerens soldater (patruljer, invasionen og den svenske hær) har grå uniform,
// så man kan kende dem fra andre spilleres røde.
const NPC_COLOR = "#B0BEC5";
let computerSoldierImg = null;
const computerImgPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { computerSoldierImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/npc.png";
});

// style: "own" (dine), "enemy" (andre spillere) eller "npc" (computerstyret patrulje).
// status for egne: "guard" (grøn), "patrol" (blå), "march" (orange), "combat" (rød hvis i/har været i kamp).
function troopBadgeId(count, style = "own", pct = 100, status = "guard", truck = false, facingLeft = false, hasHowitzer = false) {
    const bucket = pct >= 100 ? "100" : pct < 40 ? `red-${Math.ceil(pct / 10)}` : `orange-${Math.ceil(pct / 10)}`;
    const truckSuffix = truck ? (hasHowitzer ? (facingLeft ? "-truck-h-left" : "-truck-h") : (facingLeft ? "-truck-left" : "-truck")) : (hasHowitzer ? "-gun" : "");
    return `img-${style}-${status}-${count}-${bucket}${truckSuffix}`;
}

async function ensureTroopBadge(count, style = "own", pct = 100, status = "guard", truck = false, facingLeft = false, hasHowitzer = false) {
    const imgId = troopBadgeId(count, style, pct, status, truck, facingLeft, hasHowitzer);
    if (!mapReady || registeredTroopBadges.has(imgId)) return;
    registeredTroopBadges.add(imgId);
    await soldierImgPromise;
    // Fjender (andre spillere og patruljer) har rød uniform; kun dine egne er grønne.
    const redUniform = style === "npc" || style === "enemy";
    // Allierede: "ally-<farve uden #>"; uniformen og ringen får vennens farve.
    const allyHex = style.startsWith("ally-") ? "#" + style.slice(5) : null;
    if (redUniform) await Promise.all([npcImgPromise, computerImgPromise]);
    if (truck && hasHowitzer) await truckHowitzerImgPromise;
    if (truck) await truckImgPromise;
    if (!truck && hasHowitzer) await howitzerImgPromise;
    const gunImg = !truck && hasHowitzer ? howitzerImg : null;
    const enemyImg = style === "npc" && computerSoldierImg ? computerSoldierImg : npcSoldierImg;
    let soldierImg = truck && hasHowitzer && truckHowitzerImg ? truckHowitzerImg : (truck && truckImg ? truckImg : (redUniform && enemyImg ? enemyImg : baseSoldierImg));
    if (allyHex && !truck && soldierImg) soldierImg = tintedUniform(soldierImg, allyHex);
    if (!soldierImg) return;

    const scale = truck ? 2 : 3;
    const sw = soldierImg.width * scale;
    const sh = soldierImg.height * scale;
    // Haubitsen står til venstre for soldaten; soldaten står stadig midt på sin position.
    const gw = gunImg ? gunImg.width : 0;
    const gh = gunImg ? gunImg.height : 0;
    const text = String(count);

    const canvas = document.createElement("canvas");
    const badgeW = Math.max(34, text.length * 10 + 16);
    const badgeH = 22;
    const barH = 5;
    canvas.width = Math.max(sw, badgeW) + 8 + (gunImg ? 2 * (gw + 4) : 0);
    canvas.height = Math.max(sh, gh) + badgeH + barH + 8;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const bx = (canvas.width - badgeW) / 2;
    ctx.fillStyle = "rgba(17, 22, 28, 0.92)";

    // Farve på cirklen/mærket om tallet over hovedet:
    // Blå hvis en gruppe går patrulje, grøn hvis den står vagt, orange hvis den er på vej et sted hen,
    // og rød hvis den har været i kamp (eller fjende).
    let strokeColor = "#39FF14"; // grøn standard (står vagt)
    if (style === "npc") {
        strokeColor = NPC_COLOR; // Sverige og andre computerstyrede fjender er grå
    } else if (allyHex) {
        strokeColor = allyHex;
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
        const top = badgeH + barH + 6 + Math.max(0, gh - sh);
        ctx.drawImage(soldierImg, sx, top, sw, sh);
        if (gunImg) ctx.drawImage(gunImg, sx - gw - 4, badgeH + barH + 6 + Math.max(0, sh - gh), gw, gh);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!map.hasImage(imgId)) {
        map.addImage(imgId, { width: canvas.width, height: canvas.height, data: imageData.data });
    }
}

// Soldaten med uniformen (de grønne pixels) farvet i en allieret vens farve.
const tintCache = new Map();
function tintedUniform(img, hex) {
    const key = img.src + hex;
    if (tintCache.has(key)) return tintCache.get(key);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const tr = parseInt(hex.slice(1, 3), 16), tg = parseInt(hex.slice(3, 5), 16), tb = parseInt(hex.slice(5, 7), 16);
    for (let i = 0; i < d.data.length; i += 4) {
        const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
        if (d.data[i + 3] === 0 || !(g > r + 10 && g > b + 10)) continue;
        const light = Math.min(1.3, (r + g + b) / 3 / 110);
        d.data[i] = Math.min(255, tr * light);
        d.data[i + 1] = Math.min(255, tg * light);
        d.data[i + 2] = Math.min(255, tb * light);
    }
    ctx.putImageData(d, 0, 0);
    tintCache.set(key, c);
    return c;
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

// ============================================================================
// Bygnings-kollision, Skudlinje (Line of Sight) & Taktisk Gade-Pathfinding (v107)
// ============================================================================

function pointInRingLL(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

// Skæringspunkt t på A->B hvis A->B skærer C->D; ellers -1
function segSegIntersectT(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1x = bx - ax, d1y = by - ay;
    const d2x = dx - cx, d2y = dy - cy;
    const den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 1e-12) return -1;
    const qx = cx - ax, qy = cy - ay;
    const t = (qx * d2y - qy * d2x) / den;
    if (t < 0 || t > 1) return -1;
    const u = (qx * d1y - qy * d1x) / den;
    if (u < 0 || u > 1) return -1;
    return t;
}

function pointToSegDistSq2D(px, py, ax, ay, bx, by) {
    let x = ax, y = ay;
    let dx = bx - x, dy = by - y;
    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) { x = bx; y = by; }
        else if (t > 0) { x += dx * t; y += dy * t; }
    }
    const ex = px - x, ey = py - y;
    return ex * ex + ey * ey;
}

function segToSegDistSq2D(ax, ay, bx, by, cx, cy, dx, dy) {
    if (segSegIntersectT(ax, ay, bx, by, cx, cy, dx, dy) >= 0) return 0;
    return Math.min(
        pointToSegDistSq2D(ax, ay, cx, cy, dx, dy),
        pointToSegDistSq2D(bx, by, cx, cy, dx, dy),
        pointToSegDistSq2D(cx, cy, ax, ay, bx, by),
        pointToSegDistSq2D(dx, dy, ax, ay, bx, by)
    );
}

// Gennemløber alle kortets bygninger i rawChunks, hvis kasse overlapper det givne område
function forEachMapBuildingInBBox(minLat, maxLat, minLon, maxLon, cb) {
    const cx0 = Math.floor(minLon / CHUNK_LON) - 1;
    const cx1 = Math.floor(maxLon / CHUNK_LON) + 1;
    const cy0 = Math.floor(minLat / CHUNK_LAT) - 1;
    const cy1 = Math.floor(maxLat / CHUNK_LAT) + 1;
    if ((cx1 - cx0) * (cy1 - cy0) > 900) return false;
    for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
            const ch = rawChunks.get(cx + ":" + cy);
            if (!ch || !ch.rawBlds.length) continue;
            for (let i = 0; i < ch.rawBlds.length; i++) {
                const rb = ch.rawBlds[i];
                if (rb.maxLon < minLon || rb.minLon > maxLon || rb.maxLat < minLat || rb.minLat > maxLat) continue;
                if (bboxCleared(rb.minLat, rb.maxLat, rb.minLon, rb.maxLon)) continue;
                if (cb(rb) === true) return true;
            }
        }
    }
    return false;
}

function pointInsideMapBuilding(lat, lon, padM = 1.0) {
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    const mPerLat = 111320;
    const padLat = padM / mPerLat;
    const padLon = padM / mPerLon;
    const padSq = padM * padM;

    return forEachMapBuildingInBBox(lat - padLat, lat + padLat, lon - padLon, lon + padLon, (rb) => {
        if (pointInRingLL(lon, lat, rb.raw)) return true;
        if (padM <= 0.05) return false;
        const ring = rb.raw;
        for (let i = 0; i < ring.length - 1; i++) {
            const ax = (ring[i][0] - lon) * mPerLon, ay = (ring[i][1] - lat) * mPerLat;
            const bx = (ring[i + 1][0] - lon) * mPerLon, by = (ring[i + 1][1] - lat) * mPerLat;
            if (pointToSegDistSq2D(0, 0, ax, ay, bx, by) <= padSq) return true;
        }
        return false;
    });
}

// Afstand i meter fra et punkt til nærmeste mur på kortets huse (0 inde i et hus, maxM hvis intet hus er tættere).
function mapBuildingDistanceM(lat, lon, maxM = 6) {
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    const mPerLat = 111320;
    let bestSq = maxM * maxM;
    forEachMapBuildingInBBox(lat - maxM / mPerLat, lat + maxM / mPerLat, lon - maxM / mPerLon, lon + maxM / mPerLon, (rb) => {
        if (pointInRingLL(lon, lat, rb.raw)) { bestSq = 0; return true; }
        const ring = rb.raw;
        for (let i = 0; i < ring.length - 1; i++) {
            const ax = (ring[i][0] - lon) * mPerLon, ay = (ring[i][1] - lat) * mPerLat;
            const bx = (ring[i + 1][0] - lon) * mPerLon, by = (ring[i + 1][1] - lat) * mPerLat;
            const d = pointToSegDistSq2D(0, 0, ax, ay, bx, by);
            if (d < bestSq) bestSq = d;
        }
        return false;
    });
    return Math.sqrt(bestSq);
}

function pointInsideAnyBuilding(lat, lon, padM = 1.0, ignorePts = null) {
    if (pointInsideMapBuilding(lat, lon, padM)) return true;
    const vis = state.visibleBuildings || [];
    for (let i = 0; i < vis.length; i++) {
        const b = vis[i];
        const sz = buildingSize(b.kind);
        if (ignorePts) {
            let skip = false;
            for (let k = 0; k < ignorePts.length; k++) {
                if (Geo.pointInSquare(ignorePts[k][0], ignorePts[k][1], b.lat, b.lon, sz + 3)) {
                    skip = true;
                    break;
                }
            }
            if (skip) continue;
        }
        if (Geo.pointInSquare(lat, lon, b.lat, b.lon, sz + padM * 2)) return true;
    }
    return false;
}

// Skubber et klik på et hustag ud på nærmeste frie fortov/gade/have lige uden for muren
function snapOutsideMapBuilding(lat, lon, marginM = 2.2) {
    syncVectorTilesToChunks();
    if (!pointInsideMapBuilding(lat, lon, 1.1)) return [lat, lon];
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    const mPerLat = 111320;

    for (let dist = marginM; dist <= 26; dist += 2.2) {
        const steps = 16;
        let best = null;
        let bestRoadScore = Infinity;
        for (let s = 0; s < steps; s++) {
            const ang = (s / steps) * Math.PI * 2;
            const cLat = lat + (Math.sin(ang) * dist) / mPerLat;
            const cLon = lon + (Math.cos(ang) * dist) / mPerLon;
            if (isWaterAt(cLat, cLon)) continue;
            if (pointInsideAnyBuilding(cLat, cLon, 1.25)) continue;
            const onRoad = isNearRoadFast(cLat, cLon, 8.5);
            const score = dist - (onRoad ? 1.8 : 0);
            if (score < bestRoadScore) {
                bestRoadScore = score;
                best = [cLat, cLon];
            }
        }
        if (best) return best;
    }
    return [lat, lon];
}

// Finder første sted (t mellem 0 og 1), hvor en linje (fx skudlinje eller rutestykke) rammer en bygning.
// Returnerer null ved fri linje, eller { t, hitLat, hitLon } ved blokering.
function firstBuildingHitOnSegment(lat1, lon1, lat2, lon2, padM = 0.25, allowEndpointMapBlds = false) {
    const midLat = (lat1 + lat2) * 0.5;
    const midLon = (lon1 + lon2) * 0.5;
    const cosLat = Math.max(Math.cos(midLat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    const mPerLat = 111320;

    const ax = (lon1 - midLon) * mPerLon, ay = (lat1 - midLat) * mPerLat;
    const bx = (lon2 - midLon) * mPerLon, by = (lat2 - midLat) * mPerLat;
    const segLen = Math.hypot(bx - ax, by - ay);
    if (segLen < 0.4) return null;

    const padLat = Math.max(padM, 2) / mPerLat;
    const padLon = Math.max(padM, 2) / mPerLon;
    const minLat = Math.min(lat1, lat2) - padLat, maxLat = Math.max(lat1, lat2) + padLat;
    const minLon = Math.min(lon1, lon2) - padLon, maxLon = Math.max(lon1, lon2) + padLon;
    const padSq = padM * padM;

    let bestT = Infinity;

    const testRing = (ring) => {
        if (allowEndpointMapBlds && (pointInRingLL(lon1, lat1, ring) || pointInRingLL(lon2, lat2, ring))) {
            return;
        }
        let hitThis = false;
        for (let i = 0; i < ring.length - 1; i++) {
            const cx = (ring[i][0] - midLon) * mPerLon, cy = (ring[i][1] - midLat) * mPerLat;
            const dx = (ring[i + 1][0] - midLon) * mPerLon, dy = (ring[i + 1][1] - midLat) * mPerLat;
            const t = segSegIntersectT(ax, ay, bx, by, cx, cy, dx, dy);
            if (t >= 0.015 && t <= 0.985) {
                if (t < bestT) bestT = t;
                hitThis = true;
            } else if (padM > 0.05 && segToSegDistSq2D(ax, ay, bx, by, cx, cy, dx, dy) <= padSq) {
                if (0.5 < bestT) bestT = 0.5;
                hitThis = true;
            }
        }
        if (!hitThis && pointInRingLL(midLon, midLat, ring)) {
            if (0.5 < bestT) bestT = 0.5;
        }
    };

    forEachMapBuildingInBBox(minLat, maxLat, minLon, maxLon, (rb) => {
        testRing(rb.raw);
        return false;
    });

    // Spillernes militærbygninger (forsvarere inde i selve bygningen kan skyde/gå ud fra den)
    const vis = state.visibleBuildings || [];
    for (let i = 0; i < vis.length; i++) {
        const b = vis[i];
        const sz = buildingSize(b.kind);
        if (Geo.pointInSquare(lat1, lon1, b.lat, b.lon, sz + 2.5) ||
            Geo.pointInSquare(lat2, lon2, b.lat, b.lon, sz + 2.5)) {
            continue;
        }
        const hLat = (sz * 0.5) / mPerLat;
        const hLon = (sz * 0.5) / (111320 * Math.max(Math.cos(b.lat * RAD_PER_DEG), MIN_COS));
        if (b.lat + hLat < minLat || b.lat - hLat > maxLat || b.lon + hLon < minLon || b.lon - hLon > maxLon) continue;
        const sqRing = [
            [b.lon - hLon, b.lat - hLat],
            [b.lon + hLon, b.lat - hLat],
            [b.lon + hLon, b.lat + hLat],
            [b.lon - hLon, b.lat + hLat],
            [b.lon - hLon, b.lat - hLat]
        ];
        testRing(sqRing);
    }

    if (bestT === Infinity) return null;
    return {
        t: bestT,
        hitLat: lat1 + (lat2 - lat1) * bestT,
        hitLon: lon1 + (lon2 - lon1) * bestT
    };
}

function segmentCrossesBuilding(lat1, lon1, lat2, lon2, padM = 1.15, allowEndpointMapBlds = true) {
    return firstBuildingHitOnSegment(lat1, lon1, lat2, lon2, padM, allowEndpointMapBlds) !== null;
}

// Hvor et skud stoppes af et hus — eller null, hvis der er frit skud (0047_spiller_mod_spiller.sql).
// Samme regler som serverens has_line_of_sight: inden for FIRE_CLOSE_M skydes der altid (nærkamp om
// hjørner og gennem haver), og et hus, som skytten eller målet selv står inde i, tæller ikke som dækning.
function shotBlockedAt(lat1, lon1, lat2, lon2) {
    if (Geo.distanceM(lat1, lon1, lat2, lon2) <= GAME_CONFIG.FIRE_CLOSE_M) return null;
    return firstBuildingHitOnSegment(lat1, lon1, lat2, lon2, 0.2, true);
}

function hasLineOfSight(lat1, lon1, lat2, lon2) {
    return shotBlockedAt(lat1, lon1, lat2, lon2) === null;
}

function isNearRoadFast(lat, lon, maxDistM = 7.5) {
    const cx = Math.floor(lon / CHUNK_LON), cy = Math.floor(lat / CHUNK_LAT);
    const ch = rawChunks.get(cx + ":" + cy);
    if (!ch || !ch.roadSegs.length) return false;
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    const maxSq = maxDistM * maxDistM;
    for (let i = 0; i < ch.roadSegs.length; i++) {
        const s = ch.roadSegs[i];
        if (lon < s.minX || lon > s.maxX || lat < s.minY || lat > s.maxY) continue;
        const ax = (s.x1 - lon) * mPerLon, ay = (s.y1 - lat) * 111320;
        const bx = (s.x2 - lon) * mPerLon, by = (s.y2 - lat) * 111320;
        if (pointToSegDistSq2D(0, 0, ax, ay, bx, by) <= maxSq) return true;
    }
    return false;
}

// Finder vejens retning (enhedsvektor øst/nord i meter) tæt ved et punkt, så parkerede lastbiler og vagter følger gaden
function nearestRoadDirection(lat, lon, maxDistM = 24) {
    const cx = Math.floor(lon / CHUNK_LON), cy = Math.floor(lat / CHUNK_LAT);
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const mPerLon = 111320 * cosLat;
    let bestSq = maxDistM * maxDistM;
    let bestDir = null;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const ch = rawChunks.get((cx + dx) + ":" + (cy + dy));
            if (!ch || !ch.roadSegs.length) continue;
            for (let i = 0; i < ch.roadSegs.length; i++) {
                const s = ch.roadSegs[i];
                const ax = (s.x1 - lon) * mPerLon, ay = (s.y1 - lat) * 111320;
                const bx = (s.x2 - lon) * mPerLon, by = (s.y2 - lat) * 111320;
                const dSq = pointToSegDistSq2D(0, 0, ax, ay, bx, by);
                if (dSq < bestSq) {
                    const vx = bx - ax, vy = by - ay;
                    const len = Math.hypot(vx, vy);
                    if (len > 1) {
                        bestSq = dSq;
                        bestDir = vx >= 0 ? { ux: vx / len, uy: vy / len } : { ux: -vx / len, uy: -vy / len };
                    }
                }
            }
        }
    }
    return bestDir || { ux: 1, uy: 0 };
}

function areBuildingsLoadedAlong(lat1, lon1, lat2, lon2) {
    const midLat = (lat1 + lat2) * 0.5, midLon = (lon1 + lon2) * 0.5;
    const check = (la, lo) => rawChunks.has(Math.floor(lo / CHUNK_LON) + ":" + Math.floor(la / CHUNK_LAT));
    return check(lat1, lon1) && check(midLat, midLon) && check(lat2, lon2);
}

// Hurtig lokal A* på fint metergitter (2,4 - 7,5 m), der leder soldater rundt om huse, hegn og vand
// og foretrækker gader/stier en lille smule, når vejen er næsten lige lang.
function findTacticalBuildingPath(startLat, startLon, endLat, endLon) {
    const distM = Geo.distanceM(startLat, startLon, endLat, endLon);
    if (distM < 2 || distM > 1600) return null;

    const midLat = (startLat + endLat) * 0.5;
    const cosLat = Math.max(Math.cos(midLat * RAD_PER_DEG), MIN_COS);
    const mPerLat = 111320;
    const mPerLon = 111320 * cosLat;

    const stepM = Math.max(2.4, Math.min(7.5, distM / 46));
    const padM = Math.max(80, Math.min(280, distM * 0.45));

    const minLat = Math.min(startLat, endLat) - padM / mPerLat;
    const maxLat = Math.max(startLat, endLat) + padM / mPerLat;
    const minLon = Math.min(startLon, endLon) - padM / mPerLon;
    const maxLon = Math.max(startLon, endLon) + padM / mPerLon;

    const stepLat = stepM / mPerLat;
    const stepLon = stepM / mPerLon;
    const rows = Math.min(128, Math.max(24, Math.ceil((maxLat - minLat) / stepLat) + 1));
    const cols = Math.min(128, Math.max(24, Math.ceil((maxLon - minLon) / stepLon) + 1));
    const effStepLat = (maxLat - minLat) / (rows - 1);
    const effStepLon = (maxLon - minLon) / (cols - 1);

    const toCell = (la, lo) => [
        Math.max(0, Math.min(rows - 1, Math.round((la - minLat) / effStepLat))),
        Math.max(0, Math.min(cols - 1, Math.round((lo - minLon) / effStepLon)))
    ];
    const cellLat = r => minLat + r * effStepLat;
    const cellLon = c => minLon + c * effStepLon;

    const [sr, sc] = toCell(startLat, startLon);
    const [er, ec] = toCell(endLat, endLon);
    const startIdx = sr * cols + sc;
    const goalIdx = er * cols + ec;
    if (startIdx === goalIdx) return [[startLat, startLon], [endLat, endLon]];

    const ignorePts = [[startLat, startLon], [endLat, endLon]];
    const totalCells = rows * cols;
    const stateCache = new Uint8Array(totalCells); // 0=ukendt, 1=fri, 2=vej, 3=spærret

    const cellKind = (r, c) => {
        if ((r === sr && c === sc) || (r === er && c === ec)) return 2;
        const idx = r * cols + c;
        let st = stateCache[idx];
        if (st !== 0) return st;
        const la = cellLat(r), lo = cellLon(c);
        if (isWaterAt(la, lo) || pointInsideAnyBuilding(la, lo, 1.35, ignorePts)) {
            st = 3;
        } else {
            st = isNearRoadFast(la, lo, 6.5) ? 2 : 1;
        }
        stateCache[idx] = st;
        return st;
    };

    const gScore = new Float32Array(totalCells).fill(Infinity);
    const cameFrom = new Int32Array(totalCells).fill(-1);
    const closed = new Uint8Array(totalCells);
    gScore[startIdx] = 0;

    // Binær min-heap til lynhurtig A* (< 3 ms)
    const heapIdx = [startIdx];
    const heapF = [Math.hypot(er - sr, ec - sc) * 0.9];
    const heapPush = (idx, f) => {
        let i = heapIdx.length;
        heapIdx.push(idx);
        heapF.push(f);
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heapF[p] <= f) break;
            heapIdx[i] = heapIdx[p]; heapF[i] = heapF[p];
            i = p;
        }
        heapIdx[i] = idx; heapF[i] = f;
    };
    const heapPop = () => {
        const top = heapIdx[0];
        const lastIdx = heapIdx.pop();
        const lastF = heapF.pop();
        const n = heapIdx.length;
        if (n > 0) {
            let i = 0;
            while (true) {
                let l = i * 2 + 1, r = l + 1, s = i;
                if (l < n && heapF[l] < (s === i ? lastF : heapF[s])) s = l;
                if (r < n && heapF[r] < (s === i ? lastF : heapF[s])) s = r;
                if (s === i) break;
                heapIdx[i] = heapIdx[s]; heapF[i] = heapF[s];
                i = s;
            }
            heapIdx[i] = lastIdx; heapF[i] = lastF;
        }
        return top;
    };

    const dr = [-1, 1, 0, 0, -1, -1, 1, 1];
    const dc = [0, 0, -1, 1, -1, 1, -1, 1];
    const baseCost = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];

    while (heapIdx.length > 0) {
        const u = heapPop();
        if (u === goalIdx) break;
        if (closed[u]) continue;
        closed[u] = 1;

        const ur = Math.floor(u / cols), uc = u % cols;
        for (let d = 0; d < 8; d++) {
            const nr = ur + dr[d], nc = uc + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const v = nr * cols + nc;
            if (closed[v]) continue;
            const kind = cellKind(nr, nc);
            if (kind === 3) continue;
            // Undgå at skære skråt gennem et hushjørne
            if (d >= 4 && (cellKind(ur + dr[d], uc) === 3 || cellKind(ur, uc + dc[d]) === 3)) continue;

            const stepW = kind === 2 ? 0.90 : 1.0;
            const tg = gScore[u] + baseCost[d] * stepW;
            if (tg < gScore[v]) {
                cameFrom[v] = u;
                gScore[v] = tg;
                heapPush(v, tg + Math.hypot(er - nr, ec - nc) * 0.89);
            }
        }
    }

    if (cameFrom[goalIdx] === -1) return null;

    const raw = [];
    let cur = goalIdx;
    while (cur !== -1 && cur !== startIdx) {
        raw.push([cellLat(Math.floor(cur / cols)), cellLon(cur % cols)]);
        cur = cameFrom[cur];
    }
    raw.reverse();
    const full = [[startLat, startLon], ...raw.slice(0, -1), [endLat, endLon]];

    // Stram ruten op, men kun hvor hverken vand eller bygninger krydses!
    const smoothed = [full[0]];
    let i = 0;
    while (i < full.length - 1) {
        let next = i + 1;
        for (let j = full.length - 1; j >= i + 2; j--) {
            if (!segmentCrossesWater(full[i][0], full[i][1], full[j][0], full[j][1]) &&
                !segmentCrossesBuilding(full[i][0], full[i][1], full[j][0], full[j][1], 1.25, true)) {
                next = j;
                break;
            }
        }
        smoothed.push(full[next]);
        i = next;
    }
    return smoothed;
}

// Synkroniser nærliggende bygningsomrids til serveren (0046_gadekamp_skudlinje.sql), når egne soldater
// og fjender er tæt på hinanden, så serverens npc_step heller ikke skyder gennem huse.
// Virker uden fejl, også før 0046 er kørt i Supabase.
const sentCombatBuildingKeys = new Set();
let serverSupportsCombatBuildings = true;
let syncingCombatBuildings = false;

async function syncCombatBuildingsToServer(ownPositions, enemyPositions) {
    if (!serverSupportsCombatBuildings || syncingCombatBuildings || !state.user || !ownPositions.length || !enemyPositions.length) return;
    const toSend = [];
    for (let i = 0; i < enemyPositions.length; i++) {
        const [eLat, eLon] = enemyPositions[i];
        let nearOwn = false;
        for (let j = 0; j < ownPositions.length; j++) {
            if (Geo.distanceM(eLat, eLon, ownPositions[j][0], ownPositions[j][1]) <= 210) {
                nearOwn = true;
                break;
            }
        }
        if (!nearOwn) continue;
        const padLat = 130 / 111320;
        const padLon = 130 / (111320 * Math.max(Math.cos(eLat * RAD_PER_DEG), MIN_COS));
        forEachMapBuildingInBBox(eLat - padLat, eLat + padLat, eLon - padLon, eLon + padLon, (rb) => {
            const bKey = Math.round(rb.lat0 * 5e4) + ":" + Math.round(rb.lon0 * 3e4);
            if (!sentCombatBuildingKeys.has(bKey) && rb.raw.length >= 4 && rb.raw.length <= 85) {
                sentCombatBuildingKeys.add(bKey);
                toSend.push({ key: bKey, ring: rb.raw });
            }
            return toSend.length >= 100;
        });
        if (toSend.length >= 100) break;
    }
    if (!toSend.length) return;
    syncingCombatBuildings = true;
    try {
        const { error } = await sb.rpc("report_combat_buildings", { p_buildings: toSend });
        if (error) {
            if (error.code === "PGRST202" || String(error.message || "").includes("report_combat_buildings")) {
                serverSupportsCombatBuildings = false;
            } else {
                for (const item of toSend) sentCombatBuildingKeys.delete(item.key);
            }
        }
    } catch (_) {
        for (const item of toSend) sentCombatBuildingKeys.delete(item.key);
    } finally {
        syncingCombatBuildings = false;
    }
}

function canShortcutAcrossLandAndBuildings(lat1, lon1, lat2, lon2) {
    if (segmentCrossesWater(lat1, lon1, lat2, lon2)) return false;
    if (segmentCrossesBuilding(lat1, lon1, lat2, lon2, 1.25, true)) return false;
    // Hvis vi er zoomet langt ud (< 14), så z14-huse ikke er indlæst på hele stykket, må vi ikke skære genvej gennem byzoner
    if (Geo.distanceM(lat1, lon1, lat2, lon2) > 55 && !areBuildingsLoadedAlong(lat1, lon1, lat2, lon2)) {
        const midLat = (lat1 + lat2) * 0.5, midLon = (lon1 + lon2) * 0.5;
        if (terrainAt(midLat, midLon).id === "town" || terrainAt(lat1, lon1).id === "town" || terrainAt(lat2, lon2).id === "town") {
            return false;
        }
    }
    return true;
}

async function tightenPathAcrossLand(rawPts) {
    if (!rawPts || rawPts.length <= 2) return rawPts;
    syncVectorTilesToChunks();

    function stringPull(pts) {
        const out = [pts[0]];
        let i = 0;
        while (i < pts.length - 1) {
            let next = i + 1;
            for (let j = Math.min(pts.length - 1, i + STRING_PULL_LOOKAHEAD); j >= i + 2; j--) {
                if (canShortcutAcrossLandAndBuildings(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) {
                    next = j;
                    break;
                }
            }
            out.push(pts[next]);
            i = next;
        }
        return out;
    }

    // 1. Stram kun op over åbent land uden vand og uden bygninger
    let path = stringPull(rawPts);
    await yieldToBrowser();

    // 2. Indsæt ekstra mellempunkter på lange åbne strækninger og glat hjørner uden at skære ind i bygninger eller vand
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
                if (!isWaterAt(mLat, mLon) && !pointInsideMapBuilding(mLat, mLon, 1.2)) refined.push([mLat, mLon]);
            }
        }
        refined.push(b);
    }
    path = refined;

    const rounds = path.length > 40 ? 2 : 4;
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
                !pointInsideAnyBuilding(candLat, candLon, 1.3, [path[0], path[path.length - 1]]) &&
                canShortcutAcrossLandAndBuildings(prev[0], prev[1], candLat, candLon) &&
                canShortcutAcrossLandAndBuildings(candLat, candLon, next[0], next[1])
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
    // Sørg for at hele ruten er i kortets synsfelt, og synkronisér vektorfliser (bygninger og veje)
    await ensureRouteInView(startLat, startLon, endLat, endLon);
    syncVectorTilesToChunks();

    const distM = Geo.distanceM(startLat, startLon, endLat, endLon);
    const crossesWater = segmentCrossesWater(startLat, startLon, endLat, endLon);
    const crossesBld = segmentCrossesBuilding(startLat, startLon, endLat, endLon, 1.15, true);
    const unloadedTown = distM > 60 && !areBuildingsLoadedAlong(startLat, startLon, endLat, endLon) && (
        terrainAt((startLat + endLat) * 0.5, (startLon + endLon) * 0.5).id === "town" ||
        terrainAt(startLat, startLon).id === "town" ||
        terrainAt(endLat, endLon).id === "town"
    );

    // 1. Fri linje på åbent land/gade uden hverken vand eller bygninger i vejen
    if (!crossesWater && !crossesBld && !unloadedTown) {
        return [[startLat, startLon], [endLat, endLon]];
    }

    // 2. Taktisk gade- og bygningsrute i nærområdet (<= 1,5 km): hurtig lokal A* rundt om huse og ad gader
    if (!crossesWater && !unloadedTown && distM <= 1500) {
        const localStreetPath = findTacticalBuildingPath(startLat, startLon, endLat, endLon);
        if (localStreetPath && localStreetPath.length >= 2) {
            return localStreetPath;
        }
    }

    // 3. Længere ruter eller ruter over broer/gennem byer: OSRM gangsti/gade + bygnings-sikker opstramning
    try {
        const url = `https://router.project-osrm.org/route/v1/foot/${startLon.toFixed(6)},${startLat.toFixed(6)};${endLon.toFixed(6)},${endLat.toFixed(6)}?overview=full&geometries=geojson`;
        const resp = await fetch(url);
        if (resp.ok) {
            const json = await resp.json();
            const coords = json?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
                const rawLatLon = coords.map(c => [c[1], c[0]]);
                const simplified = simplifyPolyline(rawLatLon, 0.00008);
                let startConn = [[startLat, startLon]];
                if (simplified.length > 0 && segmentCrossesBuilding(startLat, startLon, simplified[0][0], simplified[0][1], 1.1, true)) {
                    const detour = findTacticalBuildingPath(startLat, startLon, simplified[0][0], simplified[0][1]);
                    if (detour && detour.length > 2) startConn = detour.slice(0, -1);
                }
                let endConn = [[endLat, endLon]];
                const lastRoad = simplified[simplified.length - 1];
                if (lastRoad && segmentCrossesBuilding(lastRoad[0], lastRoad[1], endLat, endLon, 1.1, true)) {
                    const detour = findTacticalBuildingPath(lastRoad[0], lastRoad[1], endLat, endLon);
                    if (detour && detour.length > 2) endConn = detour.slice(1);
                }
                const base = [
                    ...startConn,
                    ...simplified,
                    ...endConn
                ];
                return await tightenPathAcrossLand(base);
            }
        }
    } catch (_) {}

    const localFallback = distM <= 1600 ? findTacticalBuildingPath(startLat, startLon, endLat, endLon) : null;
    if (localFallback) return localFallback;
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

// ============================================================================
// Taktisk gade-visning (zoom 16+): små soldater og køretøjer i formation
// ============================================================================
const registeredStreetSprites = new Set();
const registeredStreetBadges = new Set();

function troopStatusStrokeColor(style, status) {
    if (style === "npc") return NPC_COLOR;
    if (style === "enemy") return "#FF5252";
    if (style.startsWith("ally-")) return "#" + style.slice(5);
    if (status === "combat") return "#FF5252";
    if (status === "patrol") return "#4FC3F7";
    if (status === "march") return "#FF9800";
    return "#39FF14";
}

// Knælende soldat i kamp: samme figur, men bukserne (række 10-11 i 16×14-billedet) er taget ud,
// så overkroppen sidder lavere ned mod støvlerne.
const kneelCache = new WeakMap();
function kneelingSprite(img) {
    if (!img) return null;
    if (kneelCache.has(img)) return kneelCache.get(img);
    const c = document.createElement("canvas");
    const cut = 2;
    const top = Math.max(1, img.height - 4);
    c.width = img.width;
    c.height = img.height - cut;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, img.width, top, 0, 0, img.width, top);
    ctx.drawImage(img, 0, top + cut, img.width, img.height - top - cut, 0, top, img.width, img.height - top - cut);
    kneelCache.set(img, c);
    return c;
}

async function ensureStreetUnitSprites(style = "own") {
    const redUniform = style === "npc" || style === "enemy";
    const allyHex = style.startsWith("ally-") ? "#" + style.slice(5) : null;
    await Promise.all([soldierImgPromise, npcImgPromise, computerImgPromise, truckImgPromise, truckHowitzerImgPromise, howitzerImgPromise]);

    const addShadowedSprite = (id, srcImg, scale, flipX = false, dimAlpha = 1) => {
        if (!srcImg || !mapReady || registeredStreetSprites.has(id)) return;
        registeredStreetSprites.add(id);
        const sw = srcImg.width * scale;
        const sh = srcImg.height * scale;
        const pad = 4;
        const canvas = document.createElement("canvas");
        canvas.width = sw + pad * 2;
        canvas.height = sh + pad * 2 + 2;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        // Blød mørk pixel-skygge under støvler / dæk, så små enheder står skarpt mod både asfalt og fortov
        ctx.fillStyle = "rgba(15, 20, 28, 0.42)";
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.5, pad + sh - 1, sw * 0.42, Math.max(2.5, sh * 0.16), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = dimAlpha;
        if (flipX) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(srcImg, pad, pad, sw, sh);
        ctx.restore();

        if (!map.hasImage(id)) {
            const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
            map.addImage(id, { width: canvas.width, height: canvas.height, data: d.data });
        }
    };

    const enemyImg = style === "npc" && computerSoldierImg ? computerSoldierImg : npcSoldierImg;
    let solImg = redUniform && enemyImg ? enemyImg : baseSoldierImg;
    if (allyHex && solImg) solImg = tintedUniform(solImg, allyHex);
    const solKey = style === "npc" ? "npc" : (redUniform ? "enemy" : (allyHex ? style : "own"));
    addShadowedSprite(`st-sol-${solKey}`, solImg, 2, false);
    addShadowedSprite(`st-sol-${solKey}-l`, solImg, 2, true);
    const kneelImg = kneelingSprite(solImg);
    addShadowedSprite(`st-sol-${solKey}-k`, kneelImg, 2, false);
    addShadowedSprite(`st-sol-${solKey}-k-l`, kneelImg, 2, true);

    addShadowedSprite("st-truck", truckImg, 2, false);
    addShadowedSprite("st-truck-l", truckImg, 2, true);
    addShadowedSprite("st-truck-h", truckHowitzerImg, 2, false);
    addShadowedSprite("st-truck-h-l", truckHowitzerImg, 2, true);
    addShadowedSprite("st-parked", truckImg, 2, false, 0.88);
    addShadowedSprite("st-parked-h", truckHowitzerImg, 2, false, 0.88);
    addShadowedSprite("st-howitzer", howitzerImg, 1, false);
    addShadowedSprite("st-howitzer-l", howitzerImg, 1, true);
}

function streetBadgeId(count, strokeColor, pct, tag = "") {
    const bucket = pct >= 100 ? "100" : pct < 40 ? `r${Math.ceil(pct / 10)}` : `o${Math.ceil(pct / 10)}`;
    return `st-lbl-${strokeColor.slice(1)}-${count}-${bucket}${tag ? "-" + tag : ""}`;
}

function ensureStreetBadge(count, strokeColor, pct, tag = "") {
    const id = streetBadgeId(count, strokeColor, pct, tag);
    if (!mapReady || registeredStreetBadges.has(id)) return id;
    registeredStreetBadges.add(id);

    const label = tag ? `${count} · ${tag}` : String(count);
    const w = Math.max(24, label.length * 7 + 12);
    const pillH = 16;
    const barH = 4;
    const canvas = document.createElement("canvas");
    canvas.width = w + 4;
    canvas.height = pillH + barH + 5;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(17, 22, 28, 0.90)";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(2, 1.5, w, pillH, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10.5px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 2 + w / 2, 1.5 + pillH / 2 + 0.5);

    const step = Math.max(0.08, Math.ceil(pct / 10) / 10);
    const by = pillH + 2.5;
    ctx.fillStyle = "rgba(17, 22, 28, 0.90)";
    ctx.fillRect(4, by, w - 4, barH);
    ctx.fillStyle = energyColor(pct);
    ctx.fillRect(5, by + 1, Math.max(1, (w - 6) * step), barH - 2);

    if (!map.hasImage(id)) {
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        map.addImage(id, { width: canvas.width, height: canvas.height, data: d.data });
    }
    return id;
}

// Skaleringsprofil pr. enhedstype (zoom 16 -> 22): tydelige mini-enheder ved zoom 16, ægte gade-/hus-proportioner ved zoom 17-22
function streetUnitScaleProps(kind) {
    // v109: ved zoom 16-18 er enhederne tegnet langt større end "ægte" skala (ellers er de prikker);
    // fra zoom 20 passer de med husene. v117: køretøjer og haubitser følger soldaternes forstørrelse,
    // så en lastbil altid er ca. 2,5 soldater lang (7,8 m mod 3,1 m) og en haubits ca. 1,8 – ved alle zoom.
    if (kind === "truck-h") return { s16: 0.69, s17: 0.79, s18: 0.95, s20: 1.96, s22: 7.84 }; // ~12,2 m vogntog (128 px bred)
    if (kind === "truck")   return { s16: 0.69, s17: 0.79, s18: 0.95, s20: 1.96, s22: 7.84 }; // ~7,8 m lastbil (84 px bred -> samme førerhus-skala!)
    if (kind === "gun")     return { s16: 0.55, s17: 0.63, s18: 0.76, s20: 1.56, s22: 6.24 }; // ~5,6 m haubits (76 px bred)
    return                         { s16: 0.58, s17: 0.66, s18: 0.80, s20: 1.65, s22: 6.59 }; // ~3,1 m soldat (40 px bred inkl. pad)
}

function visibleSoldierCount(count) {
    if (count <= 0) return 0;
    if (count <= 12) return count;
    return Math.min(16, 12 + Math.floor(Math.log2(count / 12 + 1) * 2));
}

// Finder punkt og kurs langs en march-rute forskudt deltaM meter frem (+) eller tilbage (-) fra nuværende fremskridt
function pointAlongMarchByMeters(m, now, deltaM) {
    const pts = m.path && m.path.length >= 2 ? m.path : [[m.startLat, m.startLon], [m.toLat, m.toLon]];
    const segM = [];
    let totalM = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const d = Geo.distanceM(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        segM.push(d);
        totalM += d;
    }
    if (totalM < 0.2) {
        return { lat: pts[0][0], lon: pts[0][1], ux: 1, uy: 0 };
    }
    const cur = marchCurrentPos(m, now);
    let curM = 0, bestD = Infinity, acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const cosL = Math.max(Math.cos(a[0] * RAD_PER_DEG), MIN_COS);
        const ax = (a[1] - cur[1]) * 111320 * cosL, ay = (a[0] - cur[0]) * 111320;
        const bx = (b[1] - cur[1]) * 111320 * cosL, by = (b[0] - cur[0]) * 111320;
        const dx = bx - ax, dy = by - ay;
        const l2 = dx * dx + dy * dy;
        const t = l2 > 1e-6 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
        const px = ax + dx * t, py = ay + dy * t;
        const d2 = px * px + py * py;
        if (d2 < bestD) {
            bestD = d2;
            curM = acc + segM[i] * t;
        }
        acc += segM[i];
    }

    const targetM = Math.max(0, Math.min(totalM, curM + deltaM));
    let walk = 0;
    for (let i = 0; i < segM.length; i++) {
        if (walk + segM[i] >= targetM || i === segM.length - 1) {
            const t = segM[i] > 0.01 ? (targetM - walk) / segM[i] : 0;
            const lat = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t;
            const lon = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
            const cosL = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
            const vx = (pts[i + 1][1] - pts[i][1]) * 111320 * cosL;
            const vy = (pts[i + 1][0] - pts[i][0]) * 111320;
            const len = Math.hypot(vx, vy) || 1;
            return { lat, lon, ux: vx / len, uy: vy / len };
        }
        walk += segM[i];
    }
    return { lat: cur[0], lon: cur[1], ux: 1, uy: 0 };
}

// Udregner diskret vej-hældning til side-view lastbil, så den følger skrå gader uden nogensinde at vende på hovedet
function vehicleTiltDeg(ux, uy) {
    const facingLeft = ux < -0.02;
    const absX = Math.max(0.25, Math.abs(ux));
    const slopeDeg = Math.atan2(uy, absX) * (180 / Math.PI);
    const clamped = Math.max(-24, Math.min(24, slopeDeg));
    return { facingLeft, rot: facingLeft ? clamped : -clamped };
}

function groundCircleFeature(lat, lon, radiusM, props) {
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const coords = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        coords.push([
            lon + (Math.cos(a) * radiusM) / (111320 * cosLat),
            lat + (Math.sin(a) * radiusM) / 111320
        ]);
    }
    return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } };
}

// Gemmer hver gruppes små gade-positioner, så både lysspor (geværild) og museklik rammer de enkelte små soldater/lastbiler!
const activeStreetFormations = new Map(); // "kind:id" -> Array<[lat, lon]>

// Pladser til en stående gruppe: løst spredt omkring midten, helst tæt op ad en husmur (dækning),
// aldrig inde i et hus eller i vand. Huskes pr. gruppe og sted, så det ikke regnes om hvert sekund.
const coverSlotCache = new Map();
function coverFormationSlots(groupKey, lat, lon, nSol, seed, keepCenterFree) {
    const key = `${groupKey}|${lat.toFixed(6)}|${lon.toFixed(6)}|${nSol}|${keepCenterFree ? 1 : 0}|${rawChunks.size}`;
    const hit = coverSlotCache.get(key);
    if (hit) return hit;
    if (coverSlotCache.size > 400) coverSlotCache.clear();

    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const invLon = 1 / (111320 * cosLat), invLat = 1 / 111320;
    const radius = Math.min(18, 4 + Math.sqrt(nSol) * 2.6);
    const wallM = 2.4; // så tæt på en mur tæller som dækning
    const cands = [];
    let n = 0;
    for (let r = keepCenterFree ? 3.4 : 0; r <= radius; r += 1.5) {
        const steps = r < 0.5 ? 1 : Math.max(6, Math.round((2 * Math.PI * r) / 1.6));
        for (let i = 0; i < steps; i++) {
            n++;
            const jit = (((n * 37 + seed) % 11) - 5) * 0.06;
            const a = (i / steps) * Math.PI * 2 + (seed % 7) * 0.3 + jit;
            const rr = r + (((n * 53 + seed) % 9) - 4) * 0.12;
            const cLat = lat + Math.sin(a) * rr * invLat;
            const cLon = lon + Math.cos(a) * rr * invLon;
            const wall = mapBuildingDistanceM(cLat, cLon, 6);
            if (wall < 0.7) continue; // inde i eller klods op ad muren
            const cover = wall <= wallM ? 0 : (wall - wallM) * 1.1;
            cands.push({ p: [cLat, cLon], score: cover + rr * 0.32, x: Math.cos(a) * rr, y: Math.sin(a) * rr });
        }
    }
    cands.sort((a, b) => a.score - b.score);
    const picked = [];
    const minSq = 1.9 * 1.9;
    for (const c of cands) {
        if (picked.length >= nSol) break;
        if (picked.some(q => (q.x - c.x) ** 2 + (q.y - c.y) ** 2 < minSq)) continue;
        if (isWaterAt(c.p[0], c.p[1])) { c.water = true; continue; }
        picked.push(c);
    }
    // For lidt plads (fx tæt bebyggelse): fyld op med de bedste resterende pladser.
    for (const c of cands) {
        if (picked.length >= nSol) break;
        if (!c.water && !picked.includes(c)) picked.push(c);
    }
    const slots = picked.map(c => c.p);
    if (!slots.length) slots.push(snapOutsideMapBuilding(lat, lon, 1.8));
    coverSlotCache.set(key, slots);
    return slots;
}

function buildStreetSquadFeatures(groupKey, group, lat, lon, style, status, marchObj, now, isSelected, shiftMeters = 0, faceTarget = null) {
    const unitFeats = [];
    const positions = [];
    const cosLat = Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const invLon = 1 / (111320 * cosLat);
    const invLat = 1 / 111320;
    const redUniform = style === "npc" || style === "enemy";
    const solKey = style === "npc" ? "npc" : (redUniform ? "enemy" : (style.startsWith("ally-") ? style : "own"));

    const trucks = truckCount(group);
    const howitzers = group.howitzers || 0;
    const isMoving = !!marchObj && (marchObj.arrivesAtMillis > marchObj.startedAtMillis + 500) && now < marchObj.arrivesAtMillis;
    const isDriving = trucks > 0 && (marchObj ? (marchObj.driving !== false && truckCanDrive(group.count, trucks)) : truckCanDrive(group.count, trucks));

    const pushUnit = (uLat, uLon, img, kind, rot = 0) => {
        positions.push([uLat, uLon]);
        unitFeats.push({
            type: "Feature",
            properties: {
                img,
                rot,
                sort: -uLat,
                ...streetUnitScaleProps(kind)
            },
            geometry: { type: "Point", coordinates: [uLon, uLat] }
        });
    };

    if (isMoving) {
        if (isDriving) {
            // Kørende lastbil-kolonne langs vejen (op til 6 synlige vogne i kolonne)
            const nVis = Math.min(trucks, 6);
            const spacing = howitzers > 0 ? 14.2 : 10.2;
            const headOff = Math.min(10, (nVis - 1) * spacing * 0.35);
            for (let i = 0; i < nVis; i++) {
                const pt = pointAlongMarchByMeters(marchObj, now, headOff - i * spacing);
                const { facingLeft, rot } = vehicleTiltDeg(pt.ux, pt.uy);
                const hasGun = i < howitzers;
                const img = hasGun
                    ? (facingLeft ? "st-truck-h-l" : "st-truck-h")
                    : (facingLeft ? "st-truck-l" : "st-truck");
                pushUnit(pt.lat, pt.lon, img, hasGun ? "truck-h" : "truck", rot);
            }
        } else {
            // Soldater på march i 2-geleds gadekolonne langs ruten (drejer pænt rundt om hushjørner!)
            const nSol = visibleSoldierCount(group.count);
            const rows = Math.ceil(nSol / 2);
            const headOff = Math.min(8, (rows - 1) * 1.4);
            for (let i = 0; i < nSol; i++) {
                const row = Math.floor(i / 2);
                const side = (i % 2 === 0) ? -1 : 1;
                const pt = pointAlongMarchByMeters(marchObj, now, headOff - row * 3.4);
                const nx = -pt.uy, ny = pt.ux;
                const jitter = (((i * 73 + (Number(group.id) || 1) * 19) % 11) - 5) * 0.05;
                let latS = pt.lat + (ny * side * 1.3 + pt.uy * jitter) * invLat;
                let lonS = pt.lon + (nx * side * 1.3 + pt.ux * jitter) * invLon;
                if (pointInsideMapBuilding(latS, lonS, 0.55)) {
                    latS = pt.lat;
                    lonS = pt.lon;
                }
                const faceL = pt.ux < -0.05;
                pushUnit(latS, lonS, faceL ? `st-sol-${solKey}-l` : `st-sol-${solKey}`, "sol", 0);
            }
            // Eventuelle medfølgende lastbiler i gåtempo bagerst i kolonnen
            const nTr = Math.min(trucks, 3);
            for (let t = 0; t < nTr; t++) {
                const pt = pointAlongMarchByMeters(marchObj, now, headOff - rows * 3.4 - 5.5 - t * 10.5);
                const { facingLeft, rot } = vehicleTiltDeg(pt.ux, pt.uy);
                const hasGun = t < howitzers;
                pushUnit(pt.lat, pt.lon, hasGun ? (facingLeft ? "st-truck-h-l" : "st-truck-h") : (facingLeft ? "st-truck-l" : "st-truck"), hasGun ? "truck-h" : "truck", rot);
            }
        }
    } else {
        // Stående vagtstyrke / stoppet enhed: ret ind langs nærmeste gade og undgå hustage!
        const rd = nearestRoadDirection(lat, lon);
        const nx = -rd.uy, ny = rd.ux;
        const baseLat = lat + (rd.uy * shiftMeters) * invLat;
        const baseLon = lon + (rd.ux * shiftMeters) * invLon;

        if (trucks > 0) {
            const nVis = Math.min(trucks, 5);
            const spacing = howitzers > 0 ? 13.8 : 9.8;
            const startOff = ((nVis - 1) * spacing) * 0.5;
            const { facingLeft, rot } = vehicleTiltDeg(rd.ux, rd.uy);
            for (let i = 0; i < nVis; i++) {
                const along = startOff - i * spacing;
                let tLat = baseLat + (rd.uy * along + ny * 1.1) * invLat;
                let tLon = baseLon + (rd.ux * along + nx * 1.1) * invLon;
                if (pointInsideMapBuilding(tLat, tLon, 0.9)) {
                    tLat = baseLat + (rd.uy * along) * invLat;
                    tLon = baseLon + (rd.ux * along) * invLon;
                }
                const hasGun = i < howitzers;
                pushUnit(tLat, tLon, hasGun ? (facingLeft ? "st-truck-h-l" : "st-truck-h") : (facingLeft ? "st-truck-l" : "st-truck"), hasGun ? "truck-h" : "truck", rot);
            }
            // 2-4 vagtsoldater stående ved siden af de holdende lastbiler
            const nGuards = Math.min(group.count, 4);
            for (let gIdx = 0; gIdx < nGuards; gIdx++) {
                const along = (gIdx - (nGuards - 1) * 0.5) * 3.2;
                let gLat = baseLat + (rd.uy * along - ny * 2.2) * invLat;
                let gLon = baseLon + (rd.ux * along - nx * 2.2) * invLon;
                if (pointInsideMapBuilding(gLat, gLon, 0.6)) {
                    gLat = baseLat + (rd.uy * along) * invLat;
                    gLon = baseLon + (rd.ux * along) * invLon;
                }
                pushUnit(gLat, gLon, (gIdx & 1) ? `st-sol-${solKey}-l` : `st-sol-${solKey}`, "sol", 0);
            }
        } else {
            // Opstillede haubitser (uden lastbil) + besætning og soldater i gadeformation
            const nGuns = Math.min(howitzers, 3);
            for (let hIdx = 0; hIdx < nGuns; hIdx++) {
                const along = (hIdx - (nGuns - 1) * 0.5) * 5.2;
                pushUnit(baseLat + rd.uy * along * invLat, baseLon + rd.ux * along * invLon, "st-howitzer", "gun", 0);
            }

            const nSol = visibleSoldierCount(group.count);
            if (nSol === 1 && nGuns === 0) {
                let sLat = baseLat, sLon = baseLon;
                if (pointInsideMapBuilding(sLat, sLon, 0.7)) [sLat, sLon] = snapOutsideMapBuilding(sLat, sLon, 1.8);
                pushUnit(sLat, sLon, `st-sol-${solKey}`, "sol", 0);
            } else {
                // Gruppen spreder sig løst og søger dækning ved husmure i stedet for at stå i en stiv blok.
                // I kamp knæler soldaterne og vender mod fjenden. Kun udseende: kampen afgøres på serveren.
                const seed = (Number(group.id) || 3) * 31;
                const slots = coverFormationSlots(groupKey, baseLat, baseLon, nSol, seed, nGuns > 0);
                const kneel = status === "combat";
                for (let s = 0; s < nSol; s++) {
                    const [cLat, cLon] = slots[s % Math.max(1, slots.length)] || [baseLat, baseLon];
                    const faceL = faceTarget
                        ? faceTarget[1] < cLon
                        : ((s + seed) & 1) === 1;
                    const img = `st-sol-${solKey}${kneel ? "-k" : ""}${faceL ? "-l" : ""}`;
                    pushUnit(cLat, cLon, img, "sol", 0);
                }
            }
        }
    }

    activeStreetFormations.set(groupKey, positions);

    const stroke = troopStatusStrokeColor(style, status);
    const pct = energyPct(group);
    const tag = trucks > 0 ? `${trucks}L` : (howitzers > 0 ? `${howitzers}H` : "");
    const badgeImg = ensureStreetBadge(group.count, stroke, pct, tag);
    const labelLat = lat + (shiftMeters ? (nearestRoadDirection(lat, lon).uy * shiftMeters) * invLat : 0);
    const labelLon = lon + (shiftMeters ? (nearestRoadDirection(lat, lon).ux * shiftMeters) * invLon : 0);

    const badgeFeat = {
        type: "Feature",
        properties: { img: badgeImg, off: [0, -13] },
        geometry: { type: "Point", coordinates: [labelLon, labelLat] }
    };

    const ringFeat = (isSelected || status === "combat")
        ? groundCircleFeature(labelLat, labelLon, Math.max(4.8, Math.min(13, 3.5 + Math.sqrt(group.count) * 1.1)), {
            c: isSelected ? "#FFD54F" : stroke,
            sel: !!isSelected
        })
        : null;

    return { unitFeats, badgeFeat, ringFeat };
}

async function renderTroopsOnMap() {
    if (!mapReady) return;
    syncVectorTilesToChunks();
    const now = serverNow();
    const troopFeatures = [];
    const lineFeatures = [];
    const streetUnits = [];
    const streetBadges = [];
    const streetRings = [];

    activeStreetFormations.clear();
    await Promise.all([
        ensureStreetUnitSprites("own"),
        ensureStreetUnitSprites("enemy"),
        ensureStreetUnitSprites("npc")
    ]);

    // Patruljerne går jævnt videre mellem opdateringerne (strækning + tider fra serveren).
    const npcs = state.enemies.npcs.map(n => ({ n, pos: npcCurrentPos(n, now) }));

    // Alle fjender, der kan skyde og blive skudt på: computerens patruljer og andre spilleres soldater.
    const foes = [
        ...npcs.map(({ n, pos }) => ({ key: `npc:${n.id}`, pos, seed: (Number(n.id) || 0) * 0.37 })),
        ...state.enemies.garrisons.map(g => ({ key: `enemy-garrison:${g.id}`, pos: [g.lat, g.lon], seed: (Number(g.id) || 0) * 0.53 + 0.11 })),
        ...state.enemies.marches.map(m => ({ key: `enemy-march:${m.id}`, pos: [m.lat, m.lon], seed: (Number(m.id) || 0) * 0.71 + 0.23 }))
    ];

    // Egne grupper lige nu (til at afgøre, om en fjende er i kamp med dine soldater)
    const ownQuick = [];
    for (const g of state.garrisons) if (g.count > 0) ownQuick.push([g.lat, g.lon]);
    for (const m of state.marches) if (m.count > 0) ownQuick.push(marchCurrentPos(m, now));

    // Kun kamp hvis parterne er inden for skudafstand OG har fri skudlinje uden bygninger imellem!
    const isFightingNear = (lat, lon) => {
        for (const f of foes) {
            if (Geo.distanceM(f.pos[0], f.pos[1], lat, lon) <= GAME_CONFIG.FIRE_RANGE_M &&
                hasLineOfSight(f.pos[0], f.pos[1], lat, lon)) {
                return true;
            }
        }
        return false;
    };
    const isFightingOwn = (lat, lon) => {
        for (const p of ownQuick) {
            if (Geo.distanceM(p[0], p[1], lat, lon) <= GAME_CONFIG.FIRE_RANGE_M && hasLineOfSight(p[0], p[1], lat, lon)) {
                return true;
            }
        }
        return false;
    };

    const addTroop = async (groupKey, group, lat, lon, style, status = "guard", facingLeft = false, shiftX = 0, marchObj = null, isSelected = false) => {
        if (style.startsWith("ally-")) await ensureStreetUnitSprites(style);
        const pct = energyPct(group);
        const truck = truckCount(group) > 0;
        const hasHowitzer = (group.howitzers || 0) > 0;
        await ensureTroopBadge(group.count, style, pct, status, truck, facingLeft, hasHowitzer);
        troopFeatures.push({
            type: "Feature",
            properties: { img: troopBadgeId(group.count, style, pct, status, truck, facingLeft, hasHowitzer), off: [shiftX, 0] },
            geometry: { type: "Point", coordinates: [lon, lat] }
        });

        const shiftMeters = shiftX < 0 ? -9.5 : 0;
        // Nærmeste modstander inden for lidt mere end skudafstand: soldaterne vender sig mod den.
        const hostile = style === "npc" || style === "enemy";
        let faceTarget = null;
        let bestD = GAME_CONFIG.FIRE_RANGE_M * 1.5;
        for (const p of hostile ? ownQuick : foes.map(f => f.pos)) {
            const d = Geo.distanceM(p[0], p[1], lat, lon);
            if (d < bestD) { bestD = d; faceTarget = p; }
        }
        const st = buildStreetSquadFeatures(groupKey, group, lat, lon, style, status, marchObj, now, isSelected, shiftMeters, faceTarget);
        for (let i = 0; i < st.unitFeats.length; i++) streetUnits.push(st.unitFeats[i]);
        streetBadges.push(st.badgeFeat);
        if (st.ringFeat) streetRings.push(st.ringFeat);
    };

    const enemyPositions = [];

    // Fjender, som du kan se lige nu
    for (const g of state.enemies.garrisons) {
        enemyPositions.push([g.lat, g.lon]);
        const sel = state.groupModal?.kind === "enemy-garrison" && String(state.groupModal.id) === String(g.id);
        const status = isFightingOwn(g.lat, g.lon) ? "combat" : "enemy";
        await addTroop(`enemy-garrison:${g.id}`, g, g.lat, g.lon, "enemy", status, false, 0, null, sel);
    }
    for (const m of state.enemies.marches) {
        enemyPositions.push([m.lat, m.lon]);
        const facingLeft = truckCount(m) > 0 && m.to_lon != null && m.lon != null && m.to_lon < m.lon;
        const sel = state.groupModal?.kind === "enemy-march" && String(state.groupModal.id) === String(m.id);
        const status = isFightingOwn(m.lat, m.lon) ? "combat" : "enemy";
        await addTroop(`enemy-march:${m.id}`, m, m.lat, m.lon, "enemy", status, facingLeft, 0, null, sel);
    }
    for (const { n, pos } of npcs) {
        enemyPositions.push(pos);
        const npcMarch = {
            path: n.path,
            startLat: n.path?.[0]?.[0] ?? pos[0],
            startLon: n.path?.[0]?.[1] ?? pos[1],
            toLat: n.path?.at(-1)?.[0] ?? pos[0],
            toLon: n.path?.at(-1)?.[1] ?? pos[1],
            driving: n.driving !== false && truckCanDrive(n.count, truckCount(n)),
            startedAtMillis: Date.parse(n.started_at),
            arrivesAtMillis: Date.parse(n.arrives_at)
        };
        const facingLeft = truckCount(n) > 0 && marchFacingLeft(npcMarch, now);
        const sel = state.groupModal?.kind === "npc" && String(state.groupModal.id) === String(n.id);
        const status = n.fighting ? "combat" : "npc";
        await addTroop(`npc:${n.id}`, n, pos[0], pos[1], "npc", status, facingLeft, 0, npcMarch, sel);
    }

    // Allierede: altid synlige, i deres egen farve.
    for (const g of state.allies.garrisons) {
        if (g.count <= 0) continue;
        const sel = state.groupModal?.kind === "ally-garrison" && String(state.groupModal.id) === String(g.id);
        await addTroop(`ally-garrison:${g.id}`, g, g.lat, g.lon, "ally-" + allyColor(g.owner_id).slice(1), "guard", false, 0, null, sel);
    }
    for (const m of state.allies.marches) {
        if (m.count <= 0) continue;
        const [lat, lon] = marchCurrentPos(m, now);
        const facingLeft = truckCount(m) > 0 && marchFacingLeft(m, now);
        const sel = state.groupModal?.kind === "ally-march" && String(state.groupModal.id) === String(m.id);
        await addTroop(`ally-march:${m.id}`, m, lat, lon, "ally-" + allyColor(m.owner_id).slice(1), "march", facingLeft, 0, m, sel);
    }

    const own = [];
    const ownPositions = [];
    for (const g of state.garrisons) {
        if (g.count <= 0) continue;
        own.push({ key: `garrison:${g.id}`, lat: g.lat, lon: g.lon });
        ownPositions.push([g.lat, g.lon]);
        const inCombat = (g.wounded && g.wounded.length > 0) || energyPct(g) < 100 || isFightingNear(g.lat, g.lon);
        const status = inCombat ? "combat" : "guard";
        const isSelected = state.highlight?.garrisons?.has(String(g.id))
            || (state.groupModal?.kind === "garrison" && String(state.groupModal.id) === String(g.id));
        await addTroop(`garrison:${g.id}`, g, g.lat, g.lon, "own", status, false, garrisonShiftPx(g), null, isSelected);
    }

    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [lat, lon] = marchCurrentPos(m, now);
        own.push({ key: `march:${m.id}`, lat, lon });
        ownPositions.push([lat, lon]);
        const inCombat = (m.wounded && m.wounded.length > 0) || energyPct(m) < 100 || isFightingNear(lat, lon);
        const isPatrol = !!m.patrolPath;
        const status = inCombat ? "combat" : (isPatrol ? "patrol" : "march");
        const facingLeft = truckCount(m) > 0 && marchFacingLeft(m, now);
        const isSelected = state.highlight?.marches?.has(String(m.id))
            || (state.groupModal?.kind === "march" && String(state.groupModal.id) === String(m.id));
        await addTroop(`march:${m.id}`, m, lat, lon, "own", status, facingLeft, 0, m, isSelected);

        const rem = marchRemainingPath(m, now);
        if (isPatrol) {
            if (isSelected) {
                lineFeatures.push({
                    type: "Feature",
                    properties: { patrol: true },
                    geometry: { type: "LineString", coordinates: m.patrolPath.map(pt => [pt[1], pt[0]]) }
                });
                lineFeatures.push({
                    type: "Feature",
                    properties: { patrol: true },
                    geometry: { type: "LineString", coordinates: rem.map(pt => [pt[1], pt[0]]) }
                });
            }
        } else {
            lineFeatures.push({
                type: "Feature",
                properties: { patrol: false },
                geometry: { type: "LineString", coordinates: rem.map(pt => [pt[1], pt[0]]) }
            });
        }
    }

    // Parkerede tomme lastbiler: overblik under zoom 16, rigtig gadestørrelse langs vejen fra zoom 16+
    const parkedFeatures = state.parkedTrucks.flatMap(p => (p.trucks || []).map((_, i) => ({
        type: "Feature",
        properties: {
            img: i < (p.howitzers || 0) ? "img-parked-truck-h" : "img-parked-truck",
            off: [PARKED_OFFSET_X + i * 24, i * 12]
        },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] }
    })));

    for (const p of state.parkedTrucks) {
        const list = p.trucks || [];
        if (!list.length) continue;
        const rd = nearestRoadDirection(p.lat, p.lon);
        const nx = -rd.uy, ny = rd.ux;
        const cosL = Math.max(Math.cos(p.lat * RAD_PER_DEG), MIN_COS);
        const invLon = 1 / (111320 * cosL), invLat = 1 / 111320;
        const { rot } = vehicleTiltDeg(rd.ux, rd.uy);
        const spacing = (p.howitzers || 0) > 0 ? 13.5 : 9.4;
        const pPositions = [];
        for (let i = 0; i < Math.min(list.length, 6); i++) {
            const along = 6.5 + i * spacing;
            const hasGun = i < (p.howitzers || 0);
            const tLat = p.lat + (rd.uy * along + ny * 2.0) * invLat;
            const tLon = p.lon + (rd.ux * along + nx * 2.0) * invLon;
            pPositions.push([tLat, tLon]);
            streetUnits.push({
                type: "Feature",
                properties: {
                    img: hasGun ? "st-parked-h" : "st-parked",
                    rot,
                    sort: -tLat,
                    ...streetUnitScaleProps(hasGun ? "truck-h" : "truck")
                },
                geometry: { type: "Point", coordinates: [tLon, tLat] }
            });
        }
        activeStreetFormations.set(`parked:${p.id}`, pPositions);
    }

    map.getSource("src-troops")?.setData({ type: "FeatureCollection", features: troopFeatures });
    map.getSource("src-parked-trucks")?.setData({ type: "FeatureCollection", features: parkedFeatures });
    map.getSource("src-march-lines")?.setData({ type: "FeatureCollection", features: lineFeatures });
    map.getSource("src-street-units")?.setData({ type: "FeatureCollection", features: streetUnits });
    map.getSource("src-street-badges")?.setData({ type: "FeatureCollection", features: streetBadges });
    map.getSource("src-street-rings")?.setData({ type: "FeatureCollection", features: streetRings });

    const { activeShots, blockedFeatures } = findShotPairs(foes, own);
    shotPairs = activeShots;
    map.getSource("src-los-blocked")?.setData({ type: "FeatureCollection", features: blockedFeatures });
    renderShots();

    syncCombatBuildingsToServer(ownPositions, enemyPositions);
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

function isBlockedInRifleRangeOfOwn(lat, lon) {
    const now = serverNow();
    let blockedNear = false;
    for (const g of state.garrisons) {
        if (g.count <= 0) continue;
        if (Geo.distanceM(lat, lon, g.lat, g.lon) <= GAME_CONFIG.FIRE_RANGE_M) {
            if (hasLineOfSight(lat, lon, g.lat, g.lon)) return false;
            blockedNear = true;
        }
    }
    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [mLat, mLon] = marchCurrentPos(m, now);
        if (Geo.distanceM(lat, lon, mLat, mLon) <= GAME_CONFIG.FIRE_RANGE_M) {
            if (hasLineOfSight(lat, lon, mLat, mLon)) return false;
            blockedNear = true;
        }
    }
    return blockedNear;
}

function npcAbout(n) {
    const pos = npcCurrentPos(n);
    if (isBlockedInRifleRangeOfOwn(pos[0], pos[1])) {
        return "🧱 Inden for skudafstand, men en bygning dækker skudlinjen (ryk rundt om hjørnet eller brug morter).";
    }
    if (n.fighting) return "💥 i kamp med dine soldater";
    if (n.unit_kind === "trucks") return `Den svenske hær: lastbiler, der har sat soldaterne af. ${npcGear(n)}.`;
    if (n.unit_kind) {
        const gear = npcGear(n);
        return `Den svenske hær, angreb over Øresundsbroen.${gear ? ` ${gear}.` : ""}`;
    }
    return n.is_invasion ? "Invasionsstyrke fra Malmø." : "Computerstyret. Går rundt i området og angriber soldater, den får øje på.";
}

// Geværild mellem fjender (patruljer og andre spilleres soldater) og dine soldater inden for skudafstand
// MED fri skudlinje (ingen lange skud gennem bygninger; nærkamp inden for FIRE_CLOSE_M skydes altid).
let shotPairs = [];
let shotTimer = null;

function findShotPairs(foes, ownList) {
    const activeShots = [];
    const blockedFeatures = [];
    for (const f of foes) {
        const pos = f.pos;
        const npcUnits = activeStreetFormations.get(f.key) || [pos];
        for (const o of ownList) {
            if (Geo.distanceM(pos[0], pos[1], o.lat, o.lon) > GAME_CONFIG.FIRE_RANGE_M) continue;
            const hit = shotBlockedAt(o.lat, o.lon, pos[0], pos[1]);
            if (hit) {
                blockedFeatures.push({
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: [[o.lon, o.lat], [hit.hitLon, hit.hitLat]] }
                });
                blockedFeatures.push({
                    type: "Feature",
                    properties: {},
                    geometry: { type: "Point", coordinates: [hit.hitLon, hit.hitLat] }
                });
                continue;
            }
            const ownUnits = activeStreetFormations.get(o.key) || [[o.lat, o.lon]];
            const lanes = [];
            // Flere skytter i store grupper: 3 til 6 skudlinjer mellem de enkelte små soldater.
            const nLanes = Math.min(6, Math.max(3, Math.ceil(Math.min(ownUnits.length, npcUnits.length) / 2)));
            for (let k = 0; k < nLanes; k++) {
                const ou = ownUnits[(k * 3) % ownUnits.length];
                const nu = npcUnits[(k * 2) % npcUnits.length];
                if (hasLineOfSight(ou[0], ou[1], nu[0], nu[1])) {
                    lanes.push({ own: [ou[1], ou[0]], npc: [nu[1], nu[0]] });
                } else {
                    lanes.push({ own: [o.lon, o.lat], npc: [pos[1], pos[0]] });
                }
            }
            activeShots.push({
                own: [o.lon, o.lat],
                npc: [pos[1], pos[0]],
                lanes,
                seed: f.seed || 0
            });
        }
    }
    return { activeShots, blockedFeatures };
}

function pointAlong(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Tre lysspor pr. side flyver mellem de enkelte små soldater på gaden (eller gruppecentret zoomet ud).
function shotFeatures(now) {
    const out = [];
    const streetMode = mapReady && map && map.getZoom() >= STREET_TACTICAL_ZOOM;
    for (const p of shotPairs) {
        const nLanes = streetMode && p.lanes ? p.lanes.length : 3;
        for (let k = 0; k < nLanes; k++) {
            const lane = (streetMode && p.lanes && p.lanes[k]) ? p.lanes[k] : p;
            for (const [from, a, b, offset] of [["own", lane.own, lane.npc, 0], ["npc", lane.npc, lane.own, 0.5]]) {
                // Krudtrøg, der stiger op og breder sig fra skytten (kun nede på gadeniveau).
                if (streetMode) {
                    const ph = (now / 2600 + p.seed * 1.7 + k * 0.29 + offset * 0.5) % 1;
                    const driftM = 1.5 + ph * 5;
                    out.push({
                        type: "Feature",
                        properties: { smoke: true, r: 3 + ph * 11, o: 0.6 * (1 - ph) },
                        geometry: { type: "Point", coordinates: [a[0] + driftM * 0.35 / (111320 * Math.max(Math.cos(a[1] * RAD_PER_DEG), MIN_COS)), a[1] + driftM / 111320] }
                    });
                }
                const t = (now / 450 + p.seed + offset + k / nLanes + Math.sin(k * 7.1 + p.seed) * 0.08) % 1;
                const t0 = Math.max(0, t - 0.15);
                out.push({
                    type: "Feature",
                    properties: { from },
                    geometry: { type: "LineString", coordinates: [pointAlong(a, b, t0), pointAlong(a, b, t)] }
                });
                if (t < 0.12) {
                    const baseR = streetMode ? 3.6 : 5;
                    out.push({
                        type: "Feature",
                        properties: { from, r: Math.max(1.2, baseR - t * (streetMode ? 18 : 25)) },
                        geometry: { type: "Point", coordinates: a }
                    });
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
                if (r.fire_close_m != null) GAME_CONFIG.FIRE_CLOSE_M = Number(r.fire_close_m);
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
                    hitShare: "truck_hit_share", wreckHours: "truck_wreck_hours",
                    boardM: "truck_board_m"
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
        if (myBldRes.data.length > 0) {
            const first = myBldRes.data[0];
            try { localStorage.setItem("hf_start_pos", JSON.stringify({ lon: first.lon, lat: first.lat })); } catch (_) {}
            if (!state.hasCenteredOnce && map) {
                state.hasCenteredOnce = true;
                map.jumpTo({ center: [first.lon, first.lat], zoom: 16.5 });
            }
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
    loadFlags();
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
// Tomme lastbiler tegnes så mange pixels til højre for deres position (ved siden af soldaten).
const PARKED_OFFSET_X = 30;

// Soldater, der er steget af, står samme sted som lastbilen med resten af soldaterne (0045).
// De tegnes så mange pixels til venstre, så de ikke dækker lastbilen.
const DISMOUNTED_OFFSET_X = -45;

function garrisonShiftPx(g) {
    if (truckCount(g) > 0) return 0;
    const byTruck = state.garrisons.some(x => x !== g && x.count > 0 && truckCount(x) > 0
        && Geo.distanceM(x.lat, x.lon, g.lat, g.lon) <= GAME_CONFIG.GARRISON_MERGE_M);
    return byTruck ? DISMOUNTED_OFFSET_X : 0;
}

function hitActiveStreetFormation(groupKey, lat, lon, pt, centerLat, centerLon, hitRadiusM = 6.5) {
    const units = activeStreetFormations.get(groupKey);
    if (units && units.length) {
        for (let i = 0; i < units.length; i++) {
            if (Geo.distanceM(lat, lon, units[i][0], units[i][1]) <= hitRadiusM) return true;
        }
    }
    if (Geo.distanceM(lat, lon, centerLat, centerLon) <= Math.max(7.5, hitRadiusM)) return true;
    if (pt && mapReady) {
        const cp = map.project([centerLon, centerLat]);
        if (Math.abs(pt.x - cp.x) <= 24 && pt.y >= cp.y - 42 && pt.y <= cp.y + 10) return true;
    }
    return false;
}

// Tomme lastbiler under et tryk på kortet: overbliks-billede (< zoom 16) eller parkerede gadelastbiler (zoom 16+)
function parkedTrucksNear(lat, lon) {
    if (!mapReady) return [];
    const pt = map.project([lon, lat]);
    const streetMode = map.getZoom() >= STREET_TACTICAL_ZOOM;
    return state.parkedTrucks.filter(p => {
        const n = (p.trucks || []).length;
        if (!n) return false;
        if (streetMode) {
            const units = activeStreetFormations.get(`parked:${p.id}`) || [];
            return units.some(u => Geo.distanceM(lat, lon, u[0], u[1]) <= 6.2);
        }
        const pp = map.project([p.lon, p.lat]);
        const w = (p.howitzers || 0) > 0 ? 124 : 80;
        return pt.x >= pp.x + PARKED_OFFSET_X && pt.x <= pp.x + PARKED_OFFSET_X + w + 24 * (n - 1)
            && pt.y >= pp.y - 50 && pt.y <= pp.y + 12 * n;
    });
}

// Egne vagtstyrker tæt nok på tomme lastbiler til at stige på.
function garrisonsByParked(p) {
    return state.garrisons.filter(g => g.count > 0 && Geo.distanceM(g.lat, g.lon, p.lat, p.lon) <= GAME_CONFIG.TRUCK.boardM);
}

function garrisonsNear(list, lat, lon, mergeSnap = false) {
    const pt = mapReady ? map.project([lon, lat]) : null;
    const streetMode = !mergeSnap && mapReady && map.getZoom() >= STREET_TACTICAL_ZOOM;
    const keyPrefix = list === state.garrisons ? "garrison"
        : list === state.allies?.garrisons ? "ally-garrison"
        : list === state.enemies?.garrisons ? "enemy-garrison" : null;

    return list.filter(g => {
        if (g.count <= 0) return false;
        if (streetMode && keyPrefix) {
            return hitActiveStreetFormation(`${keyPrefix}:${g.id}`, lat, lon, pt, g.lat, g.lon, truckCount(g) > 0 ? 7.5 : 5.8);
        }
        if (Geo.distanceM(lat, lon, g.lat, g.lon) <= GAME_CONFIG.GARRISON_MERGE_M) return true;
        if (!pt) return false;
        const gp = map.project([g.lon, g.lat]);
        const shift = list === state.garrisons ? garrisonShiftPx(g) : 0;
        return Math.abs(pt.x - (gp.x + shift)) <= 30 && pt.y >= gp.y - 85 && pt.y <= gp.y + 15;
    });
}

// Patruljer ved et klik på kortet (både overbliks-ikon og de små soldater/køretøjer på gaden).
function npcsNear(lat, lon) {
    const pt = mapReady ? map.project([lon, lat]) : null;
    const streetMode = mapReady && map.getZoom() >= STREET_TACTICAL_ZOOM;
    return state.enemies.npcs
        .map(n => ({ n, pos: npcCurrentPos(n) }))
        .filter(({ n, pos }) => {
            if (streetMode) {
                return hitActiveStreetFormation(`npc:${n.id}`, lat, lon, pt, pos[0], pos[1], truckCount(n) > 0 ? 7.5 : 5.8);
            }
            return garrisonsNear([{ lat: pos[0], lon: pos[1], count: 1 }], lat, lon, true).length > 0;
        });
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
        const nearGar = garrisonsNear(state.garrisons, lat, lon, true).find(g => {
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
            // Hvis man klikker oven på et af kortets huse, stiller soldaterne sig på fortovet/gaden lige uden for huset
            const [sLat, sLon] = snapOutsideMapBuilding(lat, lon, 2.2);
            target = { lat: sLat, lon: sLon, label: formatPos(sLat, sLon) };
        }
        addRoutePoint(target);
        return;
    }
    if (openFlagModalNear(lat, lon)) return;
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

// Delinger på march, man har klikket på (både overbliks-ikon og hele gadekolonnen ved zoom 16+).
function marchesNear(lat, lon, list = state.marches) {
    if (!mapReady) return [];
    const pt = map.project([lon, lat]);
    const now = serverNow();
    const streetMode = map.getZoom() >= STREET_TACTICAL_ZOOM;
    const keyPrefix = list === state.marches ? "march"
        : list === state.allies?.marches ? "ally-march"
        : list === state.enemies?.marches ? "enemy-march" : "march";

    return list.filter(m => {
        if (m.count <= 0) return false;
        const [mLat, mLon] = marchCurrentPos(m, now);
        if (streetMode) {
            return hitActiveStreetFormation(`${keyPrefix}:${m.id}`, lat, lon, pt, mLat, mLon, truckCount(m) > 0 ? 7.5 : 5.8);
        }
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
    const ally = !isMine && isAlly(bld.owner_id);
    badge.textContent = isMine ? "Din bygning" : ally ? "Allieret bygning" : "Fjendtlig bygning";
    setSelectedShape(squareFeature(bld.lat, bld.lon, size, { state: "building" }));

    const stageName = cfg ? cfg.stages[bld.level - 1] : bld.kind;
    const sprite = buildingImageUrl(bld.kind, bld.level, buildingOwnerColor(bld));
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
                    <img src="${sprite}" class="item-sprite" alt="" />
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
    } else if (ally) {
        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="${sprite}" class="item-sprite" alt="" />
                    <div class="item-info">
                        <div class="item-title" style="color:${allyColor(bld.owner_id)}">${escapeHtml(allyName(bld.owner_id))}s ${cfg?.shortName || bld.kind} (trin ${bld.level})</div>
                        <div class="item-sub">🤝 Allieret. I kæmper ikke mod hinanden. Sender du soldater hertil, stiller de sig som vagt ved bygningen.</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="sendSoldiersTo(${bld.lat}, ${bld.lon})">🪖 Send soldater hertil</button>
                </div>
            </div>
        `;
    } else {
        const radius = size / 2 + GAME_CONFIG.GARRISON_MERGE_M;
        const guards = state.enemies.garrisons
            .filter(g => g.owner_id === bld.owner_id && Geo.distanceM(g.lat, g.lon, bld.lat, bld.lon) <= radius)
            .reduce((n, g) => n + g.count, 0);
        const bldDef = GAME_CONFIG.BUILDING_DEFENSE_PER_LEVEL * bld.level;
        html += `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="${sprite}" class="item-sprite" alt="" />
                    <div class="item-info">
                        <div class="item-title enemy-title">Fjendtlig ${cfg?.shortName || bld.kind} (trin ${bld.level})</div>
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

// Afstand på skærmen fra klikket til en gruppes ikon (ikonet står lidt over positionen).
function clickDistancePx(lat, lon, gLat, gLon, shiftX = 0) {
    if (!mapReady) return Geo.distanceM(lat, lon, gLat, gLon);
    const pt = map.project([lon, lat]);
    const gp = map.project([gLon, gLat]);
    return Math.hypot(pt.x - (gp.x + shiftX), pt.y - (gp.y - 35));
}

window.showAllGroupsHere = function(all) {
    if (!state.selected) return;
    state.selected.showAll = all;
    renderSelectedBox();
};

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

        // Står flere af dine grupper tæt på skærmen, vises kun den, der er nærmest klikket.
        // Resten ligger bag knappen "Vis N andre grupper her".
        const own = [
            ...ownGuards.map(g => ({ kind: "garrison", g, d: clickDistancePx(lat, lon, g.lat, g.lon, garrisonShiftPx(g)) })),
            ...ownMarches.map(m => ({ kind: "march", g: m, d: clickDistancePx(lat, lon, ...marchCurrentPos(m)) }))
        ].sort((a, b) => a.d - b.d);
        const shown = state.selected?.showAll ? own : own.slice(0, 1);
        const others = own.length - shown.length;
        const guardsShown = shown.filter(x => x.kind === "garrison").map(x => x.g);
        const marchesShown = shown.filter(x => x.kind === "march").map(x => x.g);
        html = garrisonRowsHtml(guardsShown) + marchesShown.map(m => `
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
        if (others > 0) {
            html += `<div class="item-actions" style="margin-top:8px;"><button class="btn btn-small btn-muted" onclick="showAllGroupsHere(true)">👥 Vis ${others} ${others === 1 ? "anden gruppe" : "andre grupper"} her</button></div>`;
        } else if (own.length > 1) {
            html += `<div class="item-actions" style="margin-top:8px;"><button class="btn btn-small btn-muted" onclick="showAllGroupsHere(false)">Vis kun den nærmeste</button></div>`;
        }
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
                        <img src="assets/npc.png" class="pixel-img item-sprite" />
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
                    <img src="${buildingImageUrl(cfg.id, 1)}" class="item-sprite" alt="" />
                    <div class="item-info">
                        <div class="item-title">${cfg.name} (trin 1)</div>
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
    const [sLat, sLon] = bld ? [bld.lat, bld.lon] : snapOutsideMapBuilding(lat, lon, 2.2);
    const target = bld
        ? { lat: bld.lat, lon: bld.lon, label: buildingLabel(bld) }
        : { lat: sLat, lon: sLon, label: formatPos(sLat, sLon) };

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
        const sprite = buildingImageUrl(b.kind, b.level, buildingOwnerColor(b));
        const housing = cfg?.housing ? cfg.housing[b.level - 1] : null;
        const prod = computeProductionContents(b);
        const avail = availableInBarracks();
        const nextPrice = cfg && b.level < cfg.prices.length ? cfg.prices[b.level] : null;
        const nextSteel = cfg?.materials?.[b.level]?.steel || 0;
        const canAfford = nextPrice !== null && state.balance >= nextPrice && state.steel >= nextSteel;

        return `
            <div class="item-row">
                <div class="item-row-top">
                    <img src="${sprite}" class="item-sprite" alt="" />
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
    const now = serverNow();
    const hits = [
        ...garrisonsNear(state.garrisons, lat, lon).map(g => ({ kind: "garrison", id: g.id, pos: [g.lat, g.lon] })),
        ...marchesNear(lat, lon).map(m => ({ kind: "march", id: m.id, pos: marchCurrentPos(m, now) })),
        ...garrisonsNear(state.allies.garrisons, lat, lon).map(g => ({ kind: "ally-garrison", id: g.id, pos: [g.lat, g.lon] })),
        ...marchesNear(lat, lon, state.allies.marches).map(m => ({ kind: "ally-march", id: m.id, pos: marchCurrentPos(m, now) })),
        ...garrisonsNear(state.enemies.garrisons, lat, lon).map(g => ({ kind: "enemy-garrison", id: g.id, pos: [g.lat, g.lon] })),
        ...marchesNear(lat, lon, state.enemies.marches).map(m => ({ kind: "enemy-march", id: m.id, pos: [m.lat, m.lon] })),
        ...npcsNear(lat, lon).map(({ n, pos }) => ({ kind: "npc", id: n.id, pos }))
    ];
    const p = parkedTrucksNear(lat, lon)[0];
    if (p) {
        openGroupModal("parked", p.id);
        return;
    }
    if (hits.length === 1) {
        openGroupModal(hits[0].kind, hits[0].id);
    } else if (hits.length > 1 && mapReady && map.getZoom() >= STREET_TACTICAL_ZOOM) {
        // På gadezoom: åbn den gruppe, hvis nærmeste soldat/køretøj er tættest på klikket
        hits.sort((a, b) => {
            const ua = activeStreetFormations.get(`${a.kind}:${a.id}`) || [a.pos];
            const ub = activeStreetFormations.get(`${b.kind}:${b.id}`) || [b.pos];
            const da = Math.min(...ua.map(u => Geo.distanceM(lat, lon, u[0], u[1])));
            const db = Math.min(...ub.map(u => Geo.distanceM(lat, lon, u[0], u[1])));
            return da - db;
        });
        openGroupModal(hits[0].kind, hits[0].id);
    }
}

function findGroup(kind, id) {
    const same = x => String(x.id) === String(id);
    switch (kind) {
        case "garrison": return state.garrisons.find(same);
        case "march": return state.marches.find(same);
        case "enemy-garrison": return state.enemies.garrisons.find(same);
        case "enemy-march": return state.enemies.marches.find(same);
        case "npc": return state.enemies.npcs.find(same);
        case "parked": return state.parkedTrucks.find(same);
        case "ally-garrison": return state.allies.garrisons.find(same);
        case "ally-march": return state.allies.marches.find(same);
    }
    return null;
}

function groupPos(kind, g) {
    if (kind === "march" || kind === "ally-march") return marchCurrentPos(g, serverNow());
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
    // Navngivne soldater først (højeste rang øverst til venstre), med rang og navn på flisen.
    const named = state.groupModal ? namedInGroup(state.groupModal.kind, g.id) : [];
    let html = named.map(n => {
        const parts = escapeHtml(n.name).split(" ");
        return `
            <div class="soldier-tile named-tile" title="${rankTitle(n.heals)} ${escapeHtml(n.name)} · ${n.heals} ${n.heals === 1 ? "heling" : "helinger"}">
                <img src="assets/tropper.png" class="pixel-img" />
                <div class="named-rank">${rankTitle(n.heals)}</div>
                <div class="named-name">${parts[0]}<br>${parts.slice(1).join(" ")}</div>
            </div>`;
    }).join("");
    let nr = 0;
    html += wounded.map(e => tile(e, ++nr)).join("");
    const showHealthy = g.count <= GROUP_MODAL_MAX_TILES ? Math.max(0, healthy - named.length) : 0;
    for (let i = 0; i < showHealthy; i++) html += tile(hp, ++nr);
    let more = "";
    if (showHealthy < healthy - named.length) more = `<p class="muted-hint">+ ${healthy - named.length} raske menige med fuld energi (${hp}).</p>`;
    return `<div class="soldier-grid${named.length ? " has-named" : ""}">${html}</div>${more}`;
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
    if (gm.kind === "parked" && !g) {
        title.textContent = "Lastbilerne holder her ikke længere";
        body.innerHTML = `<p class="muted-hint">Soldaterne er steget på igen.</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }
    if (gm.kind !== "parked" && (!g || g.count <= 0)) {
        title.textContent = "Gruppen findes ikke længere";
        body.innerHTML = `<p class="muted-hint">Soldaterne er nået frem, gået hjem, slået sammen med andre eller faldet i kamp.</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }
    if (gm.kind === "parked") {
        renderParkedModal(g);
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
            ${namedLineHtml(gm.kind, g)}
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
            ${truckCount(g) > 0 ? `<button class="btn btn-primary" onclick="openDismountModal(${g.id})">🚚 Stig af lastbil${truckCount(g) === 1 ? "en" : "erne"}</button>` : ""}
            ${state.garrisons.filter(x => x.id !== g.id && x.count > 0 && truckCount(x) > 0 && Geo.distanceM(x.lat, x.lon, g.lat, g.lon) <= GAME_CONFIG.TRUCK.boardM).map(x => `<button class="btn btn-primary" onclick="closeModal(); mergeWithGarrison(${g.id}, ${x.id})">🚚 Stig på ${truckCount(x) === 1 ? "lastbilen" : `de ${truckCount(x)} lastbiler`} (${x.count} soldater i)</button>`).join("")}
            ${state.parkedTrucks.filter(p => garrisonsByParked(p).some(x => x.id === g.id)).map(p => `<button class="btn btn-primary" onclick="closeModal(); boardTrucks(${p.id}, ${g.id})">🚚 Stig på ${p.trucks.length === 1 ? "lastbilen" : `${p.trucks.length} lastbiler`}</button>`).join("")}
            ${hurt ? `<button class="btn btn-primary" onclick="closeModal(); sendWoundedToHospital(${g.id})">🏥 Send ${hurt} ${hurt === 1 ? "såret" : "sårede"} til hospitalet</button>` : ""}
            <button class="btn btn-danger" onclick="closeModal(); sendGarrisonHome(${g.id})">🏠 Send hjem</button>
            <button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }

    if (gm.kind === "ally-garrison" || gm.kind === "ally-march") {
        const color = allyColor(g.owner_id);
        const gear = npcGear(g);
        title.innerHTML = `<span style="color:${color}">🤝 ${escapeHtml(allyName(g.owner_id))}</span>: ${g.count} soldater ${gm.kind === "ally-march" ? (g.driving ? "kører" : "på march") : "på vagt"}`;
        body.innerHTML = `
            <p class="muted-hint">Allieret. I kæmper ikke mod hinanden og deler udsyn.${g.hurt ? ` ${g.hurt} ${g.hurt === 1 ? "såret" : "sårede"}.` : ""}${gear ? ` ${gear}.` : ""}</p>
            ${bar}`;
        actions.innerHTML = `
            <button class="btn" onclick="closeModal(); jumpToPoint(${lat}, ${lon})">🎯 Hop til</button>
            <button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }

    // Fjender: kun det, man kan se på afstand — antal, lastbiler og samlet energi.
    title.textContent = gm.kind === "npc" ? `${g.unit_name ? npcLabel(g) : (g.is_invasion ? "Fjendtlig invasionshær" : "Fjendtlig patrulje")}: ${g.count} soldater`
        : gm.kind === "enemy-march" ? `Fjendtlige soldater på march: ${g.count}` : `Fjendtlige vagter: ${g.count}`;
    body.innerHTML = `
        <p class="muted-hint">${gm.kind === "npc"
            ? (g.fighting ? `💥 I kamp med dine soldater lige nu.${npcGear(g) ? ` ${npcGear(g)}.` : ""}` : npcAbout(g))
            : `${isBlockedInRifleRangeOfOwn(lat, lon) ? "🧱 Inden for skudafstand, men en bygning dækker skudlinjen (ryk rundt om hjørnet eller brug morter). " : ""}En anden spillers soldater.${truckCount(g) ? ` 🚚 ${truckCount(g)} ${truckCount(g) === 1 ? "lastbil" : "lastbiler"}${g.driving ? ", kører" : ""}.` : ""} Dine soldater skyder automatisk, når de har frit skud.`} Du kan ikke se den enkelte fjendes energi, kun gruppens samlede.</p>
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

// Vælg hvor mange soldater der stiger af (0045). Stiger alle af, holder lastbilerne tomme tilbage.
// Ellers bliver resten siddende i lastbilerne (mindst én i hver) og kan køre videre.
window.openDismountModal = function(id) {
    const g = state.garrisons.find(x => String(x.id) === String(id));
    const t = truckCount(g);
    if (!g || t <= 0) return;
    state.groupModal = null;
    const maxSome = g.count - t; // flest der kan stige af, hvis nogen skal blive i lastbilerne
    document.getElementById("modal-title").textContent = "🚚 Stig af lastbil" + (t === 1 ? "en" : "erne");
    document.getElementById("modal-body").innerHTML = `
        <p>Vælg hvor mange af de ${g.count} soldater der skal stige af:</p>
        <div style="text-align:center;font-size:20px;font-weight:800;color:#39FF14;" id="dismount-val-label"></div>
        <input type="range" min="1" max="${g.count}" value="${g.count}" class="range-slider" id="dismount-range-input" />
        <p class="muted-hint" id="dismount-hint"></p>`;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn btn-primary" id="dismount-ok">🚚 Stig af</button>
        <button class="btn" onclick="closeModal()">Annuller</button>`;
    const slider = document.getElementById("dismount-range-input");
    const update = () => {
        const n = Number(slider.value);
        const ok = n >= g.count || n <= maxSome;
        document.getElementById("dismount-val-label").textContent = `${n} / ${g.count} soldater`;
        document.getElementById("dismount-hint").textContent = n >= g.count
            ? `Alle stiger af. ${t === 1 ? "Lastbilen holder tom" : `De ${t} lastbiler holder tomme`} tilbage her.`
            : ok ? `${g.count - n} bliver siddende i ${t === 1 ? "lastbilen" : "lastbilerne"} med alt udstyret og kan køre videre. De ${n} står vagt til fods ved siden af.`
            : `Der skal blive mindst én soldat i hver lastbil. Vælg højst ${maxSome}, eller lad alle stige af.`;
        document.getElementById("dismount-ok").disabled = !ok;
    };
    slider.oninput = update;
    update();
    document.getElementById("dismount-ok").onclick = () => {
        closeModal();
        dropOffFromTrucks(g.id, Number(slider.value));
    };
    document.getElementById("modal-overlay").classList.remove("hidden");
};

window.dropOffFromTrucks = async function(id, count) {
    const g = state.garrisons.find(x => String(x.id) === String(id));
    const t = truckCount(g);
    if (!g || t <= 0) return;
    const n = Math.min(count ?? g.count, g.count);
    const { error } = await sb.rpc("dismount_soldiers", { p_garrison: g.id, p_count: n });
    if (error) {
        showToast("Soldaterne kunne ikke stige af: " + error.message);
        return;
    }
    const h = g.howitzers || 0;
    showToast(n >= g.count
        ? `🚚 Soldaterne er steget af. ${t === 1 ? "Lastbilen holder tom" : `De ${t} lastbiler holder tomme`} tilbage${h > 0 ? ` med ${h === 1 ? "haubitsen" : `${h} haubitser`} og granaterne på slæb` : ""}.`
        : `🚚 ${n} ${n === 1 ? "soldat er steget" : "soldater er steget"} af. ${g.count - n} bliver i ${t === 1 ? "lastbilen" : "lastbilerne"}.`);
    await loadArmy();
};

window.boardTrucks = async function(parkedId, garrisonId) {
    const { data, error } = await sb.rpc("board_trucks", { p_parked: parkedId, p_garrison: garrisonId });
    if (error) {
        showToast("Soldaterne kunne ikke stige på: " + error.message);
        return;
    }
    showToast(`🚚 Soldaterne er steget på. Vagtstyrken har nu ${data.trucks} ${data.trucks === 1 ? "lastbil" : "lastbiler"}.`);
    await loadArmy();
};

// Popup for tomme lastbiler: hvem der kan stige på, eller send soldater herhen.
function renderParkedModal(p) {
    const T = GAME_CONFIG.TRUCK;
    const n = (p.trucks || []).length;
    const near = garrisonsByParked(p);
    document.getElementById("modal-title").textContent = (n === 1 ? "Tom lastbil" : `${n} tomme lastbiler`)
        + (p.howitzers > 0 ? ` med ${p.howitzers === 1 ? "haubits" : `${p.howitzers} haubitser`}` : "");
    document.getElementById("modal-body").innerHTML = `
        <p class="muted-hint">Soldaterne er steget af. ${n === 1 ? "Lastbilen holder" : "Lastbilerne holder"} her, indtil soldater inden for ${formatDistance(T.boardM)} stiger på igen. Kun du kan se ${n === 1 ? "den" : "dem"}.</p>
        ${truckLineHtml("parked", p)}
        ${p.howitzers > 0 ? `<p class="muted-hint">💥 ${p.howitzers} ${p.howitzers === 1 ? "haubits" : "haubitser"} på slæb · 🎯 ${p.howitzer_shells || 0} haubitsgranater. Følger med, når soldater stiger på.</p>` : ""}
        ${near.length ? "" : `<p class="muted-hint">Ingen af dine soldater står tæt nok på. Send soldater herhen, så kan de stige på, når de er nået frem.</p>`}`;
    document.getElementById("modal-actions").innerHTML = `
        <button class="btn" onclick="closeModal(); jumpToPoint(${p.lat}, ${p.lon})">🎯 Hop til</button>
        ${near.map(g => `<button class="btn btn-primary" onclick="closeModal(); boardTrucks(${p.id}, ${g.id})">🚚 Stig på (${g.count} soldater)</button>`).join("")}
        <button class="btn btn-primary" onclick="closeModal(); sendSoldiersTo(${p.lat}, ${p.lon})">🪖 Send soldater hertil</button>
        <button class="btn" onclick="closeModal()">Luk</button>`;
}

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
        : kind === "parked" ? `${t.length} ${word} uden soldater (plads til ${t.length * T.capacity}).`
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
        announceAllyShells();
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

// "Din allierede Lars skyder 4 mortergranater": én besked pr. salve, når en allieret skyder.
const announcedSalvos = new Set();
function announceAllyShells() {
    const now = serverNow();
    const salvos = new Map();
    for (const c of state.craters) {
        if (!c.ally || !c.fired_at || Date.parse(c.lands_at) <= now) continue;
        const key = `${c.ally_name || ""}|${c.fired_at}|${c.weapon}`;
        salvos.set(key, (salvos.get(key) || 0) + 1);
    }
    for (const [key, n] of salvos) {
        if (announcedSalvos.has(key)) continue;
        announcedSalvos.add(key);
        const [name, , weapon] = key.split("|");
        const what = weapon === "howitzer" ? (n === 1 ? "haubitsgranat" : "haubitsgranater") : (n === 1 ? "mortergranat" : "mortergranater");
        queueToast(`💣 Din allierede${name ? " " + name : ""} skyder ${n} ${what}. Se nedslagene på kortet.`);
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

// Tegner kratere, eksplosioner og egne og allieredes granater i luften. Returnerer true, så længe noget bevæger sig.
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
        if (!(c.mine || c.ally) || c.from_lat == null) continue;
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
    engaged:    r => `⚔️ Dine ${r.count} soldater er stødt på en anden spillers soldater og har taget stilling.`,
    skirmish_won:  r => `🏅 Dine soldater nedkæmpede en fjendtlig spillers gruppe på ${r.enemy_losses} soldater.`,
    skirmish_lost: r => `💀 En anden spillers soldater nedkæmpede ${r.count} af dine soldater.`,
    flag_taken: r => `🚩 Dine soldater har taget flaget ${r.note || ""}.`,
    flag_lost:  r => `🏳️ Du har mistet flaget ${r.note || ""}.`,
    town_taken: r => `🏙️ ${r.note || "En by"} er nu under din kontrol!`,
    town_lost:  r => `💔 Du har mistet kontrollen over ${r.note || "en by"}.`,
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
// Eksplosionerne fra gamle træfninger på kortet kan slås til og fra (slået fra som standard).
// En kamp, man klikker på i listen, vises dog altid.
const BATTLES_ON_MAP_KEY = "hf_battles_on_map";
let battlesOnMap = false;
try { battlesOnMap = localStorage.getItem(BATTLES_ON_MAP_KEY) === "1"; } catch (_) {}

function toggleBattlesOnMap() {
    battlesOnMap = !battlesOnMap;
    try { localStorage.setItem(BATTLES_ON_MAP_KEY, battlesOnMap ? "1" : "0"); } catch (_) {}
    renderBattlesSidebar();
    renderBattlesOnMap();
}

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
    const toggle = `<button class="btn btn-small ${battlesOnMap ? "btn-primary" : ""}" onclick="toggleBattlesOnMap()" title="Vis eller skjul eksplosionerne fra gamle træfninger på kortet">${battlesOnMap ? "💥 Skjul træfninger" : "💥 Se træfninger"}</button>`;
    let html = `<div class="item-actions" style="margin-bottom:8px;">${buttons}</div>
        <div class="item-actions" style="margin-bottom:8px;">${toggle}</div>`;

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
        features: battles.filter(b => battlesOnMap || String(b.id) === String(selectedBattleId)).map(b => ({
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
        .select("*")
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
    if (data.some(r => r.kind.startsWith("flag_") || r.kind.startsWith("town_"))) pollFlagStates();
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
        const al = data.allies || {};
        state.allies = {
            players: al.players || [],
            buildings: al.buildings || [],
            garrisons: al.garrisons || [],
            marches: (al.marches || []).map(m => ({
                ...m,
                startedAtMillis: Date.parse(m.started_at),
                arrivesAtMillis: Date.parse(m.arrives_at)
            }))
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
            ? `👁️ Dine soldater har fået øje på fjenden: ${npcLabel(n)} med ${n.count} soldater${npcGear(n) ? ` (${npcGear(n)})` : ""}.`
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
                ? `💥 Dine soldater er i kamp med fjenden: ${npcLabel(n)} med ${n.count} soldater!`
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

    const who = o => o.by_soldiers ? "set af dine soldater" : (o.always_visible && !o.in_sight ? "synlig til test" : "set med telefonen");
    const rows = [];          // soldater og patruljer: øverst
    const bldRows = [];       // bygninger: i en gruppe, der kan foldes sammen
    for (const b of e.buildings) {
        const cfg = GAME_CONFIG.BUILDINGS[b.kind];
        const sprite = buildingImageUrl(b.kind, b.level, buildingOwnerColor(b));
        bldRows.push(`
            <div class="item-row">
                <div class="item-row-top">
                    <img src="${sprite}" class="item-sprite" alt="" />
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
                    <img src="assets/npc.png" class="pixel-img item-sprite" />
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
    let html = rows.join("");
    if (!rows.length) html = `<p class="muted-hint">Ingen fjendtlige soldater i sigte.</p>`;
    if (bldRows.length) {
        html += `
            <details class="sub-fold" ${contactsBuildingsOpen ? "open" : ""} ontoggle="contactsBuildingsOpen = this.open">
                <summary>🏭 Fjendtlige bygninger <span class="badge">${bldRows.length}</span></summary>
                <div class="list-stack">${bldRows.join("")}</div>
            </details>`;
    }
    list.innerHTML = html;
}
// Husker, om gruppen med fjendtlige bygninger er foldet ud (listen tegnes om hele tiden).
let contactsBuildingsOpen = false;

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
            <td class="admin-res">
                <label>Alliance <input type="text" id="adm-alliance-${p.id}" value="${escapeHtml(p.alliance || "")}" placeholder="ingen" style="width:90px" /></label>
                <button class="btn btn-small" onclick="saveAlliance('${p.id}', this)">Gem</button>
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
        <p class="muted-hint">Alliance: spillere med samme navn (fx Danmark) er allierede. De kæmper ikke mod hinanden, ser altid hinandens soldater og bygninger og deler udsyn. Tomt felt = spilleren er alene.</p>
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

window.saveAlliance = async function(playerId, button) {
    const name = document.getElementById(`adm-alliance-${playerId}`).value.trim();
    button.disabled = true;
    const { error } = await sb.rpc("admin_set_alliance", { p_player: playerId, p_alliance: name });
    button.disabled = false;
    if (error) {
        showToast("Kunne ikke gemme: " + error.message);
        return;
    }
    showToast(name ? `Gemt: alliance ${name}.` : "Gemt: spilleren er nu alene.");
    pollWorld();
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
    ["flags", "Byer og flag"],
    ["rank", "Navngivne soldater og rang"],
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
    fire_close_m:               ["fire", "Nærkamp: så tæt på skydes der altid, også om hushjørner", "m"],
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
    truck_board_m:              ["truck", "Så tæt skal soldater stå på tomme lastbiler for at stige på", "m"],
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
    rank_fire_bonus:            ["rank", "Mere ildkraft pr. rang (0,10 = 10 %)", "0–1"],
    rank_fire_max:              ["rank", "Højeste ildkraftbonus pr. soldat (1,0 = +100 %)", "0–2"],
    rank_survive_bonus:         ["rank", "Mindre chance for at falde pr. rang (0,08 = 8 %)", "0–1"],
    rank_survive_max:           ["rank", "Højeste overlevelsesbonus (0,6 = 60 %)", "0–1"],
    flag_radius_m:              ["flags", "Cirkel om flaget", "m"],
    flag_hold_s:                ["flags", "Så længe skal man stå alene i cirklen for at tage flaget", "s"],
    sweden_vision_m:            ["sweden", "Så langt hærens enheder ser (hele hæren deler det)", "m"],
    sweden_dismount_m:          ["sweden", "Lastbiler stopper og sætter soldaterne af, når fjenden er så tæt på", "m"],
    sweden_attack_range_m:      ["sweden", "Så langt infanteriet går for at angribe", "m"],
    sweden_attack_ratio:        ["sweden", "Angriber kun, hvis de selv og naboerne er så mange gange flere (1 = lige mange)", "gange"],
    sweden_support_m:           ["sweden", "Naboenheder så tæt på tæller med i styrken", "m"],
    sweden_retreat_share:       ["sweden", "Kompagniet trækker sig tilbage under denne andel af sine soldater (0,3 = 30 %)", "0–1"],
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
    state.flagModal = null;
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
    try { localStorage.removeItem("hf_start_pos"); } catch (_) {}
    state.hasCenteredOnce = false;
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
            <p class="muted-hint" style="margin-bottom: 12px;">🎖️ <strong>Navngivne soldater og rang:</strong> En såret soldat, der heles på felthospitalet, får navn og bliver korporal. Hver heling derefter giver næste rang: sergent, oversergent, seniorsergent, løjtnant, premierløjtnant, kaptajn og major. De navngivne følger med grupperne: ved deling fordeles de jævnt, ved sammenlægning følger alle med, og i kamp falder de i forhold til deres andel af gruppen. De ses i gruppens popup. <strong>I kampen</strong> giver hver rang ${fmtPct(codexRule("rank_fire_bonus", 0.10))} mere ildkraft (højst +${fmtPct(codexRule("rank_fire_max", 1.0))} pr. soldat) og ${fmtPct(codexRule("rank_survive_bonus", 0.08))} mindre chance pr. rang for at falde (højst ${fmtPct(codexRule("rank_survive_max", 0.6))}). Siden <strong>🎖️ Mine soldater</strong> i toppen viser alle navngivne, hvor de er, og mindelisten over de faldne.</p>

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
                ${b.stages.map((_, i) => `
                    <div class="codex-stage">
                        <div class="codex-stage-img"><img src="${buildingImageUrl(b.id, i + 1)}" alt="" /></div>
                        <div class="codex-stage-name">Trin ${i + 1}</div>
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
                    <p class="muted-hint">Hver soldat har et gevær. Skud udveksles automatisk, når en fjende er inden for skudafstand med frit skud – både computerens patruljer og andre spilleres soldater. Huse spærrer for de lange skud, men i nærkamp skydes der altid, også rundt om hushjørner. Delinger på march standser og tager stilling, når de får frit skud til en fjende.</p>
                    ${codexStats([
                        ["Skudafstand", formatDistance(C.FIRE_RANGE_M)],
                        ["Nærkamp trods huse", `inden for ${formatDistance(C.FIRE_CLOSE_M)}`],
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
                    <p class="muted-hint">Grøn militærlastbil med presenning over ladet, hvor soldaterne sidder. Vælg lastbiler, når du sender soldater. Der skal mindst 1 soldat i hver lastbil for at køre den, og er der flere soldater, end der er plads til, går alle. Kommer den hjem til barrakken, bliver den repareret. Soldaterne kan stige af og lade lastbilen stå tom tilbage, indtil de (eller andre af dine soldater) kommer og stiger på igen. En haubits på slæb bliver hængende bag den tomme lastbil sammen med sine granater.</p>
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
                    <p class="muted-hint">Angriber over Øresundsbroen fra Lernacken på den svenske side med samme våben og køretøjer som dig. Fodfolket går, køretøjerne kører med lastbilens fart. Hele hæren deler, hvad dens enheder ser (${formatDistance(codexRule("sweden_vision_m", 500))}).</p>
                    <ul class="muted-hint">
                        <li>Morterer og haubitser går i stilling, så snart de kan nå dine soldater, og skyder. De skyder ikke, hvis deres egne står i farezonen, og granaterne slipper op.</li>
                        <li>Motoriserede kompagnier sætter soldaterne af ${formatDistance(codexRule("sweden_dismount_m", 800))} fra dine soldater eller når de bliver beskudt. Lastbilerne bliver stående med en chauffør i hver.</li>
                        <li>Infanteriet angriber dine soldater inden for ${formatDistance(codexRule("sweden_attack_range_m", 1500))}, men kun når de selv og naboerne er mindst lige så mange. Ellers venter de og lader artilleriet skyde.</li>
                        <li>Et kompagni med under ${fmtPct(codexRule("sweden_retreat_share", 0.3))} af sine soldater trækker sig tilbage til staben eller artilleriet.</li>
                    </ul>
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
                    <div class="codex-card-head"><h3>Fjendtlig patrulje</h3><span class="badge">grå uniform</span></div>
                    <div class="codex-weapon-img"><img src="assets/npc.png" class="pixel-img" alt="" /></div>
                    <p class="muted-hint">Computerstyret. Strejfer rundt omkring spillerne og angriber dine soldater, når de ser dem. Har gevær ligesom dine soldater.</p>
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
        codexSoldierHtml() + codexBuildingsHtml() + codexWeaponsHtml() + codexVehiclesHtml() + codexTownsHtml() + codexEnemiesHtml();
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

// ============================================================================
// Navngivne soldater med rang (0050_navngivne_soldater.sql) — del 1
// En såret soldat, der heles på felthospitalet, får navn og rang. Hver heling derefter giver
// næste rang. De følger med grupperne (serveren holder styr på det); her vises de kun.
// ============================================================================
const namedData = { alive: [], fallen: [], loaded: false, supported: true };
const RANKS = [
    [10, "Major"], [8, "Kaptajn"], [6, "Premierløjtnant"], [5, "Løjtnant"],
    [4, "Seniorsergent"], [3, "Oversergent"], [2, "Sergent"], [1, "Korporal"]
];

function rankTitle(heals) {
    for (const [min, title] of RANKS) if (heals >= min) return title;
    return "Menig";
}

async function loadNamedSoldiers() {
    if (!state.user || !namedData.supported) return;
    const { data, error } = await sb.rpc("my_named_soldiers");
    if (error) {
        if (error.code === "PGRST202" || String(error.message || "").includes("my_named_soldiers")) namedData.supported = false;
        return;
    }
    namedData.alive = data?.alive || [];
    namedData.fallen = data?.fallen || [];
    namedData.loaded = true;
}

// De navngivne i en bestemt gruppe (vagtstyrke eller deling).
function namedInGroup(kind, id) {
    const place = kind === "march" ? "march" : "garrison";
    return namedData.alive.filter(n => n.place === place && String(n.group_id) === String(id));
}

function namedLineHtml(kind, g) {
    if (!namedData.loaded) return "";
    const list = namedInGroup(kind, g.id);
    if (!list.length) return "";
    const shown = list.slice(0, 8).map(n => `<span title="${n.heals} ${n.heals === 1 ? "heling" : "helinger"}">${rankTitle(n.heals)} ${escapeHtml(n.name)}</span>`).join(", ");
    const more = list.length > 8 ? ` og ${list.length - 8} til` : "";
    const fb = codexRule("rank_fire_bonus", 0.10), fmax = codexRule("rank_fire_max", 1.0);
    const bonus = list.reduce((sum, n) => sum + Math.min(n.heals * fb, fmax), 0);
    const pct = g.count > 0 ? Math.round(bonus / g.count * 100) : 0;
    return `<p class="muted-hint">🎖️ ${list.length} ${list.length === 1 ? "navngiven soldat" : "navngivne soldater"}${pct > 0 ? ` (+${pct} % ildkraft)` : ""}: ${shown}${more}.</p>`;
}

// Nærmeste by til et punkt (til "vagt i Glostrup"), hvis byerne er hentet.
function nearestTownName(lat, lon, maxM = 2500) {
    if (!flagData.loaded) return null;
    let best = null, bestD = maxM;
    for (const t of flagData.towns.values()) {
        const d = Geo.distanceM(lat, lon, t.lat, t.lon);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best ? best.name : null;
}

// Hvor en navngiven soldat er lige nu, som tekst + sted at hoppe til.
function namedWhere(n) {
    if (n.place === "home") return { text: "🏠 i barakken", lat: null, lon: null, kind: null, id: null };
    if (n.place === "hospital") return { text: "🏥 på hospitalet", lat: null, lon: null, kind: null, id: null };
    if (n.place === "garrison") {
        const g = state.garrisons.find(x => String(x.id) === String(n.group_id));
        if (!g) return { text: "🪖 på vagt", lat: null, lon: null, kind: null, id: null };
        const town = nearestTownName(g.lat, g.lon);
        return { text: `🪖 på vagt${town ? ` i ${town}` : ""} (${g.count} soldater)`, lat: g.lat, lon: g.lon, kind: "garrison", id: g.id };
    }
    const m = state.marches.find(x => String(x.id) === String(n.group_id));
    if (!m) return { text: "🚶 på march", lat: null, lon: null, kind: null, id: null };
    const [lat, lon] = marchCurrentPos(m, serverNow());
    const town = nearestTownName(m.toLat, m.toLon);
    return { text: `🚶 på march${town ? ` mod ${town}` : ""} (${m.count} soldater)`, lat, lon, kind: "march", id: m.id };
}

// Siden "Mine soldater": alle navngivne efter rang, hvor de er, og mindelisten over de faldne.
window.openSoldiersPage = async function(tab = "alive") {
    state.groupModal = null;
    state.hospitalModal = null;
    state.flagModal = null;
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const actions = document.getElementById("modal-actions");
    document.querySelector(".modal-box")?.classList.add("modal-wide");
    title.textContent = "🎖️ Mine soldater";
    body.innerHTML = `<p class="muted-hint">Henter soldater …</p>`;
    actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    document.getElementById("modal-overlay").classList.remove("hidden");

    await loadNamedSoldiers();
    if (!namedData.supported) {
        body.innerHTML = `<p class="muted-hint">Navngivne soldater kræver, at <strong>0050_navngivne_soldater.sql</strong> er kørt i Supabase.</p>`;
        return;
    }

    const total = Number(state.soldiers || 0);
    const alive = namedData.alive;
    const fallen = namedData.fallen;
    const byRank = new Map();
    for (const n of alive) byRank.set(rankTitle(n.heals), (byRank.get(rankTitle(n.heals)) || 0) + 1);
    const rankBadges = RANKS.map(([, t]) => t).filter(t => byRank.has(t)).map(t => `<span class="badge">${t}: ${byRank.get(t)}</span>`).join(" ");

    const tabs = `<div class="item-actions" style="margin-bottom:8px;">
        <button class="btn btn-small ${tab === "alive" ? "btn-primary" : ""}" onclick="openSoldiersPage('alive')">🎖️ Navngivne (${alive.length})</button>
        <button class="btn btn-small ${tab === "fallen" ? "btn-primary" : ""}" onclick="openSoldiersPage('fallen')">🕯️ Mindeliste (${fallen.length})</button>
    </div>`;

    if (tab === "alive") {
        const tiles = alive.map(n => {
            const w = namedWhere(n);
            const click = w.kind ? `onclick="closeModal(); jumpToPoint(${w.lat}, ${w.lon}); openGroupModal('${w.kind}', ${JSON.stringify(String(w.id))})"` : "";
            const parts = escapeHtml(n.name).split(" ");
            return `<div class="soldier-tile named-tile" ${click ? `style="cursor:pointer" ${click}` : ""} title="${rankTitle(n.heals)} ${escapeHtml(n.name)} · ${n.heals} ${n.heals === 1 ? "heling" : "helinger"} · ${w.text.replace(/<[^>]+>/g, "")}">
                <img src="assets/tropper.png" class="pixel-img" />
                <div class="named-rank">${rankTitle(n.heals)}</div>
                <div class="named-name">${parts[0]}<br>${parts.slice(1).join(" ")}</div>
                <div class="named-where">${w.text.split(" ")[0]}</div>
            </div>`;
        }).join("");
        body.innerHTML = `
            ${tabs}
            <p class="muted-hint">Du har <strong>${total.toLocaleString("da-DK")}</strong> soldater i alt, heraf <strong>${alive.length}</strong> navngivne med rang. Højeste rang står øverst til venstre. Tryk på en soldat i felten for at hoppe til gruppen. 🏠 i barakken · 🏥 på hospitalet · 🪖 på vagt · 🚶 på march.</p>
            ${rankBadges ? `<p>${rankBadges}</p>` : ""}
            ${tiles ? `<div class="soldier-grid named-grid">${tiles}</div>` : `<p class="muted-hint">Ingen navngivne soldater endnu. Send sårede soldater hjem til hospitalet, så får de navn, når de er raske.</p>`}`;
    } else {
        const rows = fallen.map(n => `<div class="item-row" ${n.died_lat != null ? `style="cursor:pointer" onclick="closeModal(); jumpToPoint(${n.died_lat}, ${n.died_lon})"` : ""}>
                <div class="item-row-top">
                    <strong>🕯️ ${rankTitle(n.heals)} ${escapeHtml(n.name)}</strong>
                    <span class="muted-hint">${fmtWhen(n.died_at)}</span>
                </div>
                <div class="muted-hint">${escapeHtml(n.died_note || "faldet")}${n.died_lat != null ? ` · ${nearestTownName(n.died_lat, n.died_lon) ? `ved ${nearestTownName(n.died_lat, n.died_lon)}` : formatPos(n.died_lat, n.died_lon)}` : ""}</div>
            </div>`).join("");
        body.innerHTML = `
            ${tabs}
            <p class="muted-hint">Navngivne soldater, der er faldet. Tryk på en for at se stedet på kortet.</p>
            ${rows ? `<div class="list-stack">${rows}</div>` : `<p class="muted-hint">Ingen faldne endnu.</p>`}`;
    }
};
document.getElementById("btn-soldiers-page")?.addEventListener("click", () => openSoldiersPage());

// ============================================================================
// Byer og flag (0048_byer_og_flag.sql): kontrol over byer
// Hvert flag har en cirkel. Den side, der står alene i cirklen længe nok, ejer flaget; byen ejes af
// den side med flest flag. Alt afgøres på serveren (flags_tick); her tegnes og vises det kun.
// Virker uden fejl, før 0048 er kørt (knappen "Byer" forklarer så, hvad der mangler).
// ============================================================================
const FLAG_POLL_MS = 20000;
const flagData = {
    towns: new Map(),      // id -> { id, name, kind, lat, lon, owner_id, owner_name, owned_at, flags }
    flags: new Map(),      // id -> { id, town_id, name, lat, lon, owner_id, owner_name, owned_at, cand_id, cand_name, cand_since }
    rules: { radius_m: 50, hold_s: 60 },
    loaded: false,
    supported: true,
    loading: false
};
const FLAG_COLORS = { own: "#39FF14", ally: "#B388FF", enemy: "#FF5252", none: "#B0BEC5" };
const TOWN_KIND_LABEL = { storby: "storby", by: "by", bydel: "bydel", kvarter: "kvarter", nabolag: "nabolag", landsby: "landsby" };

// Hvem ejeren er set fra dig: dig selv, en allieret, en fjende eller ingen.
function flagSideOf(ownerId) {
    if (!ownerId) return "none";
    if (state.user && ownerId === state.user.id) return "own";
    if (isAlly(ownerId)) return "ally";
    return "enemy";
}

function flagSideColor(ownerId) {
    const side = flagSideOf(ownerId);
    if (side === "ally") return allyColor(ownerId);
    return FLAG_COLORS[side];
}

function flagOwnerLabel(ownerId, ownerName) {
    const side = flagSideOf(ownerId);
    if (side === "none") return "ingen";
    if (side === "own") return "dig";
    if (side === "ally") return `${ownerName || allyName(ownerId)} (allieret)`;
    return `${ownerName || "en anden spiller"} (fjende)`;
}

// Et lille flag i pixel-stil i ejerens farve (tegnes én gang pr. farve).
const flagImageIds = new Set();
function flagImageId(color) {
    const id = "img-flag-" + color.replace("#", "");
    if (!flagImageIds.has(id) && map && !map.hasImage(id)) {
        const art = [
            "PDDDDDDDDDDD....",
            "PDFFFFFFFFFFD...",
            "PDFFFFFFFFFFFFD.",
            "PDFFFFFFFFFFFFFD",
            "PDFFFFFFFFFFFFFD",
            "PDFFFFFFFFFFFFFD",
            "PDFFFFFFFFFFFFD.",
            "PDFFFFFFFFFFD...",
            "PDDDDDDDDDDD....",
            "P...............",
            "P...............",
            "P...............",
            "P...............",
            "PP..............",
            "SSS............."
        ];
        const colors = { P: "#5D4037", D: "#1a1208", F: color, S: "#3e2a1a" };
        const px = 3, pad = 1, w = 16 * px + pad * 2, h = 15 * px + pad * 2;
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        art.forEach((row, y) => [...row].forEach((c, x) => {
            if (!colors[c]) return;
            ctx.fillStyle = colors[c];
            ctx.fillRect(pad + x * px, pad + y * px, px, px);
        }));
        map.addImage(id, ctx.getImageData(0, 0, w, h), { pixelRatio: 1 });
        flagImageIds.add(id);
    }
    return id;
}

function installFlagLayers() {
    if (map.getSource("src-flags")) return;
    const empty = { type: "FeatureCollection", features: [] };
    map.addSource("src-flag-circles", { type: "geojson", data: empty });
    map.addSource("src-flags", { type: "geojson", data: empty });
    const before = map.getLayer("lyr-troops") ? "lyr-troops" : undefined;

    map.addLayer({
        id: "lyr-flag-circle-fill",
        type: "fill",
        source: "src-flag-circles",
        minzoom: 12,
        paint: { "fill-color": ["get", "c"], "fill-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.08, 15, 0.16] }
    }, before);
    map.addLayer({
        id: "lyr-flag-circle-line",
        type: "line",
        source: "src-flag-circles",
        minzoom: 12,
        paint: {
            "line-color": ["get", "c"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 2],
            "line-dasharray": [2, 1.5],
            "line-opacity": 0.8
        }
    }, before);
    map.addLayer({
        id: "lyr-flag-cand",
        type: "circle",
        source: "src-flags",
        filter: ["==", ["get", "cand"], 1],
        paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 7, 16, 16],
            "circle-color": "#FFD54F",
            "circle-opacity": 0.25,
            "circle-stroke-color": "#FFD54F",
            "circle-stroke-width": 2
        }
    }, before);
    // Ejede flag får en farvet plet bagved, så ejerskabet kan ses selv zoomet langt ud.
    map.addLayer({
        id: "lyr-flag-owned",
        type: "circle",
        source: "src-flags",
        minzoom: 9,
        filter: ["==", ["get", "owned"], 1],
        paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 13, 8, 16, 13],
            "circle-color": ["get", "c"],
            "circle-opacity": 0.75,
            "circle-stroke-color": "#1a1208",
            "circle-stroke-width": 1.5
        }
    }, before);
    map.addLayer({
        id: "lyr-flags",
        type: "symbol",
        source: "src-flags",
        minzoom: 9,
        layout: {
            "icon-image": ["get", "img"],
            "icon-anchor": "bottom",
            "icon-size": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 13, 0.75, 16, 1.0],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-field": ["step", ["zoom"], "", 14.5, ["get", "label"]],
            "text-font": ["Noto Sans Bold"],
            "text-size": 11,
            "text-anchor": "top",
            "text-offset": [0, 0.4],
            "text-optional": true
        },
        paint: {
            "text-color": ["get", "c"],
            "text-halo-color": "#241a10",
            "text-halo-width": 1.6
        }
    }, before);
}

// Cirkel som polygon (radius i meter), så den har samme størrelse som på serveren uanset zoom.
function circlePolygon(lat, lon, radiusM, n = 32) {
    const mPerLat = 111320;
    const mPerLon = 111320 * Math.max(Math.cos(lat * RAD_PER_DEG), MIN_COS);
    const ring = [];
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        ring.push([lon + Math.cos(a) * radiusM / mPerLon, lat + Math.sin(a) * radiusM / mPerLat]);
    }
    return { type: "Polygon", coordinates: [ring] };
}

function renderFlagsOnMap() {
    if (!mapReady || !map.getSource("src-flags")) return;
    const r = flagData.rules.radius_m;
    const circles = [];
    const points = [];
    for (const f of flagData.flags.values()) {
        const color = flagSideColor(f.owner_id);
        const town = flagData.towns.get(f.town_id);
        circles.push({ type: "Feature", properties: { c: color }, geometry: circlePolygon(f.lat, f.lon, r) });
        points.push({
            type: "Feature",
            properties: {
                id: f.id, c: color, img: flagImageId(color), cand: f.cand_id ? 1 : 0, owned: f.owner_id ? 1 : 0,
                label: town && (town.flags || 1) > 1 ? `${town.name}: ${f.name}` : (town ? town.name : f.name)
            },
            geometry: { type: "Point", coordinates: [f.lon, f.lat] }
        });
    }
    map.getSource("src-flag-circles").setData({ type: "FeatureCollection", features: circles });
    map.getSource("src-flags").setData({ type: "FeatureCollection", features: points });
    applyTownLabelColors();
}

// Bynavnene på kortet får ejerens farve (grøn = din side, lilla = allieret, rød = fjende).
function applyTownLabelColors() {
    if (!mapReady) return;
    const own = [], ally = [], enemy = [];
    for (const t of flagData.towns.values()) {
        if (!t.owner_id) continue;
        const side = flagSideOf(t.owner_id);
        if (side === "own") own.push(t.name);
        else if (side === "ally") ally.push(t.name);
        else enemy.push(t.name);
    }
    const nameExpr = ["coalesce", ["get", "name:latin"], ["get", "name"]];
    const expr = ["case",
        ["in", nameExpr, ["literal", own]], "#8CFF4D",
        ["in", nameExpr, ["literal", ally]], "#D1B3FF",
        ["in", nameExpr, ["literal", enemy]], "#FF8A80",
        "#f6e9c4"];
    for (const id of ["label_city", "label_city_capital", "label_town", "label_village"]) {
        if (map.getLayer(id)) map.setPaintProperty(id, "text-color", expr);
    }
}

function flagsUnsupported(error) {
    return error && (error.code === "PGRST202" || String(error.message || "").includes("list_flag"));
}

async function loadFlags() {
    if (!state.user || !flagData.supported || flagData.loading) return;
    flagData.loading = true;
    try {
        const { data, error } = await sb.rpc("list_flags");
        if (error) {
            if (flagsUnsupported(error)) flagData.supported = false;
            else console.warn("list_flags fejlede:", error.message || error);
            return;
        }
        flagData.towns.clear();
        flagData.flags.clear();
        for (const t of data?.towns || []) flagData.towns.set(t.id, t);
        for (const f of data?.flags || []) flagData.flags.set(f.id, f);
        if (data?.rules) flagData.rules = { radius_m: Number(data.rules.radius_m) || 50, hold_s: Number(data.rules.hold_s) || 60 };
        flagData.loaded = true;
        renderFlagsOnMap();
        updateTownsBadge();
        if (state.flagModal) renderFlagModal();
    } finally {
        flagData.loading = false;
    }
}

async function pollFlagStates() {
    if (!state.user || !flagData.supported || !flagData.loaded) return;
    const { data, error } = await sb.rpc("list_flag_states");
    if (error || !data) return;
    const ownedTowns = new Set();
    for (const t of data.towns || []) {
        ownedTowns.add(t.id);
        const cur = flagData.towns.get(t.id);
        if (cur) Object.assign(cur, t);
    }
    for (const t of flagData.towns.values()) {
        if (t.owner_id && !ownedTowns.has(t.id)) { t.owner_id = null; t.owner_name = null; t.owned_at = null; }
    }
    const active = new Set();
    for (const f of data.flags || []) {
        active.add(f.id);
        const cur = flagData.flags.get(f.id);
        if (cur) Object.assign(cur, f);
    }
    for (const f of flagData.flags.values()) {
        if ((f.owner_id || f.cand_id) && !active.has(f.id)) {
            f.owner_id = null; f.owner_name = null; f.owned_at = null; f.cand_id = null; f.cand_name = null; f.cand_since = null;
        }
    }
    renderFlagsOnMap();
    updateTownsBadge();
    if (state.flagModal) renderFlagModal();
}

function updateTownsBadge() {
    const btn = document.getElementById("btn-towns");
    if (!btn) return;
    let mine = 0;
    for (const t of flagData.towns.values()) {
        if (t.owner_id && flagSideOf(t.owner_id) !== "enemy") mine++;
    }
    btn.textContent = mine > 0 ? `🏙️ Byer (${mine})` : "🏙️ Byer";
}

// Klik på kortet tæt ved et flag åbner flagets infoboks.
function openFlagModalNear(lat, lon) {
    if (!mapReady || !flagData.loaded || map.getZoom() < 9) return false;
    const p = map.project([lon, lat]);
    let best = null, bestD = 22;
    for (const f of flagData.flags.values()) {
        const q = map.project([f.lon, f.lat]);
        const d = Math.hypot(q.x - p.x, q.y - (p.y + 20));  // flaget står oven på punktet (anker i bunden)
        const d2 = Math.hypot(q.x - p.x, q.y - p.y);
        const dd = Math.min(d, d2);
        if (dd < bestD) { bestD = dd; best = f; }
    }
    if (!best) return false;
    openFlagModal(best.id);
    return true;
}

window.openFlagModal = function(id) {
    state.groupModal = null;
    state.hospitalModal = null;
    state.flagModal = id;
    renderFlagModal();
    document.getElementById("modal-overlay").classList.remove("hidden");
};

// Soldater i cirklen lige nu, set fra dig (egne, allierede og fjender du kan se).
function soldiersInFlagCircle(f) {
    const r = flagData.rules.radius_m;
    const now = serverNow();
    const near = (lat, lon) => Geo.distanceM(lat, lon, f.lat, f.lon) <= r;
    let own = 0, ally = 0, enemy = 0;
    for (const g of state.garrisons) if (g.count > 0 && near(g.lat, g.lon)) own += g.count;
    for (const m of state.marches) {
        if (m.count <= 0) continue;
        const [la, lo] = marchCurrentPos(m, now);
        if (near(la, lo)) own += m.count;
    }
    for (const g of state.allies.garrisons) if (near(g.lat, g.lon)) ally += g.count;
    for (const m of state.allies.marches) {
        const [la, lo] = marchCurrentPos(m, now);
        if (near(la, lo)) ally += m.count;
    }
    for (const g of state.enemies.garrisons) if (near(g.lat, g.lon)) enemy += g.count;
    for (const m of state.enemies.marches) if (near(m.lat, m.lon)) enemy += m.count;
    return { own, ally, enemy };
}

function fmtWhen(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function renderFlagModal() {
    const f = flagData.flags.get(state.flagModal);
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const actions = document.getElementById("modal-actions");
    if (!f) {
        title.textContent = "Flag";
        body.innerHTML = `<p class="muted-hint">Flaget findes ikke længere.</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        return;
    }
    const town = flagData.towns.get(f.town_id);
    const townFlags = [...flagData.flags.values()].filter(x => x.town_id === f.town_id);
    const sideColor = flagSideColor(f.owner_id);
    const inCircle = soldiersInFlagCircle(f);
    title.textContent = `🚩 ${f.name}${town ? ` · ${town.name}` : ""}`;

    let cand = "";
    if (f.cand_id && f.cand_since) {
        const left = Math.max(0, Math.round(flagData.rules.hold_s - (serverNow() - Date.parse(f.cand_since)) / 1000));
        const who = flagSideOf(f.cand_id) === "own" ? "Dine soldater" : `${f.cand_name || "En anden spiller"}s soldater`;
        cand = `<p>⏳ <strong>${who}</strong> står alene i cirklen og tager flaget om <strong>${left} s</strong>.</p>`;
    }
    const townLine = town
        ? `<p>🏙️ <strong>${town.name}</strong> (${TOWN_KIND_LABEL[town.kind] || town.kind}) har ${townFlags.length} ${townFlags.length === 1 ? "flag" : "flag"} og ejes af <strong style="color:${flagSideColor(town.owner_id)}">${flagOwnerLabel(town.owner_id, town.owner_name)}</strong>${town.owner_id ? ` siden ${fmtWhen(town.owned_at)}` : ""}.</p>`
        : "";
    const flagList = townFlags.length > 1
        ? `<div class="muted-hint" style="margin-top:6px;">Byens flag: ${townFlags.map(x =>
            `<a href="#" onclick="openFlagModal(${x.id}); return false;" style="color:${flagSideColor(x.owner_id)}">${x.id === f.id ? "<strong>" : ""}${x.name}${x.id === f.id ? "</strong>" : ""}</a>`).join(" · ")}</div>`
        : "";
    body.innerHTML = `
        <p>Ejes af <strong style="color:${sideColor}">${flagOwnerLabel(f.owner_id, f.owner_name)}</strong>${f.owner_id ? ` siden ${fmtWhen(f.owned_at)}` : ""}.</p>
        ${cand}
        <p>I cirklen (${formatDistance(flagData.rules.radius_m)}) lige nu: 🪖 dine ${inCircle.own}${inCircle.ally ? ` · allierede ${inCircle.ally}` : ""} · fjender ${inCircle.enemy}</p>
        ${townLine}
        ${flagList}
        <p class="muted-hint" style="margin-top:8px;">Den side, der står alene i cirklen i ${fmtNum(flagData.rules.hold_s)} sekunder, tager flaget. Ejeren beholder det, så længe mindst én af ejerens soldater står i cirklen. Byen ejes af den side med flest flag.</p>`;
    actions.innerHTML = `
        <button class="btn" onclick="closeModal(); jumpToPoint(${f.lat}, ${f.lon})">🎯 Hop til</button>
        <button class="btn btn-primary" onclick="closeModal(); sendSoldiersTo(${f.lat}, ${f.lon})">🪖 Send soldater hertil</button>
        <button class="btn" onclick="closeModal()">Luk</button>`;
}

// Siden "Byer": spillere → byer, spilleren har flag i → byens flag. Klik på et flag åbner flagets infoboks.
const townsView = { level: "players", owner: null, townId: null };

window.openTownsModal = function(level = "players", owner = null, townId = null) {
    state.groupModal = null;
    state.hospitalModal = null;
    state.flagModal = null;
    townsView.level = level; townsView.owner = owner; townsView.townId = townId;
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const actions = document.getElementById("modal-actions");
    document.querySelector(".modal-box")?.classList.add("modal-wide");

    if (!flagData.supported) {
        title.textContent = "🏙️ Byer under kontrol";
        body.innerHTML = `<p class="muted-hint">Byer og flag kræver, at <strong>0048_byer_og_flag.sql</strong> og <strong>0049_byer_danmark_data.sql</strong> er kørt i Supabase.</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        document.getElementById("modal-overlay").classList.remove("hidden");
        return;
    }
    if (!flagData.loaded) {
        title.textContent = "🏙️ Byer under kontrol";
        body.innerHTML = `<p class="muted-hint">Henter byer …</p>`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
        document.getElementById("modal-overlay").classList.remove("hidden");
        loadFlags().then(() => { if (!document.getElementById("modal-overlay").classList.contains("hidden")) openTownsModal(level, owner, townId); });
        return;
    }

    const flagsByTown = new Map();
    for (const f of flagData.flags.values()) {
        if (!flagsByTown.has(f.town_id)) flagsByTown.set(f.town_id, []);
        flagsByTown.get(f.town_id).push(f);
    }
    const sideRank = { own: 0, ally: 1, enemy: 2, none: 3 };
    const ownedTowns = [...flagData.towns.values()].filter(t => t.owner_id);
    const contested = [...flagData.flags.values()].filter(f => f.cand_id).length;

    if (level === "players") {
        // Én række pr. spiller med flag: antal byer, han ejer, og antal flag, han holder.
        const players = new Map();
        for (const f of flagData.flags.values()) {
            if (!f.owner_id) continue;
            if (!players.has(f.owner_id)) players.set(f.owner_id, { id: f.owner_id, name: f.owner_name, flags: 0, towns: 0, townsWithFlags: new Set() });
            const p = players.get(f.owner_id);
            p.flags++;
            p.townsWithFlags.add(f.town_id);
        }
        for (const t of ownedTowns) {
            if (players.has(t.owner_id)) players.get(t.owner_id).towns++;
        }
        const list = [...players.values()].sort((a, b) => sideRank[flagSideOf(a.id)] - sideRank[flagSideOf(b.id)]
            || b.towns - a.towns || b.flags - a.flags);
        title.textContent = "🏙️ Byer under kontrol";
        const rows = list.map(p => `<div class="item-row" style="cursor:pointer" onclick="openTownsModal('towns', '${p.id}')">
                <div class="item-row-top">
                    <strong style="color:${flagSideColor(p.id)}">${flagOwnerLabel(p.id, p.name)}</strong>
                    <span class="muted-hint">▶</span>
                </div>
                <div class="muted-hint">Ejer ${p.towns} ${p.towns === 1 ? "by" : "byer"} · holder ${p.flags} flag i ${p.townsWithFlags.size} ${p.townsWithFlags.size === 1 ? "by" : "byer"}</div>
            </div>`).join("");
        body.innerHTML = `
            <p class="muted-hint">${flagData.towns.size} byer, bydele og landsbyer med ${flagData.flags.size} flag i alt. ${ownedTowns.length} er under kontrol${contested ? `, ${contested} flag er ved at skifte hænder` : ""}. Tryk på en spiller for at se byerne.</p>
            ${rows ? `<div class="list-stack">${rows}</div>` : `<p class="muted-hint">Ingen har taget flag endnu. Send soldater ind i en bys flagcirkel og lad dem stå der alene i ${fmtNum(flagData.rules.hold_s)} sekunder.</p>`}`;
        actions.innerHTML = `<button class="btn" onclick="closeModal()">Luk</button>`;
    } else if (level === "towns") {
        // Byer, hvor spilleren holder mindst ét flag.
        const name = flagOwnerLabel(owner, [...flagData.flags.values()].find(f => f.owner_id === owner)?.owner_name);
        const towns = [...flagData.towns.values()]
            .filter(t => (flagsByTown.get(t.id) || []).some(f => f.owner_id === owner))
            .map(t => {
                const fl = flagsByTown.get(t.id) || [];
                return { t, fl, held: fl.filter(f => f.owner_id === owner).length, owns: t.owner_id === owner };
            })
            .sort((a, b) => (b.owns - a.owns) || b.held - a.held || a.t.name.localeCompare(b.t.name, "da"));
        title.textContent = `🏙️ ${name}`;
        const rows = towns.map(({ t, fl, held, owns }) => `<div class="item-row" style="cursor:pointer" onclick="openTownsModal('flags', '${owner}', ${t.id})">
                <div class="item-row-top">
                    <strong style="color:${flagSideColor(t.owner_id)}">${t.name}</strong>
                    <span class="muted-hint">${TOWN_KIND_LABEL[t.kind] || t.kind}${fl.some(f => f.cand_id) ? " ⏳" : ""} ▶</span>
                </div>
                <div class="muted-hint">${owns ? `Ejer byen siden ${fmtWhen(t.owned_at)}` : `Byen ejes af ${flagOwnerLabel(t.owner_id, t.owner_name)}`} · holder ${held}/${fl.length} flag</div>
            </div>`).join("");
        body.innerHTML = `
            <p class="muted-hint">Byer, hvor <strong style="color:${flagSideColor(owner)}">${name}</strong> holder flag. Tryk på en by for at se dens flag.</p>
            ${rows ? `<div class="list-stack">${rows}</div>` : `<p class="muted-hint">Ingen flag.</p>`}`;
        actions.innerHTML = `
            <button class="btn" onclick="openTownsModal('players')">◀ Spillere</button>
            <button class="btn" onclick="closeModal()">Luk</button>`;
    } else {
        // Byens flag med ejer; klik åbner flagets infoboks.
        const t = flagData.towns.get(townId);
        const fl = (flagsByTown.get(townId) || []).slice().sort((a, b) => a.id - b.id);
        title.textContent = `🚩 ${t ? t.name : "By"}`;
        const rows = fl.map(f => {
            let cand = "";
            if (f.cand_id && f.cand_since) {
                const left = Math.max(0, Math.round(flagData.rules.hold_s - (serverNow() - Date.parse(f.cand_since)) / 1000));
                cand = ` · ⏳ ${flagSideOf(f.cand_id) === "own" ? "dine soldater" : (f.cand_name || "en anden spiller")} tager det om ${left} s`;
            }
            return `<div class="item-row" style="cursor:pointer" onclick="openFlagModal(${f.id})">
                <div class="item-row-top">
                    <strong style="color:${flagSideColor(f.owner_id)}">${f.name}</strong>
                    <span class="muted-hint">▶</span>
                </div>
                <div class="muted-hint">Ejer: ${flagOwnerLabel(f.owner_id, f.owner_name)}${f.owner_id ? ` siden ${fmtWhen(f.owned_at)}` : ""}${cand}</div>
            </div>`;
        }).join("");
        body.innerHTML = `
            <p class="muted-hint">${t ? `${TOWN_KIND_LABEL[t.kind] || t.kind} med ${fl.length} flag. Byen ejes af <strong style="color:${flagSideColor(t.owner_id)}">${flagOwnerLabel(t.owner_id, t.owner_name)}</strong>${t.owner_id ? ` siden ${fmtWhen(t.owned_at)}` : ""}.` : ""} Tryk på et flag for at se det på kortet.</p>
            <div class="list-stack">${rows}</div>`;
        actions.innerHTML = `
            <button class="btn" onclick="openTownsModal('towns', '${owner}')">◀ Byer</button>
            ${t ? `<button class="btn" onclick="closeModal(); jumpToPoint(${t.lat}, ${t.lon})">🎯 Hop til byen</button>` : ""}
            <button class="btn" onclick="closeModal()">Luk</button>`;
    }
    document.getElementById("modal-overlay").classList.remove("hidden");
};

// Samme side = samme spiller eller allierede (set fra dig kan vi kun afgøre: dig+allierede er én side).
function sameSide(a, b) {
    if (a === b) return true;
    const sa = flagSideOf(a), sb2 = flagSideOf(b);
    if ((sa === "own" || sa === "ally") && (sb2 === "own" || sb2 === "ally")) return true;
    return false;
}

function codexTownsHtml() {
    const kinds = new Map();
    for (const t of flagData.towns.values()) kinds.set(t.kind, (kinds.get(t.kind) || 0) + 1);
    const kindRows = [["storby", 7], ["by", 5], ["bydel", 3], ["kvarter", 1], ["nabolag", 1], ["landsby", 1]]
        .map(([k, n]) => [`${TOWN_KIND_LABEL[k]}${kinds.has(k) ? ` (${fmtNum(kinds.get(k))} i Danmark)` : ""}`, `op til ${n} flag`]);
    return `
        <details class="codex-section">
            <summary><span class="codex-sum-title">🚩 Byer og flag</span><span class="codex-sum-sub">kontrol over byer, bydele og landsbyer</span></summary>
            <p class="muted-hint" style="margin-bottom: 12px;">Hver by har et ulige antal flag på steder, folk kender: bymidten, stationen, rådhuset, kirken, idrætsanlægget og skolen. Flagene kan kun tages af soldater, der står i flagets cirkel. Granater, morterer og haubitser kan dræbe dem, der står der, men aldrig selv tage et flag.</p>
            <div class="codex-grid codex-grid-3">
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Sådan tages et flag</h3><span class="badge">regler</span></div>
                    <p class="muted-hint">Den side (spiller eller alliance), der står <strong>alene</strong> i cirklen i ${fmtNum(codexRule("flag_hold_s", 60))} sekunder, ejer flaget. Ejeren beholder flaget, så længe mindst én af ejerens soldater står i cirklen, uanset hvor mange fjender der er. Et tomt flag beholder sin ejer.</p>
                    ${codexStats([
                        ["Cirkel om flaget", formatDistance(codexRule("flag_radius_m", 50))],
                        ["Tid alene i cirklen", `${fmtNum(codexRule("flag_hold_s", 60))} s`]
                    ])}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Sådan ejes en by</h3><span class="badge">flest flag</span></div>
                    <p class="muted-hint">Byen ejes af den side, der holder flest af byens flag. Ved lige mange beholder den hidtidige ejer byen. Bynavnet på kortet får ejerens farve, og byen står på siden 🏙️ Byer.</p>
                    ${codexStats(kindRows)}
                </div>
                <div class="codex-card">
                    <div class="codex-card-head"><h3>Farver på kortet</h3><span class="badge">overblik</span></div>
                    <p class="muted-hint"><span style="color:${FLAG_COLORS.own}">■</span> dine flag og byer · <span style="color:${FLAG_COLORS.ally}">■</span> allierede · <span style="color:${FLAG_COLORS.enemy}">■</span> fjender · <span style="color:${FLAG_COLORS.none}">■</span> ingen ejer. En gul ring om flaget betyder, at nogen står alene i cirklen og er ved at tage det.</p>
                    <p class="muted-hint">Point og stål for byer kommer i næste trin.</p>
                </div>
            </div>
        </details>`;
}

document.getElementById("btn-towns")?.addEventListener("click", () => openTownsModal());

// Visningsknap med tre trin: soldater + flag → kun flag → kun soldater → forfra.
const TROOP_LAYERS = ["lyr-troops", "lyr-street-units", "lyr-street-badges", "lyr-street-rings", "lyr-parked-trucks",
    "lyr-march-lines", "lyr-shots", "lyr-shot-smoke", "lyr-shot-flash", "lyr-los-blocked", "lyr-los-blocked-dot",
    "lyr-wrecks", "lyr-wrecks-street", "lyr-battles"];
const FLAG_LAYERS = ["lyr-flag-circle-fill", "lyr-flag-circle-line", "lyr-flag-cand", "lyr-flag-owned", "lyr-flags"];
const VIEW_MODES = [
    { troops: true,  flags: true,  label: "🪖🚩 Soldater + flag", toast: "Soldater og flag vises." },
    { troops: false, flags: true,  label: "🚩 Kun flag",          toast: "Kun flagene vises – soldater og køretøjer er skjult." },
    { troops: true,  flags: false, label: "🪖 Kun soldater",      toast: "Kun soldater og køretøjer vises – flagene er skjult." }
];
let viewMode = 0;
function applyViewMode() {
    const m = VIEW_MODES[viewMode];
    if (mapReady) {
        for (const id of TROOP_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", m.troops ? "visible" : "none");
        for (const id of FLAG_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", m.flags ? "visible" : "none");
    }
    const btn = document.getElementById("btn-flags-only");
    if (btn) {
        btn.textContent = m.label;
        btn.classList.toggle("btn-primary", viewMode !== 0);
    }
}
window.toggleFlagsOnly = function() {
    viewMode = (viewMode + 1) % VIEW_MODES.length;
    applyViewMode();
    showToast(VIEW_MODES[viewMode].toast);
};
document.getElementById("btn-flags-only")?.addEventListener("click", () => toggleFlagsOnly());
setInterval(pollFlagStates, FLAG_POLL_MS);

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
setInterval(() => { if (state.user) loadCraters(); }, GAME_CONFIG.CRATER_POLL_MS);

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
