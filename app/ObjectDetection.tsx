import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

interface ObjectDetectionProps {
  streamUrl: MediaStream | null;
  isActive: boolean;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const loadModelAndDetect = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      console.log('Initializing object detection...');
      const model = await cocoSsd.load();
      console.log('Model loaded successfully.');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      video.onloadeddata = () => {
        console.log('Video loaded data.');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const detectFrame = async () => {
          if (!isActive || !context) return;

          console.log('Starting to detect frame...');
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const predictions = await model.detect(video);

          console.log('Predictions:', predictions);
          predictions.forEach((prediction) => {
            console.log('Drawing bounding box:', prediction.bbox);
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
            context.closePath();
          });

          animationFrameId = requestAnimationFrame(detectFrame);
        };

        detectFrame();
      };

      if (streamUrl instanceof MediaStream) {
        video.srcObject = streamUrl;
        console.log('Setting video source as MediaStream:', streamUrl);
        video.play().catch(error => console.error('Error playing video:', error));
      } else {
        console.error('Invalid stream URL or MediaStream:', streamUrl);
      }
    };

    if (isActive) {
      loadModelAndDetect();
    }

    return () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null; // Clear the video source
      }
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, streamUrl]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
      {isActive ? (
        <>
          <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />
        </>
      ) : null}
    </div>
  );
};

export default ObjectDetection;
