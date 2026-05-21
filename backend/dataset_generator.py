import pandas as pd
import numpy as np
from sklearn.datasets import make_classification
import os

def generate_mock_nsl_kdd():
    print("Generating mock NSL-KDD dataset...")
    # 5 classes: Normal, DoS, Probe, R2L, U2R
    X, y = make_classification(
        n_samples=5000, 
        n_features=41, # NSL-KDD has 41 features
        n_informative=15, 
        n_classes=5, 
        weights=[0.53, 0.36, 0.09, 0.01, 0.01], # approximate distribution
        random_state=42
    )
    
    # Feature names mimicking NSL-KDD
    feature_names = [
        "duration", "protocol_type", "service", "flag", "src_bytes", 
        "dst_bytes", "land", "wrong_fragment", "urgent", "hot", 
        "num_failed_logins", "logged_in", "num_compromised", "root_shell", 
        "su_attempted", "num_root", "num_file_creations", "num_shells", 
        "num_access_files", "num_outbound_cmds", "is_host_login", 
        "is_guest_login", "count", "srv_count", "serror_rate", 
        "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate", 
        "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", 
        "dst_host_srv_count", "dst_host_same_srv_rate", 
        "dst_host_diff_srv_rate", "dst_host_same_src_port_rate", 
        "dst_host_srv_diff_host_rate", "dst_host_serror_rate", 
        "dst_host_srv_serror_rate", "dst_host_rerror_rate", 
        "dst_host_srv_rerror_rate"
    ]
    
    df = pd.DataFrame(X, columns=feature_names)
    
    # Map target integers to class labels
    class_mapping = {0: 'normal', 1: 'dos', 2: 'probe', 3: 'r2l', 4: 'u2r'}
    df['class'] = [class_mapping[label] for label in y]
    
    os.makedirs('dataset', exist_ok=True)
    df.to_csv('dataset/nsl_kdd_mock.csv', index=False)
    
    # Generate a smaller file for UI upload testing
    df_test = df.sample(n=200, random_state=1)
    df_test = df_test.drop('class', axis=1) # Upload data doesn't have class usually
    df_test.to_csv('dataset/test_upload.csv', index=False)
    
    print("Mock datasets generated in dataset/ directory.")

if __name__ == "__main__":
    generate_mock_nsl_kdd()
