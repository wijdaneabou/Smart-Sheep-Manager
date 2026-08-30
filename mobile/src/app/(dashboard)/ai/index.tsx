// mobile/src/app/(dashboard)/ai/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePredictionStore } from '../../../stores/predictionStore';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { API_URL } from '../../../services/api';
import Toast from '../../../components/Toast';

// Colors
const COLORS = {
  primary: '#0F7A3C',
  background: '#F5F8FA',
  white: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  high: '#8B0000',      // Dark Red
  moderate: '#888888',  // Gray
  low: '#4CAF50',
  border: '#E8E8E8',
};

export default function AiDashboardScreen() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const {
    statistics,
    allAnimals,
    isLoading,
    fetchStatistics,
    fetchAllAnimals,
    fetchRiskyAnimals,
    getAnimalPrediction,
  } = usePredictionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAnimal, setRefreshingAnimal] = useState<number | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const canViewStats = permissions.includes('AI:STATISTICS');

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
      fetchAllAnimals(50);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatistics(), fetchAllAnimals(50)]);
    setRefreshing(false);
  };

  const navigateToAnimalDetails = (animalId: number) => {
    if (!animalId) return;
    router.push({
      pathname: '/ai/[animalId]/detail',
      params: { animalId: String(animalId) },
    });
  };

  const navigateToStats = () => {
    router.push('/ai/stats');
  };

  const navigateToCreate = () => {
    router.push('/ai/create');
  };

  const handleRefreshAnimal = async (animalId: number) => {
    setRefreshingAnimal(animalId);
    try {
      const result = await getAnimalPrediction(animalId);
      if (result) {
        const type = result.riskLevel === 'Élevé' ? 'error' : result.riskLevel === 'Modéré' ? 'warning' : 'success';
        setToast({
          visible: true,
          message: `Animal #${animalId} – ${result.riskLevel} (${(result.probability * 100).toFixed(1)}%)`,
          type,
        });
      }
      await fetchAllAnimals(50);
    } catch (error: any) {
      setToast({
        visible: true,
        message: error?.message || 'Échec de l\'actualisation',
        type: 'error',
      });
    } finally {
      setRefreshingAnimal(null);
    }
  };

  if (isLoading && !statistics && allAnimals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const high = statistics?.highRisk || 0;
  const moderate = statistics?.moderateRisk || 0;
  const low = statistics?.lowRisk || 0;

  const animals = Array.isArray(allAnimals) ? allAnimals : [];

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
    return `${API_URL}/${cleanPath}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header without greeting */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Prédictions</Text>
          <View style={styles.headerActions}>
            {canViewStats && (
              <TouchableOpacity style={styles.iconButton} onPress={navigateToStats}>
                <Feather name="bar-chart-2" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Risk Summary Cards */}
        <View style={styles.riskSummary}>
          <TouchableOpacity
            style={[styles.riskCard, styles.highRisk]}
            activeOpacity={0.7}
            onPress={() => fetchRiskyAnimals(0.7, 50)}
          >
            <Text style={styles.riskNumber}>{high}</Text>
            <Text style={styles.riskLabel}>Élevé</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskCard, styles.moderateRisk]}
            activeOpacity={0.7}
            onPress={() => fetchRiskyAnimals(0.4, 50)}
          >
            <Text style={styles.riskNumber}>{moderate}</Text>
            <Text style={styles.riskLabel}>Modéré</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskCard, styles.lowRisk]}
            activeOpacity={0.7}
          >
            <Text style={styles.riskNumber}>{low}</Text>
            <Text style={styles.riskLabel}>Faible</Text>
          </TouchableOpacity>
        </View>

        {/* Total Predictions */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Prédictions totales</Text>
          <Text style={styles.totalNumber}>{statistics?.totalPredictions || 0}</Text>
        </View>

        {/* All Animals List Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Toutes les prédictions</Text>
          <TouchableOpacity onPress={() => fetchAllAnimals(50)}>
            <Text style={styles.viewAll}>Actualiser</Text>
          </TouchableOpacity>
        </View>

        {animals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune prédiction</Text>
            <Text style={styles.emptyText}>
              Ajoutez des prédictions en appuyant sur le bouton + ci-dessous.
            </Text>
          </View>
        ) : (
          animals.slice(0, 50).map((animal, index) => {
            const photoUri = getPhotoUrl(animal.animalPhoto);
            const displayWeight = animal.animalWeight || animal.featureValues?.weight_last;
            const isRefreshing = refreshingAnimal === animal.animalId;

            const riskColor =
              animal.riskLevel === 'Élevé' ? COLORS.high :
              animal.riskLevel === 'Modéré' ? COLORS.moderate :
              COLORS.low;

            return (
              <View key={animal.animalId ? animal.animalId : index} style={styles.animalCardContainer}>
                <TouchableOpacity
                  style={styles.animalCard}
                  onPress={() => navigateToAnimalDetails(animal.animalId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.animalInfo}>
                    <View style={styles.animalAvatar}>
                      {photoUri ? (
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.animalImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather name="user" size={24} color={COLORS.textSecondary} />
                      )}
                    </View>
                    <View style={styles.animalDetails}>
                      <View style={styles.animalNameRow}>
                        <Text style={styles.animalName}>
                          {animal.animalName || `#${animal.animalId}`}
                        </Text>
                        <TouchableOpacity
                          style={styles.refreshButton}
                          onPress={() => handleRefreshAnimal(animal.animalId)}
                          disabled={isRefreshing}
                        >
                          <Feather
                            name="refresh-cw"
                            size={16}
                            color={COLORS.primary}
                            style={isRefreshing && styles.refreshingIcon}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.animalStats}>
                        {animal.animalRfid || animal.featureValues?.breed || 'Mouton'}
                      </Text>
                      <Text style={styles.animalStats}>
                        Poids : {displayWeight ? `${displayWeight} kg` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.animalRisk}>
                    <View
                      style={[
                        styles.riskBadge,
                        { backgroundColor: riskColor },
                      ]}
                    >
                      <Text style={styles.riskBadgeText}>
                        {animal.riskLevel || 'Inconnu'}
                      </Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <Text style={styles.probabilityText}>
                        {animal.probability ? (animal.probability * 100).toFixed(1) : '0'}%
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(animal.probability || 0) * 100}%`,
                              backgroundColor: riskColor,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={navigateToCreate} activeOpacity={0.8}>
        <Feather name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  riskSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  riskCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  highRisk: {
    borderTopWidth: 4,
    borderTopColor: COLORS.high,
  },
  moderateRisk: {
    borderTopWidth: 4,
    borderTopColor: COLORS.moderate,
  },
  lowRisk: {
    borderTopWidth: 4,
    borderTopColor: COLORS.low,
  },
  riskNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  riskLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  animalCardContainer: {
    marginBottom: 10,
  },
  animalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  animalImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  animalDetails: {
    flex: 1,
  },
  animalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
    marginLeft: 6,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
  animalStats: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  animalRisk: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  probabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 10,
    minWidth: 45,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});