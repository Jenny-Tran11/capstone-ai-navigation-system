import { Fragment } from 'react';
import { Rect, Svg, Text as SvgText } from 'react-native-svg';
import type { DetectionResult } from './detection-api';
type ViewSize = { width: number; height: number };

function boxColor(det: DetectionResult): string {
  if (det.proximity === 'very_near') return '#dc2626';
  if (det.proximity === 'near') return '#f97316';
  if (det.obstacleType === 'dynamic') return '#f97316';
  if (det.obstacleType === 'surface') return '#eab308';
  if (det.obstacleType === 'static') return '#38bdf8';
  return '#22c55e';
}

export function BoundingBoxOverlay({
  detections,
  imageSize,
  viewSize,
}: {
  detections: DetectionResult[];
  imageSize: { width: number; height: number };
  viewSize: ViewSize;
}) {
  if (!detections.length || !imageSize.width || !imageSize.height) return null;

  const scaleX = viewSize.width / imageSize.width;
  const scaleY = viewSize.height / imageSize.height;

  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0 }}
      width={viewSize.width}
      height={viewSize.height}
    >
      {detections.map((det) => {
        const [x1, y1, x2, y2] = det.box;
        const color = boxColor(det);
        const key = `${det.name}:${det.box.join(',')}:${det.confidence}`;
        const left = x1 * scaleX;
        const top = y1 * scaleY;
        const width = (x2 - x1) * scaleX;
        const height = (y2 - y1) * scaleY;

        const warning =
          det.proximity === 'very_near'
            ? 'WARNING'
            : det.proximity === 'near'
              ? 'CAUTION'
              : '';
        const label = `${warning ? `${warning} ` : ''}${det.name} (${det.obstacleType}) ${Math.round(det.confidence * 100)}%`;
        const labelX = Math.max(4, left + 4);
        const labelY = Math.max(16, top - 6);
        const labelWidth = Math.min(
          viewSize.width - labelX - 4,
          Math.max(72, label.length * 7 + 8),
        );

        return (
          <Fragment key={key}>
            <Rect
              x={left}
              y={top}
              width={width}
              height={height}
              stroke={color}
              strokeWidth={2}
              fill="none"
            />
            <Rect
              x={labelX - 3}
              y={labelY - 13}
              width={labelWidth}
              height={16}
              rx={4}
              fill="rgba(0,0,0,0.75)"
            />
            <SvgText
              x={labelX}
              y={labelY}
              fill="#ffffff"
              fontSize={12}
              fontWeight="bold"
            >
              {label}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}
