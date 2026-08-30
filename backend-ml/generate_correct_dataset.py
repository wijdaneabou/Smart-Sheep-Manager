# generate_correct_dataset_v10.py
# VERSION FINALE - Tous les paramètres ajustés pour des corrélations 0.15-0.35

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("🚀 GÉNÉRATION DU DATASET V10 (VERSION FINALE)")
print("=" * 80)

N_ANIMALS = 200000
SICK_RATE = 0.08
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

n_healthy = int(N_ANIMALS * (1 - SICK_RATE))
n_sick = N_ANIMALS - n_healthy

print(f"\n📊 Génération de {N_ANIMALS:,} animaux...")
print(f"   - Sains : {n_healthy:,} ({n_healthy/N_ANIMALS*100:.1f}%)")
print(f"   - Malades : {n_sick:,} ({n_sick/N_ANIMALS*100:.1f}%)")

RACE_PARAMS = {
    "D'man": {
        'adult_weight_female': 28.0, 'adult_weight_male': 35.0,
        'bcs_mean': 3.2, 'bcs_std': 0.6
    },
    'Timahdite': {
        'adult_weight_female': 42.0, 'adult_weight_male': 55.0,
        'bcs_mean': 3.0, 'bcs_std': 0.7
    },
    'Sardi': {
        'adult_weight_female': 58.0, 'adult_weight_male': 75.0,
        'bcs_mean': 3.1, 'bcs_std': 0.7
    },
    'Beni-Guil': {
        'adult_weight_female': 50.0, 'adult_weight_male': 65.0,
        'bcs_mean': 3.0, 'bcs_std': 0.65
    }
}

def weight_factor_by_age(age_days):
    if age_days < 60:
        return 0.15 + (age_days / 60) * 0.15
    elif age_days < 180:
        return 0.30 + ((age_days - 60) / 120) * 0.25
    elif age_days < 365:
        return 0.55 + ((age_days - 180) / 185) * 0.20
    elif age_days < 730:
        return 0.75 + ((age_days - 365) / 365) * 0.15
    else:
        return 0.90 + min((age_days - 730) / 730, 0.10)

# ============================================================
# 2. FONCTION DE GÉNÉRATION
# ============================================================

