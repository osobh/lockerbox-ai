import React, { useEffect, useRef } from 'react';
import '@tensorflow/tfjs';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface FaceDetectProps {
  streamUrl: MediaStream | null;
  isActive: boolean;
}

const FaceDetect: React.FC<FaceDetectProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadModelAndDetect = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      console.log('Initializing face detection...');
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_landmarker/face_landmarker.tflite',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
        }
      );

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
          const detections = await faceLandmarker.detectForVideo(video, Date.now());

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          detections.forEach((face: any) => {
            face.landmarks?.forEach((landmark: any) => { // Add the optional chaining operator here
              context.beginPath();
              context.arc(landmark.x, landmark.y, 2, 0, 2 * Math.PI);
              context.fillStyle = 'red';
              context.fill();
              context.closePath();
            });
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

export default FaceDetect;
