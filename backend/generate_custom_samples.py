import pandas as pd
import numpy as np

def generate():
    # Load the big mock dataset
    df = pd.read_csv('dataset/nsl_kdd_mock.csv')
    
    # Create mostly normal traffic
    normal_df = df[df['class'] == 'normal'].sample(n=180, replace=True, random_state=10)
    attacks_df = df[df['class'] != 'normal'].sample(n=20, replace=True, random_state=10)
    mostly_normal = pd.concat([normal_df, attacks_df]).sample(frac=1, random_state=10)
    mostly_normal = mostly_normal.drop('class', axis=1)
    mostly_normal.to_csv('../normal_traffic_sample.csv', index=False)
    
    # Create heavy attack traffic (mostly DoS and Probes)
    heavy_attacks_df = df[df['class'].isin(['dos', 'probe', 'r2l', 'u2r'])].sample(n=250, replace=True, random_state=20)
    minor_normal = df[df['class'] == 'normal'].sample(n=50, replace=True, random_state=20)
    heavy_attack = pd.concat([heavy_attacks_df, minor_normal]).sample(frac=1, random_state=20)
    heavy_attack = heavy_attack.drop('class', axis=1)
    heavy_attack.to_csv('../heavy_attack_sample.csv', index=False)
    print("Custom CSV files generated successfully.")

if __name__ == "__main__":
    generate()
