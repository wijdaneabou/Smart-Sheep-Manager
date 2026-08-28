import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePermissions } from "@/contexts/PermissionsContext";
import { CooperativeOverview, fetchCooperativeOverview } from "@/services/biService";

const C = { primary: "#2E7D32", danger: "#C62828", bg: "#F5F7F5", card: "#FFF", text: "#1B1B1B", muted: "#6B6B6B" };
type ViewName = "overview" | "farms" | "ranking" | "trends";

export default function BiBenchmarkScreen() {
  const { userRole } = usePermissions();
  const [data, setData] = useState<CooperativeOverview | null>(null), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState<string | null>(null), [view, setView] = useState<ViewName>("overview"), [presentationMode, setPresentationMode] = useState(false), [presentationIndex, setPresentationIndex] = useState(0), [autoRotate, setAutoRotate] = useState(true);
  const canAccess = useMemo(() => ["COOPERATIVE", "ADMIN"].includes(userRole.toUpperCase()), [userRole]);
  const load = useCallback(async () => { try { setError(null); setData(await fetchCooperativeOverview()); } catch (e: any) { setError(e?.message ?? "Impossible de charger les indicateurs du groupement."); } }, []);
  useEffect(() => { if (!canAccess) { setLoading(false); return; } const timer = setTimeout(() => void load().finally(() => setLoading(false)), 0); return () => clearTimeout(timer); }, [canAccess, load]);
  const refresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const togglePresentation = useCallback(async () => {
    const next = !presentationMode;
    setPresentationMode(next);
    setPresentationIndex(0);
  }, [presentationMode]);
  useEffect(() => {
    if (!presentationMode || !autoRotate) return;
    const timer = setInterval(() => {
      setPresentationIndex((current) => (current + 1) % 4);
    }, 8000);
    return () => clearInterval(timer);
  }, [presentationMode, autoRotate]);
  if (!canAccess) return <Denied />;
  if (loading) return <Center><ActivityIndicator size="large" color={C.primary} /><Text style={s.muted}>Chargement du groupement…</Text></Center>;
  if (error) return <Center><Text style={s.error}>{error}</Text><Pressable style={s.primaryButton} onPress={load}><Text style={s.primaryText}>Réessayer</Text></Pressable></Center>;

  if (presentationMode) {
    const views = [
      { key: "overview", label: "Synthèse", render: () => data && <Overview totals={data.totals} /> },
      { key: "farms", label: "Exploitations", render: () => <Farms rows={data?.exploitations ?? []} /> },
      { key: "ranking", label: "Classement", render: () => <Ranking rows={data?.ranking ?? []} /> },
      { key: "trends", label: "Tendances", render: () => <Trends rows={data?.trends ?? []} /> },
    ];
    const current = views[presentationIndex % views.length];
    return (
      <View style={s.presentationContainer}>
        <View style={s.presentationTop}>
          <View>
            <Text style={s.presentationTitle}>Pilotage coopérative</Text>
            <Text style={s.presentationSubtitle}>{current.label} · {presentationIndex + 1}/{views.length}</Text>
          </View>
          <View style={s.presentationActions}>
            <Pressable onPress={() => setAutoRotate((value) => !value)} style={s.presentationIcon}>
              <Ionicons name={autoRotate ? "pause" : "play"} size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={togglePresentation} style={s.presentationExit}>
              <Ionicons name="contract-outline" size={22} color="#fff" />
              <Text style={s.presentationExitText}>Quitter</Text>
            </Pressable>
          </View>
        </View>
        <Pressable style={s.presentationBody} onPress={() => setPresentationIndex((current) => (current + 1) % views.length)}>
          <ScrollView contentContainerStyle={s.presentationContent}>
            {current.render()}
          </ScrollView>
        </Pressable>
        <View style={s.presentationDot}>
          {views.map((item, index) => (
            <View key={item.key} style={[s.presentationDot, index === presentationIndex && s.presentationDotActive]} />
          ))}
        </View>
      </View>
    );
  }

  return <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.primary]} />}>
    <View style={s.header}><Pressable onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={22} color={C.text} /></Pressable><View><Text style={s.title}>Pilotage coopérative</Text><Text style={s.subtitle}>Indicateurs consolidés de vos adhérents</Text></View></View>
    <View style={s.tabs}>{([['overview','Synthèse'],['farms','Exploitations'],['ranking','Classement'],['trends','Tendances']] as [ViewName,string][]).map(([key,label]) => <Pressable key={key} onPress={() => setView(key)} style={[s.tab,view===key&&s.tabActive]}><Text style={[s.tabText,view===key&&s.tabTextActive]}>{label}</Text></Pressable>)}</View>
    {view === "overview" && data && <Overview totals={data.totals} />}
    {view === "farms" && <Farms rows={data?.exploitations ?? []} />}
    {view === "ranking" && <Ranking rows={data?.ranking ?? []} />}
    {view === "trends" && <Trends rows={data?.trends ?? []} />}
  </ScrollView>;
}

