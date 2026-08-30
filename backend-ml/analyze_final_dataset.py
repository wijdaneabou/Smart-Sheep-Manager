# analyze_final_dataset.py
# Script d'analyse complet du dataset final V10
# Vérifie : qualité des données, distributions, corrélations, NaN, cohérence

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("📊 ANALYSE COMPLÈTE DU DATASET V10")
print("=" * 80)

# ============================================================
# 1. CHARGEMENT ET STRUCTURE
# ============================================================
print("\n📂 Chargement du dataset...")
df = pd.read_csv("dataset_final_v10.csv")
print(f"✅ {len(df):,} lignes, {len(df.columns)} colonnes")

print("\n" + "=" * 80)
print("📋 1. STRUCTURE DU DATASET")
print("=" * 80)

print("\n🔍 Types des colonnes:")
print(df.dtypes)

print("\n📋 Liste des colonnes:")
for i, col in enumerate(df.columns, 1):
    dtype = df[col].dtype
    n_nan = df[col].isna().sum()
    nan_pct = n_nan / len(df) * 100
    nan_str = f"({nan_pct:.1f}% NaN)" if n_nan > 0 else ""
    print(f"   {i:2d}. {col:<30} ({dtype}) {nan_str}")

# ============================================================
# 2. VALEURS MANQUANTES
# ============================================================
print("\n" + "=" * 80)
print("🔍 2. VALEURS MANQUANTES (NaN)")
print("=" * 80)

missing = df.isnull().sum()
if missing.sum() == 0:
    print("✅ Aucune valeur manquante détectée")
else:
    print("\n📊 Colonnes avec valeurs manquantes:")
    for col, count in missing[missing > 0].items():
        pct = count / len(df) * 100
        print(f"   {col:<30}: {count:,} ({pct:.1f}%)")
    
    # Vérifier si les NaN sont cohérents avec has_bcs et has_iot
    bcs_nan = df['bcs_mean_30d'].isna().mean() * 100
    iot_nan = df['temp_mean_30d'].isna().mean() * 100
    print(f"\n📊 Cohérence NaN vs indicateurs:")
    print(f"   BCS NaN: {bcs_nan:.1f}% (has_bcs = 1 - {df['has_bcs'].mean()*100:.1f}% = {100 - df['has_bcs'].mean()*100:.1f}%)")
    print(f"   IoT NaN: {iot_nan:.1f}% (has_iot = {df['has_iot'].mean()*100:.1f}%)")

# ============================================================
# 3. STATISTIQUES DESCRIPTIVES
# ============================================================
print("\n" + "=" * 80)
print("📊 3. STATISTIQUES DESCRIPTIVES")
print("=" * 80)

# Variables clés
key_vars = [
    'age_days',
    'bcs_last', 'bcs_mean_30d', 'bcs_count_30d', 'bcs_change_30d',
    'temp_mean_30d', 'temp_max_30d', 'temp_anomalies_30d',
    'rest_ratio_30d', 'movement_ratio_30d', 'grazing_ratio_30d',
    'alert_count_30d', 'days_iot_data_30d',
    'weight_last', 'weight_mean_30d', 'weight_change_30d', 'weight_count_30d',
    'vaccine_count', 'days_since_last_vaccine',
    'repro_cycles_count', 'has_lambing', 'pregnancies_count',
    'health_records_count_365d', 'days_since_last_disease_365d',
    'target'
]

print("\n📊 Statistiques des variables clés:")
print("-" * 100)
print(f"{'Variable':<30} {'Moyenne':<12} {'Écart-type':<12} {'Min':<10} {'Max':<10} {'NaN %':<10}")
print("-" * 100)

for var in key_vars:
    if var in df.columns:
        mean = df[var].mean()
        std = df[var].std()
        min_val = df[var].min()
        max_val = df[var].max()
        nan_pct = df[var].isna().mean() * 100
        print(f"{var:<30} {mean:<12.2f} {std:<12.2f} {min_val:<10.2f} {max_val:<10.2f} {nan_pct:<10.1f}")

# ============================================================
# 4. DISTRIBUTION DU TARGET
# ============================================================
print("\n" + "=" * 80)
print("🎯 4. DISTRIBUTION DU TARGET")
print("=" * 80)

target_counts = df['target'].value_counts()
sick_count = target_counts.get(1, 0)
healthy_count = target_counts.get(0, 0)
sick_pct = sick_count / len(df) * 100

