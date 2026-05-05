import { Rect, Svg, Text as SvgText } from 'react-native-svg';
import { DANGER_CLASSES, MEDIUM_CLASSES } from './detection-classes';
import type { DetectionResult } from './detection-api';

type ViewSize = { width: number; height: number };

function boxColor(name: string): string {
  const n = name.toLowerCase();
  if (DANGER_CLASSES.has(n)) return '#ef4444';
  if (MEDIUM_CLASSES.has(n)) return '#f97316';
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
      {detections.map((det, i) => {
        const [x1, y1, x2, y2] = det.box;
        const color = boxColor(det.name);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable within render
          <Rect
            key={i}
            x={x1 * scaleX}
            y={y1 * scaleY}
            width={(x2 - x1) * scaleX}
            height={(y2 - y1) * scaleY}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
        );
      })}
      {detections.map((det, i) => {
        const [x1, y1] = det.box;
        const color = boxColor(det.name);
        const label = `${det.name} ${Math.round(det.confidence * 100)}%`;
        return (
          <SvgText
            // biome-ignore lint/suspicious/noArrayIndexKey: stable within render
            key={i}
            x={x1 * scaleX + 4}
            y={y1 * scaleY - 4}
            fill={color}
            fontSize={12}
            fontWeight="bold"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
