import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

interface ObjectDetectionProps {
  streamUrl: string | MediaStream | null;
  isActive: boolean;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadModelAndDetect = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      console.log('Initializing object detection...');
      const model = await cocoSsd.load();
      console.log('Model loaded successfully.');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      video.onloadeddata = async () => {
        console.log('Video loaded data.');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const detectFrame = async () => {
          if (!isActive || !context) return;

          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const predictions = await model.detect(video);
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          predictions.forEach((prediction) => {
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

          requestAnimationFrame(detectFrame);
        };

        detectFrame();
      };

      if (typeof streamUrl === 'string') {
        video.src = streamUrl;
        console.log('Setting video source as URL:', streamUrl);
        video.play().catch(error => console.error('Error playing video:', error));
      } else if (streamUrl instanceof MediaStream) {
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
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [isActive, streamUrl]);

  return (
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
};

export default ObjectDetection;