function Overview({ totals }: { totals: CooperativeOverview["totals"] }) { return <><View style={s.summary}><Text style={s.summaryTitle}>Vue totalisée du groupement</Text><MetricRow values={[["Adhérents",String(totals.exploitations)],["Effectif",String(totals.totalAnimals)],["Recettes 30 j",money(totals.totalRevenues30d)]]}/><View style={s.divider}/><MetricRow values={[["Mortalité",`${totals.avgMortalityRate}%`],["Fertilité",`${totals.avgFertilityRate}%`],["BCS moyen",totals.avgBcs?.toFixed(2) ?? "—"]]}/></View><Text style={s.section}>Lecture rapide</Text><View style={s.info}><Ionicons name="shield-checkmark-outline" size={21} color={C.primary}/><Text style={s.infoText}>Les indicateurs sont consolidés. Les données détaillées restent visibles uniquement par la coopérative.</Text></View></>; }
function MetricRow({ values }: { values: [string,string][] }) { return <View style={s.metrics}>{values.map(([label,value]) => <View key={label}><Text style={s.label}>{label}</Text><Text style={s.metric}>{value}</Text></View>)}</View>; }
function Farms({ rows }: { rows: CooperativeOverview["exploitations"] }) { return <><Text style={s.section}>Par exploitation ({rows.length})</Text>{rows.length ? rows.map(row => <View key={row.exploitationId} style={s.farm}><Text style={s.farmName}>{row.exploitationName}</Text><Text style={s.farmMeta}>{row.totalAnimals} têtes · {money(row.totalRevenues30d)} sur 30 jours</Text><MetricRow values={[["Mortalité",`${row.mortalityRate}%`],["Fertilité",`${row.fertilityRate}%`],["BCS",row.avgBcs?.toFixed(2) ?? "—"]]}/></View>) : <Empty text="Aucune exploitation rattachée à cette coopérative." />}</>; }
function Ranking({ rows }: { rows: CooperativeOverview["ranking"] }) {
  if (!rows.length) return <><Text style={s.section}>Classement anonymisé</Text><Empty text="Pas encore assez de données pour le classement." /></>;
  return <><Text style={s.section}>Classement anonymisé</Text><Text style={s.hint}>Les noms sont masqués pour un partage équitable des performances.</Text>{rows.map(row => <View key={row.rank} style={s.rank}><View style={s.rankBadge}><Text style={s.rankText}>{row.rank}</Text></View><View style={{ flex: 1 }}><Text style={s.farmName}>{row.label}</Text><Text style={s.farmMeta}>{row.totalAnimals} têtes · Mortalité {row.mortalityRate}% · Fertilité {row.fertilityRate}%</Text></View><Text style={s.score}>{row.score}</Text></View>)}</>;
}
function Trends({ rows }: { rows: CooperativeOverview["trends"] }) {
  if (!rows.length) return <><Text style={s.section}>Tendances du groupe</Text><Empty text="Aucune tendance disponible." /></>;
  const max = Math.max(1, ...rows.map(row => row.avgWeight ?? 0));
  return <><Text style={s.section}>Tendances du groupe</Text><Text style={s.hint}>Poids moyen consolidé par période, sans données nominatives.</Text><View style={s.trendCard}>{rows.map(row => <View key={row.period} style={s.trend}><Text style={s.period}>{row.period}</Text><View style={s.track}><View style={[s.fill, { width: `${((row.avgWeight ?? 0) / max) * 100}%` }]} /></View><Text style={s.weight}>{row.avgWeight?.toFixed(1) ?? "—"} kg</Text></View>)}</View></>;
}
function Empty({text}:{text:string}) { return <View style={s.empty}><Text style={s.muted}>{text}</Text></View>; }
function Center({children}:{children:React.ReactNode}) { return <View style={s.center}>{children}</View>; }
function Denied(){ return <Center><Ionicons name="lock-closed-outline" size={38} color={C.muted}/><Text style={s.denied}>Accès réservé</Text><Text style={s.muted}>Cette vue est réservée à la coopérative et à l’administration.</Text><Pressable style={s.primaryButton} onPress={()=>router.back()}><Text style={s.primaryText}>Retour</Text></Pressable></Center>; }
function money(value:number){return `${value.toLocaleString("fr-FR",{maximumFractionDigits:0})} MAD`;}

