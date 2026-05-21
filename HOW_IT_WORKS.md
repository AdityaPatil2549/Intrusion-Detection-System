# How Sentinel AI Works

Sentinel AI is a machine-learning-powered Intrusion Detection System (IDS). This document explains the internal architecture, data flow, and algorithms used to detect cyber threats.

---

## 1. System Architecture

The application is built on a modern decoupled architecture:
* **Frontend:** React (Vite) + Tailwind CSS. Responsible for the UI, state management, data visualization, and PDF generation.
* **Backend:** Python + Flask. Serves as the API bridge between the frontend and the machine learning model.
* **Machine Learning Engine:** Scikit-learn (Random Forest). Handles data preprocessing and inference.

---

## 2. Data Flow: Step-by-Step

When you upload a CSV file to Sentinel AI, the following sequence occurs:

1. **Upload Initiation:** The user drags and drops a CSV file containing network traffic logs into the frontend dashboard.
2. **API Request:** The React app bundles this file into a `multipart/form-data` request and POSTs it to the Flask backend (`/api/predict`).
3. **Data Ingestion:** The Flask API receives the file, reads it into a Pandas DataFrame, and verifies that the dataset dimensions match what the model expects.
4. **Preprocessing Pipeline:** 
   * **Categorical Data:** String values (like `protocol_type`) are transformed into numerical arrays using a `OneHotEncoder`.
   * **Numerical Data:** Continuous numerical values (like `src_bytes`) are normalized using a `StandardScaler` so that large numbers don't overwhelm the algorithm.
5. **Inference (Prediction):** The scaled and encoded data is fed into the pre-trained **Random Forest Classifier**. The model generates a specific prediction for each row of traffic (Normal, DoS, Probe, R2L, U2R) alongside a confidence probability score.
6. **Result Aggregation:** The backend counts the total number of threats, calculates an overall threat level percentage, and formats a sample of the logs for the live UI stream.
7. **Visualization:** The frontend receives the JSON response and updates the Dashboard. The Recharts library renders the pie and bar charts, and the live terminal begins animating the logs sequentially.

---

## 3. The Machine Learning Model: Random Forest

Sentinel AI utilizes a **Random Forest Classifier**.

### Why Random Forest?
Random Forest is an ensemble learning method. Instead of relying on a single decision tree (which is prone to overfitting), it creates a "forest" of many decision trees during training. When evaluating new network traffic, every tree makes a prediction, and the forest "votes" on the final output. This makes it highly accurate, resilient to noisy network data, and efficient.

### The Dataset
The model is trained on a structure reflecting the **NSL-KDD dataset**, a benchmark dataset in cybersecurity. It evaluates 41 unique features per network connection, including:
* Duration of the connection
* Protocol type (TCP, UDP, ICMP)
* Bytes sent and received
* Number of failed login attempts
* Connection rates to the same host

---

## 4. Threat Classifications

The system categorizes network traffic into five distinct classes:

1. **Normal:** Standard, benign network traffic with no malicious signatures.
2. **Denial of Service (DoS):** Attacks designed to overwhelm a system with traffic, rendering it unresponsive (e.g., SYN floods).
3. **Probing:** Surveillance activities, such as port scanning, used by attackers to map vulnerabilities before a larger attack.
4. **Remote to Local (R2L):** Unauthorized attempts from a remote machine to gain local access privileges (e.g., password guessing).
5. **User to Root (U2R):** Local attacks where an unprivileged user attempts to exploit vulnerabilities to gain superuser (root) privileges.
