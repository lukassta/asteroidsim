import { useState, useEffect, useRef } from "react";
import * as Cesium from "cesium";
import PanelCard from "../components/PanelCard";
import MetaCard from "../components/MetaCard";
import { fetchSimulation } from "../utils/fetchSimulation";
import { useCesium, CesiumProvider } from "../context/CesiumContext";
import CesiumMap from "../components/CesiumMap.jsx";

export default function ImpactEffectPage() {
    const [id, setId] = useState("");
    const [map, setMap] = useState(null);
    const [panel, setPanel] = useState(null);
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        fetchSimulation().then((data) => {
            setId(data.id);
            setMap(data.map);
            setPanel(data.panel);
            setMeta(data.meta);
        });
    }, []);

    if (!map || !panel || !meta) return <p>Loading simulation...</p>;

    return (
        <CesiumProvider>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PanelCard panel={panel} />
                    <MetaCard meta={meta} />
                </div>
            </div>
        </CesiumProvider>
    );
}
