from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16 MB max upload size for security
CORS(app, resources={r"/api/*": {"origins": "*"}})

PIPELINE_PATH = 'model/pipeline.pkl'
FEATURES_PATH = 'model/feature_names.pkl'

if os.path.exists(PIPELINE_PATH) and os.path.exists(FEATURES_PATH):
    pipeline = joblib.load(PIPELINE_PATH)
    expected_features = joblib.load(FEATURES_PATH)
    print("Pipeline and feature definitions loaded successfully.")
else:
    pipeline = None
    expected_features = None
    print("Warning: Pipeline not found. Please run train_model.py.")

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "model_loaded": pipeline is not None
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if pipeline is None:
        return jsonify({"error": "Machine Learning model is not loaded. Train the model first."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded in request."}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename."}), 400

    try:
        # Read CSV
        df = pd.read_csv(file)
        
        if 'class' in df.columns:
            df = df.drop('class', axis=1)
            
        # Validation: Check dimensions and feature names
        if len(df.columns) != len(expected_features):
            return jsonify({
                "error": f"Dimension Mismatch: The model expects {len(expected_features)} features, but the uploaded dataset has {len(df.columns)} features. Please upload a valid NSL-KDD dataset."
            }), 400
            
        # Reorder to match training just in case
        df = df[expected_features]
        
        # Run inference using the full pipeline (handles scaling and encoding automatically)
        predictions = pipeline.predict(df)
        probabilities = pipeline.predict_proba(df)
        confidences = probabilities.max(axis=1)
        
        df['prediction'] = predictions
        df['confidence'] = confidences
        
        pred_counts = df['prediction'].value_counts().to_dict()
        total_records = len(df)
        
        normal_count = pred_counts.get('normal', 0)
        threat_level = ((total_records - normal_count) / total_records) * 100 if total_records > 0 else 0
        
        logs = df[['prediction', 'confidence']].head(100).to_dict('records')
        
        return jsonify({
            "success": True,
            "total_records": total_records,
            "threat_level": round(threat_level, 2),
            "stats": pred_counts,
            "logs": logs
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
