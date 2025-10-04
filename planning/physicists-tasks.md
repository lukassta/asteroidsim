# Official suggestions from the challenge website
**Scientific Considerations**
- Orbital Mechanics: You can model the asteroid’s trajectory using Keplerian orbital elements (e.g., semi-major axis, eccentricity, true anomaly) with standard orbital position calculations.
- Impact Energy: You can estimate kinetic energy based on the asteroid’s mass (derived from size and density, e.g., 3000 kg/m³) and velocity, then convert to the Trinitrotoluene (TNT) equivalent for impact scale.
- Crater Scaling: You can use established scaling relationships to estimate crater size based on impact energy.
- Environmental Effects: You can leverage USGS data to model secondary effects like tsunamis (using coastal elevation) or seismic waves (for inland impacts).
- more info that I could've missed out on: https://www.spaceappschallenge.org/2025/challenges/meteor-madness/

# What do we want to compute?
- energy released (megatons TNT) 
- crater diameter & depth (transient) (m)
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
- trajectory forward
- trajectory backward (for simulating deflection later since we are only given the entry state vector)

# Inputs that we get
- asteroid diameter
- asteroid material density
- asteroid velocity before entering Earth's atmosphere (we assume that happens at 120km)
- entry angle (from horizontal)
- azimuth
- aim point (lat, lon) - surface reference used to place the spawn point directly above at 120 km and to build the local ENU frame; physics then decides the actual airburst/impact location (if entry angle is set to 90 then the impact/airburst will occur at aim point)

# How to get trajectory_forward?


# How to get trajectory_backward?

