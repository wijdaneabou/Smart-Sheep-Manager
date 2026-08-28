/**
 * mobile/src/components/widgets/DragDropWidgetList.tsx
 * ------------------------------------------------------------------
 * ⚠️ CORRECTIONS APPORTÉES À LA VERSION FOURNIE :
 *
 *  1) BUG CRITIQUE (Rules of Hooks) : `useAnimatedStyle` était appelé à
 *     l'intérieur de `sortedWidgets.map(...)`. Un hook ne doit jamais
 *     être appelé dans une boucle — l'ordre des hooks doit rester
 *     identique à chaque rendu. Dès qu'un widget est masqué/affiché,
 *     ça plante ("Rendered more hooks than during the previous render").
 *     → Corrigé en extrayant chaque item dans un sous-composant
 *       `DraggableWidgetItem`, qui appelle le hook une seule fois à son
 *       propre niveau (autorisé, car c'est un composant à part entière).
 *
 *  2) BUG CRITIQUE (worklets) : `findItemAtY` et `calculateNewIndex`
 *     sont des fonctions JS classiques (elles lisent `layouts.current`,
 *     une ref React). Elles étaient appelées depuis `.onBegin()` /
 *     `.onEnd()` de `Gesture.Pan()`, qui s'exécutent sur le UI thread
 *     (worklets). Une fonction non marquée `'worklet'` plante au
 *     runtime si on l'appelle depuis un worklet.
 *     → Corrigé en marquant ces deux fonctions `'worklet'` et en leur
 *       passant les layouts via une SharedValue (`layoutsShared`)
 *       plutôt qu'une ref React classique, qui n'est pas accessible
 *       depuis le UI thread.
 * ------------------------------------------------------------------
 */

import { useCallback, useMemo } from "react";
import { View, Pressable, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#2E7D32",
  primaryLight: "#E8F5E9",
  background: "#F8FAF9",
  card: "#FFFFFF",
  text: "#1B1B1B",
  textSecondary: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  shadow: "rgba(15, 23, 42, 0.06)",
  shadowMedium: "rgba(15, 23, 42, 0.10)",
};

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.5,
};

export type WidgetType =
  | "kpi-herd"
  | "kpi-gmq"
  | "kpi-fcr"
  | "kpi-mortality"
  | "chart-gmq-trend"
  | "chart-breed-distribution"
  | "chart-financial"
  | "table-races"
  | "table-charges"
  | "alerts"
  | "calendar";

export interface WidgetItem {
  widgetType: WidgetType;
  isVisible: boolean;
  sortOrder: number;
  size: "small" | "medium" | "large";
}

interface DragDropWidgetListProps {
  widgets: WidgetItem[];
  renderWidget: (item: WidgetItem, index: number) => React.ReactNode;
  onReorder: (newOrder: WidgetType[]) => void;
  onToggleVisibility: (widgetType: WidgetType) => void;
  onResize: (widgetType: WidgetType, size: WidgetItem["size"]) => void;
  editMode: boolean;
}

interface ItemLayout {
  y: number;
  height: number;
}

const MUTED = "#64748B";
const PRIMARY = "#2E7D32";

const SIZES: WidgetItem["size"][] = ["small", "medium", "large"];
const SIZE_LABELS: Record<WidgetItem["size"], string> = {
  small: "S",
  medium: "M",
  large: "L",
};

// Fonctions "worklet" : exécutées sur le UI thread, elles ne peuvent lire
// que des SharedValue (pas de ref React classique, pas de state).
function findItemAtY(layoutsArr: ItemLayout[], count: number, y: number): number {
  "worklet";
  for (let i = 0; i < count; i++) {
    const layout = layoutsArr[i];
    if (layout && y >= layout.y && y <= layout.y + layout.height) {
      return i;
    }
  }
  return -1;
}

function calculateNewIndex(layoutsArr: ItemLayout[], count: number, y: number): number {
  "worklet";
  for (let i = 0; i < count; i++) {
    const layout = layoutsArr[i];
    if (layout && y < layout.y + layout.height / 2) {
      return i;
    }
  }
  return count - 1;
}

