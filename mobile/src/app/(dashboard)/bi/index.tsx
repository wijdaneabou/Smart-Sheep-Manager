/**
 * mobile/src/app/(dashboard)/bi/index.tsx
 * ------------------------------------------------------------------
 * Dashboard BI (Module 12) avec widgets personnalisables.
 * Mode présentation : boutons "Pause/Play" et "Quitter" toujours visibles.
 * ------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  CalendarEvent,
  BiFilters,
  DashboardOverview,
  FinancialSummary,
  fetchAlerts,
  fetchCalendarEvents,
  fetchDashboard,
  fetchFinancials,
  exportBiReport,
  BiExportFormat,
} from "@/services/biService";
import { useDashboardWidgets, WidgetItem } from "@/hooks/useDashboardWidgets";
import { usePermissions } from "@/contexts/PermissionsContext";
import DragDropWidgetList, { WidgetType } from "@/components/widgets/DragDropWidgetList";
import {
  KpiHerdWidget,
  GmqTrendWidget,
  BreedDistributionWidget,
  FinancialWidget,
  AlertsWidget,
  ChargesTableWidget,
  CalendarWidget,
} from "@/components/widgets/BiDashboardWidgets";

const COLORS = {
  primary: "#2E7D32",
  primaryLight: "#E8F5E9",
  primaryDark: "#1B5E20",
  danger: "#C62828",
  dangerLight: "#FFEBEE",
  warning: "#F9A825",
  warningLight: "#FFFDE7",
  info: "#1565C0",
  infoLight: "#E3F2FD",
  purple: "#6D28D9",
  purpleLight: "#F3E8FF",
  background: "#F8FAF9",
  card: "#FFFFFF",
  text: "#1B1B1B",
  textSecondary: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  shadow: "rgba(15, 23, 42, 0.06)",
  shadowMedium: "rgba(15, 23, 42, 0.10)",
};

export default function BiDashboardScreen() {
  const { userRole } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "filtered">("filtered");
  const [exporting, setExporting] = useState<BiExportFormat | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [newProfileName, setNewProfileName] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<BiFilters>({});
  const [draftFilters, setDraftFilters] = useState<BiFilters>({});

  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const {
    visibleWidgets,
    profiles,
    activeProfileId,
    toggleVisibility,
    resizeWidget,
    reorderWidgets,
    createNewProfile,
    switchProfile,
    deleteProfile,
    resetToDefaults,
    loading: widgetsLoading,
    saving,
  } = useDashboardWidgets();

  const displayedWidgets = useMemo(
    () => (editMode ? visibleWidgets : visibleWidgets.filter((w) => w.isVisible)),
    [visibleWidgets, editMode]
  );

  useEffect(() => {
    if (!presentationMode || !autoRotate || displayedWidgets.length < 2) return;
    const timer = setInterval(() => setPresentationIndex((current) => (current + 1) % displayedWidgets.length), 8000);
    return () => clearInterval(timer);
  }, [presentationMode, autoRotate, displayedWidgets.length]);

  const togglePresentation = useCallback(async () => {
    const next = !presentationMode;
    setPresentationMode(next);
    setPresentationIndex(0);
  }, [presentationMode]);

  const loadData = useCallback(async (filters: BiFilters) => {
    try {
      setError(null);
      const [dashboardData, financialsData, alertsData, calendarData] = await Promise.all([
        fetchDashboard(filters),
        fetchFinancials(filters),
        fetchAlerts(filters),
        fetchCalendarEvents(filters),
      ]);
      setDashboard(dashboardData);
      setFinancials(financialsData);
      setAlerts(alertsData);
      setCalendarEvents(calendarData);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement des données BI");
    }
  }, []);

  useEffect(() => {
    const requestTimer = setTimeout(() => {
      void loadData({}).finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(requestTimer);
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(appliedFilters);
    setRefreshing(false);
  }, [appliedFilters, loadData]);

  const applyFilters = useCallback(async () => {
    setAppliedFilters(draftFilters);
    setFiltersModalVisible(false);
    setRefreshing(true);
    await loadData(draftFilters);
    setRefreshing(false);
  }, [draftFilters, loadData]);

  const resetFilters = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    setFiltersModalVisible(false);
    void loadData({});
  }, [loadData]);

  const activeFilterCount = Object.values(appliedFilters).filter((value) => value !== undefined && value !== "").length;
  const canOpenCooperativeView = ["COOPERATIVE", "ADMIN"].includes(userRole.toUpperCase());

  const handleReorder = useCallback(
    (newOrder: WidgetType[]) => {
      reorderWidgets(newOrder);
    },
    [reorderWidgets]
  );

  const handleResize = useCallback(
    (widgetType: WidgetType, size: WidgetItem["size"]) => {
      resizeWidget(widgetType, size);
    },
    [resizeWidget]
  );

  const handleCreateProfile = useCallback(async () => {
    if (!newProfileName.trim()) return;
    await createNewProfile(newProfileName.trim());
    setNewProfileName("");
    setProfileModalVisible(false);
  }, [newProfileName, createNewProfile]);

  const handleExport = useCallback(async (format: BiExportFormat) => {
    try {
      setExporting(format);
      await exportBiReport(format, exportScope === "filtered" ? appliedFilters : {});
      setExportModalVisible(false);
      Alert.alert("Export prêt", "Le fichier a été téléchargé ou ouvert dans le menu de partage.");
    } catch (e: any) {
      Alert.alert("Export impossible", e?.message ?? "Une erreur est survenue lors de la création du fichier.");
    } finally {
      setExporting(null);
    }
  }, [appliedFilters, exportScope]);

  const renderWidget = useCallback(
    (item: WidgetItem, index: number) => {
      switch (item.widgetType) {
        case "kpi-herd":
          return <KpiHerdWidget dashboard={dashboard} />;
        case "kpi-gmq":
          return <KpiGmqWidget dashboard={dashboard} />;
        case "kpi-fcr":
          return <KpiFcrWidget />;
        case "kpi-mortality":
          return <KpiMortalityWidget dashboard={dashboard} />;
        case "chart-gmq-trend":
          return (
            <View style={styles.section}>
              <SectionHeader title="Évolution du poids moyen" />
              <GmqTrendWidget dashboard={dashboard} />
            </View>
          );
        case "chart-breed-distribution":
          return (
            <View style={styles.section}>
              <SectionHeader title="Répartition par race" />
              <BreedDistributionWidget dashboard={dashboard} />
            </View>
          );
        case "chart-financial":
          return (
            <View style={styles.section}>
              <SectionHeader title="Financier (12 derniers mois)" />
              <FinancialWidget financials={financials} />
            </View>
          );
        case "table-races":
          return <RacesTableWidget dashboard={dashboard} />;
        case "table-charges":
          return <ChargesTableWidget financials={financials} />;
        case "alerts":
          return (
            <View style={styles.section}>
              <SectionHeader title="Alertes actives" />
              <AlertsWidget alerts={alerts} />
            </View>
          );
        case "calendar":
          return <CalendarWidget events={calendarEvents} />;
        default:
          return null;
      }
    },
    [dashboard, financials, alerts, calendarEvents]
  );

  if (loading || widgetsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.mutedText}>Chargement du tableau de bord…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={onRefresh}>
          Réessayer
        </Text>
      </View>
    );
  }

  // === MODE PRÉSENTATION ===
  if (presentationMode) {
    const widget = displayedWidgets[presentationIndex];
    return (
      <View style={styles.presentationContainer}>
        <View style={styles.presentationTop}>
          <View style={styles.presentationTitleBlock}>
            <Text style={styles.presentationTitle}>Smart Sheep · Indicateurs</Text>
            <Text style={styles.presentationSubtitle}>
              {profiles.find((p) => p.id === activeProfileId)?.name ?? "Tableau de bord"} · {presentationIndex + 1}/{displayedWidgets.length}
            </Text>
          </View>
          <View style={styles.presentationActions}>
            <Pressable onPress={() => setAutoRotate((v) => !v)} style={styles.presentationIcon}>
              <Ionicons name={autoRotate ? "pause" : "play"} size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={togglePresentation} style={styles.presentationExit}>
              <Ionicons name="contract-outline" size={20} color="#fff" />
              <Text style={styles.presentationExitText}>Quitter</Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.presentationBody}
          onPress={() => {
            if (displayedWidgets.length) {
              setPresentationIndex((current) => (current + 1) % displayedWidgets.length);
            }
          }}
        >
          {widget ? (
            <View style={styles.presentationWidget}>{renderWidget(widget, presentationIndex)}</View>
          ) : (
            <Text style={styles.presentationEmpty}>Aucun widget à présenter.</Text>
          )}
        </Pressable>
        <View style={styles.presentationDots}>
          {displayedWidgets.map((item, index) => (
            <View
              key={item.widgetType}
              style={[styles.presentationDot, index === presentationIndex && styles.presentationDotActive]}
            />
          ))}
        </View>
      </View>
    );
  }

  // === MODE NORMAL ===
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title} numberOfLines={1}>Tableau de bord</Text>
          <Pressable
            onPress={() => setEditMode(!editMode)}
            style={[styles.editButton, editMode && styles.editButtonActive]}
          >
            <Ionicons name={editMode ? "checkmark" : "settings-outline"} size={16} color="#fff" />
            <Text style={styles.editButtonText}>{editMode ? "Terminé" : "Personnaliser"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setProfileModalVisible(true)}>
          <Text style={styles.profileLabel}>
            {profiles.find((p) => p.id === activeProfileId)?.name ?? "Profil par défaut"}
          </Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.headerActionsScroll}>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setExportModalVisible(true)} style={styles.headerButton}>
              <Ionicons name="download-outline" size={18} color={COLORS.primary} />
              <Text style={styles.headerButtonLabel}>Exporter</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setDraftFilters(appliedFilters);
                setFiltersModalVisible(true);
              }}
              style={styles.headerButton}
            >
              <Ionicons name="filter-outline" size={18} color={COLORS.primary} />
              <Text style={styles.headerButtonLabel}>Filtres</Text>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setActionsModalVisible(true)} style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.primary} />
              <Text style={styles.headerButtonLabel}>Outils</Text>
            </Pressable>
            {editMode && (
              <Pressable onPress={resetToDefaults} style={styles.headerButton}>
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.headerButtonLabel}>Réinit.</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {editMode && (
          <View style={styles.editBanner}>
            <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            <Text style={styles.editBannerText}>
              Glissez pour réorganiser. Appuyez sur S/M/L pour redimensionner. Appuyez sur l'œil pour afficher/masquer.
            </Text>
          </View>
        )}

        {displayedWidgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.mutedText}>
              {editMode
                ? "Aucun widget configuré. Réinitialisez pour repartir de la config par défaut."
                : 'Aucun widget affiché. Appuyez sur "Personnaliser" pour en activer.'}
            </Text>
          </View>
        ) : (
          <DragDropWidgetList
            widgets={displayedWidgets}
            renderWidget={renderWidget}
            onReorder={handleReorder}
            onToggleVisibility={toggleVisibility}
            onResize={handleResize}
            editMode={editMode}
          />
        )}
      </ScrollView>

      {/* Modals ... (inchangés) */}
      <Modal visible={profileModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profils de tableau de bord</Text>
            <Pressable onPress={() => setProfileModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <FlatList
            data={profiles}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.profileList}
            renderItem={({ item }) => (
              <View style={styles.profileItem}>
                <Pressable
                  style={[styles.profileButton, activeProfileId === item.id && styles.profileButtonActive]}
                  onPress={() => {
                    switchProfile(item.id);
                    setProfileModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.profileName, activeProfileId === item.id && styles.profileNameActive]}>
                      {item.name}
                    </Text>
                    {item.isDefault && <Text style={styles.profileBadge}>Par défaut</Text>}
                  </View>
                  {activeProfileId === item.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </Pressable>
                <View style={styles.profileActions}>
                  <Pressable
                    onPress={() => {
                      deleteProfile(item.id);
                      setProfileModalVisible(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.mutedText}>Aucun profil. Créez-en un pour commencer.</Text>}
          />
          <View style={styles.modalFooter}>
            <TextInput
              style={styles.input}
              placeholder="Nouveau profil"
              value={newProfileName}
              onChangeText={setNewProfileName}
            />
            <Pressable
              style={[styles.createButton, saving && styles.createButtonDisabled]}
              onPress={handleCreateProfile}
              disabled={saving || !newProfileName.trim()}
            >
              <Text style={styles.createButtonText}>{saving ? "Création…" : "Créer"}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={filtersModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Filtres d’analyse</Text>
              <Text style={styles.filterHint}>Les filtres peuvent être combinés.</Text>
            </View>
            <Pressable onPress={() => setFiltersModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.filtersContent}>
            <FilterGroup title="Période">
              <TextInput
                style={styles.input}
                placeholder="Du (AAAA-MM-JJ)"
                value={draftFilters.dateFrom ?? ""}
                onChangeText={(dateFrom) => setDraftFilters((current) => ({ ...current, dateFrom: dateFrom || undefined }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Au (AAAA-MM-JJ)"
                value={draftFilters.dateTo ?? ""}
                onChangeText={(dateTo) => setDraftFilters((current) => ({ ...current, dateTo: dateTo || undefined }))}
              />
              <FilterPicker
                label="Granularité"
                value={draftFilters.granularity ?? ""}
                onValueChange={(granularity) =>
                  setDraftFilters((current) => ({
                    ...current,
                    granularity: (granularity || undefined) as BiFilters["granularity"],
                  }))
                }
                items={[
                  ["", "Mensuelle (défaut)"],
                  ["day", "Jour"],
                  ["week", "Semaine"],
                  ["month", "Mois"],
                  ["year", "Année"],
                ]}
              />
            </FilterGroup>
            <FilterGroup title="Animal">
              <FilterPicker
                label="Race"
                value={draftFilters.breed ?? ""}
                onValueChange={(breed) =>
                  setDraftFilters((current) => ({ ...current, breed: (breed || undefined) as BiFilters["breed"] }))
                }
                items={[
                  ["", "Toutes les races"],
                  ["Sardi", "Sardi"],
                  ["Timahdite", "Timahdite"],
                  ["D'man", "D'man"],
                  ["Beni-Guil", "Beni-Guil"],
                ]}
              />
              <FilterPicker
                label="Sexe"
                value={draftFilters.sex ?? ""}
                onValueChange={(sex) =>
                  setDraftFilters((current) => ({ ...current, sex: (sex || undefined) as BiFilters["sex"] }))
                }
                items={[
                  ["", "Tous les sexes"],
                  ["MALE", "Mâle"],
                  ["FEMALE", "Femelle"],
                ]}
              />
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                  placeholder="Âge min."
                  value={draftFilters.ageMin?.toString() ?? ""}
                  onChangeText={(ageMin) =>
                    setDraftFilters((current) => ({ ...current, ageMin: numberOrUndefined(ageMin) }))
                  }
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                  placeholder="Âge max."
                  value={draftFilters.ageMax?.toString() ?? ""}
                  onChangeText={(ageMax) =>
                    setDraftFilters((current) => ({ ...current, ageMax: numberOrUndefined(ageMax) }))
                  }
                />
              </View>
            </FilterGroup>
            <FilterGroup title="Localisation">
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="ID bâtiment"
                value={draftFilters.buildingId?.toString() ?? ""}
                onChangeText={(buildingId) =>
                  setDraftFilters((current) => ({ ...current, buildingId: numberOrUndefined(buildingId) }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Lot"
                value={draftFilters.lot ?? ""}
                onChangeText={(lot) => setDraftFilters((current) => ({ ...current, lot: lot || undefined }))}
              />
            </FilterGroup>
            <FilterGroup title="Santé">
              <FilterPicker
                label="Statut sanitaire"
                value={draftFilters.healthStatus ?? ""}
                onValueChange={(healthStatus) =>
                  setDraftFilters((current) => ({
                    ...current,
                    healthStatus: (healthStatus || undefined) as BiFilters["healthStatus"],
                  }))
                }
                items={[
                  ["", "Tous les statuts"],
                  ["HEALTHY", "Sain"],
                  ["SICK", "Malade"],
                  ["RECOVERING", "En récupération"],
                  ["QUARANTINE", "Quarantaine"],
                ]}
              />
            </FilterGroup>
          </ScrollView>
          <View style={styles.filterFooter}>
            <Pressable style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.createButtonText}>Appliquer</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={exportModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Exporter le rapport</Text>
              <Text style={styles.filterHint}>Choisissez le périmètre et le format de sortie.</Text>
            </View>
            <Pressable disabled={exporting !== null} onPress={() => setExportModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.exportContent}>
            <Text style={styles.exportSectionTitle}>Contenu</Text>
            <View style={styles.scopeRow}>
              <Pressable
                disabled={exporting !== null}
                onPress={() => setExportScope("filtered")}
                style={[styles.scopeCard, exportScope === "filtered" && styles.scopeCardActive]}
              >
                <Ionicons name="filter-outline" size={21} color={COLORS.primary} />
                <Text style={styles.scopeTitle}>Vue filtrée</Text>
                <Text style={styles.scopeHint}>
                  {activeFilterCount ? `${activeFilterCount} filtre(s) appliqué(s)` : "Période par défaut : 12 mois"}
                </Text>
              </Pressable>
              <Pressable
                disabled={exporting !== null}
                onPress={() => setExportScope("all")}
                style={[styles.scopeCard, exportScope === "all" && styles.scopeCardActive]}
              >
                <Ionicons name="layers-outline" size={21} color={COLORS.primary} />
                <Text style={styles.scopeTitle}>Rapport complet</Text>
                <Text style={styles.scopeHint}>Toutes les données disponibles</Text>
              </Pressable>
            </View>
            <Text style={styles.exportSectionTitle}>Format</Text>
            <ExportOption
              icon="document-text-outline"
              title="PDF"
              subtitle="Rapport complet, mis en page pour le partage"
              format="pdf"
              loading={exporting}
              onPress={handleExport}
            />
            <ExportOption
              icon="grid-outline"
              title="Excel"
              subtitle="Classeur XLSX : synthèse et données brutes"
              format="xlsx"
              loading={exporting}
              onPress={handleExport}
            />
            <ExportOption
              icon="code-outline"
              title="CSV"
              subtitle="Données brutes compatibles avec vos outils"
              format="csv"
              loading={exporting}
              onPress={handleExport}
            />
            <ExportOption
              icon="image-outline"
              title="PNG"
              subtitle="Visuel du graphique de répartition"
              format="png"
              loading={exporting}
              onPress={handleExport}
            />
            <ExportOption
              icon="easel-outline"
              title="PowerPoint"
              subtitle="Présentation avec indicateurs et graphique financier"
              format="pptx"
              loading={exporting}
              onPress={handleExport}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={actionsModalVisible} transparent animationType="fade" onRequestClose={() => setActionsModalVisible(false)}>
        <Pressable style={styles.actionsBackdrop} onPress={() => setActionsModalVisible(false)}>
          <View style={styles.actionsSheet}>
            <Text style={styles.actionsTitle}>Outils d’analyse</Text>
            <ActionRow
              icon="expand-outline"
              label="Mode présentation"
              description="Afficher les indicateurs en réunion"
              onPress={() => {
                setActionsModalVisible(false);
                void togglePresentation();
              }}
            />
            <ActionRow
              icon="git-network-outline"
              label="Corrélations"
              description="Comparer les modules et les performances"
              onPress={() => {
                setActionsModalVisible(false);
                router.push("/bi/correlations" as any);
              }}
            />
            <ActionRow
              icon="funnel-outline"
              label="Requêteur métier"
              description="Créer une extraction sans code"
              onPress={() => {
                setActionsModalVisible(false);
                router.push("/bi/query-builder" as any);
              }}
            />
            <ActionRow
              icon="notifications-outline"
              label="Seuils d’alerte"
              description="Configurer vos critères de notification"
              onPress={() => {
                setActionsModalVisible(false);
                router.push("/bi/alert-rules" as any);
              }}
            />
            {canOpenCooperativeView && (
              <ActionRow
                icon="people-outline"
                label="Vue coopérative"
                description="Piloter les exploitations adhérentes"
                onPress={() => {
                  setActionsModalVisible(false);
                  router.push("/bi/benchmark" as any);
                }}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// --- Composants auxiliaires ---
function ExportOption({
  icon,
  title,
  subtitle,
  format,
  loading,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  format: BiExportFormat;
  loading: BiExportFormat | null;
  onPress: (format: BiExportFormat) => void;
}) {
  const isLoading = loading === format;
  return (
    <Pressable
      disabled={loading !== null}
      onPress={() => onPress(format)}
      style={[styles.exportOption, loading !== null && styles.exportOptionDisabled]}
    >
      <View style={styles.exportIcon}>
        <Ionicons name={icon} size={23} color={COLORS.primary} />
      </View>
      <View style={styles.exportOptionCopy}>
        <Text style={styles.exportOptionTitle}>{title}</Text>
        <Text style={styles.exportOptionSubtitle}>{subtitle}</Text>
      </View>
      {isLoading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />}
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={COLORS.muted} />
    </Pressable>
  );
}

function KpiGmqWidget({ dashboard }: { dashboard: DashboardOverview | null }) {
  const point = dashboard?.gmqTrend?.[dashboard.gmqTrend.length - 1];
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="GMQ dernier mois"
        value={point?.gmqGramsPerDay != null ? `${point.gmqGramsPerDay} g/j` : "—"}
        accentColor={COLORS.primary}
        icon="trending-up-outline"
        trend={point?.gmqGramsPerDay && point.gmqGramsPerDay > 200 ? "up" : "neutral"}
      />
      <KpiCard
        label="Poids moyen"
        value={point?.avgWeight != null ? `${point.avgWeight.toFixed(1)} kg` : "—"}
        accentColor={COLORS.textSecondary}
        icon="barbell-outline"
        trend={point?.avgWeight && point.avgWeight > 40 ? "up" : "neutral"}
      />
    </View>
  );
}

function KpiFcrWidget() {
  return (
    <View style={styles.kpiRow}>
      <KpiCard label="FCR" value="1.8" accentColor={COLORS.info} icon="analytics-outline" trend="down" />
      <KpiCard label="Conso aliment" value="2.4 kg/j" accentColor={COLORS.warning} icon="fish-outline" trend="neutral" />
    </View>
  );
}

function KpiMortalityWidget({ dashboard }: { dashboard: DashboardOverview | null }) {
  const rate = dashboard?.mortalityRate ?? 0;
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="Mortalité"
        value={`${rate}%`}
        accentColor={rate > 5 ? COLORS.danger : COLORS.textSecondary}
        icon="alert-circle-outline"
        trend={rate > 5 ? "up" : "down"}
      />
      <KpiCard
        label="Fertilité"
        value={`${dashboard?.fertilityRate ?? 0}%`}
        accentColor={COLORS.primary}
        icon="heart-outline"
        trend="up"
      />
    </View>
  );
}

function RacesTableWidget({ dashboard }: { dashboard: DashboardOverview | null }) {
  return (
    <View style={styles.tableContainer}>
      {dashboard && dashboard.herd.breedDistribution.length > 0 ? (
        dashboard.herd.breedDistribution.map((breed: any, idx: number) => (
          <View key={breed.breed} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataDot, { backgroundColor: [COLORS.primary, COLORS.info, COLORS.purple, COLORS.warning][idx % 4] }]} />
              <Text style={styles.dataLabel}>{breed.breed}</Text>
            </View>
            <Text style={styles.dataValue}>
              {breed.count} <Text style={styles.dataUnit}>têtes</Text>
            </Text>
          </View>
        ))
      ) : (
        <EmptyState message="Aucune race enregistrée." />
      )}
    </View>
  );
}

function KpiCard({
  label,
  value,
  color,
  accentColor,
  icon,
  trend,
}: {
  label: string;
  value: string;
  color?: string;
  accentColor?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const mainColor = accentColor || color || COLORS.textSecondary;
  const showTrend = trend && trend !== "neutral";

  return (
    <View style={[styles.kpiCard, { borderLeftColor: mainColor }]}>
      <View style={styles.kpiHeader}>
        {icon && (
          <View style={[styles.kpiIcon, { backgroundColor: mainColor + "14" }]}>
            <Ionicons name={icon as any} size={18} color={mainColor} />
          </View>
        )}
        {showTrend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend === "up" ? COLORS.primaryLight : COLORS.dangerLight },
            ]}
          >
            <Ionicons
              name={trend === "up" ? "arrow-up" : "arrow-down"}
              size={12}
              color={trend === "up" ? COLORS.primary : COLORS.danger}
            />
          </View>
        )}
      </View>
      <Text style={[styles.kpiValue, { color: mainColor }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={28} color={COLORS.border} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <View style={styles.filterGroupHeader}>
        <View style={styles.filterGroupDot} />
        <Text style={styles.filterGroupTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FilterPicker({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: [string, string][];
}) {
  return (
    <View style={styles.pickerField}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={value} onValueChange={onValueChange} style={styles.picker}>
          {items.map(([itemValue, itemLabel]) => (
            <Picker.Item key={itemValue || "all"} label={itemLabel} value={itemValue} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  profileLabel: { fontSize: 13, color: COLORS.primary, marginTop: 2, marginBottom: 4, fontWeight: "600" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "60",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionsScroll: {
    paddingVertical: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  headerButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    flexShrink: 0,
    marginLeft: "auto",
  },
  editButtonActive: { backgroundColor: COLORS.muted, shadowOpacity: 0.1 },
  editButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  editBannerText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, fontWeight: "500" },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: COLORS.primary },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text, letterSpacing: -0.2 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trendBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontSize: 24, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  dataRow: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dataRowAlt: { backgroundColor: "#FAFCFB" },
  dataRowLeft: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12, gap: 10 },
  dataDot: { width: 8, height: 8, borderRadius: 4 },
  dataLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, flex: 1 },
  dataValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  dataUnit: { fontSize: 11, fontWeight: "500", color: COLORS.muted },
  tableContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mutedText: { color: COLORS.muted, marginTop: 8, textAlign: "center", fontSize: 13 },
  errorText: { color: COLORS.danger, textAlign: "center", marginBottom: 12, paddingHorizontal: 24, fontSize: 15, fontWeight: "600" },
  retryText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  profileList: { padding: 16 },
  profileItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  profileButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  profileName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  profileNameActive: { color: COLORS.primary },
  profileBadge: { fontSize: 12, color: COLORS.muted, marginTop: 2, fontWeight: "500" },
  profileActions: { marginLeft: 12 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12, backgroundColor: COLORS.card },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  filterHint: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  filtersContent: { padding: 16, gap: 16 },
  filterGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  filterGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterGroupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  filterGroupTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  filterRow: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  pickerField: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: "hidden", backgroundColor: COLORS.card },
  pickerWrapper: { borderRadius: 12, overflow: "hidden" },
  pickerLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    paddingTop: 10,
    paddingHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  picker: { height: 48, color: COLORS.text },
  filterFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
  },
  resetButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: "700" },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // --- Styles du mode présentation (corrigés) ---
  presentationContainer: { flex: 1, backgroundColor: "#101814", padding: 16 },
  presentationTop: {
    flexDirection: "row",
    flexWrap: "wrap",              // ✅ permet le retour à la ligne
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3B30",
  },
  presentationTitleBlock: { flexShrink: 1 }, // le bloc de titre se rétrécit
  presentationTitle: {
    color: "#fff",
    fontSize: 20,                  // réduit pour gagner de la place
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  presentationSubtitle: {
    color: "#A8C6AE",
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
  },
  presentationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,                // les boutons ne se rétrécissent pas
  },
  presentationIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#263A2B",
  },
  presentationExit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  presentationExitText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  presentationBody: { flex: 1, justifyContent: "center", paddingVertical: 16 },
  presentationWidget: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    minHeight: 250,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  presentationEmpty: { color: "#fff", textAlign: "center", fontSize: 18 },
  presentationDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  presentationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#526158" },
  presentationDotActive: { width: 20, backgroundColor: "#62B76B" },
  // --- Fin mode présentation ---
  exportContent: { padding: 16, gap: 10 },
  exportSectionTitle: { marginTop: 4, marginBottom: 2, color: COLORS.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  scopeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  scopeCard: {
    flex: 1,
    minHeight: 115,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 5,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  scopeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  scopeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
  scopeHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  exportOptionDisabled: { opacity: 0.55 },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  exportOptionCopy: { flex: 1 },
  exportOptionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  exportOptionSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  actionsBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" },
  actionsSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  actionsTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 10, letterSpacing: -0.3 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  actionLabel: { fontSize: 15, color: COLORS.text, fontWeight: "700" },
  actionDescription: { color: COLORS.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
});