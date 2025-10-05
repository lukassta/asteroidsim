import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MetaCard({ meta }) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Meta Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p>
                    <strong>Units:</strong> {meta.units}
                </p>
                <p>
                    <strong>Version:</strong> {meta.version}
                </p>
                <div className="space-y-1">
                    <strong>Notes:</strong>
                    <ul className="list-disc ml-5">
                        {meta.notes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
