import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Certificate } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";

export interface CertificatesWidgetProps {
  certificates: Certificate[];
  isLoading?: boolean;
}

function CertificateItem({ cert }: { cert: Certificate }) {
  const issueDate = new Date(cert.issuedAt);
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
      <Award className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{cert.title}</h4>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
      {cert.url && (
        <Button variant="ghost" size="sm" asChild>
          <a href={cert.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open certificate</span>
          </a>
        </Button>
      )}
    </div>
  );
}

function CertificateItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

export function CertificatesWidget({
  certificates,
  isLoading = false,
}: CertificatesWidgetProps) {
  const displayCertificates = certificates.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Certificates</CardTitle>
          <Button variant="ghost" size="sm" disabled>
            View All
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <CertificateItemSkeleton key={idx} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No certificates yet"
            description="Complete events to earn certificates."
            icon={<Award className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Certificates</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayCertificates.map((cert) => (
          <CertificateItem key={cert.id} cert={cert} />
        ))}
        {certificates.length > 3 && (
          <Button variant="ghost" className="w-full mt-2" size="sm">
            View all {certificates.length} certificates
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
