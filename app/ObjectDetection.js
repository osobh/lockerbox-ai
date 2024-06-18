"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const ObjectDetection = ({ streamUrl }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    // Load the COCO-SSD model
    cocoSsd.load().then((loadedModel) => {
      setModel(loadedModel);
      console.log("COCO-SSD model loaded.");
    });

    // Set up the video feed
    const video = videoRef.current;
    if (streamUrl && typeof streamUrl === 'string') {
      video.src = streamUrl;
    } else if (streamUrl instanceof MediaStream) {
      video.srcObject = streamUrl;
    }

    video.onloadedmetadata = () => {
      video.play();
    };
  }, [streamUrl]);

  const detectFrame = useCallback((video, model) => {
    model.detect(video).then((predictions) => {
      drawPredictions(predictions);
      requestAnimationFrame(() => {
        detectFrame(video, model);
      });
    });
  }, []);

  const drawPredictions = (predictions) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = "#00FFFF";
      ctx.font = "18px Arial";
      ctx.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  };

  useEffect(() => {
    if (model && videoRef.current) {
      detectFrame(videoRef.current, model);
    }
  }, [model, detectFrame]);

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ display: "block" }}
      ></video>
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      ></canvas>
    </div>
  );
};

export default ObjectDetection;