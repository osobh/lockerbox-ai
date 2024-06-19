import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

const ObjectDetection = ({ streamUrl, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let videoElement;
    let model;

    const detectObjects = async () => {
      if (canvasRef.current && videoElement) {
        const context = canvasRef.current.getContext('2d');
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
          console.error('Video dimensions are invalid.');
          return;
        }
        canvasRef.current.width = videoElement.videoWidth;
        canvasRef.current.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
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
      model = await cocoSsd.load();
      videoElement = document.createElement('video');
      videoElement.srcObject = await navigator.mediaDevices.getUserMedia({ video: { deviceId: streamUrl } });
      videoElement.play();
      detectObjects();
    };

    if (isActive) {
      initializeDetection();
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
    };
  }, [streamUrl, isActive]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />;
};

export default ObjectDetection;