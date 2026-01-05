

# 🚆🐘 Elephant Risk Prediction Model (ML-Based)

This repository contains a **machine learning–based risk prediction system** designed to estimate the **real-time collision risk between trains and elephants**. The model is trained using structured environmental, behavioral, and railway-related data and is intended to support **AI + IoT wildlife protection systems**, especially for **elephant–train collision prevention in Sri Lanka**.

---

## 📌 Project Overview

Train–elephant collisions are a critical conservation and safety issue. This project predicts a **risk level (LOW / MEDIUM / HIGH)** based on real-time parameters such as:

* Distance between elephant and train
* Train speed
* Elephant behavior
* Elephant group size and social structure
* Weather conditions

The output can be integrated with **driver alerts**.

---

## 🧠 Model Details

* **Algorithm:** Random Forest Classifier
* **Library:** scikit-learn
* **Programming Language:** Python
* **Training Environment:** Google Colab
* **Model Persistence:** Joblib (`.pkl`)

---

## 📂 Dataset Information

* **Dataset Type:** CSV (tabular data)
* **Total Files:** 300 CSV records (combined for training)
* **Target Variable:** `risk_level`
* **Risk Classes:**

  * `LOW`
  * `MEDIUM`
  * `HIGH`

### Features Used

| Feature Name       | Description                                |
| ------------------ | ------------------------------------------ |
| `distance_km`      | Distance between elephant and train (km)   |
| `train_speed_kmh`  | Train speed (km/h)                         |
| `behavioral_state` | Elephant behavior (calm, aggressive.) |
| `elephant_count`   | Number of elephants detected               |
| `social_structure` | Single / herd /family                      |
| `weather`          | Dry / rainy                                |

---

## ⚙️ Data Preprocessing

* Categorical features encoded using **LabelEncoder**
* Separate encoders used for:

  * Behavior
  * Social structure
  * Weather
  * Risk level (target)
* Dataset split:

  * **80% training**
  * **20% testing**

---




### Training Highlights

* Robust to noisy and mixed-condition data
* Handles non-linear relationships well
* Suitable for small-to-medium tabular datasets

---

## 📊 Model Evaluation

The model is evaluated using:

* **Accuracy Score**
* **Precision, Recall, F1-score** (Classification Report)

Example output:

```text
Overall Accuracy: XX.XX%

LOW     → High precision for safe scenarios
MEDIUM  → Balanced predictions
HIGH    → Strong recall for dangerous cases
```

---

## 💾 Saved Artifacts

After training, the following files are saved to Google Drive:

* `elephant_risk_model.pkl` → Trained Random Forest model
* `risk_encoders.pkl` → Dictionary of label encoders

These assets are reused for **real-time inference**.

---

## ⚡ Real-Time Risk Prediction Function

```python
def get_realtime_risk(distance, speed, behavior, count, structure, weather):
    ...
    return risk_label
```

### Example Usage

```python
get_realtime_risk(0.4, 30, 'aggressive', 9, 'herd', 'dry')
# Output: HIGH
```

## 📜 License

This project is intended for **academic and research purposes only**.

---