print(f"\n📊 Distribution:")
print(f"   Sain (0): {healthy_count:,} ({healthy_count/len(df)*100:.2f}%)")
print(f"   Malade (1): {sick_count:,} ({sick_pct:.2f}%)")

if 0.05 <= sick_pct <= 0.15:
    print(f"✅ Proportion réaliste ({sick_pct:.2f}%) - entre 5% et 15%")
else:
    print(f"⚠️ Proportion hors plage idéale")

# ============================================================
# 5. COMPARAISON SAINS VS MALADES
# ============================================================
print("\n" + "=" * 80)
print("📊 5. COMPARAISON SAINS VS MALADES")
print("=" * 80)

healthy_mask = df['target'] == 0
sick_mask = df['target'] == 1

comparison_vars = [
    'age_days',
    'bcs_mean_30d', 'bcs_change_30d',
    'temp_mean_30d', 'temp_anomalies_30d',
    'rest_ratio_30d', 'movement_ratio_30d',
    'weight_mean_30d', 'weight_change_30d',
    'health_records_count_365d', 'days_since_last_disease_365d'
]

print("\n📊 Comparaison des moyennes (Sains vs Malades):")
print("-" * 90)
print(f"{'Variable':<30} {'Sains':<12} {'Malades':<12} {'Différence':<12} {'Évaluation':<15}")
print("-" * 90)

for var in comparison_vars:
    if var in df.columns:
        mean_healthy = df[healthy_mask][var].mean()
        mean_sick = df[sick_mask][var].mean()
        diff = mean_sick - mean_healthy
        abs_diff = abs(diff)
        if abs_diff < 0.3:
            eval_str = "✅ Subtile"
        elif abs_diff < 1.0:
            eval_str = "📊 Modérée"
        else:
            eval_str = "⚠️ Significative"
        print(f"{var:<30} {mean_healthy:<12.2f} {mean_sick:<12.2f} {diff:<+12.2f} {eval_str:<15}")

# ============================================================
# 6. CORRÉLATIONS AVEC LE TARGET
# ============================================================
print("\n" + "=" * 80)
print("🔗 6. CORRÉLATIONS AVEC LE TARGET")
print("=" * 80)

# Calcul des corrélations en ignorant les NaN
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
num_cols = [col for col in num_cols if col not in ['animal_id', 'target']]

correlations = {}
for col in num_cols:
    # Calculer la corrélation en ignorant les NaN
    corr = df[col].corr(df['target'])
    if not np.isnan(corr) and abs(corr) < 1:
        correlations[col] = corr

sorted_corr = sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True)

print("\n🔝 Top 15 des corrélations (absolues):")
print("-" * 90)
print(f"{'#':<4} {'Variable':<30} {'Corrélation':<15} {'Force':<15} {'Statut':<15}")
print("-" * 90)

perfect_count = 0
for i, (col, corr) in enumerate(sorted_corr[:15], 1):
    sign = "positif" if corr > 0 else "négatif"
    abs_corr = abs(corr)
    
    if 0.15 <= abs_corr <= 0.35:
        force = "✅ Parfait"
        status = "✅ CIBLE"
        perfect_count += 1
    elif abs_corr < 0.15:
        force = "⚠️ Faible"
        status = "❌ Faible"
    else:
        force = "❌ Trop fort"
        status = "⚠️ Hors cible"
    
    print(f"{i:<4} {col:<30} {corr:+.4f} ({sign:<7}) {force:<15} {status:<15}")

max_corr = abs(sorted_corr[0][1]) if sorted_corr else 0
print(f"\n📊 Corrélation maximale: {max_corr:.4f}")
print(f"📊 Nombre de corrélations dans la cible (0.15-0.35): {perfect_count}/15")

if 0.15 <= max_corr <= 0.35:
    print("✅ PARFAIT ! Corrélations dans la cible 0.15-0.35")
else:
    print(f"⚠️ Corrélation hors cible: {max_corr:.4f}")

# ============================================================
# 7. COUVERTURE ET COHÉRENCE
# ============================================================
print("\n" + "=" * 80)
print("📡 7. COUVERTURE ET COHÉRENCE DES DONNÉES")
print("=" * 80)

bcs_coverage = df['has_bcs'].mean() * 100
iot_coverage = df['has_iot'].mean() * 100

