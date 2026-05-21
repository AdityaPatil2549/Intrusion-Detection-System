# Sentinel AI – Machine Learning Based Intrusion Detection System ⚔️

> **Disclaimer:** This is an academic prototype demonstrating how machine learning can assist intrusion detection. It is not intended for real-time enterprise security or production-grade deployment.

Sentinel AI is a professional cybersecurity web application that uses machine learning (Random Forest) to analyze network traffic datasets and detect cyberattacks. 

## Features
- **CSV Data Ingestion**: Drag-and-drop interface for network traffic logs.
- **Machine Learning Analysis**: Categorizes traffic into Normal, DoS, Probe, R2L, and U2R.
- **Threat Dashboard**: Visualizes attack percentages, overall threat levels, and ML confidence.
- **Live Terminal Simulation**: Animates prediction logs for presentation purposes.
- **Security Report Export**: Automatically generates a PDF summary of detected threats.

---

## 🛠️ Tech Stack
| Component | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Recharts |
| **Backend** | Python, Flask, Flask-CORS |
| **Machine Learning** | Scikit-learn (Random Forest Classifier), Pandas |
| **Dataset** | NSL-KDD (Mocked/Processed) |

---

## 🚀 How to Run Locally

### 1. Start the Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
pip install -r requirements.txt

# (Optional) Regenerate dataset and train model
python dataset_generator.py
python train_model.py

# Start Flask Server
python app.py
```

### 2. Start the Frontend
Open a new terminal window.
```bash
cd frontend
npm install
npm run dev
```

---

## 🎤 Viva Questions Preparation Guide

To ensure you ace your presentation, prepare these exact questions and answers:

### Basic Machine Learning
**Q: Why did you choose Random Forest?**
*A: Random Forest provides high accuracy and is highly resistant to overfitting because it aggregates multiple decision trees. It's also computationally efficient enough to run locally for this prototype.*

**Q: What is classification?**
*A: It is a supervised learning approach where the model learns from labeled data to categorize new, unseen data into specific classes (e.g., Normal vs. DoS).*

**Q: What is supervised learning?**
*A: A type of ML where the model is trained on a labeled dataset, meaning the algorithm is given the input data alongside the correct output answers to learn the relationship.*

**Q: What is overfitting?**
*A: Overfitting happens when a model learns the training data *too well*, including its noise, meaning it performs poorly on new, unseen data. (Random Forest helps prevent this).*

### Cybersecurity
**Q: What is an intrusion?**
*A: An intrusion is any unauthorized activity or policy violation on a computer network or system.*

**Q: What is the difference between an IDS and an IPS?**
*A: An Intrusion Detection System (IDS) only monitors and alerts administrators about suspicious activity (like our project). An Intrusion Prevention System (IPS) actively attempts to block or stop the attack.*

**Q: What is a DoS attack?**
*A: Denial of Service. It's an attack meant to shut down a machine or network by overwhelming it with traffic, making it inaccessible to legitimate users.*

**Q: Why is an IDS important?**
*A: Firewalls only block traffic based on basic rules (ports/IPs). An IDS analyzes the *behavior* and *content* of the traffic to catch sophisticated attacks that bypass standard firewalls.*

### Dataset
**Q: Why use the NSL-KDD Dataset?**
*A: NSL-KDD is widely used academically. It is a refined version of the original KDD'99 dataset, having removed redundant records to prevent the model from biasing towards frequent attack types.*

**Q: What preprocessing did you perform?**
*A: I used a `ColumnTransformer` pipeline. Numerical features were scaled using a `StandardScaler` (to normalize variance), and categorical features were transformed into numerical values using `OneHotEncoder`.*

**Q: Which features were most important?**
*A: In network traffic, features like `src_bytes` (data sent), `dst_bytes` (data received), and `count` (connections to the same host in the past 2 seconds) are highly indicative of DoS and Probing attacks.*
