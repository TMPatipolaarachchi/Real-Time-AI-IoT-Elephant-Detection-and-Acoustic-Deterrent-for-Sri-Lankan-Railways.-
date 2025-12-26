import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report, f1_score

# ----------------------------
# 1️⃣ Load RF model and scaler
# ----------------------------
rf_model_file = 'elephant_rf_top_features_model.pkl'
scaler_file = 'elephant_scaler.pkl'

rf = joblib.load(rf_model_file)
scaler = joblib.load(scaler_file)

# ----------------------------
# 2️⃣ Load YOLO features and rule predictions
# ----------------------------
yolo_csv = 'elephant_pose_features_yolo_final.csv'
rule_csv = 'elephant_features_rule_pred_yolo_updated.csv'

df_yolo = pd.read_csv(yolo_csv)
df_rule = pd.read_csv(rule_csv)

# Clean columns
df_rule.columns = df_rule.columns.str.strip().str.lower()
rule_pred_cols = [c for c in df_rule.columns if 'rule' in c and 'pred' in c]
if not rule_pred_cols:
    df_rule['rule_pred_weighted'] = 'Normal'
else:
    df_rule = df_rule.rename(columns={rule_pred_cols[0]: 'rule_pred_weighted'})

# Merge datasets
df = pd.concat([df_yolo.reset_index(drop=True), df_rule[['rule_pred_weighted']].reset_index(drop=True)], axis=1)

# ----------------------------
# 3️⃣ Ensure all required features exist
# ----------------------------
rf_features = [
    'ear_spread','trunk_length','tail_length','front_leg_stance','back_leg_stance',
    'ear_ratio','trunk_ratio','front_leg_ratio','back_leg_ratio','tail_ratio','body_ratio',
    'head_angle_norm','trunk_angle_norm','front_leg_angle_norm','back_leg_angle_norm',
    'ear_angle_norm','tail_angle_norm'
]

# Fill missing features with 0
for f in rf_features:
    if f not in df.columns:
        df[f] = 0.0

X = df[rf_features]
X_scaled = scaler.transform(X)

# ----------------------------
# 4️⃣ RF Predictions
# ----------------------------
rf_probs = rf.predict_proba(X_scaled)
rf_aggr, rf_normal = rf_probs[:,1], rf_probs[:,0]

# ----------------------------
# 5️⃣ Rule-based predictions
# ----------------------------
rule_aggr = (df['rule_pred_weighted'].str.lower()=='aggressive').astype(float).values
rule_mask = (df['rule_pred_weighted'].str.lower() != 'uncertain')

# ----------------------------
# 6️⃣ Hybrid: tune alpha and threshold
# ----------------------------
alphas = np.linspace(0.4, 0.9, 6)
thresholds = np.linspace(0.4, 0.6, 5)

best_f1 = 0
best_alpha, best_thresh = 0.7, 0.5  # default

if 'true_label' in df.columns:
    true_labels = df['true_label'].values
    for a in alphas:
        for t in thresholds:
            hybrid_aggr_tmp = rf_aggr.copy()
            hybrid_aggr_tmp[rule_mask] = a*rf_aggr[rule_mask] + (1-a)*rule_aggr[rule_mask]
            hybrid_label_tmp = np.where(hybrid_aggr_tmp>=t,'Aggressive','Normal')
            f1 = f1_score(true_labels, hybrid_label_tmp, pos_label='Aggressive', average='weighted')
            if f1 > best_f1:
                best_f1 = f1
                best_alpha, best_thresh = a, t

print(f"✅ Best alpha: {best_alpha}, Threshold: {best_thresh}, Weighted F1: {best_f1:.3f}")

# ----------------------------
# 7️⃣ Apply hybrid
# ----------------------------
hybrid_aggr = rf_aggr.copy()
hybrid_aggr[rule_mask] = best_alpha*rf_aggr[rule_mask] + (1-best_alpha)*rule_aggr[rule_mask]
hybrid_label = np.where(hybrid_aggr>=best_thresh,'Aggressive','Normal')

df['hybrid_label'] = hybrid_label
df['hybrid_prob_aggressive'] = hybrid_aggr
df['hybrid_prob_normal'] = 1 - hybrid_aggr

# ----------------------------
# 8️⃣ Save predictions
# ----------------------------
df.to_csv('elephant_hybrid_all_features_balanced.csv', index=False)
print("✅ Hybrid predictions saved → elephant_hybrid_all_features_balanced.csv")

# ----------------------------
# 9️⃣ Summary
# ----------------------------
total = len(df)
agg_count = (df['hybrid_label']=='Aggressive').sum()
nor_count = (df['hybrid_label']=='Normal').sum()
print(f"Total: {total} | Agg: {agg_count} ({agg_count/total*100:.2f}%) | Normal: {nor_count} ({nor_count/total*100:.2f}%)")

if 'true_label' in df.columns:
    cm = confusion_matrix(df['true_label'], df['hybrid_label'], labels=['Normal','Aggressive'])
    print("\n📊 Confusion Matrix\n", cm)
    print("\n📊 Classification Report\n", classification_report(df['true_label'], df['hybrid_label']))
    
# ----------------------------
# 🔟 Plot probability histogram
# ----------------------------
plt.figure(figsize=(10,5))
plt.hist(hybrid_aggr[df['hybrid_label']=='Aggressive'], bins=10, alpha=0.6, label='Aggressive', color='orange')
plt.hist(hybrid_aggr[df['hybrid_label']=='Normal'], bins=10, alpha=0.6, label='Normal', color='blue')
plt.axvline(best_thresh, color='red', linestyle='--', label='Threshold')
plt.xlabel('Hybrid Probability')
plt.ylabel('Number of Samples')
plt.title('Hybrid Probability Distribution')
plt.legend()
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.show()
