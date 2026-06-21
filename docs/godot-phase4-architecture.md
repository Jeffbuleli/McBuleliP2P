# McBuleli Congo Mining — Phase 4: Godot 4 + Nakama Production Architecture

**Visual target:** Realistic African mining & logistics simulator — cinematic, industrial, grounded.  
**Not:** cartoon, low-poly mobile, anime, arcade crypto game.

**References (tone):** SnowRunner · Euro Truck Simulator · Farming Simulator · Ready Or Not · Squad · GTA V naturalism — adapted to Katanga/Kivu artisanal mining, muddy corridors, tropical humidity.

---

## 1. Production stack overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Godot 4 Client (GDExtension / GDScript)                        │
│  ├─ Rendering: Forward+/Mobile Vulkan, PBR, volumetric fog      │
│  ├─ World: chunked streaming + OSM roads + heightmap terrain    │
│  ├─ Physics: Jolt / Godot Physics — vehicles, mud, cargo mass   │
│  ├─ Characters: Humanoid rigs, IK feet, animation tree          │
│  └─ Net: Nakama Godot SDK + REST fallback to existing API       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Nakama (authoritative multiplayer + economy security)            │
│  ├─ Auth (link McBuleli.org session / custom JWT)                 │
│  ├─ Storage: inventory, fleet, cloud save                         │
│  ├─ RPC: validate mine/transport/sell server-side                 │
│  ├─ Matchmaker: regional co-op sessions (4–16 players)           │
│  └─ Leaderboards, analytics, anti-cheat hooks                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Existing Next.js API (Phase 1–3) — economy truth until migration │
│  GET /api/game/player · POST /api/game/mining · /transport · etc. │
│  GET /api/game/client — Godot manifest                            │
└───────────────────────────────────────────────────────────────────┘
```

**Strategy:** Keep REST economy authoritative via Nakama RPC wrappers calling validated logic. Godot is presentation + physics + session sync — not the bank.

---

## 2. Godot 4 scene architecture

### 2.1 Autoload singletons

| Singleton | Role |
|-----------|------|
| `GameState` | Mirrors player snapshot from API/Nakama |
| `NetworkManager` | Nakama socket + REST fallback |
| `WorldStreamer` | Chunk load/unload, LOD policy |
| `EconomyBridge` | Typed calls to `/api/game/*` |
| `AudioDirector` | Bus routing, rain/mud/industrial layers |
| `WeatherSystem` | Rain, wetness shader params, fog density |

### 2.2 Scene tree pattern

```
Main.tscn
├── WorldRoot
│   ├── TerrainStreamer (chunk containers)
│   ├── RoadNetwork (OSM-derived splines)
│   ├── POIAnchor (mines, depots, villages)
│   └── WeatherVolume
├── PlayerRig (CharacterBody3D + camera)
├── VehicleGarage (owned fleet instances)
└── UI (minimal HUD — McB/energy/XP, not MMO clutter)
```

**Rule:** Every gameplay entity = `Pawn.tscn` + data resource (`PawnData.tres`). No hard-coded stats in scenes.

### 2.3 Folder structure (production)

```
godot/
  assets/
    characters/   # GLB + AnimationLibrary
    vehicles/
    tools/
    environments/ # modular kits
    audio/
    shaders/      # mud, wetness, dust
  scenes/
    world/
    characters/
    vehicles/
    ui/
  scripts/
    core/
    net/
    economy/
    vehicles/
  data/           # JSON/Tres — minerals, routes, regions
```

---

## 3. Open world & streaming

### 3.1 Chunk strategy (not full MMO)

- **World divided:** 4 macro regions (Katanga, Kasai, Lualaba, Kivu) → sub-chunks 1–2 km²
- **Load radius:** 1 active chunk + 1 ring preload (SnowRunner-style corridor, not GTA full city)
- **Travel between regions:** async load screen + REST `POST /api/game/world/travel`

### 3.2 Data sources

| Source | Use |
|--------|-----|
| [OpenStreetMap](https://www.openstreetmap.org) | Road graph, village points, river polylines |
| [OpenTopography](https://opentopography.org) | SRTM/COP30 heightmaps for Katanga/Kivu |
| Satellite orthophoto (Mapbox / self-hosted) | Terrain albedo blending |
| Poly Haven / Megascans | PBR ground, rock, mud, vegetation |

**Pipeline:** OSM extract → GeoJSON → Godot `@tool` importer → `Curve3D` roads + flattened mine pads.

### 3.3 Procedural layers

- **Vegetation:** MultiMeshInstance3D instancing by biome mask (savanna vs forest hills)
- **Mud deformation:** Decal + shader wetness from weather + vehicle wheel traces (texture R channel)
- **LOD:** 4 LOD meshes per hero asset; impostor billboards for distant forest (GPU instancing)

### 3.4 Optimization

- Forward+ with clustered lighting (limited dynamic lights)
- Baked lightmaps for static camps/depots
- Occlusion culling (`OccluderInstance3D` on hills/buildings)
- Texture streaming: 2K near / 512 far
- Physics LOD: simplify collision meshes beyond 50 m

---

## 4. Rendering & lighting pipeline

### 4.1 PBR material standard

- **Workflow:** Blender Principled BSDF → export GLTF 2.0
- **Textures:** Albedo (sRGB), Normal, ORM packed (AO/Rough/Metal)
- **Ground:** Triplanar + macro variation for laterite, mud, gravel

### 4.2 Atmosphere

- **Sky:** ProceduralSky + HDRI backup (golden hour + overcast rain)
- **Fog:** Volumetric fog density tied to `WeatherSystem.rainIntensity`
- **Wet surfaces:** Shader param `wetness` 0→1 drives roughness down, specular up
- **Shadows:** PCSS or soft shadows; cascade splits tuned for vehicle chase cam

### 4.3 Post

- Subtle film grain + color grading LUT (desaturated greens, warm dust)
- No heavy bloom — realism over fantasy glow

---

## 5. Character / avatar system

### 5.1 Rigs

- **Skeleton:** Humanoid compatible with Mixamo/AccuRig retarget
- **Meshes:** Realistic proportions, African work gear variants (helmet, boots, reflective vest)
- **LODs:** 30k / 12k / 4k tris

### 5.2 Animation

- **AnimationTree:** locomotion blend (walk/mud walk/run), tool swing, enter vehicle
- **IK:** Foot IK on uneven terrain (`SkeletonIK3D` ankles)
- **Layers:** upper body override for steering wheel / pickaxe

### 5.3 Multiplayer sync

- **Local:** full physics character controller
- **Remote:** snapshot interpolation (position, rotation, anim state hash @ 10–20 Hz)
- **Nakama:** `match_state` opcodes for pose + action events

### 5.4 Dirt / wear

- Shader blend by `dirt_amount` uniform (mining increases, rain washes partially)

---

## 6. Vehicle simulation

### 6.1 Vehicle types (match web MVP)

| Vehicle | Physics base | Notes |
|---------|--------------|-------|
| Bicycle | RayCast wheels, low mass | Laterite paths only |
| Motorcycle | 2-wheel raycast | mud traction penalty |
| Pickup | 4-wheel VehicleBody3D | cargo bed rigid bodies |
| Mining truck | dual axle, high torque | cargo mass affects accel/brake |
| Fleet truck | articulated optional Phase 4b | convoy co-op |

### 6.2 Systems

- **Suspension:** per-wheel spring/damper; tunable per vehicle `.tres`
- **Traction:** surface enum (laterite, mud, gravel, asphalt) × weather wetness
- **Cargo:** `RigidBody3D` crates with total mass → fuel consumption multiplier
- **Damage:** maps to `conditionPct` in Nakama storage (sync web fleet)
- **Fuel:** consumption per km × mud × load; refuel at depots (McB sink)

### 6.3 Camera

- Chase cam with spring arm collision
- Interior cam for trucks (ETS-style optional)

**Reference plugins / demos:**
- [Godot Vehicle Demo (official)](https://github.com/godotengine/godot-demo-projects/tree/master/3d/truck_town)
- Study SnowRunner-style mud via custom traction curves, not arcade drift

---

## 7. Tools & interaction

### 7.1 Interaction graph

```
RayCast3D (player camera)
  → Interactable (Area3D)
      → MineSite / Depot / VehicleDoor / ShopTerminal
```

### 7.2 Mining loop (3D)

1. Approach site marker (from API `sites`)
2. Play extraction animation + procedural ore particles
3. RPC `mine` → server roll (risk engine already in TS — port to Nakama Go/Lua or call REST)
4. Feedback: success / partial / fail VFX + BULELI AI toast

### 7.3 Tool durability

- Visual: pickaxe edge wear normal blend
- Audio: pitch down as durability drops

---

## 8. Nakama architecture

### 8.1 Why Nakama here

- **Auth + storage** for Godot clients without exposing Postgres
- **Match sessions** for co-op transport / depot raids (Phase 4b)
- **Leaderboards:** regional production, safest transporter
- **Anti-cheat:** server validates McB/energy changes

### 8.2 Deployment topology

```
Godot Client
    → Nakama API (gRPC/HTTP) + Socket (realtime)
        → Nakama Server (Docker on Render/Fly/AWS)
            → PostgreSQL (Nakama internal + optional bridge to app DB)
            → Custom RPC module (Go) OR sidecar calling Next.js internal API
```

### 8.3 Authority model

| Action | Authority |
|--------|-----------|
| McB / energy / XP | Nakama RPC → validates → writes storage OR proxies to Next.js |
| Player transform (co-op) | Host / Nakama relay |
| Inventory minerals | Server storage collections |
| World weather event | Server broadcast from economy tick |

### 8.4 Storage collections

```
collection: player_profile
key: user_id
value: { role, xp, regionKey, lifestyleTier }

collection: fleet
key: vehicle_key
value: { conditionPct, fuelPct }

collection: mineral_stock
key: mineral_key
value: { quantityKg, purityPct }
```

### 8.5 RPC examples

- `rpc_mine(site_id)` → delegates to economy engine
- `rpc_start_transport(payload)` → validates fleet + energy + McB
- `rpc_travel_region(region_key)`

### 8.6 Multiplayer session model (NOT MMO)

- **Match type:** `coop_transport` — 2–4 players, one convoy
- **Match type:** `depot_shift` — shared depot processing mini-session
- **Instance size:** 4–16 players max per regional server
- **Persistence:** economy async; session only syncs poses + convoy events

**Official references:**
- [Nakama Docs](https://heroiclabs.com/docs/nakama/)
- [Nakama Godot Client](https://github.com/heroiclabs/nakama-godot)
- [Nakama Godot Tutorials](https://heroiclabs.com/docs/nakama/tutorials/godot/)

---

## 9. Networking strategy (Godot 4)

### Phase 4a — REST only (ship faster)

- Godot uses `HTTPRequest` → existing `/api/game/*`
- Manifest: `GET /api/game/client`
- Session cookie / JWT in headers

### Phase 4b — Nakama realtime

- Socket for pose sync + chat + world events
- RPC for economy

### Phase 4c — Hybrid authoritative

- Economy always server-side
- Client prediction for vehicle movement; reconcile on checkpoint

**Godot net docs:** [High-level multiplayer](https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html) — use with Nakama socket, not raw ENet for production.

---

## 10. 3D asset pipeline (Blender → Godot)

### 10.1 Blender workflow

1. Blockout → mid-poly → UV → bake (if needed)
2. Principled PBR materials
3. Export GLB (Draco mesh compression optional)
4. Godot import: generate collisions (VHACD for vehicles)

### 10.2 Modular kits

- Mining camp: tents, barrels, generators, pallets
- Depot: fences, scales, offices
- Roads: 2 m modular segments with blend shapes for berms

### 10.3 Asset sources (realistic PBR)

| Source | URL | Use |
|--------|-----|-----|
| Poly Haven | https://polyhaven.com | HDRIs, photogrammetry rock/mud |
| Quixel Megascans | https://quixel.com/megascans | Ground, debris, industrial |
| Sketchfab (CC/filter) | https://sketchfab.com | Reference vehicles — verify licenses |
| BlenderKit | https://www.blenderkit.com | Rapid kitbash |
| CGTrader | https://www.cgtrader.com | Trucks, industrial props |

**Rule:** No stylized/low-poly packs. Prioritize photogrammetry and PBR 2K–4K.

---

## 11. Audio immersion

### 11.1 Bus layout

`Master → Ambience / SFX / Vehicle / UI / Voice (BULELI AI)`

### 11.2 Layers

- **Rain:** loop + roof occlusion
- **Mud driving:** granular squelch synced to wheel slip
- **Mining:** pickaxe ring, drill bass, distant industrial hum
- **Village:** market murmur, distant radio
- **Forest:** insects, birds (Kivu biome)

**Implementation:** `AudioStreamPlayer3D` + randomized one-shots; reverb zones in tunnels/camps.

---

## 12. Recommended Godot 4 plugins & tools

| Tool | Purpose |
|------|---------|
| [Terrain3D](https://github.com/TokisanGames/Terrain3D) | Large terrain editing + sculpt |
| [Godot Jolt](https://github.com/godot-jolt/godot-jolt) | Better vehicle physics |
| [Hydroform / custom](https://github.com/godotengine/godot-docs) | Water rivers (shader + buoyancy lite) |
| OSM import scripts | Community `@tool` importers |
| [GUT](https://github.com/bitwes/Gut) | Unit tests for economy bridge |

---

## 13. Production roadmap

### Milestone 0 — Bridge (2 weeks)

- [x] Web MVP Phases 1–3
- [x] Godot HTTP client + manifest consumer (`godot/` — `NetworkManager`, `EconomyBridge`, HUD)
- [x] Login cookie flow — paste `mcbuleli_session` JWT in bridge UI (`user://mcbuleli_game.cfg`)

### Milestone 1 — Vertical slice (polish pass)

- [x] Katanga world: wet mud road, savanna grass, zone beacons (PUITS/CAMP/DÉPÔT)
- [x] Miner look + pickaxe swing + dust on extract
- [x] Moto headlight + mud splashes when riding
- [x] HUD: stock, mission line, toast panel, B → bridge
- [ ] PBR Blender assets (replace primitives)

### Milestone 2 — Economy parity (in progress)

- [x] Sell minerals at depot (`POST /api/game/trade`)
- [x] Garage repairs (`POST /api/game/vehicles/repair`)
- [x] McB shop at camp (`POST /api/game/upgrades`)
- [x] BULELI AI terminal (`POST /api/game/advisor`)
- [x] Runtime `EconomyPanel` menus (code-only, Godot-safe)

### Milestone 3 — Nakama (6 weeks)

- Auth + cloud save
- RPC wrapper around economy
- Co-op transport session (2 players)

### Milestone 4 — Content expansion (ongoing)

- Kivu forest, Lualaba industrial corridor
- Trucks, refinery exterior, export depot
- Leaderboards + analytics

---

## 14. Mobile-aware realism

Target: **mid-range mobile (Vulkan)** + PC.

- Mobile: 720p dynamic res, 2 LODs, baked lighting in camps
- PC: full fog, 4 LODs, higher shadow cascades
- Same assets, different quality tiers via `ProjectSettings` profiles

---

## 15. Security & anti-cheat

- Never trust client McB/energy/XP
- All economy via Nakama RPC → server validation
- Rate limits on mine/transport RPCs
- Anomaly detection on leaderboard submissions

---

## 16. Link to current web API

Godot should consume the same contract documented in `docs/game-architecture.md`:

- Player snapshot: `GET /api/game/player`
- Client manifest: `GET /api/game/client`
- Actions: `POST /api/game/mining`, `/transport`, `/trade`, `/world/travel`, `/vehicles/repair`

Nakama gradually becomes the **gatekeeper**; Next.js remains economy engine until Go/Lua port of `risk-engine.ts` / `economy-engine.ts` is justified by scale.

---

**North star:** When a player drives a pickup through a rainy laterite road between a Katanga pit and a Lubumbashi depot, it should feel like a documentary — not a mobile clicker with a 3D skin.