print(f"\n📊 BCS: {bcs_coverage:.2f}% des animaux ont des données BCS")
print(f"📊 IoT: {iot_coverage:.2f}% des animaux ont des données IoT")

# BCS - uniquement les animaux couverts
bcs_covered = df[df['has_bcs'] == 1]
if len(bcs_covered) > 0:
    bcs_healthy = bcs_covered[bcs_covered['target'] == 0]['bcs_mean_30d'].mean()
    bcs_sick = bcs_covered[bcs_covered['target'] == 1]['bcs_mean_30d'].mean()
    print(f"\n📊 BCS (animaux couverts):")
    print(f"   Sains : {bcs_healthy:.2f}")
    print(f"   Malades : {bcs_sick:.2f}")
    print(f"   Écart : {bcs_sick - bcs_healthy:+.2f}")
    print(f"   Écart-type : {bcs_covered['bcs_mean_30d'].std():.2f}")

# IoT - uniquement les animaux couverts
iot_covered = df[df['has_iot'] == 1]
if len(iot_covered) > 0:
    temp_healthy = iot_covered[iot_covered['target'] == 0]['temp_mean_30d'].mean()
    temp_sick = iot_covered[iot_covered['target'] == 1]['temp_mean_30d'].mean()
    print(f"\n📊 Température (animaux couverts):")
    print(f"   Sains : {temp_healthy:.2f}°C")
    print(f"   Malades : {temp_sick:.2f}°C")
    print(f"   Écart : {temp_sick - temp_healthy:+.2f}°C")
    print(f"   Écart-type : {iot_covered['temp_mean_30d'].std():.2f}°C")

# Ratios d'activité
rest_mean = df['rest_ratio_30d'].mean()
movement_mean = df['movement_ratio_30d'].mean()
grazing_mean = df['grazing_ratio_30d'].mean()
total_ratio = rest_mean + movement_mean + grazing_mean

print(f"\n📊 Ratios d'activité (moyennes globales):")
print(f"   Repos : {rest_mean:.3f}")
print(f"   Mouvement : {movement_mean:.3f}")
print(f"   Pâturage : {grazing_mean:.3f}")
print(f"   Total : {total_ratio:.3f} {'✅ = 1.0' if abs(total_ratio - 1.0) < 0.01 else '⚠️ ≠ 1.0'}")

# ============================================================
# 8. HISTORIQUE SANTÉ (TEST DE FUITES)
# ============================================================
print("\n" + "=" * 80)
print("🔍 8. TEST DE FUITES - HISTORIQUE SANTÉ")
print("=" * 80)

# Vérifier que l'historique santé est indépendant du target
health_healthy = df[healthy_mask]['health_records_count_365d'].mean()
health_sick = df[sick_mask]['health_records_count_365d'].mean()
health_diff = abs(health_healthy - health_sick)

print(f"\n📊 health_records_count_365d:")
print(f"   Sains : {health_healthy:.2f}")
print(f"   Malades : {health_sick:.2f}")
print(f"   Différence : {health_diff:.3f}")

if health_diff < 0.1:
    print("   ✅ PAS DE FUITE : l'historique est indépendant du target")
else:
    print("   ⚠️ POSSIBLE FUITE : différence significative")

# Vérifier la sentinelle 999 (jamais malade)
never_sick = (df['days_since_last_disease_365d'] == 999).mean() * 100
print(f"\n📊 % jamais malades (sentinelle 999): {never_sick:.1f}%")

# Vérifier la sentinelle 999 (jamais vacciné)
never_vaccinated = (df['days_since_last_vaccine'] == 999).mean() * 100
print(f"📊 % jamais vaccinés (sentinelle 999): {never_vaccinated:.1f}%")

# ============================================================
# 9. DISTRIBUTIONS PAR TARGET (Boxplots)
# ============================================================
print("\n" + "=" * 80)
print("📊 9. DISTRIBUTIONS PAR TARGET")
print("=" * 80)

# Créer des boxplots
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

plot_vars = ['weight_mean_30d', 'weight_change_30d',
             'bcs_mean_30d', 'bcs_change_30d',
             'temp_mean_30d', 'rest_ratio_30d']

