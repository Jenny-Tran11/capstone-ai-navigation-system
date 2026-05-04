import { getRequestHandler } from '@baseline/client-api/request-handler';
import { getAllDetections } from '@baseline/client-api/detection';
import type { Detection } from '@baseline/types/detection';
import { useLoaderData } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';
import DetectionList from '../components/detection-list/DetectionList';

export async function detectionListLoader() {
  const detections = await getAllDetections(getRequestHandler());
  return { detections };
}

const Detections = (): JSX.Element => {
  const { detections } = useLoaderData() as { detections: Detection[] };

  return (
    <PageContent
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Detections' }]}
    >
      <DetectionList detections={detections} />
    </PageContent>
  );
};

export default Detections;
