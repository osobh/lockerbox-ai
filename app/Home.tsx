"use client";

import React, { useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import ObjectDetection from './ObjectDetection';
import FaceDetect from './FaceDetect';
import WebRTCVideo from './WebRTCVideo';

const cameras = [
  { hostname: 'gitlab.lan', ip: '192.168.68.67', port: '8889', name: 'Gitlab' },
  { hostname: 'rpi04.lan', ip: '192.168.68.76', port: '8889', name: 'Rpi04' },
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

const Home: React.FC = () => {
  const [streams, setStreams] = useState<{ [key: string]: MediaStream | null }>({});
  const [detecting, setDetecting] = useState<{ [key: string]: boolean }>({});
  const [faceDetecting, setFaceDetecting] = useState<{ [key: string]: boolean }>({});
  const [startStream, setStartStream] = useState<{ [key: string]: boolean }>({});

  const handleStreamReady = (ip: string, stream: MediaStream) => {
    console.log(`Stream ready for IP: ${ip}`, stream);
    setStreams((prev) => ({ ...prev, [ip]: stream }));
  };

  const handleStartStream = (ip: string) => {
    console.log(`Start stream button clicked for IP: ${ip}`);
    setStartStream((prev) => ({ ...prev, [ip]: true }));
  };

  const handleStopStream = (ip: string) => {
    console.log(`Stop stream button clicked for IP: ${ip}`);
    const stream = streams[ip];
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStreams((prev) => ({ ...prev, [ip]: null }));
    setStartStream((prev) => ({ ...prev, [ip]: false }));
    setDetecting((prev) => ({ ...prev, [ip]: false }));
    setFaceDetecting((prev) => ({ ...prev, [ip]: false }));
  };

  const handleDetect = (ip: string) => {
    console.log(`Detect button clicked for IP: ${ip}`);
    setDetecting((prev) => ({ ...prev, [ip]: true }));
  };

  const handleStopDetect = (ip: string) => {
    console.log(`Stop detect button clicked for IP: ${ip}`);
    setDetecting((prev) => ({ ...prev, [ip]: false }));
  };

  const handleFaceDetect = (ip: string) => {
    console.log(`Face Detect button clicked for IP: ${ip}`);
    setFaceDetecting((prev) => ({ ...prev, [ip]: true }));
  };

  const handleStopFaceDetect = (ip: string) => {
    console.log(`Stop Face Detect button clicked for IP: ${ip}`);
    setFaceDetecting((prev) => ({ ...prev, [ip]: false }));
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
              {startStream[camera.ip] ? (
                <div style={{ position: 'relative' }}>
                  {detecting[camera.ip] ? (
                    <ObjectDetection streamUrl={streams[camera.ip]} isActive={detecting[camera.ip]} />
                  ) : faceDetecting[camera.ip] ? (
                    <FaceDetect streamUrl={streams[camera.ip]} isActive={faceDetecting[camera.ip]} />
                  ) : (
                    <WebRTCVideo ip={camera.ip} onStreamReady={(stream) => handleStreamReady(camera.ip, stream)} startStream={startStream[camera.ip]} />
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
                {startStream[camera.ip] ? (
                  <>
                    <FlatButton color="primary" onClick={() => handleStopStream(camera.ip)}>
                      Stop Stream
                    </FlatButton>
                    {!detecting[camera.ip] && !faceDetecting[camera.ip] && (
                      <>
                        <FlatButton color="secondary" onClick={() => handleDetect(camera.ip)}>
                          Detect
                        </FlatButton>
                        <FlatButton color="secondary" onClick={() => handleFaceDetect(camera.ip)}>
                          Face Detect
                        </FlatButton>
                      </>
                    )}
                    {detecting[camera.ip] && (
                      <FlatButton color="secondary" onClick={() => handleStopDetect(camera.ip)}>
                        Stop Detection
                      </FlatButton>
                    )}
                    {faceDetecting[camera.ip] && (
                      <FlatButton color="secondary" onClick={() => handleStopFaceDetect(camera.ip)}>
                        Stop Face Detection
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
};

export default Home;

