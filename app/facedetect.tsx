import React, { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface FaceDetectProps {
  streamUrl: MediaStream | null;
  isActive: boolean;
}

const FaceDetect: React.FC<FaceDetectProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;

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
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
        }
      );

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
          const detections = await faceLandmarker.detectForVideo(video, Date.now());

          console.log('Detections:', detections);
          detections.faceLandmarks.forEach((landmarks) => {
            landmarks.forEach((landmark) => {
              context.beginPath();
              context.arc(landmark.x * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI);
              context.fillStyle = 'red';
              context.fill();
              context.closePath();
            });
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

export default FaceDetect;
