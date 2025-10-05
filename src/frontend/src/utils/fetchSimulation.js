export async function fetchSimulation() {
    try {
        /*const response = await fetch("https://asteroidsim.com/api/simulations");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Optional: validate structure
        if (!data.map || !data.panel || !data.meta) {
            throw new Error("Invalid simulation data structure");
        }

        return data;*/
        return null;
    } catch (error) {
        console.warn("Fetching /api/simulations failed, using simulationExample.json", error);

        // Load local fallback JSON
        const fallbackResponse = await fetch("simulationExample.json");
        if (!fallbackResponse.ok) throw new Error("Failed to load fallback JSON");
        return fallbackResponse.json();
    }
}
