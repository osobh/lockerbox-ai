"use client";

import React, { useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import ObjectDetection from './ObjectDetection';
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

  const handleStreamReady = (ip: string, stream: MediaStream) => {
    console.log(`Stream ready for IP: ${ip}`, stream);
    setStreams((prev) => ({ ...prev, [ip]: stream }));
  };

  const handleDetect = (ip: string) => {
    console.log(`Detect button clicked for IP: ${ip}`);
    setDetecting((prev) => ({ ...prev, [ip]: true }));
  };

  const handleStopDetect = (ip: string) => {
    console.log(`Stop detect button clicked for IP: ${ip}`);
    setDetecting((prev) => ({ ...prev, [ip]: false }));
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
                  <WebRTCVideo ip={camera.ip} onStreamReady={(stream) => handleStreamReady(camera.ip, stream)} />
                  <ObjectDetection streamUrl={streams[camera.ip]} isActive={detecting[camera.ip]} />
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
                    <FlatButton color="primary" onClick={() => setStreams((prev) => ({ ...prev, [camera.ip]: null }))}>
                      Stop Stream
                    </FlatButton>
                    {!detecting[camera.ip] ? (
                      <FlatButton color="secondary" onClick={() => handleDetect(camera.ip)}>
                        Detect
                      </FlatButton>
                    ) : (
                      <FlatButton color="secondary" onClick={() => handleStopDetect(camera.ip)}>
                        Stop Detection
                      </FlatButton>
                    )}
                  </>
                ) : (
                  <FlatButton color="primary" onClick={() => handleStreamReady(camera.ip, null)}>
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