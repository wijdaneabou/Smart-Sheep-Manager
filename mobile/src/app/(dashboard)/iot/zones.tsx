import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  listZones,
  createZone,
  deleteZone,
  type IotZone,
  type ZonePoint,
} from "../../../services/iotZonesService";
import { searchLocation as searchLocationApi } from "../../../services/geocodeService";
import { getLatestAllSensorData } from "../../../services/sensorDataService";
import { BackButton } from "../../../components/BackButton";
import { usePermissions } from "../../../contexts/PermissionsContext";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";
const TEXT_MUTED = "#888888";
const AMBER = "#B7791F";

const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898, zoom: 15 };

type LocationSearchResult = { display_name: string; lat: string; lon: string };

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-control-attribution { font-size: 9px; }
    .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; }
    .leaflet-control-zoom a { color: #1A1A18 !important; }
    .zone-tooltip { background: rgba(26,26,24,0.85); color: #fff; border: none; border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: 600; }
    .leaflet-tooltip-left:before, .leaflet-tooltip-right:before { border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${DEFAULT_CENTER.lat}, ${DEFAULT_CENTER.lng}], ${DEFAULT_CENTER.zoom});
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const zonesLayer = L.layerGroup().addTo(map);
    const draftLayer = L.layerGroup().addTo(map);
    const animalsLayer = L.layerGroup().addTo(map);

    function post(payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }

    const drawingState = { active: false, points: [] };

    function redrawZones(zones) {
      zonesLayer.clearLayers();
      zones.forEach(function (zone) {
        const latlngs = zone.polygon.map(function (p) { return [p.lat, p.lng]; });
        L.polygon(latlngs, {
          color: zone.color || '${GREEN}',
          fillColor: zone.color || '${GREEN}',
          fillOpacity: 0.18,
          weight: 2,
        }).bindTooltip(zone.name, { permanent: false, direction: 'center', className: 'zone-tooltip' })
          .addTo(zonesLayer);
      });
    }

    function redrawDraft(points) {
      draftLayer.clearLayers();
      drawingState.points = points;
      if (points.length > 0) {
        const latlngs = points.map(function (p) { return [p.lat, p.lng]; });
        if (points.length >= 2) {
          L.polygon(latlngs, {
            color: '${AMBER}',
            fillColor: '${AMBER}',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '6, 6',
          }).addTo(draftLayer);
        }
        points.forEach(function (p, i) {
          L.circleMarker([p.lat, p.lng], {
            radius: 7,
            color: '#fff',
            weight: 2,
            fillColor: '${AMBER}',
            fillOpacity: 1,
          }).addTo(draftLayer);
        });
      }
    }

    function updateAnimals(animals) {
      animalsLayer.clearLayers();
      animals.forEach(function (animal) {
        if (animal.latitude && animal.longitude) {
          const marker = L.circleMarker([animal.latitude, animal.longitude], {
            radius: 8,
            color: '#fff',
            weight: 2,
            fillColor: animal.zoneColor || '${GREEN}',
            fillOpacity: 1,
          }).bindTooltip(animal.name, { permanent: false, direction: 'top', offset: [0, -8], className: 'zone-tooltip' });
          marker.addTo(animalsLayer);
        }
      });
    }

    function setDrawing(active) {
      drawingState.active = active;
      if (!active) drawingState.points = [];
    }

    function handleMessage(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'zones') redrawZones(msg.zones);
        if (msg.type === 'draft') { redrawDraft(msg.points); setDrawing(true); }
        if (msg.type === 'animals') updateAnimals(msg.animals);
        if (msg.type === 'center') map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom());
        if (msg.type === 'fitBounds' && msg.bounds) {
          map.fitBounds(msg.bounds);
        }
        if (msg.type === 'setDrawing') setDrawing(msg.active);
      } catch (e) {}
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    map.on('click', function (e) {
      if (!drawingState.active) {
        post({ type: 'click', lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }
      if (drawingState.points.length >= 3) {
        const first = drawingState.points[0];
        const dist = map.distance(e.latlng, L.latLng(first.lat, first.lng));
        if (dist < 20) {
          post({ type: 'close' });
          return;
        }
      }
      post({ type: 'click', lat: e.latlng.lat, lng: e.latlng.lng });
    });

    post({ type: 'ready' });
  </script>
</body>
</html>
`;

type ViewMode = "list" | "view" | "draw";

export default function IotZonesScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Silent redirect if no read permission
  useEffect(() => {
    if (!hasPermission('IOT', 'ZONES:READ')) {
      router.replace("/iot");
    }
  }, [hasPermission, router]);

  const [zones, setZones] = useState<IotZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<ZonePoint[]>([]);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [saving, setSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedZone, setSelectedZone] = useState<IotZone | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [animals, setAnimals] = useState<{ name: string; latitude: number; longitude: number; zoneColor?: string }[]>([]);

  const loadAnimals = useCallback(async () => {
    try {
      const result = await getLatestAllSensorData();
      if (result.success) {
        const animalsList = result.data
          .filter(item => item.latitude && item.longitude)
          .map(item => ({
            name: item.shield.animalId ? `Animal ${item.shield.animalId}` : item.shield.ssmIotNumber,
            latitude: parseFloat(item.latitude!),
            longitude: parseFloat(item.longitude!),
            zoneColor: zones[0]?.color || GREEN,
          }))
          .filter(a => !Number.isNaN(a.latitude) && !Number.isNaN(a.longitude));
        setAnimals(animalsList);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des animaux:", error);
    }
  }, [zones]);

  useEffect(() => {
    if (mapReady) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAnimals();
    }
  }, [mapReady, loadAnimals]);

  const canCreate = hasPermission('IOT', 'ZONES:CREATE');
  const canDelete = hasPermission('IOT', 'ZONES:DELETE');

  async function fetchZones() {
    const result = await listZones();
    if (result.success) {
      setZones(result.data);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchZones().finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    if (!mapReady) return;
    webviewRef.current?.postMessage(JSON.stringify({ type: "zones", zones }));
  }, [zones, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    webviewRef.current?.postMessage(
      JSON.stringify({ type: "draft", points: draftPoints })
    );
  }, [draftPoints, mapReady]);

  useEffect(() => {
    if (viewMode === "view" && selectedZone && mapReady) {
      const poly = selectedZone.polygon;
      if (poly.length > 0) {
        const lats = poly.map((p) => p.lat);
        const lngs = poly.map((p) => p.lng);
        const south = Math.min(...lats);
        const north = Math.max(...lats);
        const west = Math.min(...lngs);
        const east = Math.max(...lngs);
        webviewRef.current?.postMessage(
          JSON.stringify({
            type: "fitBounds",
            bounds: [
              [south, west],
              [north, east],
            ],
          })
        );
      }
    }
  }, [viewMode, selectedZone, mapReady]);

  function handleWebViewMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") {
        setMapReady(true);
      } else if (msg.type === "click" && drawing) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDraftPoints((prev) => [...prev, { lat: msg.lat, lng: msg.lng }]);
      } else if (msg.type === "close") {
        finishDrawing();
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!mapReady) return;
    webviewRef.current?.postMessage(
      JSON.stringify({ type: "animals", animals })
    );
  }, [animals, mapReady]);

  function startDrawing() {
    setDraftPoints([]);
    setDrawing(true);
    setViewMode("draw");
    setSelectedZone(null);
  }

  function undoLastPoint() {
    setDraftPoints((prev) => prev.slice(0, -1));
  }

  function cancelDrawing() {
    setDrawing(false);
    setDraftPoints([]);
    setViewMode("list");
  }

  function finishDrawing() {
    if (draftPoints.length < 3) {
      Alert.alert(
        "Zone incomplète",
        "Placez au moins 3 points pour former une zone."
      );
      return;
    }
    setZoneName("");
    setNameModalVisible(true);
  }

  async function handleSaveZone() {
    if (!zoneName.trim()) {
      Alert.alert("Nom requis", "Donnez un nom à cette zone.");
      return;
    }

    setSaving(true);
    const result = await createZone({
      name: zoneName.trim(),
      polygon: draftPoints,
    });
    setSaving(false);

    if (result.success) {
      setZones((prev) => [...prev, result.zone]);
      setNameModalVisible(false);
      setDrawing(false);
      setDraftPoints([]);
      setViewMode("list");
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleDeleteZone(zone: IotZone) {
    Alert.alert("Supprimer la zone", `Supprimer « ${zone.name} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const result = await deleteZone(zone.id);
          if (result.success) {
            setZones((prev) => prev.filter((z) => z.id !== zone.id));
            if (selectedZone?.id === zone.id) {
              setSelectedZone(null);
              setViewMode("list");
            }
          } else {
            Alert.alert("Erreur", result.message);
          }
        },
      },
    ]);
  }

  const searchLocation = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    const result = await searchLocationApi(query);
    setSearching(false);

    if (result.success) {
      setSearchResults(result.data);
      setShowSuggestions(result.data.length > 0);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
      console.error("Erreur lors de la recherche de lieu :", result.message);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchLocation(text);
    }, 500);
  };

  const selectSearchResult = (lat: string, lon: string) => {
    if (!mapReady) {
      Alert.alert("Carte non prête", "Veuillez patienter...");
      return;
    }
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: "center",
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        zoom: 17,
      })
    );
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const renderHeader = () => {
    const isList = viewMode === "list";
    return (
      <View style={styles.header}>
        {isList ? (
          <BackButton variant="dark" style={styles.backButton} />
        ) : (
          <Pressable
            onPress={() => {
              setViewMode("list");
              setSelectedZone(null);
              if (drawing) {
                setDrawing(false);
                setDraftPoints([]);
              }
            }}
            hitSlop={8}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={GREEN} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Zones IoT</Text>
          {isList && (
            <View style={styles.headerMetaRow}>
              <View style={styles.liveDot} />
              <Text style={styles.subtitle}>
                {zones.length} zone{zones.length !== 1 ? "s" : ""} définie
                {zones.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderZoneList = () => (
    <View style={styles.listContainer}>
      <FlatList
        data={zones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="map-outline" size={22} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyText}>
              Aucune zone définie. Créez-en une pour sécuriser votre pâturage.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.zoneRow}
            onPress={() => {
              setSelectedZone(item);
              setViewMode("view");
            }}
          >
            <View
              style={[
                styles.zoneColorSwatch,
                { backgroundColor: (item.color ?? GREEN) + "22" },
              ]}
            >
              <View
                style={[
                  styles.zoneColorDot,
                  { backgroundColor: item.color ?? GREEN },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneName}>{item.name}</Text>
              <Text style={styles.zonePointsCount}>
                {item.polygon.length} points
              </Text>
            </View>
            {canDelete && (
              <Pressable
                onPress={() => handleDeleteZone(item)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#B42318" />
              </Pressable>
            )}
          </Pressable>
        )}
      />
      {canCreate && (
        <View style={styles.newZoneWrap}>
          <Pressable style={styles.newZoneBtn} onPress={startDrawing}>
            <Ionicons name="add-circle" size={19} color="#fff" />
            <Text style={styles.newZoneBtnText}>Nouvelle zone</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderMapArea = () => {
    const mapHidden = viewMode === "list";
    return (
      <View style={[styles.mapWrap, mapHidden && styles.mapHidden]}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: MAP_HTML }}
          onMessage={handleWebViewMessage}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
        />
        {!mapReady && !mapHidden && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator color={GREEN} />
          </View>
        )}

        {viewMode === "draw" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.searchContainer}
          >
            <View style={styles.searchInputRow}>
              <Ionicons
                name="search"
                size={18}
                color={TEXT_MUTED}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un lieu..."
                placeholderTextColor="#B0B0B0"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={() => searchLocation(searchQuery)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSuggestions(false);
                  }}
                  hitSlop={6}
                  style={{ marginRight: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
                </Pressable>
              )}
            </View>
            {searching && <ActivityIndicator size="small" color={GREEN} style={{ marginTop: 4 }} />}
            {showSuggestions && searchResults.length > 0 && (
              <View style={styles.suggestionsList}>
                {searchResults.map((res: LocationSearchResult, idx: number) => (
                  <Pressable
                    key={idx}
                    style={styles.suggestionRow}
                    onPress={() => selectSearchResult(res.lat, res.lon)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={GREEN}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {res.display_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </KeyboardAvoidingView>
        )}

        {drawing && viewMode === "draw" && (
          <View style={styles.drawingBadge}>
            <View style={styles.drawingBadgeDot} />
            <Text style={styles.drawingBadgeText}>Mode dessin actif</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {renderHeader()}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} />
          <Text style={styles.loadingText}>Chargement des zones...</Text>
        </View>
      ) : (
        <>
          {renderMapArea()}

          {viewMode === "list" && renderZoneList()}

          {viewMode === "draw" && drawing && (
            <View style={styles.drawBar}>
              <View style={styles.drawBarHeader}>
                <View style={styles.drawBarIconWrap}>
                  <Ionicons name="create-outline" size={16} color={AMBER} />
                </View>
                <Text style={styles.drawHint}>
                  Touchez la carte pour placer un point
                </Text>
                <View style={styles.pointCountPill}>
                  <Text style={styles.pointCountText}>
                    {draftPoints.length}
                  </Text>
                </View>
              </View>

              <View style={styles.drawActions}>
                <Pressable
                  style={styles.drawBtnIcon}
                  onPress={undoLastPoint}
                  disabled={draftPoints.length === 0}
                >
                  <Ionicons
                    name="arrow-undo-outline"
                    size={18}
                    color={
                      draftPoints.length === 0 ? "#C7C4BA" : "#5A5A56"
                    }
                  />
                </Pressable>
                <Pressable
                  style={styles.drawBtnSecondary}
                  onPress={cancelDrawing}
                >
                  <Text style={styles.drawBtnSecondaryText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.drawBtnPrimary,
                    draftPoints.length < 3 &&
                      styles.drawBtnPrimaryDisabled,
                  ]}
                  onPress={finishDrawing}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.drawBtnPrimaryText}>
                    Terminer la zone
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {viewMode === "view" && selectedZone && (
            <View style={styles.viewInfoBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.viewInfoTitle}>{selectedZone.name}</Text>
                <Text style={styles.viewInfoPoints}>
                  {selectedZone.polygon.length} points
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setViewMode("list");
                  setSelectedZone(null);
                }}
                style={styles.viewBackBtn}
              >
                <Text style={styles.viewBackBtnText}>Retour à la liste</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <Modal visible={nameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="shapes-outline" size={22} color={GREEN} />
            </View>
            <Text style={styles.modalTitle}>Nommer la zone</Text>
            <Text style={styles.modalSubtitle}>
              {draftPoints.length} points placés sur la carte
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex : Pâturage nord"
              placeholderTextColor="#B0B0B0"
              value={zoneName}
              onChangeText={setZoneName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveZone}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  backButton: { marginRight: 8 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: GREEN,
    letterSpacing: -0.2,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED, fontWeight: "500" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, color: TEXT_MUTED },

  mapWrap: {
    ...StyleSheet.absoluteFill,
    top: 120,
    zIndex: 0,
  },
  mapHidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  map: { flex: 1 },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#1f2937",
  },
  suggestionsList: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F0",
  },
  suggestionText: {
    fontSize: 13,
    color: "#1f2937",
    flex: 1,
  },

  drawingBadge: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(20,83,45,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 5,
  },
  drawingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AMBER,
  },
  drawingBadgeText: { color: "#fff", fontSize: 11.5, fontWeight: "600" },

  drawBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 5,
  },
  drawBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  drawBarIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#FEF3E2",
    alignItems: "center",
    justifyContent: "center",
  },
  drawHint: { flex: 1, fontSize: 13, color: "#3D3D3A", fontWeight: "500" },
  pointCountPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  pointCountText: { fontSize: 12, fontWeight: "700", color: "#1f2937" },

  drawActions: { flexDirection: "row", gap: 8 },
  drawBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  drawBtnSecondary: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  drawBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5A5A56",
  },
  drawBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  drawBtnPrimaryDisabled: { backgroundColor: "#A9C4B3" },
  drawBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  listContainer: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 18,
  },

  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F0",
  },
  zoneColorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  zoneColorDot: { width: 10, height: 10, borderRadius: 5 },
  zoneName: { fontSize: 13.5, fontWeight: "700", color: "#111" },
  zonePointsCount: { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },

  newZoneWrap: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  newZoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  newZoneBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  viewInfoBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 5,
  },
  viewInfoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  viewInfoPoints: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  viewBackBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  viewBackBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5A5A56",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  modalSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
    marginBottom: 16,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 18,
  },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: "#5A5A56" },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalSaveText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});