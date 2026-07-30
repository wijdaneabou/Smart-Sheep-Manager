import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export interface BcsRadarValues {
  spinousProcesses: number;
  transverseProcesses: number;
  eyeMuscle: number;
  fatCover: number;
  tailDock: number;
}

export interface BcsRadarChartProps {
  values: BcsRadarValues;
  showIdealOverlay?: boolean;
  size?: number;
  interactive?: boolean;
  onValueChange?: (key: keyof BcsRadarValues, value: number) => void;
  accentColor?: string;
}

const CRITERIA_CONFIG: Array<{ key: keyof BcsRadarValues; label: string; shortLabel: string }> = [
  { key: "spinousProcesses", label: "Épine dorsale", shortLabel: "Épine" },
  { key: "transverseProcesses", label: "Processus transverses", shortLabel: "Transverses" },
  { key: "eyeMuscle", label: "Muscle de la longe", shortLabel: "Longe" },
  { key: "fatCover", label: "Couverture gras", shortLabel: "Gras" },
  { key: "tailDock", label: "Sternum / Queue", shortLabel: "Sternum" },
];

/**
 * Composant de graphique Radar 5 axes pour l'évaluation BCS
 */
export function BcsRadarChart({
  values,
  showIdealOverlay = true,
  size = 260,
  interactive = false,
  onValueChange,
  accentColor = "#059669",
}: BcsRadarChartProps) {
  const center = size / 2;
  const padding = 45;
  const radius = (size - padding * 2) / 2;
  const numAxes = CRITERIA_CONFIG.length;
  const maxScore = 5;

  // Calcul des angles pour chaque axe (départ en haut à -90 deg)
  const angles = CRITERIA_CONFIG.map((_, i) => (2 * Math.PI / numAxes) * i - Math.PI / 2);

  // Générer un segment de ligne entre 2 points (x1, y1) et (x2, y2)
  const renderLine = (x1: number, y1: number, x2: number, y2: number, color: string, width = 1, dashed = false) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    return (
      <View
        key={`line-${x1.toFixed(1)}-${y1.toFixed(1)}-${x2.toFixed(1)}-${y2.toFixed(1)}`}
        style={[
          styles.line,
          {
            left: x1,
            top: y1,
            width: length,
            height: width,
            backgroundColor: dashed ? "transparent" : color,
            borderColor: dashed ? color : undefined,
            borderStyle: dashed ? "dashed" : undefined,
            borderWidth: dashed ? width : 0,
            transform: [
              { translateX: 0 },
              { translateY: -width / 2 },
              { rotate: `${angleDeg}deg` },
            ],
            transformOrigin: "left center",
          },
        ]}
      />
    );
  };

  // Calcul des coordonnées pour une valeur donnée sur un axe
  const getCoordinates = (axisIndex: number, val: number) => {
    const angle = angles[axisIndex];
    const r = radius * (Math.max(1, Math.min(val, 5)) / maxScore);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Niveaux de grille concentriques (1, 2, 3, 4, 5)
  const levels = [1, 2, 3, 4, 5];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Grille concentrique en toile d'araignée */}
      {levels.map((level) => {
        const levelCoords = angles.map((_, i) => getCoordinates(i, level));
        const isIdeal = level === 3;
        const gridColor = isIdeal ? "#10B981" : "#E5E7EB";
        const gridWidth = isIdeal ? 1.5 : 1;

        return levelCoords.map((pt, i) => {
          const nextPt = levelCoords[(i + 1) % numAxes];
          return renderLine(pt.x, pt.y, nextPt.x, nextPt.y, gridColor, gridWidth, isIdeal && !showIdealOverlay);
        });
      })}

      {/* Axes radiaux de la grille */}
      {angles.map((angle, i) => {
        const endX = center + radius * Math.cos(angle);
        const endY = center + radius * Math.sin(angle);
        return renderLine(center, center, endX, endY, "#D1D5DB", 1);
      })}

      {/* Overlay Profil Idéal (Score 3.0 sur tous les axes) */}
      {showIdealOverlay && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {angles.map((_, i) => {
            const pt1 = getCoordinates(i, 3);
            const pt2 = getCoordinates((i + 1) % numAxes, 3);
            return renderLine(pt1.x, pt1.y, pt2.x, pt2.y, "rgba(16, 185, 129, 0.5)", 1.5, true);
          })}
        </View>
      )}

      {/* Polygone du score actuel de l'animal */}
      {angles.map((_, i) => {
        const pt1 = getCoordinates(i, CRITERIA_CONFIG[i].key in values ? values[CRITERIA_CONFIG[i].key] : 3);
        const nextKey = CRITERIA_CONFIG[(i + 1) % numAxes].key;
        const pt2 = getCoordinates((i + 1) % numAxes, nextKey in values ? values[nextKey] : 3);
        return renderLine(pt1.x, pt1.y, pt2.x, pt2.y, accentColor, 3);
      })}

      {/* Sommets et points interactifs / valeurs */}
      {CRITERIA_CONFIG.map((config, i) => {
        const val = values[config.key] ?? 3;
        const { x, y } = getCoordinates(i, val);

        return (
          <View
            key={`point-${config.key}`}
            style={[
              styles.vertex,
              {
                left: x - 9,
                top: y - 9,
                backgroundColor: accentColor,
              },
            ]}
          >
            <Text style={styles.vertexText}>{val.toFixed(1)}</Text>
          </View>
        );
      })}

      {/* ÉTIQUETTES DES CRITÈRES ET CONTRÔLEURS DE SAISIE */}
      {CRITERIA_CONFIG.map((config, i) => {
        const angle = angles[i];
        const labelRadius = radius + 28;
        const labelX = center + labelRadius * Math.cos(angle);
        const labelY = center + labelRadius * Math.sin(angle);
        const val = values[config.key] ?? 3;

        return (
          <View
            key={`label-${config.key}`}
            style={[
              styles.labelContainer,
              {
                left: labelX - 45,
                top: labelY - 20,
              },
            ]}
          >
            <Text style={styles.labelText} numberOfLines={1}>
              {config.shortLabel}
            </Text>

            {interactive && onValueChange && (
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => {
                    const newVal = Math.max(1, Number((val - 0.5).toFixed(1)));
                    onValueChange(config.key, newVal);
                  }}
                  style={styles.stepBtn}
                  hitSlop={6}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>

                <Text style={styles.stepValText}>{val.toFixed(1)}</Text>

                <Pressable
                  onPress={() => {
                    const newVal = Math.min(5, Number((val + 0.5).toFixed(1)));
                    onValueChange(config.key, newVal);
                  }}
                  style={styles.stepBtn}
                  hitSlop={6}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
    marginVertical: 10,
  },
  line: {
    position: "absolute",
  },
  vertex: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  vertexText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  labelContainer: {
    position: "absolute",
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  stepValText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 4,
  },
});
