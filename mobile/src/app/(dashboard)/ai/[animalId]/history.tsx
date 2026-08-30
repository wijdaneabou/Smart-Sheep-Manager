// mobile/src/app/(dashboard)/ai/[animalId]/history.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePredictionStore } from '../../../../stores/predictionStore';

export default function PredictionHistoryScreen() {
  const params = useLocalSearchParams<{ animalId: string }>();
  const { fetchAnimalHistory, isLoading } = usePredictionStore();
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Safe conversion from string to number
  const animalIdParam = params.animalId;
  const animalId = typeof animalIdParam === 'string' ? parseInt(animalIdParam, 10) : NaN;

  const loadHistory = async () => {
    if (isNaN(animalId)) return;
    try {
      const result = await fetchAnimalHistory(animalId, 20);
      setHistory(result || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [animalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  if (isLoading && history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F7A3C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.animalId}-${index}-${item.createdAt}`}
        renderItem={({ item }) => {
          const isHighRisk = item.riskLevel === 'Élevé';
          const isModerateRisk = item.riskLevel === 'Modéré';
          const isLowRisk = item.riskLevel === 'Faible';

          return (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
                </Text>
                <View
                  style={[
                    styles.historyBadge,
                    isHighRisk
                      ? styles.badgeHigh
                      : isModerateRisk
                      ? styles.badgeModerate
                      : styles.badgeLow,
                  ]}
                >
                  <Text style={styles.historyBadgeText}>{item.riskLevel}</Text>
                </View>
              </View>
              <View style={styles.historyBody}>
                <Text style={styles.historyProbability}>
                  {(item.probability * 100).toFixed(1)}% risk
                </Text>
                <Text style={styles.historyThreshold}>
                  Threshold: {item.thresholdUsed}
                </Text>
              </View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F7A3C"
            colors={['#0F7A3C']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No History</Text>
            <Text style={styles.emptyText}>No predictions found for this animal</Text>
          </View>
        }
        contentContainerStyle={history.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    backgroundColor: '#FFF',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 13,
    color: '#666',
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeHigh: {
    backgroundColor: '#D32F2F',
  },
  badgeModerate: {
    backgroundColor: '#FF9800',
  },
  badgeLow: {
    backgroundColor: '#4CAF50',
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  historyBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyProbability: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  historyThreshold: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});