import { getDetection } from '@baseline/client-api/detection';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Detection } from '@baseline/types/detection';
import { Badge } from '@baseline/ui/primitives/badge';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';

export async function detectionDetailLoader({ params }: LoaderFunctionArgs) {
  const detection = await getDetection(getRequestHandler(), params.detectionId as string);
  return { detection };
}

const DetectionDetail = (): JSX.Element => {
  const { detection } = useLoaderData() as { detection: Detection };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Detections', href: '/detections' },
        { label: detection.detectionId },
      ]}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Detection record</h1>
          <p className="mt-1 text-muted-foreground font-mono text-sm">{detection.detectionId}</p>
        </div>

        <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Scene description</span>
            <span className="text-sm text-muted-foreground">
              {detection.createdAt ? new Date(detection.createdAt).toLocaleString() : '—'}
            </span>
          </div>
          <p className="text-base text-foreground">{detection.sceneDescription}</p>
        </div>

        <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Objects detected ({detection.detections?.length ?? 0})
          </p>
          {detection.detections?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {detection.detections.map((d) => (
                <div key={`${d.name}-${d.confidence}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="font-medium text-sm">{d.name}</span>
                  <Badge variant="secondary">{Math.round(d.confidence * 100)}%</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No objects recorded.</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Metadata</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono">{detection.userId}</span>
            <span className="text-muted-foreground">Created</span>
            <span>{detection.createdAt ? new Date(detection.createdAt).toLocaleString() : '—'}</span>
          </div>
        </div>
      </div>
    </PageContent>
  );
};

export default DetectionDetail;
