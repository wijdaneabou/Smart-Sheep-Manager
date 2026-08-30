#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
api.py - Version corrigée avec conversion explicite des types numpy
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
import uvicorn
import shap
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = "models_final"

pipeline = joblib.load(os.path.join(MODEL_DIR, 'pipeline_final.pkl'))
thresholds_dict = joblib.load(os.path.join(MODEL_DIR, 'thresholds_dict.pkl'))
for key in thresholds_dict:
    if isinstance(thresholds_dict[key], float):
        thresholds_dict[key] = round(thresholds_dict[key], 2)

feature_names = joblib.load(os.path.join(MODEL_DIR, 'feature_names.pkl'))
explainer = joblib.load(os.path.join(MODEL_DIR, 'shap_explainer.pkl'))

with open(os.path.join(MODEL_DIR, 'metrics.json'), 'r') as f:
    metrics = json.load(f)
feature_bounds = metrics.get('feature_bounds', {})

logger.info("✅ Modèles et objets chargés avec succès")

# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class AnimalFeatures(BaseModel):
    breed: str = Field(..., description="Race (Sardi, Timahdite, D'man, Beni-Guil)")
    sex: str = Field(..., description="Sexe (MALE ou FEMALE)")
    age_days: int = Field(..., ge=30, le=1500)
    has_bcs: int = Field(0, ge=0, le=1)
    bcs_last: Optional[float] = Field(None, ge=1.5, le=4.5)
    bcs_mean_30d: Optional[float] = Field(None, ge=1.5, le=4.5)
    bcs_count_30d: Optional[int] = Field(None, ge=0, le=7)
    bcs_change_30d: Optional[float] = Field(None, ge=-0.6, le=0.3)
    has_iot: int = Field(0, ge=0, le=1)
    temp_mean_30d: Optional[float] = Field(None, ge=37.5, le=41.0)
    temp_max_30d: Optional[float] = Field(None, ge=38.0, le=42.0)
    temp_anomalies_30d: Optional[int] = Field(None, ge=0, le=10)
    temp_last: Optional[float] = Field(None, ge=37.5, le=41.0)
    rest_ratio_30d: Optional[float] = Field(None, ge=0.20, le=0.80)
    movement_ratio_30d: Optional[float] = Field(None, ge=0.10, le=0.45)
    grazing_ratio_30d: Optional[float] = Field(None, ge=0.10, le=0.45)
    alert_count_30d: Optional[int] = Field(None, ge=0, le=10)
    days_iot_data_30d: Optional[int] = Field(None, ge=0, le=30)
    weight_last: Optional[float] = Field(None, ge=10, le=95)
    weight_mean_30d: Optional[float] = Field(None, ge=10, le=95)
    weight_change_30d: Optional[float] = Field(None, ge=-5.0, le=3.0)
    weight_count_30d: Optional[int] = Field(None, ge=0, le=14)
    vaccine_count: int = Field(0, ge=0, le=5)
    days_since_last_vaccine: int = Field(0, ge=0, le=999)
    repro_cycles_count: int = Field(0, ge=0, le=5)
    has_lambing: int = Field(0, ge=0, le=1)
    pregnancies_count: int = Field(0, ge=0, le=3)
    health_records_count_365d: int = Field(0, ge=0, le=10)
    days_since_last_disease_365d: int = Field(0, ge=0, le=999)
    days_since_last_bcs: Optional[int] = Field(None, ge=0, le=999)
    days_since_last_weight: Optional[int] = Field(None, ge=0, le=999)

    @field_validator('breed')
    @classmethod
    def validate_breed(cls, v):
        allowed = ['Sardi', 'Timahdite', "D'man", 'Beni-Guil']
        if v not in allowed:
            raise ValueError(f"Race doit être parmi {allowed}")
        return v

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, v):
        if v not in ['MALE', 'FEMALE']:
            raise ValueError("Sexe doit être MALE ou FEMALE")
        return v

    @field_validator('bcs_last', 'bcs_mean_30d')
    @classmethod
    def check_bcs(cls, v, info):
        values = info.data
        if values.get('has_bcs') == 0 and v is not None:
            raise ValueError("Si has_bcs=0, les champs BCS doivent être None")
        return v

    @field_validator('temp_mean_30d', 'temp_max_30d', 'rest_ratio_30d', 'movement_ratio_30d', 'grazing_ratio_30d')
    @classmethod
    def check_iot(cls, v, info):
        values = info.data
        if values.get('has_iot') == 0 and v is not None:
            raise ValueError("Si has_iot=0, les champs IoT doivent être None")
        return v

class PredictionResponse(BaseModel):
    animal_id: Optional[int] = None
    prediction: int
    probability: float
    risk_level: str
    threshold_used: float
    profile_used: str
    explanations: Dict[str, float]
    feature_values: Dict[str, Any]

