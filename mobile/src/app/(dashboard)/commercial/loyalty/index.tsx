import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  listSegments,
  listOffers,
  listNotifications,
  listProfiles,
} from "@/services/loyaltyService";

type StatCard = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
};

export default function LoyaltyDashboard() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("CRM", "READ");

  const [loading, setLoading] = useState(true);
  const [segmentsCount, setSegmentsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [profilesCount, setProfilesCount] = useState(0);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    async function load() {
      setLoading(true);
      const [segRes, offRes, notifRes, profRes] = await Promise.all([
        listSegments({ page: 1, limit: 1 }),
        listOffers({ page: 1, limit: 1 }),
        listNotifications({ page: 1, limit: 1, unreadOnly: true }),
        listProfiles({ page: 1, limit: 1 }),
      ]);
      if (!active) return;
      if (segRes.success) setSegmentsCount(segRes.pagination.total);
      if (offRes.success) setOffersCount(offRes.pagination.total);
      if (notifRes.success) setNotificationsCount(notifRes.pagination.total);
      if (profRes.success) setProfilesCount(profRes.pagination.total);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [canRead]);

  if (!canRead) {
    return (
      <View style={styles.center}>
        <Text style={styles.locked}>Accès refusé</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  const stats: StatCard[] = [
    {
      label: "Clients notés",
      value: String(profilesCount),
      icon: "people-outline",
      color: "#15803D",
      bgColor: "#E6F8ED",
    },
    {
      label: "Segments",
      value: String(segmentsCount),
      icon: "pie-chart-outline",
      color: "#166534",
      bgColor: "#F3E8FF",
    },
    {
      label: "Offres actives",
      value: String(offersCount),
      icon: "pricetag-outline",
      color: "#2F855A",
      bgColor: "#E6F8ED",
    },
    {
      label: "Notifications non lues",
      value: String(notificationsCount),
      icon: "notifications-outline",
      color: "#1F7A4D",
      bgColor: "#E6F8ED",
    },
  ];

  const quickActions: { title: string; subtitle: string; route: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string; perm: string }[] = [
    {
      title: "Segments",
      subtitle: "VIP, Régulier, Occasionnel",
      route: "/commercial/loyalty/segments",
      icon: "pie-chart-outline",
      color: "#166534",
      bgColor: "#F3E8FF",
      perm: "READ",
    },
    {
      title: "Offres",
      subtitle: "Remises volume, offres ciblées",
      route: "/commercial/loyalty/offers",
      icon: "pricetag-outline",
      color: "#2F855A",
      bgColor: "#E6F8ED",
      perm: "READ",
    },
    {
      title: "Notifications",
      subtitle: "Disponibilité, prix, nouveautés",
      route: "/commercial/loyalty/notifications",
      icon: "notifications-outline",
      color: "#1F7A4D",
      bgColor: "#E6F8ED",
      perm: "READ",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Fidélisation & CRM</Text>
      <Text style={styles.pageSubtitle}>Développez la relation client avec des actions ciblées</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
            <Ionicons name={stat.icon} size={28} color={stat.color} />
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.actionsList}>
        {quickActions
          .filter((a) => hasPermission("CRM", a.perm))
          .map((action, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#5C8A72" />
            </Pressable>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2FAF5",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  locked: {
    fontSize: 16,
    color: "#5C8A72",
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F2A1D",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#5C8A72",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#5C8A72",
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F2A1D",
    marginBottom: 12,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#0F2A1D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F2A1D",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#5C8A72",
    marginTop: 2,
  },
});
