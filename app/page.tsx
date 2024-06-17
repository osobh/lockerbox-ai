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
    setStreams((prev) => ({ ...prev, [ip]: `http://${ip}:8889/mystream` }));
  };

  const handleStopStream = (ip: string) => {
    setStreams((prev) => ({ ...prev, [ip]: null }));
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
