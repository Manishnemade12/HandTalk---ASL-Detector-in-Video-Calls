# HandTalk - ASL Detector in Video Calls


## Overview
HandTalk is a real-time American Sign Language (ASL) detection system integrated into video calls. Our project aims to facilitate communication for individuals using ASL by recognizing hand gestures and converting them into text during live video calls. The system utilizes a pre-trained [MobileNet](https://www.researchgate.net/publication/339806434_Efficient_mobilenet_architecture_as_image_recognition_on_mobile_and_embedded_devices) model, which we fine-tuned on over 30,000 images by unfreezing 10 layers to enhance ASL recognition accuracy.

## Features
- **Real-time ASL Detection in Video Calls:** Users can communicate using sign language, and our model translates it into text messages in real-time.
- **Self-Testing & ASL Learning:** Users can practice and learn ASL through an interactive section on our website.

## Technologies Used
- **Frontend:** [React](w)
- **Backend:** [Node.js](w), WebRTC for video communication , Mediapipe for Hand detection
- **Machine Learning:** [Python](w), [OpenCV](w) for model prediction
- **Signaling Protocol:** WebSockets
- **Model Training:** Custom model trained using MobileNet architecture
  
## Project Architecture
![image](https://github.com/user-attachments/assets/cc1d2090-12d7-41e6-825f-89f4e87c90d4)


## API Endpoints
We have implemented several APIs in our Python backend:

- **`/video_feed`** - Provides video frames for ASL prediction.
- **`/process`** - Uses [MediaPipe](w) to detect hands and extract hand frames for analysis.
- **`/prediction`** - Receives hand frames, predicts the ASL label, and transmits it via WebSockets to the recipient.

## Project Structure
```
HandTalk/
│── client/          # Contains React components
│── server/
│   ├── best_model.keras  # Trained model for ASL prediction
│   ├── index.js         # Node.js backend for WebRTC communication
│   ├── server.py        # Python backend for video processing & prediction
|   ├── ser.py   #python backend for self testing 
│── ModelTrain.ipynb     # Model training script
```

## Installation Guidelines
Follow these steps to set up and run the project:

### 1. Clone the repository
```bash
git clone https://github.com/Manishnemade12/HandTalk---ASL-Detector-in-Video-Calls.git
cd GestureGenius
```

### 2. Set up the Client (React Frontend)
```bash
cd client
npm install    # Install all dependencies
npm start      # Start the React frontend
```

### 3. Set up the Server (Backend)
```bash
cd server
npm install    # Install backend dependencies
node index.js  # Start the Node.js server for WebRTC communication
```

### 4. Set up the Python Server (Machine Learning Backend)
Ensure you have Python installed and install the required dependencies:
```bash
pip install flask opencv-python numpy tensorflow mediapipe flask-cors
```
Then, start the Python backend:
```bash
python server.py
python ser.py
```

Now, access the project at **http://localhost:3000**.

## Model Training
Our model was trained using the **MobileNet** architecture, which is optimized for low computational cost due to its **depthwise and pointwise convolutions**. The model was fine-tuned in approximately **60 minutes** and achieved **high accuracy** in recognizing ASL gestures.

### Why MobileNet?
- Lightweight and efficient
- Suitable for real-time inference
- Optimized for mobile and web applications
