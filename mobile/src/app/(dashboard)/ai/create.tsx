// mobile/src/app/(dashboard)/ai/create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePredictionStore } from '../../../stores/predictionStore';
import api, { API_URL } from '../../../services/api';
import Toast from '../../../components/Toast';

interface Animal {
  id: number;
  rfid: string;
  name: string;
  breed: string;
  sex: string;
  weight: number | null;
  bcs: number | null;
  photoUrl: string | null;
  healthStatus: string;
}

export default function CreatePredictionScreen() {
  const router = useRouter();
  const { getAnimalPrediction } = usePredictionStore();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      // ✅ Use exactly the same params as the working old version
      const response = await api.get('/animals', {
        params: { limit: 100, status: 'ACTIVE' },
      });
      const data = response.data.data || response.data || [];
      setAnimals(data);
      setFilteredAnimals(data);
    } catch (err) {
      console.error('Failed to fetch animals:', err);
      setError('Could not load animals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = animals.filter(
      (animal) =>
        animal.name?.toLowerCase().includes(text.toLowerCase()) ||
        animal.rfid?.toLowerCase().includes(text.toLowerCase()) ||
        animal.breed?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredAnimals(filtered);
  };

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
    return `${API_URL}/${cleanPath}`;
  };

  const handleSelectAnimal = async (animal: Animal) => {
    setIsPredicting(true);
    try {
      const result = await getAnimalPrediction(animal.id);
      if (result) {
        const type = result.riskLevel === 'Élevé' ? 'error' : result.riskLevel === 'Modéré' ? 'warning' : 'success';
        setToast({
          visible: true,
          message: `Prediction: ${result.riskLevel} (${(result.probability * 100).toFixed(1)}%)`,
          type,
        });
        // Navigate back after a short delay
        setTimeout(() => router.back(), 1500);
      } else {
        setToast({
          visible: true,
          message: 'Failed to get prediction.',
          type: 'error',
        });
      }
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.code === 'INSUFFICIENT_DATA') {
        const missing = err.response.data.details?.missingFields || [];
        setToast({
          visible: true,
          message: `Insufficient data – Missing: ${missing.join(', ')}`,
          type: 'warning',
        });
        return;
      }
      setToast({
        visible: true,
        message: err.message || 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0F7A3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Prediction</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, RFID, or breed"
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAnimals} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAnimals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const photoUri = getPhotoUrl(item.photoUrl);
            return (
              <TouchableOpacity
                style={styles.animalCard}
                onPress={() => handleSelectAnimal(item)}
                disabled={isPredicting}
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
                      <Feather name="user" size={24} color="#666" />
                    )}
                  </View>
                  <View style={styles.animalDetails}>
                    <Text style={styles.animalName}>{item.name || 'Unnamed'}</Text>
                    <Text style={styles.animalDetailsText}>
                      {item.breed} • {item.sex} • {item.rfid}
                    </Text>
                    <Text style={styles.animalStats}>
                      Weight: {item.weight || 'N/A'} kg • BCS: {item.bcs || 'N/A'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#999" />
              <Text style={styles.emptyTitle}>No animals found</Text>
              <Text style={styles.emptyText}>
                {search ? 'Try a different search term.' : 'You have no animals in your farm.'}
              </Text>
            </View>
          }
          contentContainerStyle={filteredAnimals.length === 0 ? styles.emptyList : undefined}
        />
      )}

      {isPredicting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0F7A3C" />
          <Text style={styles.overlayText}>Getting prediction...</Text>
        </View>
      )}

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
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1A1A2E',
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  animalInfo: {
    flex: 1,
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
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  animalDetailsText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  animalStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0F7A3C',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A1A2E',
  },
});