def generate_animal(animal_id, is_sick):

    breed = np.random.choice(['Sardi', 'Timahdite', "D'man", 'Beni-Guil'])
    sex = np.random.choice(['MALE', 'FEMALE'], p=[0.4, 0.6])
    age = np.random.randint(30, 1500)

    race_info = RACE_PARAMS[breed]
    adult_weight = race_info['adult_weight_male'] if sex == 'MALE' else race_info['adult_weight_female']
    growth_factor = weight_factor_by_age(age)

    # ============================================================
    # POIDS (inchangé - V9 était parfait : corr 0.255)
    # ============================================================
    base_weight = adult_weight * growth_factor
    base_weight += np.random.normal(0, base_weight * 0.08)

    weight_change = np.random.normal(-0.1, 0.8)
    if is_sick and np.random.random() < 0.65:
        weight_change += np.random.normal(-1.2, 0.5)

    weight_mean = base_weight + weight_change * 0.5 + np.random.normal(0, base_weight * 0.03)
    weight_last = weight_mean + np.random.normal(0, 0.8)
    weight_count = np.random.randint(1, 4)

    if weight_count > 0:
        days_since_last_weight = int(np.random.uniform(1, 30 // weight_count + 5))
    else:
        days_since_last_weight = 999

    # ============================================================
    # BCS : biais augmenté pour corr ~0.18 (V9 était 0.117)
    # ============================================================
    has_bcs = 1 if np.random.random() < 0.48 else 0

    if has_bcs:
        bcs_mean = np.random.normal(race_info['bcs_mean'], race_info['bcs_std'])
        bcs_change = np.random.normal(0.0, 0.10)

        # V10 : biais -0.55 (V9: -0.40) → corr visée ~0.18
        if is_sick and np.random.random() < 0.75:
            bcs_mean += np.random.normal(-0.55, 0.12)
            bcs_change += np.random.normal(-0.12, 0.08)  # Légèrement réduit

        bcs_last = bcs_mean + np.random.normal(0, 0.15)
        bcs_count = np.random.randint(1, 4)
        days_since_last_bcs = int(np.random.uniform(1, 30 // bcs_count + 5))
    else:
        bcs_mean = np.nan
        bcs_change = np.nan
        bcs_last = np.nan
        bcs_count = 0
        days_since_last_bcs = 999

    # ============================================================
    # IoT : repos réduit pour corr ~0.28 (V9 était 0.348)
    # ============================================================
    has_iot = 1 if np.random.random() < 0.10 else 0

    if has_iot:
        days_iot = np.random.randint(22, 31)

        temp_mean = np.random.normal(38.7, 0.35)
        temp_anomalies = np.random.poisson(0.3)
        alert_count = np.random.poisson(0.2)

        if is_sick and np.random.random() < 0.55:
            temp_mean += np.random.normal(0.5, 0.20)
            temp_anomalies += np.random.poisson(1.5)  # V10 : augmenté (V9: 0.8)
            alert_count += np.random.poisson(1.0)      # V10 : augmenté (V9: 0.5)

        # V10 : repos biais réduit (V9: 50% prob, +0.04-0.09)
        # V10 : 42% prob, +0.03-0.06 → corr visée ~0.28
        rest = np.random.uniform(0.38, 0.52)
        movement = np.random.uniform(0.24, 0.34)
        grazing = np.random.uniform(0.24, 0.34)

        if is_sick and np.random.random() < 0.42:
            rest += np.random.uniform(0.03, 0.06)
            movement -= np.random.uniform(0.02, 0.05)
            grazing -= np.random.uniform(0.02, 0.05)

        total = rest + movement + grazing
        rest, movement, grazing = rest/total, movement/total, grazing/total

        temp_max = temp_mean + np.random.uniform(0.3, 0.7)
        temp_last = temp_mean + np.random.normal(0, 0.15)
    else:
        days_iot = 0
        temp_mean = np.nan
        temp_max = np.nan
        temp_anomalies = 0
        temp_last = np.nan
        alert_count = 0
        rest = np.nan
        movement = np.nan
        grazing = np.nan

    # ============================================================
    # VACCINATION (inchangé)
    # ============================================================
    if np.random.random() < 0.15:
        vaccine_count = 0
        days_since_last_vaccine = 999
    else:
        vaccine_count = np.random.randint(1, 4)
        days_since_last_vaccine = np.random.randint(7, 365)

    # ============================================================
    # REPRODUCTION (inchangé)
    # ============================================================
    if sex == 'FEMALE' and age > 300:
        repro_cycles = np.random.randint(0, 3)
        pregnancies = np.random.randint(0, 2)
        has_lambing = 1 if pregnancies > 0 or np.random.random() < 0.4 else 0
    else:
        repro_cycles = 0
        pregnancies = 0
        has_lambing = 0

    # ============================================================
    # HISTORIQUE SANTÉ (inchangé)
    # ============================================================
    if np.random.random() < 0.35:
        health_records_count = 0
        days_since_last_disease = 999
    else:
        health_records_count = np.random.poisson(0.5) + 1
        days_since_last_disease = np.random.randint(45, 365)

    target = 1 if is_sick else 0

    # ============================================================
    # CONSTRUCTION
    # ============================================================
    return {
        'animal_id': animal_id,
        'breed': breed,
        'sex': sex,
        'age_days': age,

        'has_bcs': has_bcs,
        'bcs_last': np.clip(bcs_last, 1.5, 4.5) if not np.isnan(bcs_last) else np.nan,
        'bcs_mean_30d': np.clip(bcs_mean, 1.5, 4.5) if not np.isnan(bcs_mean) else np.nan,
        'bcs_count_30d': bcs_count,
        'bcs_change_30d': np.clip(bcs_change, -0.6, 0.3) if not np.isnan(bcs_change) else np.nan,
        'days_since_last_bcs': days_since_last_bcs,

        'has_iot': has_iot,
        'temp_mean_30d': np.clip(temp_mean, 37.5, 41.0) if not np.isnan(temp_mean) else np.nan,
        'temp_max_30d': np.clip(temp_max, 38.0, 42.0) if not np.isnan(temp_max) else np.nan,
        'temp_anomalies_30d': temp_anomalies,
        'temp_last': np.clip(temp_last, 37.5, 41.0) if not np.isnan(temp_last) else np.nan,
        'rest_ratio_30d': np.clip(rest, 0.20, 0.80) if not np.isnan(rest) else np.nan,
        'movement_ratio_30d': np.clip(movement, 0.10, 0.45) if not np.isnan(movement) else np.nan,
        'grazing_ratio_30d': np.clip(grazing, 0.10, 0.45) if not np.isnan(grazing) else np.nan,
        'alert_count_30d': alert_count,
        'days_iot_data_30d': days_iot,

        'weight_last': np.clip(weight_last, 10, 95),
        'weight_mean_30d': np.clip(weight_mean, 10, 95),
        'weight_change_30d': np.clip(weight_change, -5.0, 3.0),
        'weight_count_30d': weight_count,
        'days_since_last_weight': days_since_last_weight,

        'vaccine_count': vaccine_count,
        'days_since_last_vaccine': days_since_last_vaccine,

        'repro_cycles_count': repro_cycles,
        'has_lambing': has_lambing,
        'pregnancies_count': pregnancies,

        'health_records_count_365d': health_records_count,
        'days_since_last_disease_365d': days_since_last_disease,

        'target': target
    }

# ============================================================
# 3. GÉNÉRATION
# ============================================================

data = []
for i in range(n_healthy):
    data.append(generate_animal(i+1, False))
for i in range(n_sick):
    data.append(generate_animal(n_healthy + i + 1, True))

df = pd.DataFrame(data)
df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

# ============================================================
# 4. STATISTIQUES
# ============================================================

print("\n📊 Statistiques finales :")

healthy_mask = df['target'] == 0
sick_mask = df['target'] == 1

print(f"   - Malades : {df['target'].sum():,} ({df['target'].mean()*100:.2f}%)")
print(f"   - BCS cover : {df['has_bcs'].mean()*100:.1f}%")
print(f"   - IoT cover : {df['has_iot'].mean()*100:.1f}%")

print(f"\n📊 POIDS :")
print(f"   - Global : {df['weight_mean_30d'].mean():.1f} kg (σ={df['weight_mean_30d'].std():.1f})")
print(f"   - Sains : {df[healthy_mask]['weight_mean_30d'].mean():.1f} kg")
print(f"   - Malades : {df[sick_mask]['weight_mean_30d'].mean():.1f} kg")
print(f"   - Δ poids : {df[sick_mask]['weight_mean_30d'].mean() - df[healthy_mask]['weight_mean_30d'].mean():.2f} kg")
print(f"   - Perte malades : {df[sick_mask]['weight_change_30d'].mean():.2f} kg")
print(f"   - Perte sains : {df[healthy_mask]['weight_change_30d'].mean():.2f} kg")

bcs_cov = df[df['has_bcs'] == 1]
print(f"\n📊 BCS (couverts) :")
print(f"   - Global : {bcs_cov['bcs_mean_30d'].mean():.2f} (σ={bcs_cov['bcs_mean_30d'].std():.2f})")
print(f"   - Sains : {df[healthy_mask & df['has_bcs']==1]['bcs_mean_30d'].mean():.2f}")
print(f"   - Malades : {df[sick_mask & df['has_bcs']==1]['bcs_mean_30d'].mean():.2f}")
print(f"   - Δ BCS : {df[sick_mask & df['has_bcs']==1]['bcs_mean_30d'].mean() - df[healthy_mask & df['has_bcs']==1]['bcs_mean_30d'].mean():.2f}")

iot_cov = df[df['has_iot'] == 1]
print(f"\n📊 IoT (couverts) :")
print(f"   - Temp : {iot_cov['temp_mean_30d'].mean():.2f}°C (σ={iot_cov['temp_mean_30d'].std():.2f})")
print(f"   - Sains : {df[healthy_mask & df['has_iot']==1]['temp_mean_30d'].mean():.2f}°C")
print(f"   - Malades : {df[sick_mask & df['has_iot']==1]['temp_mean_30d'].mean():.2f}°C")
print(f"   - Δ temp : {df[sick_mask & df['has_iot']==1]['temp_mean_30d'].mean() - df[healthy_mask & df['has_iot']==1]['temp_mean_30d'].mean():.2f}°C")

rest = df['rest_ratio_30d'].mean()
movement = df['movement_ratio_30d'].mean()
grazing = df['grazing_ratio_30d'].mean()
print(f"\n📊 Ratios : rest={rest:.3f}, movement={movement:.3f}, grazing={grazing:.3f}, total={rest+movement+grazing:.3f}")

print(f"\n📊 Historique :")
print(f"   - Jamais malades : {(df['days_since_last_disease_365d'] == 999).mean()*100:.1f}%")
print(f"   - Jamais vaccinés : {(df['days_since_last_vaccine'] == 999).mean()*100:.1f}%")

# Corrélations
print(f"\n🔗 Corrélations avec le target :")
corr_target = {}
for col in df.select_dtypes(include=[np.number]).columns:
    if col not in ['animal_id', 'target']:
        corr = df[col].corr(df['target'])
        if not np.isnan(corr) and abs(corr) < 1:
            corr_target[col] = abs(corr)

sorted_corr = sorted(corr_target.items(), key=lambda x: x[1], reverse=True)

in_range = 0
too_high = 0
too_low = 0

for i, (col, corr) in enumerate(sorted_corr[:15]):
    sign = "positif" if df[col].corr(df['target']) > 0 else "négatif"
    if 0.15 <= abs(corr) <= 0.40:
        status = "✅ PARFAIT"
        in_range += 1
    elif abs(corr) < 0.15:
        status = "⚠️ Faible"
        too_low += 1
    else:
        status = "❌ TROP FORT"
        too_high += 1
    print(f"   {i+1}. {col:<32} : {corr:.4f} ({sign}) {status}")

max_corr = sorted_corr[0][1] if sorted_corr else 0
print(f"\n📊 Bilan : {in_range} parfaites, {too_low} faibles, {too_high} trop fortes")

if 0.15 <= max_corr <= 0.40:
    print(f"✅ MAX = {max_corr:.4f} → DATASET PRÊT !")
else:
    print(f"⚠️ MAX = {max_corr:.4f}")

# ============================================================
# 5. SAUVEGARDE
# ============================================================

output_file = "dataset_final_v10.csv"
df.to_csv(output_file, index=False)

print(f"\n✅ Sauvegardé : {output_file}")
print(f"   - {len(df):,} lignes, {len(df.columns)} colonnes")

print("\n" + "=" * 80)
print("🎉 GÉNÉRATION V10 TERMINÉE !")
print("=" * 80)