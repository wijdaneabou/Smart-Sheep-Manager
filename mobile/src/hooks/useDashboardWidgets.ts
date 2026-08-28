/**
 * mobile/src/hooks/useDashboardWidgets.ts
 * ------------------------------------------------------------------
 * ⚠️ CORRECTIONS APPORTÉES À LA VERSION FOURNIE :
 *
 *  1) `toggleVisibility` et `resizeWidget` appelaient
 *     `widgetsConfigService.saveWidgetConfig(...)` À L'INTÉRIEUR du
 *     callback passé à `setWidgets((prev) => {...})`. Un updater de
 *     state React doit être pur — en StrictMode, React peut l'appeler
 *     deux fois, ce qui aurait déclenché deux requêtes API pour un
 *     seul clic. → Le nouveau tableau est maintenant calculé d'abord,
 *     puis `saveWidgetConfig` est appelé après, hors de l'updater.
 *
 *  2) Conséquence du bug 1 : `saving` repassait à `false` avant même
 *     que la requête ait une chance de partir (elle n'était jamais
 *     attendue). → `saving` est maintenant vrai pendant toute la durée
 *     réelle de l'appel réseau, pour toggle/resize comme pour le reste.
 *
 *  3) `reorderWidgets` donnait `sortOrder = -1` à tous les widgets
 *     absents de `newOrder` (donc les widgets masqués, puisque seuls
 *     les widgets visibles sont passés au drag-and-drop). Résultat :
 *     ils se seraient tous retrouvés collés en première position le
 *     jour où ils sont réaffichés. → Les widgets masqués conservent
 *     désormais leur ordre relatif entre eux, placés après les
 *     widgets visibles réordonnés.
 *
 * Non modifié (à vérifier de ton côté si besoin, mais ce ne sont pas
 * des bugs certains sans voir `widgetsConfigService`) :
 *   - `switchProfile` marque localement `isDefault: true` sur le
 *     profil vers lequel on bascule, ce qui mélange "profil système
 *     non supprimable" et "profil actuellement sélectionné". Si
 *     `isDefault` sert uniquement à afficher un badge visuel, ce n'est
 *     pas grave ; s'il sert à autre chose côté logique, il faudrait un
 *     champ séparé (ex: `isActive`).
 *   - `deleteProfile` ne bloque que si `profiles.length <= 1` ; rien
 *     n'empêche explicitement de supprimer LE profil par défaut s'il
 *     en reste d'autres. Si `widgetsConfigService.deleteProfile` fait
 *     déjà cette validation côté serveur, c'est suffisant — sinon il
 *     manque un garde-fou ici.
 * ------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { usePermissions } from "@/contexts/PermissionsContext";
import * as widgetsConfigService from "@/services/widgetsConfigService";

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

const DEFAULT_WIDGETS: WidgetItem[] = [
  { widgetType: "kpi-herd", isVisible: true, sortOrder: 0, size: "medium" },
  { widgetType: "kpi-gmq", isVisible: true, sortOrder: 1, size: "medium" },
  { widgetType: "kpi-fcr", isVisible: true, sortOrder: 2, size: "medium" },
  { widgetType: "kpi-mortality", isVisible: true, sortOrder: 3, size: "medium" },
  { widgetType: "chart-gmq-trend", isVisible: true, sortOrder: 4, size: "large" },
  { widgetType: "chart-breed-distribution", isVisible: true, sortOrder: 5, size: "medium" },
  { widgetType: "chart-financial", isVisible: true, sortOrder: 6, size: "large" },
  { widgetType: "table-races", isVisible: true, sortOrder: 7, size: "medium" },
  { widgetType: "table-charges", isVisible: true, sortOrder: 8, size: "medium" },
  { widgetType: "alerts", isVisible: true, sortOrder: 9, size: "medium" },
  { widgetType: "calendar", isVisible: true, sortOrder: 10, size: "medium" },
];

export function useDashboardWidgets() {
  const { user } = usePermissions();
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [profiles, setProfiles] = useState<widgetsConfigService.DashboardProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [profilesResult, widgetsResult] = await Promise.all([
        widgetsConfigService.fetchProfiles(),
        widgetsConfigService.fetchWidgetConfig(),
      ]);

      if (profilesResult && profilesResult.length > 0) {
        setProfiles(profilesResult);
        const defaultProfile = profilesResult.find((p) => p.isDefault) ?? profilesResult[0];
        setActiveProfileId(defaultProfile.id);
      }

      if (widgetsResult.data && widgetsResult.data.length > 0) {
        setWidgets(
          widgetsResult.data.map((item) => ({
            widgetType: item.widgetType as WidgetType,
            isVisible: item.isVisible,
            sortOrder: item.sortOrder,
            size: item.size,
          }))
        );
        if (widgetsResult.profileId) {
          setActiveProfileId(widgetsResult.profileId);
        }
      }
    } catch {
      // Keep defaults on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const visibleWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.sortOrder - b.sortOrder).filter((w) => w.isVisible),
    [widgets]
  );

  /** Sauvegarde un tableau déjà calculé — jamais appelé depuis un updater de state. */
  const persist = useCallback(
    async (updated: WidgetItem[]) => {
      if (!activeProfileId) return;
      setSaving(true);
      try {
        await widgetsConfigService.saveWidgetConfig(activeProfileId, updated);
      } finally {
        setSaving(false);
      }
    },
    [activeProfileId]
  );

  const toggleVisibility = useCallback(
    async (widgetType: WidgetType) => {
      const updated = widgets.map((w) =>
        w.widgetType === widgetType ? { ...w, isVisible: !w.isVisible } : w
      );
      setWidgets(updated);
      await persist(updated);
    },
    [widgets, persist]
  );

  const resizeWidget = useCallback(
    async (widgetType: WidgetType, size: WidgetItem["size"]) => {
      const updated = widgets.map((w) => (w.widgetType === widgetType ? { ...w, size } : w));
      setWidgets(updated);
      await persist(updated);
    },
    [widgets, persist]
  );

  const reorderWidgets = useCallback(
    (newOrder: WidgetType[]) => {
      // Les widgets absents de newOrder (masqués) gardent leur ordre
      // relatif entre eux, placés juste après les widgets réordonnés.
      const hiddenInPreviousOrder = widgets
        .filter((w) => !newOrder.includes(w.widgetType))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((w) => w.widgetType);

      const updated = widgets.map((w) => {
        const visibleIndex = newOrder.indexOf(w.widgetType);
        if (visibleIndex !== -1) {
          return { ...w, sortOrder: visibleIndex };
        }
        const hiddenIndex = hiddenInPreviousOrder.indexOf(w.widgetType);
        return { ...w, sortOrder: newOrder.length + hiddenIndex, isVisible: false };
      });

      setWidgets(updated);
      void persist(updated);
    },
    [widgets, persist]
  );

  const createNewProfile = useCallback(async (name: string) => {
    setSaving(true);
    try {
      const profile = await widgetsConfigService.createProfile(name);
      await widgetsConfigService.setDefaultProfile(profile.id);
      const defaultConfig = await widgetsConfigService.fetchDefaultWidgetConfig();
      await widgetsConfigService.saveWidgetConfig(profile.id, defaultConfig);
      setProfiles((prev) => [...prev, profile]);
      setActiveProfileId(profile.id);
      setWidgets(
        defaultConfig.map((item) => ({
          widgetType: item.widgetType as WidgetType,
          isVisible: item.isVisible,
          sortOrder: item.sortOrder,
          size: item.size,
        }))
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const switchProfile = useCallback(async (profileId: number) => {
    setSaving(true);
    try {
      const result = await widgetsConfigService.fetchWidgetConfig(profileId);
      if (result.data && result.data.length > 0) {
        setWidgets(
          result.data.map((item) => ({
            widgetType: item.widgetType as WidgetType,
            isVisible: item.isVisible,
            sortOrder: item.sortOrder,
            size: item.size,
          }))
        );
      }
      setActiveProfileId(profileId);
      setProfiles((prev) => prev.map((p) => ({ ...p, isDefault: p.id === profileId })));
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteProfile = useCallback(
    (profileId: number) => {
      if (profiles.length <= 1) {
        Alert.alert("Impossible", "Vous devez conserver au moins un profil.");
        return;
      }
      Alert.alert("Supprimer le profil", "Êtes-vous sûr de vouloir supprimer ce profil ?", [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await widgetsConfigService.deleteProfile(profileId);
              const remaining = await widgetsConfigService.fetchProfiles();
              setProfiles(remaining);
              if (activeProfileId === profileId && remaining.length > 0) {
                await switchProfile(remaining[0].id);
              }
            } finally {
              setSaving(false);
            }
          },
        },
      ]);
    },
    [profiles.length, activeProfileId, switchProfile]
  );

  const resetToDefaults = useCallback(() => {
    Alert.alert(
      "Réinitialiser les widgets",
      "Voulez-vous restaurer la configuration par défaut du tableau de bord ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const defaultConfig = await widgetsConfigService.fetchDefaultWidgetConfig();
              const normalized = defaultConfig.map((item) => ({
                widgetType: item.widgetType as WidgetType,
                isVisible: item.isVisible,
                sortOrder: item.sortOrder,
                size: item.size,
              }));
              setWidgets(normalized);
              if (activeProfileId) {
                await widgetsConfigService.saveWidgetConfig(activeProfileId, normalized);
              }
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [activeProfileId]);

  return {
    widgets,
    visibleWidgets,
    profiles,
    activeProfileId,
    loading,
    saving,
    toggleVisibility,
    resizeWidget,
    reorderWidgets,
    createNewProfile,
    switchProfile,
    deleteProfile,
    resetToDefaults,
    reload: loadConfig,
  };
}