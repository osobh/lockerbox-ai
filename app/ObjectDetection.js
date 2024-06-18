"use client";

// ObjectDetection.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const ObjectDetection = ({ streamUrl }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    cocoSsd.load().then((loadedModel) => {
      setModel(loadedModel);
      console.log("COCO-SSD model loaded.");
    });

    const video = videoRef.current;

    if (typeof streamUrl === 'string') {
      const pc = new RTCPeerConnection();
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };

      pc.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          // Handle ICE candidate
        }
      });

      pc.addEventListener('track', (event) => {
        video.srcObject = event.streams[0];
      });

      pc.createOffer(offerOptions)
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          fetch(streamUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: pc.localDescription.sdp
          })
            .then(response => response.text())
            .then(answer => pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answer })))
            .catch(error => console.error('Error setting remote description:', error));
        })
        .catch(error => console.error('Error creating offer:', error));
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
    <div>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      ></video>
      <canvas ref={canvasRef} width="640" height="480"></canvas>
    </div>
  );
};

export default ObjectDetection;