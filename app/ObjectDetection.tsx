import React, { useEffect, useRef } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

interface ObjectDetectionProps {
  streamUrl: MediaStream | null;
  isActive: boolean;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadModelAndDetect = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js'
      );

      const faceDetector = await FaceDetector.createFromModelPath(
        vision, 
        'https://storage.googleapis.com/mediapipe-models/face_detection/face_detection_short_range/float16/latest/face_detection_short_range_task.binarypb'
      );

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
          const faces = await faceDetector.detect(video);
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          faces.forEach((face) => {
            context.beginPath();
            context.rect(face.boundingBox.left, face.boundingBox.top, face.boundingBox.width, face.boundingBox.height);
            context.lineWidth = 2;
            context.strokeStyle = 'red';
            context.fillStyle = 'red';
            context.stroke();
            context.closePath();
          });

          requestAnimationFrame(detectFrame);
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
