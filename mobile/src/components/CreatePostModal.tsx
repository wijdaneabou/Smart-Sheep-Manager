import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePost } from '../hooks/usePosts';
import { usePermissions } from '../contexts/PermissionsContext';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreatePostModal({ visible, onClose }: CreatePostModalProps) {
  const { user } = usePermissions();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const { mutate: createPost, isPending } = useCreatePost();

  const pickImage = async () => {
    // 🔥 Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erreur', 'Permission d\'accès à la galerie refusée.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6, // Reduce quality for faster upload
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Erreur', 'Le contenu est requis.');
      return;
    }

    console.log('📤 Submitting post with image:', image ? image.uri : 'no image');

    createPost(
      {
        content: content.trim(),
        image: image,
      },
      {
        onSuccess: () => {
          console.log('✅ Post created successfully');
          setContent('');
          setImage(null);
          onClose();
        },
        onError: (error: any) => {
          console.error('❌ Error details:', error);
          console.error('❌ Response data:', error?.response?.data);
          console.error('❌ Status:', error?.response?.status);
          Alert.alert(
            'Erreur',
            error?.response?.data?.error || 'Impossible de créer le post.'
          );
        },
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Créer un post</Text>
            <TouchableOpacity
              style={[
                styles.publishButton,
                (!content.trim() || isPending) && styles.publishButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!content.trim() || isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishButtonText}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="Quoi de neuf ?"
            placeholderTextColor="#657786"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {image && (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: image.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={28} color="#E0245E" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#0F7A3C" />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    color: '#657786',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14171A',
  },
  publishButton: {
    backgroundColor: '#0F7A3C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#A0B0B0',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14171A',
  },
  contentInput: {
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
    padding: 0,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F8FA',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F8FA',
  },
  actionText: {
    fontSize: 14,
    color: '#0F7A3C',
    marginLeft: 8,
    fontWeight: '500',
  },
});