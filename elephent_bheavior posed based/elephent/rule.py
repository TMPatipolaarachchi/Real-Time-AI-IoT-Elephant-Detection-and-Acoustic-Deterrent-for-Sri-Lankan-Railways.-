import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# ----------------------------
# 1️⃣ Load Data
# ----------------------------
INPUT_CSV = "elephant_pose_features_yolo_final.csv"
OUTPUT_CSV = "elephant_features_rule_pred_yolo_updated.csv"
df = pd.read_csv(INPUT_CSV)

# ----------------------------
# 2️⃣ Select Strong Features
# ----------------------------
features = [
    "tail_stiffness","front_leg_stance","back_leg_stance","head_angle_norm",
    "front_leg_angle_norm","back_leg_angle_norm","tail_angle_norm",
    "ear_ratio","trunk_ratio","tail_ratio","body_ratio"
]
features = [f for f in features if f in df.columns]

# ----------------------------
# 3️⃣ Z-score Normalization (clip to [-3,3])
# ----------------------------
for f in features:
    df[f] = (df[f] - df[f].mean()) / (df[f].std() + 1e-6)
    df[f] = np.clip(df[f], -3, 3)

# ----------------------------
# 4️⃣ Feature Importance (Weights)
# ----------------------------
means_aggr = df[df.label == 1][features].mean()
means_norm = df[df.label == 0][features].mean()
diffs = abs(means_aggr - means_norm)
weights = (diffs / diffs.sum()).to_dict()  # normalized importance

# ----------------------------
# 5️⃣ Dynamic Margins (1 std deviation)
# ----------------------------
margins = df[features].std().to_dict()

# ----------------------------
# 6️⃣ Rule-Based Classifier
# ----------------------------
def rule_classifier(row):
    score = 0.0
    for f in features:
        mid = 0.5 * (means_aggr[f] + means_norm[f])
        m = margins.get(f, 0.2)
        if row[f] > mid + m:
            score += weights[f]
        elif row[f] < mid - m:
            score -= weights[f]

    # Additional combined posture rules
    if row.get("tail_angle_norm", 0) + row.get("head_angle_norm", 0) > 0.5:
        score += 0.1
    if row.get("front_leg_stance", 0) + row.get("back_leg_stance", 0) > 0.5:
        score += 0.1
    if row.get("tail_ratio", 0) < -0.3 and row.get("body_ratio", 0) < -0.3:
        score -= 0.1

    # Thresholds for classification
    if score > 0.25:
        return "Aggressive"
    elif score < -0.25:
        return "Normal"
    else:
        return "Uncertain"

# ----------------------------
# 7️⃣ Apply Classifier
# ----------------------------
df["true_label"] = df["label"].map({1: "Aggressive", 0: "Normal"})
df["rule_pred"] = df.apply(rule_classifier, axis=1)

# Confident accuracy & coverage
confident = df[df.rule_pred != "Uncertain"].copy()
confident["correct"] = confident.rule_pred == confident.true_label
accuracy = confident.correct.mean() * 100
coverage = len(confident) / len(df) * 100
print(f"✅ Rule-Based Accuracy (confident): {accuracy:.2f}% | Coverage: {coverage:.2f}%")

# ----------------------------
# 8️⃣ Save Updated Predictions
# ----------------------------
df.to_csv(OUTPUT_CSV, index=False)
print(f"✅ Updated rule predictions saved → {OUTPUT_CSV}")

# ----------------------------
# 9️⃣ Print Feature Weights
# ----------------------------
print("📊 Rule-Based Feature Weights:")
for f, w in weights.items():
    print(f"  {f}: {w:.3f}")

# ----------------------------
# 🔟 Plot Feature Means
# ----------------------------
plt.figure(figsize=(12, 6))
x = np.arange(len(features))
width = 0.35
plt.bar(x - width/2, means_aggr[features], width, label='Aggressive', color='salmon')
plt.bar(x + width/2, means_norm[features], width, label='Normal', color='skyblue')
plt.xticks(x, features, rotation=45)
plt.ylabel("Mean (Z-score)")
plt.title("Feature Means by Class")
plt.legend()
plt.tight_layout()
plt.show()
