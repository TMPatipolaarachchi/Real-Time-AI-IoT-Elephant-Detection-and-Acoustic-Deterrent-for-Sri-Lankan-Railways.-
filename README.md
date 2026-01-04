# Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-

# 🐘 Elephant Detection Using YOLOv8

This repository contains a **YOLOv8-based deep learning model** for detecting **adult elephants and elephant calves** under **day, night, and foggy conditions**. The model is trained using a custom dataset collected and prepared for wildlife monitoring and human–elephant conflict mitigation, with a special focus on **railway and forest-edge environments**.

---

## 📌 Project Overview

Elephant–human conflicts and elephant–train collisions are major issues in Sri Lanka. Visual detection systems often fail in **low-light and foggy conditions**. This project aims to address that gap by training a **robust object detection model** capable of identifying:

* 🐘 **Adult Elephants**
* 🐘 **Elephant Calves**

across multiple environmental conditions.

---

## 🧠 Model Details

* **Model Architecture:** YOLOv8 (Ultralytics)
* **Base Weights:** `yolov8s.pt`
* **Framework:** PyTorch (via Ultralytics YOLO)
* **Training Platform:** Google Colab
* **GPU Used:** NVIDIA Tesla T4 / GPU (device=0)

---

## 📂 Dataset Information

* **Total Images:** 2080
* **Image Conditions:**

  * Daytime
  * Nighttime
  * Foggy / low-visibility
* **Classes:**

  * `0` – Adult Elephant
  * `1` – Elephant Calf

### Dataset Structure

```
ElephantDetection_V2/
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
├── test/ (optional)
│   ├── images/
│   └── labels/
└── data.yaml
```

---

## 🏷️ data.yaml Example

```yaml
path: .
train: train/images
val: valid/images

names:
  0: adult_elephant
  1: elephant_calf
```

---

## 🚀 Training Procedure

The model was trained using the following configuration:

```python
from ultralytics import YOLO

model = YOLO("yolov8s.pt")

model.train(
    data="data.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    device=0
)
```

### Training Highlights

* Image size: **640 × 640**
* Epochs: **100**
* Batch size: **16**
* Optimized for mixed lighting and weather conditions

---

## 📊 Results (Summary)

* ✅ Successfully detects **adult elephants** and **calves**
* 🌙 Good performance in **night-time images**
* 🌫️ Improved robustness in **foggy conditions** compared to traditional models

> Detailed metrics such as **mAP, precision, recall**, and **confusion matrix** can be found in the `runs/detect/train/` directory after training.

---

## 🧪 Inference Example

```python
model = YOLO("runs/detect/train/weights/best.pt")
results = model("test_image.jpg", conf=0.5)
results.show()
```

---

## 🔧 Installation

```bash
pip install ultralytics
```

---

## 🌍 Applications

* Elephant–train collision prevention systems
* Wildlife monitoring using IR cameras
* Smart railway safety systems
* Conservation research and behavior analysis

---

## 📌 Future Improvements

* Integrate with **IoT edge devices** (Raspberry Pi + Camera)
* Real-time alert system for railway authorities
* Behavior-aware risk prediction
* Model optimization for edge deployment (TensorRT / ONNX)

---

## 👤 Author

**Supun Tharindu**
Undergraduate – IT / AI & IoT Researcher
Focus: Wildlife Conservation using AI & IoT

---

## 📜 License

This project is intended for **research and educational purposes only**.

---

## ⭐ Acknowledgments

* Ultralytics YOLOv8
* Google Colab
* Open-source wildlife datasets and research community

---

> If you find this project useful, please ⭐ the repository and contribute!
