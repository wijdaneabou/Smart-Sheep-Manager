#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
train_final_model_v3.py
Module 9.1 - Sélection multi-thresholds selon le profil métier

3 profils sauvegardés :
  - conservative : max F1 (Precision/Recall équilibré)
  - balanced     : bon compromis (Recall >= 60%)
  - high_recall  : max détection (Recall >= 75%, Precision >= 20%)
"""

import pandas as pd
import numpy as np
import warnings
import os
import json
import joblib
from datetime import datetime

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)

import xgboost as xgb
import shap
shap.initjs()

warnings.filterwarnings('ignore')

# ============================================================
# 1. CONFIG
# ============================================================
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

DATA_PATH = "dataset_final_v10.csv"
OUTPUT_DIR = "models_final"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FEATURE_BOUNDS = {
    "age_days": (30, 1500), "bcs_last": (1.5, 4.5), "bcs_mean_30d": (1.5, 4.5),
    "bcs_count_30d": (0, 7), "bcs_change_30d": (-0.6, 0.3),
    "temp_mean_30d": (37.5, 41.0), "temp_max_30d": (38.0, 42.0),
    "temp_anomalies_30d": (0, 10), "temp_last": (37.5, 41.0),
    "rest_ratio_30d": (0.20, 0.80), "movement_ratio_30d": (0.10, 0.45),
    "grazing_ratio_30d": (0.10, 0.45), "alert_count_30d": (0, 10),
    "days_iot_data_30d": (0, 30), "weight_last": (10, 95),
    "weight_mean_30d": (10, 95), "weight_change_30d": (-5.0, 3.0),
    "weight_count_30d": (0, 14), "vaccine_count": (0, 5),
    "days_since_last_vaccine": (0, 999), "days_since_last_bcs": (0, 999),
    "days_since_last_weight": (0, 999), "repro_cycles_count": (0, 5),
    "has_lambing": (0, 1), "pregnancies_count": (0, 3),
    "health_records_count_365d": (0, 10), "days_since_last_disease_365d": (0, 999),
    "has_bcs": (0, 1), "has_iot": (0, 1),
}

print("=" * 80)
print("🚀 ENTRAÎNEMENT V3 - MULTI-THRESHOLDS")
print("=" * 80)

# ============================================================
# 2. CHARGEMENT
# ============================================================
print("\n📂 Chargement...")
df = pd.read_csv(DATA_PATH, low_memory=False)
for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].replace('nan', np.nan)

print(f"   ✅ {len(df):,} lignes, {len(df.columns)} colonnes")

ID_COL, TARGET_COL = 'animal_id', 'target'
CATEGORICAL_COLS = ['breed', 'sex']
NUMERIC_COLS = [c for c in df.columns if c not in [ID_COL, TARGET_COL] + CATEGORICAL_COLS]

# ============================================================
# 3. SPLIT STRATIFIÉ
# ============================================================
print("\n📊 Split stratifié 70/15/15...")
X = df.drop(columns=[ID_COL, TARGET_COL])
y = df[TARGET_COL].values

X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=RANDOM_SEED, stratify=y)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=RANDOM_SEED, stratify=y_temp)

for name, yy in [("Train", y_train), ("Val", y_val), ("Test", y_test)]:
    print(f"   - {name}: {len(yy):,} - malades: {yy.mean()*100:.2f}%")

# ============================================================
# 4. PIPELINE
# ============================================================
print("\n🔧 Pipeline...")
preprocessor = ColumnTransformer([
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False, drop='first'), CATEGORICAL_COLS),
    ('num', 'passthrough', NUMERIC_COLS)
])

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"   - scale_pos_weight: {scale_pos_weight:.2f}")

xgb_clf = xgb.XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight, random_state=RANDOM_SEED,
    n_jobs=-1, eval_metric='logloss', missing=np.nan,
    reg_alpha=0.1, reg_lambda=1.0, min_child_weight=3, gamma=0.1
)

pipeline = Pipeline([('preprocessor', preprocessor), ('classifier', xgb_clf)])

# ============================================================
# 5. ENTRAÎNEMENT
# ============================================================
print("\n🧠 Entraînement...")
pipeline.fit(X_train, y_train)

feature_names = pipeline.named_steps['preprocessor'].get_feature_names_out()
feature_names = [f.replace('cat__', '').replace('num__', '') for f in feature_names]
print(f"   ✅ {len(feature_names)} features")

# ============================================================
# 6. PRÉDICTIONS
# ============================================================
y_val_proba = pipeline.predict_proba(X_val)[:, 1]
y_test_proba = pipeline.predict_proba(X_test)[:, 1]

# ============================================================
# 7. MULTI-THRESHOLD TUNING
# ============================================================
print("\n🎯 Multi-threshold tuning...")

thresholds = np.arange(0.05, 0.95, 0.01)
results = []

for t in thresholds:
    y_pred_t = (y_val_proba >= t).astype(int)
    prec = precision_score(y_val, y_pred_t, zero_division=0)
    rec = recall_score(y_val, y_pred_t, zero_division=0)
    f1 = f1_score(y_val, y_pred_t, zero_division=0)
    results.append({'threshold': t, 'precision': prec, 'recall': rec, 'f1': f1})

res_df = pd.DataFrame(results)

# --- PROFIL 1: CONSERVATIVE (max F1) ---
best_f1_idx = res_df['f1'].idxmax()
th_conservative = res_df.loc[best_f1_idx, 'threshold']

# --- PROFIL 2: BALANCED (max F1 avec Recall >= 0.60) ---
balanced_df = res_df[res_df['recall'] >= 0.60]
if len(balanced_df) > 0:
    best_bal_idx = balanced_df['f1'].idxmax()
    th_balanced = balanced_df.loc[best_bal_idx, 'threshold']
else:
    th_balanced = 0.50

# --- PROFIL 3: HIGH RECALL (max Recall avec Precision >= 0.20) ---
high_rec_df = res_df[res_df['precision'] >= 0.20]
if len(high_rec_df) > 0:
    best_rec_idx = high_rec_df['recall'].idxmax()
    th_high_recall = high_rec_df.loc[best_rec_idx, 'threshold']
else:
    th_high_recall = 0.20

# Tableau comparatif
print("\n   📊 TABLEAU DES PROFILS:")
print("   " + "-" * 70)
print(f"   {'Profil':<18} {'Threshold':<10} {'Recall':<8} {'Precision':<10} {'F1':<8}")
print("   " + "-" * 70)

for name, th in [("Conservateur", th_conservative), ("Équilibré", th_balanced), ("Haute sensibilité", th_high_recall)]:
    row = res_df[res_df['threshold'] == th].iloc[0]
    print(f"   {name:<18} {th:<10.2f} {row['recall']:<8.2f} {row['precision']:<10.2f} {row['f1']:<8.3f}")

print("   " + "-" * 70)
print("   💡 RECOMMANDATION: Utilise 'Haute sensibilité' pour la santé animale.")
print("      Mieux vaut 3 fausses alertes que 1 maladie manquée.")

# Graphique
plt.figure(figsize=(12, 7))
plt.plot(res_df['threshold'], res_df['precision'], label='Precision', linewidth=2, color='blue')
plt.plot(res_df['threshold'], res_df['recall'], label='Recall', linewidth=2, color='green')
plt.plot(res_df['threshold'], res_df['f1'], label='F1-Score', linewidth=2, color='orange')

plt.axvline(x=th_conservative, color='blue', linestyle='--', alpha=0.7, label=f'Conservateur = {th_conservative:.2f}')
plt.axvline(x=th_balanced, color='orange', linestyle='--', alpha=0.7, label=f'Équilibré = {th_balanced:.2f}')
plt.axvline(x=th_high_recall, color='green', linestyle='--', alpha=0.7, label=f'Haute sensibilité = {th_high_recall:.2f}')

plt.xlabel('Threshold')
plt.ylabel('Score')
plt.title('Multi-Threshold Tuning - 3 Profils Métier')
plt.legend(loc='center right')
plt.grid(True, alpha=0.3)
plt.xlim(0, 1)
plt.ylim(0, 1)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'multi_threshold_tuning.png'), dpi=150)
plt.close()
print(f"   ✅ multi_threshold_tuning.png")

# ============================================================
# 8. ÉVALUATION SUR TEST (avec les 3 thresholds)
# ============================================================
print("\n📊 Évaluation sur TEST:")

for profile_name, th in [("CONSERVATEUR", th_conservative), ("ÉQUILIBRÉ", th_balanced), ("HAUTE SENSIBILITÉ", th_high_recall)]:
    y_pred = (y_test_proba >= th).astype(int)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n   📌 {profile_name} (threshold={th:.2f}):")
    print(f"   Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")
    print(f"   Matrice: TP={cm[1,1]}, FN={cm[1,0]}, FP={cm[0,1]}, TN={cm[0,0]}")
    print(f"   → {cm[1,1]} malades détectés sur {cm[1,0]+cm[1,1]} ({rec*100:.1f}%)")

auc = roc_auc_score(y_test, y_test_proba)
print(f"\n   🎯 AUC-ROC global: {auc:.4f}")

# ============================================================
# 9. VISUALISATIONS
# ============================================================
print("\n📊 Graphiques...")

# ROC
fpr, tpr, _ = roc_curve(y_test, y_test_proba)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC (AUC = {auc:.3f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlabel('Taux Faux Positifs')
plt.ylabel('Taux Vrais Positifs')
plt.title('Courbe ROC')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'roc_curve.png'), dpi=150)
plt.close()

# Confusion pour le profil recommandé (high_recall)
y_rec_pred = (y_test_proba >= th_high_recall).astype(int)
cm_rec = confusion_matrix(y_test, y_rec_pred)
plt.figure(figsize=(8, 6))
plt.imshow(cm_rec, interpolation='nearest', cmap=plt.cm.Blues)
plt.title(f'Matrice - Profil Haute Sensibilité (th={th_high_recall:.2f})')
plt.colorbar()
plt.xticks([0, 1], ['Sain', 'Malade'])
plt.yticks([0, 1], ['Sain', 'Malade'])
for i in range(2):
    for j in range(2):
        plt.text(j, i, format(cm_rec[i, j], 'd'), ha="center", va="center",
                color="white" if cm_rec[i, j] > cm_rec.max()/2 else "black", fontsize=16, fontweight='bold')
plt.ylabel('Réel')
plt.xlabel('Prédit')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'confusion_matrix_high_recall.png'), dpi=150)
plt.close()

# Feature importance
booster = pipeline.named_steps['classifier']
imp = booster.feature_importances_
imp_df = pd.DataFrame({'feature': feature_names, 'importance': imp}).sort_values('importance', ascending=False)
plt.figure(figsize=(10, 8))
top_n = 20
plt.barh(range(top_n), imp_df['importance'].head(top_n).values[::-1])
plt.yticks(range(top_n), imp_df['feature'].head(top_n).values[::-1])
plt.xlabel('Importance')
plt.title('Top 20 Features')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'feature_importance.png'), dpi=150)
plt.close()

print("   ✅ Graphiques sauvegardés")

# ============================================================
# 10. SHAP
# ============================================================
print("\n🧠 SHAP...")
X_test_trans = pipeline.named_steps['preprocessor'].transform(X_test)
explainer = shap.TreeExplainer(booster)
shap_vals = explainer.shap_values(X_test_trans)

plt.figure(figsize=(12, 8))
shap.summary_plot(shap_vals, X_test_trans, feature_names=feature_names, show=False, max_display=20)
plt.title('SHAP Summary')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'shap_summary.png'), dpi=150, bbox_inches='tight')
plt.close()

plt.figure(figsize=(10, 8))
shap.summary_plot(shap_vals, X_test_trans, feature_names=feature_names, plot_type="bar", show=False, max_display=20)
plt.title('SHAP Importance')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'shap_importance_bar.png'), dpi=150, bbox_inches='tight')
plt.close()

# Waterfall example
tp_idx = np.where((y_test == 1) & (y_rec_pred == 1))[0]
if len(tp_idx) > 0:
    ex = tp_idx[0]
    plt.figure(figsize=(12, 4))
    shap.waterfall_plot(shap.Explanation(
        values=shap_vals[ex], base_values=explainer.expected_value,
        data=X_test_trans[ex], feature_names=feature_names
    ), show=False)
    plt.title(f'Exemple - Malade détecté (proba={y_test_proba[ex]:.2f})')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'shap_example_waterfall.png'), dpi=150, bbox_inches='tight')
    plt.close()

print("   ✅ SHAP sauvegardé")

# ============================================================
# 11. SAUVEGARDE
# ============================================================
print("\n💾 Sauvegarde...")

joblib.dump(pipeline, os.path.join(OUTPUT_DIR, 'pipeline_final.pkl'))
joblib.dump(booster, os.path.join(OUTPUT_DIR, 'model_xgboost.pkl'))
joblib.dump(preprocessor, os.path.join(OUTPUT_DIR, 'preprocessor.pkl'))
joblib.dump(feature_names, os.path.join(OUTPUT_DIR, 'feature_names.pkl'))
joblib.dump(explainer, os.path.join(OUTPUT_DIR, 'shap_explainer.pkl'))

# Sauvegarder les 3 thresholds
thresholds_dict = {
    'conservative': float(th_conservative),
    'balanced': float(th_balanced),
    'high_recall': float(th_high_recall),
    'recommended_for_health': 'high_recall'
}
joblib.dump(thresholds_dict, os.path.join(OUTPUT_DIR, 'thresholds_dict.pkl'))

with open(os.path.join(OUTPUT_DIR, 'thresholds_dict.json'), 'w') as f:
    json.dump(thresholds_dict, f, indent=2)

metrics = {
    'auc_roc': float(auc),
    'thresholds': thresholds_dict,
    'profiles': {},
    'feature_names': list(feature_names),
    'feature_bounds': FEATURE_BOUNDS,
    'training_date': datetime.now().isoformat()
}

for name, th in [("conservative", th_conservative), ("balanced", th_balanced), ("high_recall", th_high_recall)]:
    y_p = (y_test_proba >= th).astype(int)
    metrics['profiles'][name] = {
        'threshold': float(th),
        'accuracy': float(accuracy_score(y_test, y_p)),
        'precision': float(precision_score(y_test, y_p, zero_division=0)),
        'recall': float(recall_score(y_test, y_p, zero_division=0)),
        'f1': float(f1_score(y_test, y_p, zero_division=0)),
    }

with open(os.path.join(OUTPUT_DIR, 'metrics.json'), 'w', encoding='utf-8') as f:
    json.dump(metrics, f, indent=2, ensure_ascii=False)

print(f"   ✅ thresholds_dict.json : {thresholds_dict}")
print(f"   ✅ metrics.json")
print(f"   ✅ pipeline_final.pkl")

# ============================================================
# 12. RAPPORT
# ============================================================
print("\n" + "=" * 80)
print("🎉 ENTRAÎNEMENT V3 TERMINÉ")
print("=" * 80)

rec_final = metrics['profiles']['high_recall']['recall']
prec_final = metrics['profiles']['high_recall']['precision']

print(f"""
📊 RÉSULTAT RECOMMANDÉ (Haute Sensibilité):
   ┌────────────────────────────────────────┐
   │  AUC-ROC   : {auc:.4f}                  │
   │  Recall    : {rec_final:.4f}  ← ~{rec_final*100:.0f}% des malades détectés │
   │  Precision : {prec_final:.4f}                  │
   │  Threshold : {th_high_recall:.4f}                  │
   └────────────────────────────────────────┘

📁 FICHIERS dans {OUTPUT_DIR}/:
   ✅ pipeline_final.pkl
   ✅ thresholds_dict.pkl (3 profils)
   ✅ thresholds_dict.json
   ✅ shap_explainer.pkl
   ✅ metrics.json
   ✅ multi_threshold_tuning.png
   ✅ confusion_matrix_high_recall.png
   ✅ roc_curve.png, feature_importance.png
   ✅ shap_summary.png, shap_importance_bar.png
   ✅ shap_example_waterfall.png

🚀 PROCHAINE ÉTAPE: python api.py
   → Utilise thresholds_dict['high_recall'] pour la santé animale
""")
print("=" * 80)