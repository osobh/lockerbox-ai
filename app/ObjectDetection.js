import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetection = ({ streamUrl, width, height, isActive }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocoSsd.load();
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const detectFrame = async () => {
        if (!isActive) return;
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error('Video dimensions are invalid.');
          return;
        }
        const predictions = await model.detect(video);
        ctx.clearRect(0, 0, width, height);
        predictions.forEach(prediction => {
          ctx.beginPath();
          ctx.rect(...prediction.bbox);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'green';
          ctx.fillStyle = 'green';
          ctx.stroke();
          ctx.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
          );
        });
        requestAnimationFrame(detectFrame);
      };

      detectFrame();
    };

    loadModel();
  }, [streamUrl, width, height, isActive]);

  useEffect(() => {
    const video = videoRef.current;
    const handleLoadedData = () => {
      console.log(`Video loaded for ${streamUrl} with dimensions: ${video.videoWidth}x${video.videoHeight}`);
    };
    video.addEventListener('loadeddata', handleLoadedData);
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [streamUrl]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0 }}>
      <video
        ref={videoRef}
        src={streamUrl}
        width={width}
        height={height}
        autoPlay
        muted
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

export default ObjectDetection;