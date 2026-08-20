import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getLatestAllSensorData,
  type LatestSensorData,
} from "../../../services/sensorDataService";
import { getSensorTypeInfo, getShieldStatusInfo } from "../../../constants/iot";
import { BackButton } from "../../../components/BackButton";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../contexts/PermissionsContext";
import * as iotAlertsService from "../../../services/iotAlertsService";

const POLL_INTERVAL = 5000;

const ACTIVITY_LABELS: Record<string, string> = {
  REST: "Repos",
  MOVEMENT: "Déplacement",
  GRAZING: "Pâturage",
};

const ACTIVITY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  REST: "sleep",
  MOVEMENT: "walk",
  GRAZING: "grass",
};

const SENSOR_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GPS: "location",
  TEMPERATURE: "thermometer",
  ACTIVITY: "fitness",
};

const COORD_PRECISION = 4;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
}

function buildPlaceLabelFromNominatim(address: Record<string, string> | undefined): string | null {
  if (!address) return null;
  const parts = [
    address.hamlet || address.village || address.farm,
    address.suburb || address.neighbourhood,
    address.town || address.city || address.municipality,
  ].filter(Boolean) as string[];

  const unique = Array.from(new Set(parts));
  return unique.slice(0, 2).join(", ") || null;
}

function getBatteryLevel(battery: string): { color: string; icon: keyof typeof Ionicons.glyphMap } {
  const num = parseFloat(battery);
  if (num > 50) return { color: "#0F7A3C", icon: "battery-full" };
  if (num > 20) return { color: "#B7791F", icon: "battery-half" };
  return { color: "#B42318", icon: "battery-dead" };
}

