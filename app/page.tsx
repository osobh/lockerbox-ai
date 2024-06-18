"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import ObjectDetection from './ObjectDetection'; // Import the ObjectDetection component

const cameras = [
  { hostname: 'gitlab.lan', ip: 'gitlab', port: '8889', name: 'Gitlab' },
  { hostname: 'rpi01.lan', ip: 'rpi01', port: '8889', name: 'Rpi01' },
  { hostname: 'rpi03.lan', ip: 'rpi03', port: '8889', name: 'Rpi03' },
  { hostname: 'rpi04.lan', ip: 'rpi04', port: '8889', name: 'Rpi04' },
  { hostname: 'local', ip: 'local', port: '0', name: 'Local Camera' }, // Added local camera entry
];

const placeholderImage = 'https://via.placeholder.com/640x480.png?text=Camera+Feed';

const FlatButton = styled(Button)({
  border: 'none',
  boxShadow: 'none',
  textTransform: 'none',
  padding: '6px 12px',
  fontSize: '14px',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
});

export default function Home() {
  const [streams, setStreams] = useState<{ [key: string]: string | MediaStream | null }>({});
  const [detecting, setDetecting] = useState<{ [key: string]: boolean }>({});

  const startWebRTCStream = async (ip: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setStreams((prev) => ({ ...prev, [ip]: stream }));
  };

  const handleStartStream = (ip: string) => {
    console.log(`Start stream button clicked for IP: ${ip}`);
    if (ip === 'local') {
      startWebRTCStream(ip);
    } else {
      setStreams((prev) => {
        const newStreams = { ...prev, [ip]: `http://${ip}:8889/cam` };
        console.log(`Updated streams state:`, newStreams);
        return newStreams;
      });
    }
  };

  const handleStopStream = (ip: string) => {
    console.log(`Stop stream button clicked for IP: ${ip}`);
    const stream = streams[ip];
    if (stream && typeof stream !== 'string') {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStreams((prev) => ({ ...prev, [ip]: null }));
    setDetecting((prev) => ({ ...prev, [ip]: false }));
  };

  const handleDetect = (ip: string) => {
    setDetecting((prev) => ({ ...prev, [ip]: true }));
  };

  return (
    <Container>
      <Typography variant="h2" gutterBottom>
        LockerBox.ai Camera Feeds
      </Typography>
      <Grid container spacing={4}>
        {cameras.map((camera) => (
          <Grid item key={camera.ip} xs={12} md={6}>
            <Card>
              {streams[camera.ip] ? (
                <div style={{ position: 'relative' }}>
                  <WebRTCVideo ip={camera.ip} />
                  {detecting[camera.ip] && (
                    <ObjectDetection streamUrl={streams[camera.ip]} />
                  )}
                </div>
              ) : (
                <CardMedia
                  component="img"
                  alt="Camera Feed"
                  height="480"
                  image={placeholderImage}
                  title="Camera Feed"
                />
              )}
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {camera.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  IP: {camera.ip}
                </Typography>
              </CardContent>
              <CardActions>
                {streams[camera.ip] ? (
                  <>
                    <FlatButton color="primary" onClick={() => handleStopStream(camera.ip)}>
                      Stop Stream
                    </FlatButton>
                    {!detecting[camera.ip] ? (
                      <FlatButton color="secondary" onClick={() => handleDetect(camera.ip)}>
                        Detect
                      </FlatButton>
                    ) : (
                      <FlatButton color="secondary" onClick={() => handleStopStream(camera.ip)}>
                        Stop Detection
                      </FlatButton>
                    )}
                  </>
                ) : (
                  <FlatButton color="primary" onClick={() => handleStartStream(camera.ip)}>
                    Start Stream
                  </FlatButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}