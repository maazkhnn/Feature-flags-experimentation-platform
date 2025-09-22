import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PanelCard({
    title,
    children,
    right
    }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
    return (
        <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            {right}
        </CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
        </Card>
    );
}