function getTempLevel(temp: number | null): { color: string; label: string } {
  if (temp === null) return { color: "#8A8A85", label: "—" };
  if (temp > 40.5) return { color: "#B42318", label: "Élevée" };
  if (temp < 37.5) return { color: "#175CD3", label: "Basse" };
  return { color: "#0F7A3C", label: "Normale" };
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgoLabel(dateStr: string | null): string {
  if (!dateStr) return "Jamais";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Il y a ${diffH} h`;
}

function shieldHasSensor(sensors: Array<{ sensorType: string }>, type: string): boolean {
  return sensors.some(s => s.sensorType === type);
}

export default function IoTLiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (!hasPermission('IOT', 'SENSOR:READ')) {
      router.replace("/iot");
    }
  }, [hasPermission, router]);

  const [readings, setReadings] = useState<LatestSensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedReading, setSelectedReading] = useState<LatestSensorData | null>(null);

  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const geocodeCacheRef = useRef<Map<string, string>>(new Map());
  const pendingGeocodesRef = useRef<Set<string>>(new Set());
  const failedGeocodesRef = useRef<Set<string>>(new Set());
  const geocodeQueueRef = useRef<Promise<void>>(Promise.resolve());

  function queueGeocode(lat: number, lng: number, key: string) {
    geocodeQueueRef.current = geocodeQueueRef.current
      .then(() => resolvePlaceName(lat, lng, key))
      .then(() => new Promise((resolve) => setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS)));
  }

  async function resolvePlaceName(lat: number, lng: number, key: string) {
    pendingGeocodesRef.current.add(key);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SmartSheepManager/1.0 (contact@smart-sheep-manager.app)",
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

      const data = await response.json();
      const label = buildPlaceLabelFromNominatim(data?.address) ?? data?.name ?? null;

      if (label) {
        geocodeCacheRef.current.set(key, label);
        setPlaceNames((prev) => ({ ...prev, [key]: label }));
        failedGeocodesRef.current.delete(key);
      } else {
        failedGeocodesRef.current.add(key);
      }
    } catch {
      failedGeocodesRef.current.add(key);
    } finally {
      pendingGeocodesRef.current.delete(key);
    }
  }

  function maybeResolvePlaceName(lat: number, lng: number) {
    const key = coordKey(lat, lng);
    if (
      geocodeCacheRef.current.has(key) ||
      pendingGeocodesRef.current.has(key) ||
      failedGeocodesRef.current.has(key)
    ) {
      return;
    }
    queueGeocode(lat, lng, key);
  }

  async function fetchReadings() {
    setError(null);
    const result = await getLatestAllSensorData();
    if (result.success) {
      setReadings(result.data);
      for (const item of result.data) {
        if (item.latitude && item.longitude) {
          const lat = parseFloat(item.latitude);
          const lng = parseFloat(item.longitude);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            maybeResolvePlaceName(lat, lng);
          }
        }
      }
    } else {
      setError(result.message);
    }
  }

  async function loadAlertCount() {
    const result = await iotAlertsService.getAlertSummary();
    if (result.success) {
      const total = Object.values(result.summary).reduce((a, b) => a + b, 0);
      setUnresolvedCount(total);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchReadings(), loadAlertCount()]).finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    if (!autoRefresh) return;

    pollRef.current = setInterval(() => {
      Promise.all([fetchReadings(), loadAlertCount()]);
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [autoRefresh]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchReadings(), loadAlertCount()]);
    setRefreshing(false);
  }

  useEffect(() => {
    if (!selectedReading) return;
    const updated = readings.find((r) => r.shield.id === selectedReading.shield.id);
    if (updated) setSelectedReading(updated);
  }, [readings]);

  const alertCount = readings.reduce((sum, r) => sum + (r.unresolvedAlertCount || 0), 0);

  const tempAlertCount = readings.filter((r) => {
    if (!shieldHasSensor(r.shield.sensors, "TEMPERATURE")) return false;
    const t = r.temperature ? parseFloat(r.temperature) : null;
    return t !== null && t > 40.5;
  }).length;

  function getPlaceLabelFor(item: LatestSensorData): { label: string; resolved: boolean; resolving: boolean } {
    const lat = item.latitude ? parseFloat(item.latitude) : null;
    const lng = item.longitude ? parseFloat(item.longitude) : null;
    const hasCoords = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
    if (!hasCoords) return { label: "Position non disponible", resolved: false, resolving: false };

    const key = coordKey(lat!, lng!);
    const resolvedPlace = placeNames[key];
    const isResolving = pendingGeocodesRef.current.has(key);

    if (resolvedPlace) return { label: resolvedPlace, resolved: true, resolving: false };
    if (isResolving) return { label: "Résolution du lieu...", resolved: false, resolving: true };
    return { label: `${lat!.toFixed(4)}, ${lng!.toFixed(4)}`, resolved: false, resolving: false };
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerMetaRow}>
              <View style={styles.liveDot} />
              <Text style={styles.subtitle}>
                {readings.length} capteur{readings.length !== 1 ? "s" : ""} actif
                {readings.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/iot/analytics" as any)}
            style={styles.analyticsButton}
            accessibilityLabel="Voir l'historique et les analytics"
          >
            <Ionicons name="stats-chart-outline" size={22} color="#1A1A18" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/iot/zones" as any)}
            style={styles.zonesButton}
            accessibilityLabel="Gérer les zones de pâturage"
          >
            <Ionicons name="map-outline" size={22} color="#1A1A18" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/iot/alerts" as any)}
            style={styles.alertButton}
            accessibilityLabel="Voir les alertes"
          >
            <Ionicons name="notifications-outline" size={24} color="#1A1A18" />
            {unresolvedCount > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>
                  {unresolvedCount > 99 ? "99+" : unresolvedCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.refreshToggle, autoRefresh && styles.refreshToggleActive]}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <View style={[styles.refreshDot, { backgroundColor: autoRefresh ? "#0F7A3C" : "#B0AEA5" }]} />
            <Text style={[styles.refreshToggleText, autoRefresh && styles.refreshToggleTextActive]}>
              {autoRefresh ? "Auto" : "Manuel"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onRefresh}
            style={styles.refreshIconButton}
            accessibilityLabel="Actualiser maintenant"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#14532d" />
            ) : (
              <Ionicons name="refresh" size={18} color="#14532d" />
            )}
          </Pressable>
        </View>

        {!loading && readings.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{readings.length}</Text>
              <Text style={styles.summaryLabel}>Connectés</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, alertCount > 0 && { color: "#B42318" }]}>
                {alertCount}
              </Text>
              <Text style={styles.summaryLabel}>Alertes</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{POLL_INTERVAL / 1000}s</Text>
              <Text style={styles.summaryLabel}>Rafraîchissement</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#14532d" />
            <Text style={styles.loadingText}>Chargement des capteurs...</Text>
          </View>
        ) : (
          <FlatList
            data={readings}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14532d" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="pulse-outline" size={28} color="#B0AEA5" />
                </View>
                <Text style={styles.emptyTitle}>Aucune donnée pour l'instant</Text>
                <Text style={styles.emptyBody}>
                  Les mesures apparaîtront ici dès qu'un capteur enverra des données.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const statusInfo = getShieldStatusInfo(item.shield.status);
              const battery = getBatteryLevel(item.shield.battery);
              const activityLabel = item.activity ? ACTIVITY_LABELS[item.activity] ?? item.activity : "—";
              const activityIcon = item.activity ? ACTIVITY_ICONS[item.activity] : undefined;
              const tempNum = item.temperature ? parseFloat(item.temperature) : null;
              const temp = getTempLevel(tempNum);

              const hasTemp = shieldHasSensor(item.shield.sensors, "TEMPERATURE");
              const hasActivity = shieldHasSensor(item.shield.sensors, "ACTIVITY");
              const hasGps = shieldHasSensor(item.shield.sensors, "GPS");

              const showTemperature = hasTemp && tempNum !== null;
              const showActivity = hasActivity && !!item.activity;
              const showBattery = true;

              const isAlert = showTemperature && tempNum !== null && tempNum > 40.5;
              const isLowBattery = showBattery && parseFloat(item.shield.battery) < 15;
              const unresolvedAlerts = item.unresolvedAlertCount || 0;

              const visibleMetricsCount =
                (showTemperature ? 1 : 0) + (showActivity ? 1 : 0) + (showBattery ? 1 : 0);

              const { label: gpsLabel, resolved: gpsResolved, resolving: gpsResolving } = getPlaceLabelFor(item);

              const sensorsLabel = item.shield.sensors.map(s => getSensorTypeInfo(s.sensorType).label).join(" • ");

              return (
                <Pressable
                  style={[
                    styles.sensorCard,
                    isAlert && styles.sensorCardAlert,
                    isLowBattery && styles.sensorCardLowBattery,
                  ]}
                  onPress={() => setSelectedReading(item)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardIdentity}>
                      <View style={styles.cardIconWrap}>
                        <Ionicons name="wifi" size={18} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.ssmNumber}>{item.shield.ssmIotNumber}</Text>
                        <Text style={styles.sensorTypeLabel} numberOfLines={1}>{sensorsLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.cardTopRight}>
                      {unresolvedAlerts > 0 && (
                        <View style={styles.cardAlertBadge}>
                          <Ionicons name="warning-outline" size={12} color="#B42318" />
                          <Text style={styles.cardAlertBadgeText}>{unresolvedAlerts}</Text>
                        </View>
                      )}
                      <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <Text style={styles.statusPillText}>{statusInfo.label}</Text>
                      </View>
                    </View>
                  </View>

                  {isAlert && (
                    <View style={styles.alertBanner}>
                      <Ionicons name="warning-outline" size={13} color="#B42318" />
                      <Text style={styles.alertBannerText}>Température au-dessus du seuil</Text>
                    </View>
                  )}

                  {isLowBattery && (
                    <View style={styles.lowBatteryBanner}>
                      <Ionicons name="battery-dead-outline" size={13} color="#B7791F" />
                      <Text style={styles.lowBatteryBannerText}>Batterie faible</Text>
                    </View>
                  )}

                  {visibleMetricsCount > 0 && (
                    <View style={styles.metricsGrid}>
                      {showTemperature && (
                        <>
                          <View style={styles.metricCell}>
                            <Text style={styles.metricLabel}>Température</Text>
                            <Text style={[styles.metricValue, { color: temp.color }]}>
                              {tempNum !== null ? `${tempNum.toFixed(1)}°` : "—"}
                            </Text>
                            <Text style={[styles.metricSubLabel, { color: temp.color }]}>{temp.label}</Text>
                          </View>
                          {(showActivity || showBattery) && <View style={styles.metricDivider} />}
                        </>
                      )}

                      {showActivity && (
                        <>
                          <View style={styles.metricCell}>
                            <Text style={styles.metricLabel}>Activité</Text>
                            <View style={styles.metricIconRow}>
                              {activityIcon && (
                                <MaterialCommunityIcons name={activityIcon} size={16} color="#3D3D3A" />
                              )}
                              <Text style={styles.metricValueSmall}>{activityLabel}</Text>
                            </View>
                          </View>
                          {showBattery && <View style={styles.metricDivider} />}
                        </>
                      )}

                      {showBattery && (
                        <View style={styles.metricCell}>
                          <Text style={styles.metricLabel}>Batterie</Text>
                          <View style={styles.metricIconRow}>
                            <Ionicons name={battery.icon} size={16} color={battery.color} />
                            <Text style={[styles.metricValueSmall, { color: battery.color }]}>
                              {parseFloat(item.shield.battery).toFixed(0)}%
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {hasGps && (
                    <View style={styles.gpsRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={gpsResolved ? "#3D3D3A" : "#8A8A85"}
                      />
                      <Text style={[styles.gpsText, gpsResolved && styles.gpsTextResolved]} numberOfLines={1}>
                        {gpsLabel}
                      </Text>
                      {gpsResolving && (
                        <ActivityIndicator size="small" color="#B0AEA5" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerTime}>
                      {formatTime(item.measuredAt)} · {timeAgoLabel(item.measuredAt)}
                    </Text>
                    <View style={styles.detailLink}>
                      <Text style={styles.detailLinkText}>Détail</Text>
                      <Ionicons name="chevron-forward" size={14} color="#14532d" />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Modal
        visible={!!selectedReading}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReading(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedReading && (() => {
              const item = selectedReading;
              const statusInfo = getShieldStatusInfo(item.shield.status);
              const battery = getBatteryLevel(item.shield.battery);
              const tempNum = item.temperature ? parseFloat(item.temperature) : null;
              const temp = getTempLevel(tempNum);
              const activityLabel = item.activity ? ACTIVITY_LABELS[item.activity] ?? item.activity : "—";
              const activityIcon = item.activity ? ACTIVITY_ICONS[item.activity] : undefined;

              const hasTemp = shieldHasSensor(item.shield.sensors, "TEMPERATURE");
              const hasActivity = shieldHasSensor(item.shield.sensors, "ACTIVITY");
              const hasGps = shieldHasSensor(item.shield.sensors, "GPS");

              const showTemperature = hasTemp && tempNum !== null;
              const showActivity = hasActivity && !!item.activity;
              const { label: gpsLabel, resolved: gpsResolved } = getPlaceLabelFor(item);
              const lat = item.latitude ? parseFloat(item.latitude) : null;
              const lng = item.longitude ? parseFloat(item.longitude) : null;
              const sensorsLabel = item.shield.sensors.map(s => getSensorTypeInfo(s.sensorType).label).join(" • ");

              return (
                <>
                  <View style={styles.modalHandle} />

                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderIdentity}>
                      <View style={styles.modalIconWrap}>
                        <Ionicons name="wifi" size={22} color="#14532d" />
                      </View>
                      <View>
                        <Text style={styles.modalSsmNumber}>{item.shield.ssmIotNumber}</Text>
                        <Text style={styles.modalSensorType} numberOfLines={1}>{sensorsLabel}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setSelectedReading(null)}
                      style={styles.modalCloseButton}
                      accessibilityLabel="Fermer"
                    >
                      <Ionicons name="close" size={22} color="#5A5A56" />
                    </Pressable>
                  </View>

                  <View style={styles.modalStatusRow}>
                    <View style={styles.statusPill}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={styles.statusPillText}>{statusInfo.label}</Text>
                    </View>
                    <Text style={styles.modalTimeAgo}>{timeAgoLabel(item.measuredAt)}</Text>
                  </View>

                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalSectionTitle}>Données du relevé</Text>

                    {showTemperature && (
                      <View style={styles.modalDataRow}>
                        <View style={styles.modalDataLabelRow}>
                          <Ionicons name="thermometer-outline" size={16} color={TEXT_MUTED} />
                          <Text style={styles.modalDataLabel}>Température</Text>
                        </View>
                        <View style={styles.modalDataValueRow}>
                          <Text style={[styles.modalDataValue, { color: temp.color }]}>
                            {tempNum !== null ? `${tempNum.toFixed(1)}°C` : "—"}
                          </Text>
                          <Text style={[styles.modalDataSubValue, { color: temp.color }]}>{temp.label}</Text>
                        </View>
                      </View>
                    )}

                    {showActivity && (
                      <View style={styles.modalDataRow}>
                        <View style={styles.modalDataLabelRow}>
                          {activityIcon && (
                            <MaterialCommunityIcons name={activityIcon} size={16} color={TEXT_MUTED} />
                          )}
                          <Text style={styles.modalDataLabel}>Activité</Text>
                        </View>
                        <Text style={styles.modalDataValue}>{activityLabel}</Text>
                      </View>
                    )}

                    <View style={styles.modalDataRow}>
                      <View style={styles.modalDataLabelRow}>
                        <Ionicons name={battery.icon} size={16} color={TEXT_MUTED} />
                        <Text style={styles.modalDataLabel}>Batterie</Text>
                      </View>
                      <Text style={[styles.modalDataValue, { color: battery.color }]}>
                        {parseFloat(item.shield.battery).toFixed(0)}%
                      </Text>
                    </View>

                    {hasGps && (
                      <>
                        <Text style={styles.modalSectionTitle}>Position</Text>

                        <View style={styles.modalDataRow}>
                          <View style={styles.modalDataLabelRow}>
                            <Ionicons name="location-outline" size={16} color={TEXT_MUTED} />
                            <Text style={styles.modalDataLabel}>Lieu</Text>
                          </View>
                          <Text
                            style={[styles.modalDataValue, gpsResolved && { color: "#14532d" }]}
                            numberOfLines={2}
                          >
                            {gpsLabel}
                          </Text>
                        </View>

                        {lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng) && (
                          <View style={styles.modalDataRow}>
                            <View style={styles.modalDataLabelRow}>
                              <Ionicons name="navigate-outline" size={16} color={TEXT_MUTED} />
                              <Text style={styles.modalDataLabel}>Coordonnées</Text>
                            </View>
                            <Text style={styles.modalDataValueMono}>
                              {lat.toFixed(6)}, {lng.toFixed(6)}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    <Text style={styles.modalSectionTitle}>Horodatage</Text>

                    <View style={styles.modalDataRow}>
                      <View style={styles.modalDataLabelRow}>
                        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} />
                        <Text style={styles.modalDataLabel}>Mesuré le</Text>
                      </View>
                      <Text style={styles.modalDataValue}>{formatFullDate(item.measuredAt)}</Text>
                    </View>

                    <View style={{ height: 24 }} />
                  </ScrollView>

                  <Pressable
                    style={styles.modalShieldLink}
                    onPress={() => {
                      setSelectedReading(null);
                      router.push({
                        pathname: "/iot/[id]/detail",
                        params: { id: String(item.shield.id) },
                      } as any);
                    }}
                  >
                    <Text style={styles.modalShieldLinkText}>Voir la fiche du bouclier</Text>
                    <Ionicons name="chevron-forward" size={14} color="#14532d" />
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const GREEN = "#14532d";
const BORDER = "#E7E4DC";
const TEXT_MUTED = "#8A8A85";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAF8F4" },
  container: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A18", letterSpacing: -0.2 },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0F7A3C",
  },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED, fontWeight: "500" },

  analyticsButton: { padding: 6, marginRight: 4 },
  zonesButton: { padding: 6, marginRight: 4 },

  alertButton: {
    position: "relative",
    padding: 6,
    marginRight: 8,
  },
  alertBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  refreshToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  refreshToggleActive: { borderColor: "#BEE3C8", backgroundColor: "#F0FDF4" },
  refreshDot: { width: 6, height: 6, borderRadius: 3 },
  refreshToggleText: { fontSize: 12, fontWeight: "600", color: TEXT_MUTED },
  refreshToggleTextActive: { color: "#0F7A3C" },

  refreshIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    marginBottom: 14,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 19, fontWeight: "700", color: "#1A1A18" },
  summaryLabel: { fontSize: 11, color: TEXT_MUTED, marginTop: 2, fontWeight: "500" },
  summaryDivider: { width: 1, backgroundColor: BORDER },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { color: "#B42318", fontSize: 12.5, flex: 1 },

  loadingWrap: { alignItems: "center", justifyContent: "center", marginTop: 4, gap: 10 },
  loadingText: { fontSize: 13, color: TEXT_MUTED },

  listContent: { paddingBottom: 24 },

  emptyState: {
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A18", marginBottom: 4 },
  emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: "center", lineHeight: 18 },

  sensorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },
  sensorCardAlert: { borderColor: "#FECDCA" },
  sensorCardLowBattery: { borderColor: "#FEF3E2" },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIdentity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardAlertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3F2",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardAlertBadgeText: { fontSize: 11, fontWeight: "700", color: "#B42318" },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  ssmNumber: { fontSize: 14.5, fontWeight: "700", color: "#1A1A18" },
  sensorTypeLabel: { fontSize: 11.5, color: TEXT_MUTED, marginTop: 1 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F7F6F2",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "600", color: "#5A5A56" },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3F2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  alertBannerText: { fontSize: 11.5, color: "#B42318", fontWeight: "600" },

  lowBatteryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFAEB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  lowBatteryBannerText: { fontSize: 11.5, color: "#B7791F", fontWeight: "600" },

  metricsGrid: {
    flexDirection: "row",
    backgroundColor: "#FAF8F4",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  metricCell: { flex: 1, alignItems: "center", gap: 3 },
  metricDivider: { width: 1, backgroundColor: BORDER },
  metricLabel: { fontSize: 10.5, color: TEXT_MUTED, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  metricValue: { fontSize: 19, fontWeight: "700" },
  metricValueSmall: { fontSize: 13, fontWeight: "700", color: "#1A1A18" },
  metricSubLabel: { fontSize: 10.5, fontWeight: "600" },
  metricIconRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },

  gpsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  gpsText: { fontSize: 11.5, color: TEXT_MUTED, flexShrink: 1 },
  gpsTextResolved: { color: "#3D3D3A", fontWeight: "600" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerTime: { fontSize: 11, color: TEXT_MUTED },
  detailLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  detailLinkText: { fontSize: 12, fontWeight: "700", color: GREEN },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 24, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSsmNumber: { fontSize: 17, fontWeight: "800", color: "#1A1A18" },
  modalSensorType: { fontSize: 12.5, color: TEXT_MUTED, marginTop: 1 },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F6F2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTimeAgo: { fontSize: 12, color: TEXT_MUTED },

  modalScroll: { maxHeight: 420 },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 8,
  },
  modalDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F0EB",
  },
  modalDataLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalDataLabel: { fontSize: 13.5, color: "#3D3D3A", fontWeight: "500" },
  modalDataValueRow: { alignItems: "flex-end" },
  modalDataValue: { fontSize: 14.5, fontWeight: "700", color: "#1A1A18", maxWidth: 180, textAlign: "right" },
  modalDataSubValue: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  modalDataValueMono: { fontSize: 13, fontWeight: "600", color: "#1A1A18" },

  modalShieldLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  modalShieldLinkText: { fontSize: 13, fontWeight: "600", color: GREEN },
});
