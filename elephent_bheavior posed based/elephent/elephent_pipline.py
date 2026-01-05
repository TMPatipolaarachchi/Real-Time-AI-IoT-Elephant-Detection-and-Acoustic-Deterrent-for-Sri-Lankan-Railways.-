import cv2
import numpy as np
import os
import pandas as pd
from tqdm import tqdm
import random
from ultralytics import YOLO

# ----------------------------
# Paths & Settings
# ----------------------------
DATA_DIR = "elephant_images"          # Should contain 'Aggressive' and 'Normal' folders
OUTPUT_CSV = "elephant_pose_features_yolo_final.csv"
IMG_SIZE = (224, 224)
AUGMENT = True
LABELS = {"Aggressive": 1, "Normal": 0}
EPS = 1e-6  # Small value to prevent division by zero

# ----------------------------
# Image Preprocessing
# ----------------------------
def preprocess_image(img_path, size=IMG_SIZE, augment=AUGMENT):
    img = cv2.imread(img_path)
    if img is None:
        return None

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, size)

    if augment:
        # Horizontal flip
        if random.random() > 0.5:
            img = cv2.flip(img, 1)
        # Rotation
        angle = random.uniform(-10, 10)
        M = cv2.getRotationMatrix2D((size[0]//2, size[1]//2), angle, 1)
        img = cv2.warpAffine(img, M, size)
        # Brightness / contrast
        factor = random.uniform(0.8, 1.2)
        img = np.clip(img * factor, 0, 255).astype(np.uint8)
        # Zoom
        zoom = random.uniform(0.9, 1.1)
        M_zoom = cv2.getRotationMatrix2D((size[0]//2, size[1]//2), 0, zoom)
        img = cv2.warpAffine(img, M_zoom, size)

    return img

# ----------------------------
# Load YOLO-Pose Model
# ----------------------------
print("🔄 Loading YOLO-Pose model...")
yolo_model = YOLO("yolov8n-pose.pt")
print("✅ YOLO-Pose model loaded")

# ----------------------------
# Keypoint Detection
# ----------------------------
def detect_keypoints(img):
    results = yolo_model(img, verbose=False)
    kps = results[0].keypoints
    if kps is None or len(kps.xy) == 0:
        return None
    kp = kps.xy[0].cpu().numpy()
    return {
        "ear_left": tuple(kp[3]), "ear_right": tuple(kp[4]),
        "head": tuple(kp[0]), "trunk_base": tuple(kp[1]), "trunk_tip": tuple(kp[2]),
        "tail_base": tuple(kp[5]), "tail_tip": tuple(kp[6]),
        "front_leg_left": tuple(kp[7]), "front_leg_right": tuple(kp[8]),
        "back_leg_left": tuple(kp[9]), "back_leg_right": tuple(kp[10])
    }

# ----------------------------
# Feature Computation
# ----------------------------
def compute_features(kp):
    A = lambda x: np.array(x, dtype=float)

    # Distances
    ear_spread = np.linalg.norm(A(kp["ear_left"]) - A(kp["ear_right"]))
    trunk_length = np.linalg.norm(A(kp["trunk_tip"]) - A(kp["trunk_base"]))
    tail_length = np.linalg.norm(A(kp["tail_tip"]) - A(kp["tail_base"]))
    front_leg_stance = np.linalg.norm(A(kp["front_leg_left"]) - A(kp["front_leg_right"]))
    back_leg_stance = np.linalg.norm(A(kp["back_leg_left"]) - A(kp["back_leg_right"]))
    body_length = np.linalg.norm(A(kp["head"]) - A(kp["tail_tip"])) + EPS
    body_height = np.linalg.norm(A(kp["head"]) - A(kp["tail_base"])) + EPS

    # Angles [-pi, pi] normalized to [-1,1]
    trunk_angle = np.arctan2(kp["trunk_tip"][1]-kp["trunk_base"][1], kp["trunk_tip"][0]-kp["trunk_base"][0])
    head_angle = np.arctan2(kp["head"][1]-kp["trunk_base"][1], kp["head"][0]-kp["trunk_base"][0])
    front_leg_angle = np.arctan2(kp["front_leg_right"][1]-kp["front_leg_left"][1], kp["front_leg_right"][0]-kp["front_leg_left"][0])
    back_leg_angle = np.arctan2(kp["back_leg_right"][1]-kp["back_leg_left"][1], kp["back_leg_right"][0]-kp["back_leg_left"][0])
    tail_angle = np.arctan2(kp["tail_tip"][1]-kp["tail_base"][1], kp["tail_tip"][0]-kp["tail_base"][0])
    ear_angle = np.arctan2(kp["ear_right"][1]-kp["ear_left"][1], kp["ear_right"][0]-kp["ear_left"][0])

    return {
        "ear_spread": ear_spread,
        "trunk_length": trunk_length,
        "tail_length": tail_length,
        "front_leg_stance": front_leg_stance,
        "back_leg_stance": back_leg_stance,
        "ear_ratio": ear_spread / body_length,
        "trunk_ratio": trunk_length / body_length,
        "front_leg_ratio": front_leg_stance / body_length,
        "back_leg_ratio": back_leg_stance / body_length,
        "tail_ratio": tail_length / body_length,
        "body_ratio": body_height / body_length,
        "head_angle_norm": np.clip(head_angle/np.pi, -1, 1),
        "trunk_angle_norm": np.clip(trunk_angle/np.pi, -1, 1),
        "front_leg_angle_norm": np.clip(front_leg_angle/np.pi, -1, 1),
        "back_leg_angle_norm": np.clip(back_leg_angle/np.pi, -1, 1),
        "ear_angle_norm": np.clip(ear_angle/np.pi, -1, 1),
        "tail_angle_norm": np.clip(tail_angle/np.pi, -1, 1)
    }

# ----------------------------
# Process All Images
# ----------------------------
features_list, labels_list = [], []

for label_name, label_val in LABELS.items():
    folder = os.path.join(DATA_DIR, label_name)
    if not os.path.exists(folder):
        continue
    for img_file in tqdm(os.listdir(folder), desc=label_name):
        img_path = os.path.join(folder, img_file)
        img = preprocess_image(img_path)
        if img is None:
            continue
        kp = detect_keypoints(img)
        if kp is None:
            continue
        feat = compute_features(kp)
        features_list.append(feat)
        labels_list.append(label_val)

# ----------------------------
# Save to CSV
# ----------------------------
df = pd.DataFrame(features_list)
df["label"] = labels_list
df.to_csv(OUTPUT_CSV, index=False)
print(f"✅ YOLO features saved → {OUTPUT_CSV}")