const s=StyleSheet.create({container:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:40},center:{flex:1,alignItems:"center",justifyContent:"center",padding:28,backgroundColor:C.bg},header:{flexDirection:"row",alignItems:"center",marginBottom:18},back:{padding:6,marginRight:8},title:{fontSize:23,fontWeight:"700",color:C.text},subtitle:{color:C.muted,marginTop:2},tabs:{flexDirection:"row",flexWrap:"wrap",gap:7,marginBottom:14},tab:{paddingHorizontal:11,paddingVertical:8,borderRadius:20,backgroundColor:C.card,borderWidth:1,borderColor:"#E5E7EB"},tabActive:{backgroundColor:C.primary,borderColor:C.primary},tabText:{color:C.muted,fontSize:12,fontWeight:"700"},tabTextActive:{color:"#fff"},summary:{backgroundColor:"#EAF5EB",padding:16,borderRadius:14,borderWidth:1,borderColor:"#B9DEBD"},summaryTitle:{color:C.primary,fontWeight:"700",marginBottom:12},metrics:{flexDirection:"row",justifyContent:"space-between"},label:{color:C.muted,fontSize:12},metric:{color:C.text,fontSize:16,fontWeight:"700",marginTop:3},divider:{height:1,backgroundColor:"#CFE7D1",marginVertical:14},section:{color:C.text,fontSize:16,fontWeight:"700",marginTop:22,marginBottom:10},info:{flexDirection:"row",gap:10,backgroundColor:C.card,borderRadius:12,padding:14,borderWidth:1,borderColor:"#E5E7EB"},infoText:{flex:1,color:C.muted,fontSize:13,lineHeight:19},farm:{backgroundColor:C.card,borderRadius:14,padding:15,marginBottom:10,borderWidth:1,borderColor:"#E5E7EB",gap:12},farmName:{color:C.text,fontWeight:"700",fontSize:16},farmMeta:{color:C.muted,fontSize:12,marginTop:2},hint:{color:C.muted,fontSize:12,lineHeight:17,marginBottom:11},rank:{flexDirection:"row",alignItems:"center",gap:11,backgroundColor:C.card,borderRadius:12,padding:13,marginBottom:8,borderWidth:1,borderColor:"#E5E7EB"},rankBadge:{width:30,height:30,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:"#EAF5EB"},rankText:{color:C.primary,fontWeight:"800"},score:{color:C.primary,fontWeight:"800",fontSize:17},trendCard:{backgroundColor:C.card,borderRadius:13,padding:14,gap:13,borderWidth:1,borderColor:"#E5E7EB"},trend:{flexDirection:"row",alignItems:"center",gap:8},period:{width:57,color:C.muted,fontSize:11},track:{flex:1,height:10,borderRadius:8,overflow:"hidden",backgroundColor:"#E8EEEA"},fill:{height:"100%",borderRadius:8,backgroundColor:C.primary},weight:{width:55,textAlign:"right",color:C.text,fontSize:11,fontWeight:"700"},empty:{backgroundColor:C.card,borderRadius:12,padding:24,alignItems:"center"},muted:{color:C.muted,textAlign:"center",marginTop:10},error:{color:C.danger,textAlign:"center"},denied:{color:C.text,fontSize:18,fontWeight:"700",marginTop:12},primaryButton:{marginTop:16,backgroundColor:C.primary,borderRadius:10,paddingHorizontal:16,paddingVertical:10},primaryText:{color:"#fff",fontWeight:"700"},presentationContainer:{flex:1,backgroundColor:"#101814"},presentationTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:20,borderBottomWidth:1,borderBottomColor:"#2A3B30"},presentationTitle:{color:"#fff",fontSize:22,fontWeight:"800"},presentationSubtitle:{color:"#A8C6AE",marginTop:4,fontSize:14},  presentationActions:{flexDirection:"row",gap:12,alignItems:"center"},presentationIcon:{padding:12,borderRadius:22,backgroundColor:"#263A2B"},presentationExit:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#EF4444",borderRadius:22,paddingHorizontal:18,paddingVertical:12},presentationExitText:{color:"#fff",fontWeight:"800",fontSize:16},presentationBody:{flex:1},presentationContent:{padding:20,paddingBottom:40},presentationDot:{width:8,height:8,borderRadius:4,backgroundColor:"#526158"},presentationDotActive:{width:24,backgroundColor:"#62B76B"}});