for i, var in enumerate(plot_vars):
    if i < len(axes) and var in df.columns:
        # Filtrer les NaN pour le boxplot
        healthy_data = df[healthy_mask & df[var].notna()][var].values
        sick_data = df[sick_mask & df[var].notna()][var].values
        
        axes[i].boxplot([healthy_data, sick_data], positions=[1, 2],
                       widths=0.6, patch_artist=True,
                       boxprops=dict(facecolor='lightblue'),
                       medianprops=dict(color='red', linewidth=2))
        axes[i].set_xticks([1, 2])
        axes[i].set_xticklabels(['Sain', 'Malade'])
        axes[i].set_title(f'{var} (NaN ignorés)')
        axes[i].set_ylabel(var)
        axes[i].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('distributions_by_target_v10.png', dpi=300)
print("✅ Boxplots sauvegardés: distributions_by_target_v10.png")

# ============================================================
# 10. BILAN FINAL
# ============================================================
print("\n" + "=" * 80)
print("📌 10. BILAN FINAL - LE DATASET EST-IL PRÊT ?")
print("=" * 80)

# Vérifications
passed = 0
total_checks = 8

# 1. Target
if 0.05 <= sick_pct <= 0.15:
    passed += 1
    print(f"✅ Target: {sick_pct:.2f}% (entre 5% et 15%)")
else:
    print(f"⚠️ Target: {sick_pct:.2f}% (hors 5-15%)")

# 2. Corrélations
if 0.15 <= max_corr <= 0.35:
    passed += 1
    print(f"✅ Corrélations: max = {max_corr:.4f} (dans cible 0.15-0.35)")
else:
    print(f"⚠️ Corrélations: max = {max_corr:.4f} (hors cible)")

# 3. NaN BCS
bcs_nan_pct = df['bcs_mean_30d'].isna().mean() * 100
if 45 <= bcs_nan_pct <= 55:
    passed += 1
    print(f"✅ NaN BCS: {bcs_nan_pct:.1f}% (dans 45-55%)")
else:
    print(f"⚠️ NaN BCS: {bcs_nan_pct:.1f}%")

# 4. NaN IoT
iot_nan_pct = df['temp_mean_30d'].isna().mean() * 100
if 85 <= iot_nan_pct <= 95:
    passed += 1
    print(f"✅ NaN IoT: {iot_nan_pct:.1f}% (dans 85-95%)")
else:
    print(f"⚠️ NaN IoT: {iot_nan_pct:.1f}%")

# 5. Ratios IoT
if abs(total_ratio - 1.0) < 0.01:
    passed += 1
    print(f"✅ Ratios IoT: somme = {total_ratio:.3f} (≈ 1.0)")
else:
    print(f"⚠️ Ratios IoT: somme = {total_ratio:.3f}")

# 6. Pas de fuite historique
if health_diff < 0.1:
    passed += 1
    print(f"✅ Historique santé: pas de fuite (diff = {health_diff:.3f})")
else:
    print(f"⚠️ Historique santé: possible fuite (diff = {health_diff:.3f})")

# 7. Sentinelle jamais malade
if 30 <= never_sick <= 40:
    passed += 1
    print(f"✅ Jamais malades: {never_sick:.1f}% (dans 30-40%)")
else:
    print(f"⚠️ Jamais malades: {never_sick:.1f}%")

# 8. Variance du poids
weight_std = df['weight_mean_30d'].std()
if weight_std >= 10:
    passed += 1
    print(f"✅ Variance poids: σ = {weight_std:.1f} kg (>= 10 kg)")
else:
    print(f"⚠️ Variance poids: σ = {weight_std:.1f} kg")

print("\n" + "-" * 60)
print(f"📊 Bilan: {passed}/{total_checks} vérifications passées")

if passed >= 7:
    print("\n✅" + "=" * 50)
    print("✅ LE DATASET EST PRÊT POUR L'ENTRAÎNEMENT !")
    print("=" * 53)
    print("\n📌 Résumé V10:")
    print(f"   - {len(df):,} animaux, {sick_pct:.1f}% malades")
    print(f"   - Corrélation max: {max_corr:.4f}")
    print(f"   - NaN BCS: {bcs_nan_pct:.1f}%, NaN IoT: {iot_nan_pct:.1f}%")
    print(f"   - Variance poids: σ = {weight_std:.1f} kg")
    print("\n🚀 Prochaine étape: python train_final_model.py")
elif passed >= 5:
    print("\n⚠️ Le dataset est acceptable mais des améliorations sont possibles.")
else:
    print("\n❌ Le dataset n'est pas prêt pour l'entraînement.")

print("\n" + "=" * 80)
print("🎉 ANALYSE TERMINÉE !")
print("=" * 80)