const DragDropWidgetList = ({
  widgets,
  renderWidget,
  onReorder,
  onToggleVisibility,
  onResize,
  editMode,
}: DragDropWidgetListProps) => {
  const sortedWidgets = useMemo(() => [...widgets].sort((a, b) => a.sortOrder - b.sortOrder), [widgets]);

  // SharedValue plutôt qu'une ref React classique : accessible depuis le UI thread (worklets).
  const layoutsShared = useSharedValue<ItemLayout[]>([]);

  const activeIndex = useSharedValue(-1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      const next = [...layoutsShared.value];
      next[index] = { y, height };
      layoutsShared.value = next;
    },
    [layoutsShared]
  );

  const reorderJS = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const currentTypes = sortedWidgets.map((w) => w.widgetType);
      const [moved] = currentTypes.splice(fromIndex, 1);
      currentTypes.splice(toIndex, 0, moved);
      onReorder(currentTypes);
    },
    [onReorder, sortedWidgets]
  );

  const widgetCount = sortedWidgets.length;

  const panGesture = Gesture.Pan()
    .enabled(editMode)
    .minDistance(5)
    .onBegin((e) => {
      const index = findItemAtY(layoutsShared.value, widgetCount, e.y);
      if (index >= 0 && index < widgetCount) {
        activeIndex.value = index;
        scale.value = withSpring(1.02, SPRING_CONFIG);
      }
    })
    .onUpdate((e) => {
      if (activeIndex.value >= 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (activeIndex.value >= 0) {
        const layout = layoutsShared.value[activeIndex.value];
        const newY = (layout?.y ?? 0) + e.translationY;
        const newIndex = calculateNewIndex(layoutsShared.value, widgetCount, newY);
        if (newIndex !== activeIndex.value && newIndex >= 0) {
          runOnJS(reorderJS)(activeIndex.value, newIndex);
        }
        activeIndex.value = -1;
        translateY.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
      }
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(editMode)
    .minDuration(200)
    .onStart((e) => {
      const index = findItemAtY(layoutsShared.value, widgetCount, e.y);
      if (index >= 0) {
        activeIndex.value = index;
        scale.value = withSpring(1.02, SPRING_CONFIG);
      }
    })
    .onEnd(() => {
      if (activeIndex.value >= 0) {
        activeIndex.value = -1;
        translateY.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
      }
    });

  const composedGesture = Gesture.Race(longPressGesture, panGesture);

  const cycleSize = useCallback(
    (widgetType: WidgetType) => {
      const widget = sortedWidgets.find((w) => w.widgetType === widgetType);
      if (!widget) return;
      const currentIdx = SIZES.indexOf(widget.size);
      const nextIdx = (currentIdx + 1) % SIZES.length;
      onResize(widgetType, SIZES[nextIdx]);
    },
    [onResize, sortedWidgets]
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        {sortedWidgets.map((item, index) => (
          <DraggableWidgetItem
            key={item.widgetType}
            item={item}
            index={index}
            activeIndex={activeIndex}
            translateY={translateY}
            scale={scale}
            editMode={editMode}
            onLayout={handleLayout}
            onToggleVisibility={onToggleVisibility}
            onCycleSize={cycleSize}
            renderWidget={renderWidget}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

// ============================================================
// Sous-composant : un seul appel à useAnimatedStyle, à son propre
// niveau — c'est ce qui corrige la violation des Rules of Hooks.
// ============================================================

interface DraggableWidgetItemProps {
  item: WidgetItem;
  index: number;
  activeIndex: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  editMode: boolean;
  onLayout: (index: number, e: LayoutChangeEvent) => void;
  onToggleVisibility: (widgetType: WidgetType) => void;
  onCycleSize: (widgetType: WidgetType) => void;
  renderWidget: (item: WidgetItem, index: number) => React.ReactNode;
}

function DraggableWidgetItem({
  item,
  index,
  activeIndex,
  translateY,
  scale,
  editMode,
  onLayout,
  onToggleVisibility,
  onCycleSize,
  renderWidget,
}: DraggableWidgetItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    const translate = isActive ? translateY.value : 0;
    return {
      transform: [
        { translateY: withSpring(translate, SPRING_CONFIG) },
        { scale: withSpring(isActive ? scale.value : 1, SPRING_CONFIG) },
      ],
      zIndex: isActive ? 100 : 0,
      opacity: withSpring(isActive ? 0.92 : 1, SPRING_CONFIG),
    };
  });

  const isLarge = item.size === "large";
  const isSmall = item.size === "small";

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.widgetWrapper,
        isLarge && styles.widgetLarge,
        isSmall && styles.widgetSmall,
        editMode && styles.widgetWrapperEdit,
      ]}
      onLayout={(e) => onLayout(index, e)}
    >
      {editMode && (
        <View style={styles.dragHandle}>
          <View style={styles.dragHandleDots}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
        </View>
      )}
      <View style={[styles.widgetContent, isSmall && styles.widgetContentSmall]}>
        <View style={styles.widgetInner}>{renderWidget(item, index)}</View>
      </View>
      {editMode && (
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => onCycleSize(item.widgetType)}>
            <Text style={styles.sizeLabel}>{SIZE_LABELS[item.size]}</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => onToggleVisibility(item.widgetType)}>
            <Ionicons name={item.isVisible ? "eye" : "eye-off"} size={17} color={item.isVisible ? PRIMARY : MUTED} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  widgetWrapper: { flexDirection: "row", alignItems: "stretch", gap: 8, minHeight: 120 },
  widgetWrapperEdit: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary + "30", shadowColor: COLORS.shadowMedium, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  widgetLarge: { minHeight: 240 },
  widgetSmall: { minHeight: 100 },
  dragHandle: { width: 28, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  dragHandleDots: { flexDirection: "column", alignItems: "center", gap: 3 },
  dragDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.border },
  widgetContent: { flex: 1 },
  widgetContentSmall: { flex: 0, width: "48%" },
  widgetInner: { flex: 1, borderRadius: 16, overflow: "hidden" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingRight: 4 },
  actionButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sizeLabel: { fontSize: 12, fontWeight: "800", color: MUTED },
});

export default DragDropWidgetList;
