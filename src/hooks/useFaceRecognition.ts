"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

export function useFaceRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // We use face-api.js for embeddings because MediaPipe tasks-vision JS API 
  // does not expose a native face recognition (embedding) module out of the box, 
  // only FaceLandmarker.
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        // If the models are in public/models.
        // We'll fall back to CDN if local fails, but Next.js public/ is standard.
        // Since we may not have models locally, let's load from a widely used CDN for face-api
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
      } catch (err: any) {
        setErrorMessage("Failed to load AI models. " + err.message);
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      }
    } catch (err: any) {
      setErrorMessage("Camera access denied or unavailable.");
    }
  };

  const getEmbedding = async (): Promise<number[] | null> => {
    if (!videoRef.current || !isModelLoaded) return null;
    
    const detection = await faceapi.detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();
      
    if (detection) {
      // face-api.js returns Float32Array for descriptor
      return Array.from(detection.descriptor);
    }
    return null;
  };

  return {
    videoRef,
    isModelLoaded,
    isCameraReady,
    startCamera,
    getEmbedding,
    errorMessage
  };
}
