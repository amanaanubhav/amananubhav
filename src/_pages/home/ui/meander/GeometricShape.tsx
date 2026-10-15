import { SHAPE_STROKE, type ShapeType } from '../../config/meander';
import { hexagonPoints } from '../../lib/meander-geometry';

export interface GeometricShapeProps {
  type: ShapeType;
  size: number;
}

export function GeometricShape({ type, size }: GeometricShapeProps) {
  const stroke = SHAPE_STROKE;
  if (type === 'hexagon') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon points={hexagonPoints(size)} fill="none" stroke={stroke} strokeWidth="0.8" />
      </svg>
    );
  }
  if (type === 'triangle') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${size / 2},1 ${size - 1},${size - 1} 1,${size - 1}`}
          fill="none"
          stroke={stroke}
          strokeWidth="0.8"
        />
      </svg>
    );
  }
  if (type === 'diamond') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${size / 2},1 ${size - 1},${size / 2} ${size / 2},${size - 1} 1,${size / 2}`}
          fill="none"
          stroke={stroke}
          strokeWidth="0.8"
        />
      </svg>
    );
  }
  // circle
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke={stroke} strokeWidth="0.8" />
    </svg>
  );
}