class BatchPredictionRequest(BaseModel):
    animals: List[AnimalFeatures]
    profile: str = "high_recall"

app = FastAPI(title="Smart Sheep Manager - ML API", version="1.1.0")

# ============================================================
# FONCTIONS
# ============================================================

def get_threshold(profile: str) -> float:
    if profile not in thresholds_dict:
        allowed = [k for k in thresholds_dict.keys() if k not in ['recommended_for_health']]
        raise ValueError(f"Profil inconnu. Choisir parmi {allowed}")
    if profile == "recommended":
        profile = thresholds_dict.get('recommended_for_health', 'high_recall')
    return float(thresholds_dict[profile])

def get_risk_level(probability: float) -> str:
    if probability >= 0.7:
        return "Élevé"
    elif probability >= 0.4:
        return "Modéré"
    else:
        return "Faible"

def preprocess_features(features: AnimalFeatures) -> pd.DataFrame:
    data = features.model_dump()
    for key, val in data.items():
        if val is None:
            data[key] = np.nan
    return pd.DataFrame([data])

def get_raw_feature_values(features: AnimalFeatures) -> Dict[str, Any]:
    data = features.model_dump()
    result = {}
    for k, v in data.items():
        if v is not None and not isinstance(v, (list, dict)):
            result[k] = v
    return result

def explain_prediction(X_transformed, feature_names, shap_values, expected_value):
    if isinstance(shap_values, list):
        shap_values_class1 = shap_values[1]
    else:
        shap_values_class1 = shap_values
    if shap_values_class1.ndim == 2:
        shap_contrib = shap_values_class1[0]
    else:
        shap_contrib = shap_values_class1
    contrib_dict = {name: float(val) for name, val in zip(feature_names, shap_contrib)}
    sorted_items = sorted(contrib_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    return {name: round(val, 4) for name, val in sorted_items[:5]}

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    return {"message": "Smart Sheep Manager - ML API", "version": "1.1.0", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True, "thresholds": thresholds_dict, "timestamp": datetime.now().isoformat()}

@app.post("/predict/animal", response_model=PredictionResponse)
async def predict_animal(features: AnimalFeatures, profile: str = Query("high_recall")):
    try:
        if profile not in thresholds_dict:
            allowed = [k for k in thresholds_dict.keys() if k not in ['recommended_for_health']]
            raise HTTPException(status_code=400, detail=f"Profil invalide. Choisir parmi {allowed}")
        threshold = get_threshold(profile)
        df = preprocess_features(features)
        proba = float(pipeline.predict_proba(df)[0, 1])
        prediction = int(proba >= threshold)
        risk = get_risk_level(proba)

        X_transformed = pipeline.named_steps['preprocessor'].transform(df)
        shap_vals = explainer.shap_values(X_transformed)
        expected = explainer.expected_value
        if isinstance(expected, (list, np.ndarray)):
            expected = expected[1] if len(expected) > 1 else expected[0]
        explanations = explain_prediction(X_transformed, feature_names, shap_vals, expected)
        raw_features = get_raw_feature_values(features)

        return PredictionResponse(
            animal_id=None,
            prediction=prediction,
            probability=round(proba, 4),
            risk_level=risk,
            threshold_used=float(threshold),
            profile_used=profile,
            explanations=explanations,
            feature_values=raw_features
        )
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
    try:
        if request.profile not in thresholds_dict:
            allowed = [k for k in thresholds_dict.keys() if k not in ['recommended_for_health']]
            raise HTTPException(status_code=400, detail=f"Profil invalide. Choisir parmi {allowed}")
        threshold = get_threshold(request.profile)
        results = []
        for animal in request.animals:
            df = preprocess_features(animal)
            proba = float(pipeline.predict_proba(df)[0, 1])
            pred = int(proba >= threshold)
            results.append({
                "prediction": pred,
                "probability": round(proba, 4),
                "risk_level": get_risk_level(proba)
            })
        return {
            "profile_used": request.profile,
            "threshold_used": float(threshold),
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Batch error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/risky-animals")
async def get_risky_animals(
    limit: int = Query(10, ge=1, le=100),
    min_probability: float = Query(0.4, ge=0.0, le=1.0),
    profile: str = Query("high_recall")
):
    return {
        "message": "⚠️ Cette endpoint sera connectée à la base de données dans la prochaine version.",
        "demo": True,
        "example": [
            {"animal_id": 123, "probability": 0.87, "risk_level": "Élevé"},
            {"animal_id": 456, "probability": 0.62, "risk_level": "Modéré"},
            {"animal_id": 789, "probability": 0.51, "risk_level": "Modéré"}
        ][:limit]
    }

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)