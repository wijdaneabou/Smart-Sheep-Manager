import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Post } from '../services/posts';
import { useUpdatePost, useDeletePost } from '../hooks/usePosts';
import { getFileUrl } from '../services/api';

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

export function PostCard({ post, isAdmin }: PostCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content);
  const [timeAgo, setTimeAgo] = useState('');

  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

  // 🔥 Fix 1: Update time every minute with correct UTC parsing
  useEffect(() => {
    const updateTime = () => {
      try {
        const date = parseISO(post.createdAt);
        const formatted = formatDistanceToNow(date, {
          addSuffix: true,
          locale: fr,
        });
        setTimeAgo(formatted);
      } catch (error) {
        setTimeAgo('Date inconnue');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute

    return () => clearInterval(interval);
  }, [post.createdAt]);

  const handleEdit = () => {
    setMenuVisible(false);
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Supprimer le post',
      'Voulez-vous vraiment supprimer ce post ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deletePost(post.id),
        },
      ]
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      Alert.alert('Erreur', 'Le contenu est requis.');
      return;
    }
    updatePost(
      {
        id: post.id,
        data: {
          title: editTitle.trim() || undefined,
          content: editContent.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditModalVisible(false);
        },
        onError: () => {
          Alert.alert('Erreur', 'Impossible de modifier le post.');
        },
      }
    );
  };

  // 🔥 Fix 2: Use ?? undefined for both image and author photo
  const imageUrl = getFileUrl(post.imageUrl) ?? undefined;
  const authorPhotoUrl = getFileUrl(post.author.photo) ?? undefined;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            {authorPhotoUrl ? (
              <Image source={{ uri: authorPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {post.author.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>
                {post.author.firstName} {post.author.lastName}
              </Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#657786" />
            </TouchableOpacity>
          )}
        </View>

        {post.title && <Text style={styles.title}>{post.title}</Text>}

        <Text style={styles.content}>{post.content}</Text>

        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}

        {isAdmin && menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={18} color="#0F7A3C" />
              <Text style={styles.menuItemText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#E0245E" />
              <Text style={[styles.menuItemText, { color: '#E0245E' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le post</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Titre (optionnel)"
              value={editTitle}
              onChangeText={setEditTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Contenu"
              value={editContent}
              onChangeText={setEditContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#14171A' }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
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
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171A',
  },
  timeAgo: {
    fontSize: 12,
    color: '#657786',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#14171A',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#F5F8FA',
  },
  menuContainer: {
    position: 'absolute',
    right: 10,
    top: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
    minWidth: 130,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#14171A',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalCancel: {
    backgroundColor: '#E1E8ED',
  },
  modalSave: {
    backgroundColor: '#0F7A3C',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});