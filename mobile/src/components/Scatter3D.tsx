// mobile/src/components/Scatter3D.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Isometric projection
const isoX = (x: number, z: number) => (x - z) * 0.866;
const isoY = (x: number, y: number, z: number) => -(x + z) * 0.5 - y;

// Rotate around Y axis
const rotateY = (x: number, z: number, angle: number) => {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return { x: x * cosA - z * sinA, z: x * sinA + z * cosA };
};

interface Point3D {
  id: string;
  x: number; // Temperature
  y: number; // BCS
  z: number; // Weight
  color: string;
  name: string;
  rfid: string;
  risk: string;
}

interface Scatter3DProps {
  points: Point3D[];
  onPointPress?: (point: Point3D) => void;
  width?: number;
  height?: number;
}

export default function Scatter3D({ points, onPointPress, width = 350, height = 260 }: Scatter3DProps) {
  const [rotation, setRotation] = useState(0);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; point: Point3D | null }>({
    visible: false,
    x: 0,
    y: 0,
    point: null,
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        setRotation(rotation + gestureState.dx / 150);
      },
    })
  ).current;

  // Scale values
  const maxTemp = Math.max(...points.map(p => p.x), 1);
  const maxBcs = Math.max(...points.map(p => p.y), 1);
  const maxWeight = Math.max(...points.map(p => p.z), 1);

  const scale = (val: number, max: number) => (val / max) * 80 + 10;

  const project = (x: number, y: number, z: number) => {
    const rotated = rotateY(x, z, rotation);
    const iso = { x: isoX(rotated.x, rotated.z), y: isoY(rotated.x, y, rotated.z) };
    return {
      x: iso.x + width / 2,
      y: iso.y + height / 2 + 30,
    };
  };

  const projectedPoints = points.map((p) => {
    const sx = scale(p.x, maxTemp);
    const sy = scale(p.y, maxBcs);
    const sz = scale(p.z, maxWeight);
    const proj = project(sx, sy, sz);
    return { ...p, proj };
  });

  // Sort by depth (y) for layering
  const sorted = [...projectedPoints].sort((a, b) => a.proj.y - b.proj.y);

  const handlePointPress = (point: Point3D, x: number, y: number) => {
    setTooltip({ visible: true, x, y, point });
    setTimeout(() => setTooltip({ ...tooltip, visible: false }), 2000);
    if (onPointPress) onPointPress(point);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D32F2F' }]} /><Text style={styles.legendText}>High</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} /><Text style={styles.legendText}>Moderate</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendText}>Low</Text></View>
        <Text style={styles.rotateHint}>← Drag to rotate →</Text>
      </View>

      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const t = (i / 4) * 100;
          const p1 = project(t, 0, 0);
          const p2 = project(t, 0, 100);
          const p3 = project(0, t, 0);
          const p4 = project(100, t, 0);
          return (
            <G key={`grid-${i}`}>
              <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#E0E0E0" strokeWidth={1} />
              <Line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke="#E0E0E0" strokeWidth={1} />
            </G>
          );
        })}

        {/* Axis labels */}
        <SvgText x={width - 30} y={height - 10} fontSize="10" fill="#888" fontWeight="600">Temp →</SvgText>
        <SvgText x={10} y={30} fontSize="10" fill="#888" fontWeight="600">BCS ↑</SvgText>
        <SvgText x={width - 50} y={height - 30} fontSize="10" fill="#888" fontWeight="600">↗ Weight</SvgText>

        {/* Points */}
        {sorted.map((p) => {
          const size = 8 + (p.z / maxWeight) * 6;
          const isHigh = p.risk === 'Élevé';
          return (
            <G key={p.id}>
              {/* Glow for high risk */}
              {isHigh && (
                <Circle
                  cx={p.proj.x}
                  cy={p.proj.y}
                  r={size * 1.6}
                  fill="rgba(211, 47, 47, 0.15)"
                />
              )}
              {/* Dot */}
              <Circle
                cx={p.proj.x}
                cy={p.proj.y}
                r={size}
                fill={p.color}
                onPress={() => handlePointPress(p, p.proj.x, p.proj.y)}
              />
              {/* Border */}
              <Circle
                cx={p.proj.x}
                cy={p.proj.y}
                r={size}
                fill="transparent"
                stroke="white"
                strokeWidth={1.5}
              />
            </G>
          );
        })}
      </Svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.point && (
        <View style={[styles.tooltip, { left: tooltip.x - 40, top: tooltip.y - 40 }]}>
          <Text style={styles.tooltipName}>{tooltip.point.name}</Text>
          <Text style={styles.tooltipRfid}>RFID: {tooltip.point.rfid}</Text>
          <Text style={[styles.tooltipRisk, { color: tooltip.point.color }]}>{tooltip.point.risk}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  rotateHint: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1A1A2E',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tooltipName: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tooltipRfid: {
    color: '#CCC',
    fontSize: 10,
  },
  tooltipRisk: {
    fontSize: 10,
    fontWeight: '700',
  },
});