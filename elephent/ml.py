import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ----------------------------
# 1️⃣ Load YOLO Features CSV
# ----------------------------
INPUT_CSV = "elephant_pose_features_yolo_final.csv"
df = pd.read_csv(INPUT_CSV)

# ----------------------------
# 2️⃣ Compute Ratios / Normalize
# ----------------------------
EPS = 1e-6
df['ear_ratio'] = df['ear_spread'] / (df['trunk_length'] + EPS)
df['trunk_ratio'] = df['trunk_length'] / (df['trunk_length'].max() + EPS)
df['front_leg_ratio'] = df['front_leg_stance'] / (df['ear_spread'] + EPS)
df['back_leg_ratio'] = df['back_leg_stance'] / (df['ear_spread'] + EPS)
df['tail_ratio'] = df['tail_length'] / (df['ear_spread'] + EPS)
# body_ratio assumed precomputed

# ----------------------------
# 3️⃣ Normalize angles to [-1,1]
# ----------------------------
angle_cols = ['head_angle','trunk_angle','front_leg_angle','back_leg_angle','ear_angle','tail_angle']
for col in angle_cols:
    if col in df.columns:
        df[f"{col}_norm"] = np.clip(np.radians(df[col])/np.pi, -1, 1)

# ----------------------------
# 4️⃣ Select Features
# ----------------------------
feature_cols = [
    'ear_spread','trunk_length','tail_length','front_leg_stance','back_leg_stance',
    'ear_ratio','trunk_ratio','front_leg_ratio','back_leg_ratio','tail_ratio','body_ratio',
    'head_angle_norm','trunk_angle_norm','front_leg_angle_norm','back_leg_angle_norm',
    'ear_angle_norm','tail_angle_norm'
]
X = df[feature_cols]
y = df['label']

# ----------------------------
# 5️⃣ Train/Test Split + Scaling
# ----------------------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ----------------------------
# 6️⃣ Train Random Forest
# ----------------------------
rf = RandomForestClassifier(
    n_estimators=1000,
    max_depth=None,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train_scaled, y_train)
y_pred = rf.predict(X_test_scaled)

print(f"\n✅ RF Accuracy (Test Set): {accuracy_score(y_test, y_pred)*100:.2f}%")
print(classification_report(y_test, y_pred, target_names=['Normal','Aggressive']))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

# ----------------------------
# 7️⃣ Feature Importance
# ----------------------------
importances = rf.feature_importances_
feat_imp = pd.DataFrame({'feature': feature_cols, 'importance': importances}).sort_values(by='importance', ascending=False)

plt.figure(figsize=(10,6))
plt.barh(feat_imp['feature'], feat_imp['importance'])
plt.gca().invert_yaxis()
plt.title("Random Forest Feature Importance")
plt.show()

# ----------------------------
# 8️⃣ Select Top Features
# ----------------------------
importance_threshold = 0.03
top_features = feat_imp[feat_imp['importance'] > importance_threshold]['feature'].tolist()
top_idx = [feature_cols.index(f) for f in top_features]

X_train_top = X_train_scaled[:, top_idx]
X_test_top = X_test_scaled[:, top_idx]

rf_top = RandomForestClassifier(
    n_estimators=1000,
    max_depth=None,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf_top.fit(X_train_top, y_train)
y_pred_top = rf_top.predict(X_test_top)

print(f"\n🏆 Accuracy (Top Features): {accuracy_score(y_test, y_pred_top)*100:.2f}%")

# ----------------------------
# 9️⃣ Cross-Validation
# ----------------------------
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
y_pred_cv = cross_val_predict(rf_top, scaler.transform(X)[:, top_idx], y, cv=cv)
print(f"📈 5-Fold CV Accuracy: {accuracy_score(y, y_pred_cv)*100:.2f}%")
print(classification_report(y, y_pred_cv, target_names=['Normal','Aggressive']))

# ----------------------------
# 🔟 Save Model, Scaler & Predictions
# ----------------------------
df_out = pd.DataFrame(X_test_top, columns=top_features)
df_out['true_label'] = y_test.values
df_out['pred_label'] = y_pred_top
df_out.to_csv("elephant_rf_top_features_predictions.csv", index=False)

joblib.dump(rf_top, "elephant_rf_top_features_model.pkl")
joblib.dump(scaler, "elephant_scaler.pkl")
print("✅ Model, Scaler & Predictions saved")
