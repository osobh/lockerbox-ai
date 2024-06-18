"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import ObjectDetection from './ObjectDetection'; // Import the ObjectDetection component

const cameras = [
  { hostname: 'gitlab.lan', ip: '192.168.68.67', port: '8889', name: 'Gitlab' },
  { hostname: 'rpi01.lan', ip: '192.168.68.82', port: '8889', name: 'Rpi01' },
  { hostname: 'rpi04.lan', ip: '192.168.68.76', port: '8889', name: 'Rpi04' },
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

interface WebRTCVideoProps {
  ip: string;
}

const WebRTCVideo: React.FC<WebRTCVideoProps> = ({ ip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadStream = () => {
    const pc = new RTCPeerConnection();
    const offerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    };

    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        // Handle ICE candidate
      }
    });

    pc.addEventListener('track', (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    });

    pc.createOffer(offerOptions)
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        const offer = pc.localDescription;
        if (offer && offer.sdp) {
          fetch(`http://${ip}:8889/cam/whep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp,
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.text();
            })
            .then((answer) => {
              const desc = new RTCSessionDescription({ type: 'answer', sdp: answer });
              pc.setRemoteDescription(desc);
            })
            .catch((error) => console.error('Error setting remote description:', error));
        }
      })
      .catch((error) => console.error('Error creating offer:', error));
  };

  useEffect(() => {
    loadStream();
  }, [ip]);

  return (
    <video
      ref={videoRef}
      width="640"
      height="480"
      autoPlay
      muted
      onLoadedData={(event) => {
        const videoElement = event.currentTarget;
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
          console.error('Video dimensions are invalid.');
        } else {
          console.log(`Loaded data for ${ip}: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        }
      }}
    />
  );
};

export default function Home() {
  const [streams, setStreams] = useState<{ [key: string]: string | MediaStream | null }>({});
  const [detecting, setDetecting] = useState<{ [key: string]: boolean }>({});

  const startWebRTCStream = async (ip: string) => {
    if (!navigator.mediaDevices) {
      console.error('navigator.mediaDevices is not supported.');
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      console.error('navigator.mediaDevices.getUserMedia is not supported.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStreams((prev) => ({ ...prev, [ip]: stream }));
    } catch (error) {
      console.error('Error accessing local camera:', error);
    }
  };

  const handleStartStream = (ip: string) => {
    console.log(`Start stream button clicked for IP: ${ip}`);
    if (ip === 'local') {
      startWebRTCStream(ip);
    } else {
      setStreams((prev) => {
        const newStreams = { ...prev, [ip]: `http://${ip}:8889/cam/whep` }; // Use WHEP endpoint
        console.log(`Updated streams state:`, newStreams);
        return newStreams;
      });
    }
  };

  const handleStopStream = (ip: string) => {
    console.log(`Stop stream button clicked for IP: ${ip}`);
    const stream = streams[ip];
    if (stream && typeof stream !== 'string') {
      (stream as MediaStream).getTracks().forEach((track) => track.stop());
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
                  {camera.ip === 'local' ? (
                    <video
                      ref={(ref) => {
                        if (ref && streams[camera.ip] && typeof streams[camera.ip] !== 'string') {
                          ref.srcObject = streams[camera.ip] as MediaStream;
                          ref.play();
                        }
                      }}
                      width="640"
                      height="480"
                      autoPlay
                      muted
                      onLoadedData={() => console.log(`Loaded data for ${camera.ip}:`)}
                    />
                  ) : (
                    <WebRTCVideo ip={camera.ip} />
                  )}
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