// mobile/src/app/(dashboard)/ai/[animalId]/detail.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePredictionStore } from '../../../../stores/predictionStore';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { API_URL } from '../../../../services/api';

const COLORS = {
  primary: '#0F7A3C',
  background: '#F5F8FA',
  white: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  high: '#8B0000',
  moderate: '#888888',
  low: '#4CAF50',
  border: '#E8E8E8',
  warning: '#FF9800',
};

export default function AnimalDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ animalId: string }>();
  const { getAnimalPrediction, isLoading } = usePredictionStore();
  const { permissions } = usePermissions();
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const animalIdParam = params.animalId;
  const animalId = typeof animalIdParam === 'string' ? parseInt(animalIdParam, 10) : NaN;

  useEffect(() => {
    if (!isNaN(animalId)) {
      loadPrediction();
    } else {
      setError('ID d\'animal invalide');
    }
  }, [animalId]);

  const loadPrediction = async () => {
    if (isNaN(animalId)) return;
    try {
      const result = await getAnimalPrediction(animalId);
      if (result) {
        setPrediction(result);
        setError(null);
      } else {
        setError('Aucune prédiction trouvée pour cet animal');
      }
    } catch (err) {
      setError('Échec du chargement de la prédiction');
    }
  };

  const navigateToHistory = () => {
    if (!isNaN(animalId)) {
      router.push({
        pathname: '/ai/[animalId]/history',
        params: { animalId: String(animalId) },
      });
    }
  };

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
    return `${API_URL}/${cleanPath}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !prediction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.textSecondary} />
          <Text style={styles.errorTitle}>Aucune prédiction</Text>
          <Text style={styles.errorText}>{error || 'Animal introuvable'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPrediction}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const featureValues = prediction.featureValues || {};
  const explanations: Record<string, number> = prediction.explanations || {};
  const entries = Object.entries(explanations).slice(0, 5) as [string, number][];
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.01);

  const isHighRisk = prediction.riskLevel === 'Élevé';
  const isModerateRisk = prediction.riskLevel === 'Modéré';
  const isLowRisk = prediction.riskLevel === 'Faible';

  const dataStatus = prediction.dataStatus;
  const hasMinimumData = dataStatus?.hasMinimumData ?? true;
  const missingFields = dataStatus?.missingCategories || [];

  const currentWeight = prediction.currentWeight;
  const currentBcs = prediction.currentBcs;
  const currentTemp = prediction.currentTemperature;
  const currentActivity = prediction.currentActivity;

  const animalName = prediction.animalName || featureValues?.breed || 'Mouton';
  const animalRfid = prediction.animalRfid || '';
  const photoUri = getPhotoUrl(prediction.animalPhoto);

  const riskColor = isHighRisk ? COLORS.high : isModerateRisk ? COLORS.moderate : COLORS.low;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!hasMinimumData && (
          <View style={styles.warningBanner}>
            <Feather name="alert-triangle" size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Données limitées</Text>
              <Text style={styles.warningText}>
                Cette prédiction peut ne pas être fiable. Manque : {missingFields.join(', ')}.
                {'\n'}Veuillez ajouter {missingFields.length > 1 ? 'ces enregistrements' : 'cet enregistrement'} pour une meilleure précision.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.animalHeader}>
          <View style={styles.animalAvatarLarge}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.animalAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Feather name="user" size={32} color={COLORS.textSecondary} />
            )}
          </View>
          <View style={styles.animalHeaderInfo}>
            <Text style={styles.animalNameLarge}>{animalName}</Text>
            {animalRfid ? (
              <Text style={styles.animalRfidText}>RFID: {animalRfid}</Text>
            ) : null}
            <View style={styles.badgesContainer}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{featureValues?.sex || 'N/A'}</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{featureValues?.age_days || 0} jours</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.riskCardContainer}>
          <View style={styles.riskGauge}>
            <View style={[styles.gaugeCircle, { borderColor: riskColor }]}>
              <Text style={styles.gaugePercent}>
                {(prediction.probability * 100).toFixed(1)}%
              </Text>
            </View>
            <View
              style={[
                styles.riskLevelBadge,
                { backgroundColor: riskColor },
              ]}
            >
              <Text style={styles.riskLevelText}>
                {isHighRisk ? '⚠️' : '📊'} {prediction.riskLevel}
              </Text>
            </View>
            <Text style={styles.riskUpdateText}>
              Mis à jour : {new Date(prediction.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Real-time Vital Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="activity" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}> Statistiques vitales en temps réel</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Feather name="box" size={18} color={COLORS.textSecondary} />
              <Text style={styles.statLabel}>Poids</Text>
              <Text style={styles.statValue}>
                {currentWeight !== null && currentWeight !== undefined ? `${currentWeight} kg` : '—'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="bar-chart-2" size={18} color={COLORS.textSecondary} />
              <Text style={styles.statLabel}>BCS</Text>
              <Text style={styles.statValue}>
                {currentBcs !== null && currentBcs !== undefined ? currentBcs : '—'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="thermometer" size={18} color={COLORS.textSecondary} />
              <Text style={styles.statLabel}>Température</Text>
              <Text style={styles.statValue}>
                {currentTemp !== null && currentTemp !== undefined ? `${currentTemp}°C` : '—'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="activity" size={18} color={COLORS.textSecondary} />
              <Text style={styles.statLabel}>Activité</Text>
              <Text style={styles.statValue}>
                {currentActivity || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pourquoi cette prédiction ? */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="search" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}> Pourquoi cette prédiction ?</Text>
          </View>
          {entries.length === 0 ? (
            <Text style={styles.noExplanations}>Aucune explication disponible</Text>
          ) : (
            entries.map(([feature, value]) => (
              <View key={feature} style={styles.shapRow}>
                <Text style={styles.shapFeature}>{formatFeatureName(feature)}</Text>
                <View style={styles.shapBarContainer}>
                  <View
                    style={[
                      styles.shapBar,
                      {
                        width: `${(Math.abs(value) / maxAbs) * 100}%`,
                        backgroundColor: value > 0 ? COLORS.high : COLORS.low,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.shapValue,
                    { color: value > 0 ? COLORS.high : COLORS.low },
                  ]}
                >
                  {value > 0 ? '+' : ''}{value.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="sun" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}> Recommandations</Text>
          </View>
          <View style={styles.recommendationsCard}>
            {getRecommendations(prediction.riskLevel).map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationDot}>•</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonFull]}
            onPress={navigateToHistory}
          >
            <Feather name="clock" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Voir l'historique</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatFeatureName(feature: string): string {
  const map: Record<string, string> = {
    temp_anomalies_30d: 'Anomalies de température',
    weight_change_30d: 'Variation de poids',
    temp_mean_30d: 'Température moyenne',
    days_since_last_vaccine: 'Jours depuis dernier vaccin',
    grazing_ratio_30d: 'Activité de pâturage',
    bcs_change_30d: 'Variation BCS',
    bcs_mean_30d: 'BCS moyen',
    bcs_last: 'BCS actuel',
    rest_ratio_30d: 'Repos',
    movement_ratio_30d: 'Mouvement',
    weight_mean_30d: 'Poids moyen',
    weight_last: 'Poids actuel',
    temp_last: 'Dernière température',
    temp_max_30d: 'Température max',
    vaccine_count: 'Nombre de vaccins',
    repro_cycles_count: 'Cycles de reproduction',
    pregnancies_count: 'Gestations',
    has_lambing: 'Mise bas',
    health_records_count_365d: 'Enregistrements santé',
    days_since_last_disease_365d: 'Jours depuis dernière maladie',
    days_since_last_bcs: 'Jours depuis dernier BCS',
    days_since_last_weight: 'Jours depuis dernier poids',
    has_bcs: 'BCS disponible',
    has_iot: 'Données IoT',
  };
  return map[feature] || feature.replace(/_/g, ' ');
}

function getRecommendations(riskLevel: string): string[] {
  if (riskLevel === 'Élevé') {
    return [
      'Consultation vétérinaire immédiate requise',
      'Contactez votre vétérinaire dans les 24 heures',
      'Surveillez la température 3 fois par jour',
      'Notez tous les symptômes pour le vétérinaire',
      'Isolez l\'animal du reste du troupeau',
    ];
  }
  if (riskLevel === 'Modéré') {
    return [
      'Planifiez un examen vétérinaire cette semaine',
      'Augmentez la fréquence de surveillance',
      'Suivez le poids et le BCS quotidiennement',
      'Vérifiez l\'historique des vaccinations',
    ];
  }
  return [
    'Aucune action immédiate requise',
    'Continuez la surveillance régulière',
    'Maintenez une bonne nutrition',
    'Tenez à jour le calendrier vaccinal',
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningContent: {
    flex: 1,
    marginLeft: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  },
  warningText: {
    fontSize: 13,
    color: '#BF360C',
    marginTop: 2,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  animalAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  animalAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  animalHeaderInfo: {
    flex: 1,
  },
  animalNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  animalRfidText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badgePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  riskCardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskGauge: {
    alignItems: 'center',
  },
  gaugeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugePercent: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  riskLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  riskLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  riskUpdateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  shapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  shapFeature: {
    width: 140,
    fontSize: 13,
    color: '#333',
  },
  shapBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  shapBar: {
    height: '100%',
    borderRadius: 4,
  },
  shapValue: {
    width: 50,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  noExplanations: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  recommendationDot: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonFull: {
    width: '100%',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 6,
  },
});