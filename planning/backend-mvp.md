# Official statement (condensed)
Develop an interactive visualization and simulation tool that uses real data from NASA APIs to model asteroid impact scenarios, predict consequences, and evaluate potential mitigation strategies. Model environmental and geological impacts (e.g., tsunami zones, seismic activity, topography).

## API Endpoints
| Method | Endpoint                | Params | Description                                                                 | Status Codes                              |
|--------|--------------------------|--------|-----------------------------------------------------------------------------|-------------------------------------------|
| POST   | `/api/simulations`         | check inputs    | Compute simulation params (hash normalized inputs to get id, check DB if id already exists, if it doesn't - compute params for that id) and return id, input params, computed params. | 200 OK; 400 Bad Request; 422 Unprocessable Entity |
| GET    | `/api/simulations/{id}`    | id (path) | Fetch simulation params by ID. Returns stored input params + computed params. | 200 OK; 304 Not Modified; 404 Not Found    |

# Input
request POST can be found in `examples/`
The backend receives these params:
- asteroid diameter
- asteroid material density (frontend can add basic presets to make it easier to use e.g. rock, crystal, iron, etc.)
- asteroid velocity before entering Earth's atmosphere
- entry angle (from horizontal)
- azimuth
- aim point (lat, lon) - surface reference used to place the spawn point directly above at 120 km and to build the local ENU frame; physics then decides the actual airburst/impact location (if entry angle is set to 90 then the impact/airburst will occur at aim point)
- target surface (water or land for simplicity, can use cesium `sampleTerrain`)

# Output
- energy released (megatons TNT) 
- crater diameter (transient) (m)
- crater diameter & depth (final) (m)
- radius for each blast ring:
  - severe structural damage (>=70kPa) (m)
  - heavy damage (35-70kPa) (m)
  - moderate damage (20-35kPa) (m)
  - light damage (10-20kPa) (m)
  - minor damage (3-10kPa) (m)
- atmospheric entry: 
  - the asteroid begins to break up at an altitude of h1 (m)
  - the asteroid reaches peak energy at h2 (m)
  - the asteroid airbursts at h3 (or surface impact) (m)
- trajectory forward (into the earth)
- trajectory backward (for deflection computation)

example jsons in `examples/`.

# Backend parts ig
## `normalize_params()`
a function that takes all parameters relevant to the simulation (JSON or already parsed dict) and returns a normalized JSON, so that we can create a unique id for that unique set of parameters.

normalization should:
- fill in defaults where user didn't provide something
- validate types
- normalize units to SI (maybe not needed depending on frontend)
- round floats to some agreed upon precision so that we can get away without recomputing same simulations with just tiny differences in float (though will need to put approximation error percentage in the docs - physicist's job)
- anything else?

## `compute_id()`
 a function that takes in a json and hashes it using sha256 (deterministic, collision resistant, fast) to return a hash which we will use as an id.

## `simulation_exists(id)`
a function that returns true if an id is in the database, false if not

## `run_simulation(normalized_params)`
a function that takes in the normalized JSON and returns JSON (metrics, trajectory), GEOJSON (craters, etc.)

## `write_simulation_to_db()` or `persist_data()`
a function that takes in `id, normalized_params, outputs` and writes them to the database
need physicists help for trajectory/deflection








