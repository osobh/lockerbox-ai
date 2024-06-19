import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

const ObjectDetection = ({ streamUrl, isActive }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let model;

    const detectObjects = async () => {
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        const predictions = await model.detect(canvasRef.current);
        predictions.forEach(prediction => {
          context.beginPath();
          context.rect(...prediction.bbox);
          context.lineWidth = 2;
          context.strokeStyle = 'red';
          context.fillStyle = 'red';
          context.stroke();
          context.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
          );
        });
        requestAnimationFrame(detectObjects);
      }
    };

    const initializeDetection = async () => {
      console.log('Initializing object detection...');
      try {
        model = await cocoSsd.load();
        console.log('Model loaded successfully.');
        if (streamUrl.startsWith('local')) {
          console.log('Setting up local video stream.');
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
        } else {
          console.log(`Setting up remote video stream from URL: ${streamUrl}`);
          videoRef.current.src = streamUrl;
        }
        videoRef.current.onloadeddata = () => {
          console.log('Video element loaded data:', videoRef.current.videoWidth, videoRef.current.videoHeight);
          detectObjects();
        };
        videoRef.current.onerror = (error) => {
          console.error('Error loading video element:', error);
        };
        videoRef.current.play();
      } catch (error) {
        console.error('Error initializing object detection:', error);
      }
    };

    if (isActive) {
      initializeDetection();
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, [streamUrl, isActive]);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </>
  );
};

export default ObjectDetection;