import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PanelCard({ panel }) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Panel Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p>
                    <strong>Energy Released:</strong> {panel.energy_released_megatons} megatons
                </p>
                <p>
                    <strong>Crater Diameter:</strong> {panel.crater_final.diameter_m} m
                </p>
                <p>
                    <strong>Total Estimated Deaths:</strong> {panel.totals.total_estimated_deaths}
                </p>

                <div className="space-y-1">
                    {panel.rings.map((ring, idx) => (
                        <div key={idx} className="border-t pt-1">
                            <p>
                                <strong>Threshold:</strong> {ring.threshold_kpa} kPa | <strong>Radius:</strong>{" "}
                                {ring.radius_m} m
                            </p>
                            <p>
                                <strong>Estimated Deaths:</strong> {ring.estimated_deaths} |{" "}
                                <strong>Population:</strong> {ring.population}
                            </p>
                            <p>{ring.blurb}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
