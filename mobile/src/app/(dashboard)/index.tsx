import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useInfinitePosts } from '../../hooks/usePosts';
import { PostCard } from '../../components/PostCard';
import { CreatePostModal } from '../../components/CreatePostModal';
import { usePermissions } from '../../contexts/PermissionsContext';

export default function DashboardScreen() {
  const { user } = usePermissions();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts(10);

  const isAdmin = user?.roleId === 1;
  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  const handleAIAssistantPress = () => {
    router.push('/ai-assistant');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {isAdmin ? (
        <TouchableOpacity
          style={styles.whatsNewButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.whatsNewContent}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.createAvatar} />
            ) : (
              <View style={[styles.createAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.textContainer}>
              <View style={styles.textRow}>
                <Feather name="feather" size={22} color="#0F7A3C" style={styles.quillIcon} />
                <Text style={styles.whatsNewText}>Quoi de neuf ?</Text>
              </View>
              <View style={styles.underline} />
            </View>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (isLoading && !allPosts.length) return null;
    if (!allPosts.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun post</Text>
          <Text style={styles.emptyText}>
            {isAdmin
              ? 'Commencez par créer le premier post !'
              : 'Aucun post disponible pour le moment.'}
          </Text>
        </View>
      );
    }
    if (isFetchingNextPage) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F7A3C" />
        </View>
      );
    }
    if (hasNextPage) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => fetchNextPage()}>
          <Text style={styles.loadMoreText}>Charger plus</Text>
        </TouchableOpacity>
      );
    }
    return <Text style={styles.endText}>Aucun autre post à afficher</Text>;
  };

  if (isLoading && !allPosts.length) {
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
        data={allPosts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} isAdmin={isAdmin} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#0F7A3C"
            colors={['#0F7A3C']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <CreatePostModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      {/* AI Assistant Chatbot Button - Fixed bottom left with chat bubble shape */}
      <TouchableOpacity
        style={styles.aiAssistantButton}
        onPress={handleAIAssistantPress}
        activeOpacity={0.8}
      >
        <View style={styles.aiAssistantButtonInner}>
          <Image
            source={require('../../../assets/images/sheep-chatbot.png')}
            style={styles.aiAssistantIcon}
          />
        </View>
        <View style={styles.aiAssistantTail} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  whatsNewButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    marginBottom: 8,
  },
  whatsNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createAvatar: {
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
  textContainer: {
    flex: 1,
    marginLeft: 4,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quillIcon: {
    marginRight: 8,
  },
  whatsNewText: {
    fontSize: 16,
    color: '#657786',
    fontWeight: '400',
  },
  underline: {
    height: 2,
    width: '60%',
    backgroundColor: '#0F7A3C',
    marginTop: 2,
    marginLeft: 30,
    borderRadius: 1,
  },
  loaderContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    marginVertical: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#0F7A3C',
    fontWeight: '500',
  },
  endText: {
    textAlign: 'center',
    color: '#657786',
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  aiAssistantButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 64,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1B7A4B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  aiAssistantButtonInner: {
    width: 56,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  aiAssistantTail: {
    position: 'absolute',
    bottom: -8,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 16,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1B7A4B',
  },
});