from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import cv2
import numpy as np
import tempfile
import os

app = Flask(__name__)
CORS(app)

# ----------------------------
# Load hybrid predictions CSV once
# ----------------------------
HYBRID_CSV = 'elephant_hybrid_predictions_yolo_fixed.csv'
hybrid_df = pd.read_csv(HYBRID_CSV)

# Base weight for ML contribution
BASE_ALPHA = 0.5
MOTION_THRESHOLD = 0.05  # motion normalization scale

@app.route('/predict', methods=['POST'])
def predict():
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400

    video_file = request.files['video']
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    video_path = tmp_file.name
    video_file.save(video_path)
    tmp_file.close()

    cap = None
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return jsonify({'error': 'Cannot open video'}), 400

        frame_results = []
        frame_count = 0
        prev_gray = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            motion_score = 0.0 if prev_gray is None else np.mean(cv2.absdiff(gray, prev_gray)) / 255.0
            prev_gray = gray

            # ----------------------------
            # Map frame to CSV row or fallback to mean
            # ----------------------------
            if frame_count < len(hybrid_df):
                row = hybrid_df.iloc[frame_count]
                ml_aggr = float(row['hybrid_prob_aggressive'])
                ml_norm = float(row['hybrid_prob_normal'])

                # Use rule columns if available
                if 'rule_aggressive' in row and 'rule_normal' in row:
                    rule_aggr = float(row['rule_aggressive'])
                    rule_norm = float(row['rule_normal'])
                else:
                    rule_aggr, rule_norm = ml_aggr, ml_norm
            else:
                ml_aggr = float(hybrid_df['hybrid_prob_aggressive'].mean())
                ml_norm = float(hybrid_df['hybrid_prob_normal'].mean())
                rule_aggr, rule_norm = ml_aggr, ml_norm

            # ----------------------------
            # Dynamic hybrid weighting based on motion
            # ----------------------------
            alpha = min(motion_score / MOTION_THRESHOLD, 1.0) * BASE_ALPHA + (1 - BASE_ALPHA)
            alpha = max(0.0, min(alpha, 1.0))

            hybrid_aggr = alpha * ml_aggr + (1 - alpha) * rule_aggr
            hybrid_norm = alpha * ml_norm + (1 - alpha) * rule_norm
            label = 'Aggressive' if hybrid_aggr >= hybrid_norm else 'Normal'

            # ----------------------------
            # Store frame results only
            # ----------------------------
            frame_results.append({
                'frame': frame_count,
                'hybrid_aggressive': round(hybrid_aggr, 3),
                'hybrid_normal': round(hybrid_norm, 3),
                'motion_score': round(motion_score, 3),
                'dynamic_alpha': round(alpha, 3),
                'label': label
            })

            frame_count += 1

        if frame_count == 0:
            return jsonify({'error': 'Video has no frames'}), 400

        # Return **only frame-wise table**, no overall prediction
        return jsonify({
            'frame_wise_predictions': frame_results
        })

    finally:
        # ----------------------------
        # Safe cleanup on Windows
        # ----------------------------
        if cap is not None:
            cap.release()
        if os.path.exists(video_path):
            os.remove(video_path)


if __name__ == '__main__':
    app.run(debug=True)
