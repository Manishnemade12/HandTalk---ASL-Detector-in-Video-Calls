import React, { useEffect, useRef, useState, useCallback } from 'react';

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [localPeerId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [prediction, setPrediction] = useState({ class: '', confidence: 0 });
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const canvasRef = useRef();
  const peerConnectionRef = useRef();
  const wsRef = useRef();
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef();

  // Constants for optimization
  const FRAME_SKIP = 2; // Process every 3rd frame
  const VIDEO_CONSTRAINTS = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    wsRef.current = new WebSocket(`ws://192.168.155.252:8000/ws/${localPeerId}`);
    
    wsRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'offer':
          await handleOffer(message);
          break;
        case 'answer':
          await handleAnswer(message);
          break;
        case 'ice-candidate':
          await handleIceCandidate(message);
          break;
        case 'processed-frame':
          if (remoteVideoRef.current) {
            const img = new Image();
            img.onload = () => {
              const ctx = remoteVideoRef.current.getContext('2d');
              ctx.drawImage(img, 0, 0, remoteVideoRef.current.width, remoteVideoRef.current.height);
            };
            img.src = message.frame;
            setPrediction(message.prediction);
          }
          break;
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Optimized frame capture function
  const captureAndSendFrame = useCallback(() => {
    if (!peerId || !wsRef.current || isProcessingFrame) return;

    frameCountRef.current++;
    if (frameCountRef.current % (FRAME_SKIP + 1) !== 0) {
      animationFrameRef.current = requestAnimationFrame(captureAndSendFrame);
      return;
    }

    const video = localVideoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setIsProcessingFrame(true);
      
      // Compress frame before sending
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'video-frame',
                frame: reader.result,
                target: peerId
              }));
            }
            setIsProcessingFrame(false);
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.7 // Reduced quality for better performance
      );
    }

    animationFrameRef.current = requestAnimationFrame(captureAndSendFrame);
  }, [peerId, isProcessingFrame]);

  // Initialize local stream with optimized settings
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS,
          audio: true
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Start frame capture using requestAnimationFrame
        if (peerId) {
          animationFrameRef.current = requestAnimationFrame(captureAndSendFrame);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [peerId, captureAndSendFrame]);

  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          target: peerId,
          from: localPeerId
        }));
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  }, [localStream, peerId, localPeerId]);

  const handleOffer = async (message) => {
    peerConnectionRef.current = createPeerConnection();
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
    
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer,
        target: message.from,
        from: localPeerId
      }));
    }
  };

  const handleAnswer = async (message) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    }
  };

  const handleIceCandidate = async (message) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(message.candidate)
      );
    }
  };

  const startCall = async () => {
    peerConnectionRef.current = createPeerConnection();
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'offer',
        offer: offer,
        target: peerId,
        from: localPeerId
      }));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.infoSection}>
        <p style={styles.peerId}>Your ID: {localPeerId}</p>
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Enter peer ID"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            style={styles.input}
          />
          <button onClick={startCall} style={styles.button}>
            Start Call
          </button>
        </div>
        <p style={styles.prediction}>
          Prediction: {prediction.class} ({(prediction.confidence * 100).toFixed(2)}%)
        </p>
      </div>
      
      <div style={styles.videoGrid}>
        <div style={styles.videoContainer}>
          <p style={styles.videoLabel}>Local Video</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          <canvas 
            ref={canvasRef} 
            style={styles.hiddenCanvas} 
            width="640" 
            height="480" 
          />
        </div>
        <div style={styles.videoContainer}>
          <p style={styles.videoLabel}>Remote Video</p>
          <canvas
            ref={remoteVideoRef}
            width="640"
            height="480"
            style={styles.video}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  infoSection: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  peerId: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '200px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginTop: '20px',
  },
  videoContainer: {
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  videoLabel: {
    color: '#666',
    margin: '10px',
  },
  video: {
    width: '100%',
    height: '300px',
    backgroundColor: '#2f2f2f',
  },
  hiddenCanvas: {
    display: 'none',
  },
  prediction: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666',
  }
};

export default VideoChat;