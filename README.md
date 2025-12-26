# Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-

<  Elephant Behavior Classification  > 

```md
# 🐘 Elephant Behavior Classification Model

A **Hybrid Machine Learning system** to classify **Elephant Behavior** as **Aggressive** or **Normal** using **YOLO pose-based features + Random Forest + Rule-based logic**.

---

## 📌 Project Description

This project analyzes elephant posture and movement patterns extracted from images to identify aggressive behavior.  
It uses a **hybrid approach** combining:
- Pose/keypoint features extracted via **YOLO**
- **Random Forest** machine learning model
- Rule-based decision layer for improved robustness

---

## 🧠 Features

- YOLO-based pose feature extraction
- Robust feature scaling
- Random Forest classification
- Hybrid (ML + rule-based) prediction logic
- CSV-based input/output for easy analysis

---
```
```
---

## 📦 Dataset

- **Type:** Elephant images + extracted YOLO pose features  
- **Total samples:** ~1000 images (Aggressive: 500, Normal: 500)  

```
```
## 📂 Project Structure

elephent/
│
├── rule.py                        # rule base classify
├── extract_pose_features.py       # YOLO pose feature extraction
├── train_rf_model.py              # Random Forest training
├── hybrid_classify.py             # Hybrid prediction logic
│
├── models/
│   ├── elephant_rf_top7_model_final.pkl
│   └── elephant_scaler_final.pkl
│
├── data/
│   ├── elephant_pose_features_yolo_final.csv
│   └── elephant_hybrid_predictions_final.csv
|   └── elephant_rule_predictions_final.csv
│
├── requirements.txt
└── README.md

````

---

## ⚙️ Requirements

- Python **3.9+**
- pip
- Virtual environment (recommended)

---

## 🛠️ Setup Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/elephent.git
cd elephent
````

### 2️⃣ Create Virtual Environment

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🧪 Train the Model (Optional)

```bash
python train_rf_model.py
```

Outputs:

* `elephant_rf_top7_model_final.pkl`
* `elephant_scaler_final.pkl`

---

## 🐘 Extract Pose Features (Optional)

```bash
python extract_pose_features.py
```

Output:

* `elephant_pose_features_yolo_final.csv`

---

## 🤖 Run Hybrid Classifier

```bash
python hybrid_classify.py
```

Outputs:

* `elephant_hybrid_predictions_final.csv`
* Console summary example:

```
Total samples        : 423
Aggressive predicted : 114 (26.95%)
Normal predicted     : 309 (73.05%)
```

---

## 📦 Libraries Used

* numpy
* pandas
* scikit-learn
* matplotlib
* joblib
* opencv-python
* ultralytics
* tqdm

---

## 🚀 Future Enhancements

* Real-time video inference
* Edge deployment (ESP32 / rasbary)

---


