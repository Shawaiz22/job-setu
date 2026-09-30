import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Bootstrap Verified</Badge>
          <span className="text-muted-foreground font-mono text-xs">
            Tier 0 · Foundation
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Job Setu
            </CardTitle>
            <CardDescription>
              Deterministic eligibility verification platform for Madhya Pradesh
              government opportunities and welfare schemes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              We decide eligibility, and we cite the rule that decided it.
            </p>
            <div className="flex gap-3">
              <Button>Explore Engine</Button>
              <Button variant="outline">View Specifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
