import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

def train():
    dataset_path = 'dataset/nsl_kdd_mock.csv'
    if not os.path.exists(dataset_path):
        print("Dataset not found. Please run dataset_generator.py first.")
        return

    print("Loading dataset...")
    df = pd.read_csv(dataset_path)
    
    X = df.drop('class', axis=1)
    y = df['class']
    
    # Identify numeric and categorical columns dynamically
    # This prevents crashes when swapping from mock numerical data to real mixed data
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Create the preprocessing pipeline
    print("Building preprocessing pipeline...")
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    # Create the full pipeline with the classifier
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("Training Random Forest Pipeline...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the FULL pipeline (scaler + encoder + model)
    print("Saving pipeline...")
    os.makedirs('model', exist_ok=True)
    joblib.dump(pipeline, 'model/pipeline.pkl')
    # Save feature names to validate during inference
    joblib.dump(X.columns.tolist(), 'model/feature_names.pkl')
    print("Training complete! Pipeline saved to model/ directory.")

if __name__ == "__main__":
    train()
