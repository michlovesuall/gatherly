import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Award } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Calendar className="h-5 w-5" />
            <span>Browse Events</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Users className="h-5 w-5" />
            <span>Find Clubs</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Award className="h-5 w-5" />
            <span>My Certificates</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
