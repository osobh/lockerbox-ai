import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

interface FaceDetectionProps {
  streamUrl: MediaStream | null;
  isActive: boolean;
}

const FaceDetect: React.FC<FaceDetectionProps> = ({ streamUrl, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const loadModelsAndDetect = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      console.log('Initializing face detection...');
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        console.log('Models loaded successfully.');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      video.onloadeddata = () => {
        console.log('Video loaded data.');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const detectFrame = async () => {
          if (!isActive || !context) return;

          try {
            console.log('Starting to detect frame...');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceExpressions();

            console.log('Detections:', detections);
            faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
            const resizedDetections = faceapi.resizeResults(detections, {
              width: video.videoWidth,
              height: video.videoHeight,
            });
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
          } catch (error) {
            console.error('Error during face detection:', error);
          }

          animationFrameId = requestAnimationFrame(detectFrame);
        };

        detectFrame();
      };

      if (streamUrl instanceof MediaStream) {
        video.srcObject = streamUrl;
        console.log('Setting video source as MediaStream:', streamUrl);
        video.play().catch((error) => console.error('Error playing video:', error));
      } else {
        console.error('Invalid stream URL or MediaStream:', streamUrl);
      }
    };

    if (isActive) {
      loadModelsAndDetect();
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
