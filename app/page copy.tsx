"use client";

import React, { useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';

const cameras = [
  { hostname: 'gitlab.lan', ip: '192.168.68.67', port: '8889', name: 'Gitlab' },
  { hostname: 'rpi01.lan', ip: '192.168.68.82', port: '8889', name: 'Rpi01' },
  { hostname: 'rpi03.lan', ip: '192.168.68.79', port: '8889', name: 'Rpi03' },
  { hostname: 'rpi04.lan', ip: '192.168.68.76', port: '8889', name: 'Rpi04' },
];

const placeholderImage = 'https://via.placeholder.com/640x480.png?text=Camera+Feed';

export default function Home() {
  const [streams, setStreams] = useState<{ [key: string]: string | null }>({});

  const handleStartStream = (ip: string) => {
    console.log(`Start stream button clicked for IP: ${ip}`);
    setStreams((prev) => {
      const newStreams = { ...prev, [ip]: `http://${ip}:8889/cam` };
      console.log(`Updated streams state:`, newStreams);
      return newStreams;
    });
  };

  const handleStopStream = (ip: string) => {
    console.log(`Stop stream button clicked for IP: ${ip}`);
    setStreams((prev) => {
      const newStreams = { ...prev, [ip]: null };
      console.log(`Updated streams state:`, newStreams);
      return newStreams;
    });
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
                <iframe
                  src={streams[camera.ip]!}
                  width="640"
                  height="480"
                  frameBorder="0"
                  allow="fullscreen"
                  onLoad={() => console.log(`Stream loaded for IP: ${camera.ip}`)}
                  onError={(e) => console.error(`Stream failed for IP: ${camera.ip}`, e)}
                />
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
                  <Button size="small" color="primary" onClick={() => handleStopStream(camera.ip)}>
                    Stop Stream
                  </Button>
                ) : (
                  <Button size="small" color="primary" onClick={() => handleStartStream(camera.ip)}>
                    Start Stream
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
