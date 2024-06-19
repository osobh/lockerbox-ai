"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import ObjectDetection from './ObjectDetection'; // Import the ObjectDetection component

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

interface WebRTCVideoProps {
  ip: string;
}

const WebRTCVideo: React.FC<WebRTCVideoProps> = ({ ip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadStream = () => {
    console.log(`Starting WebRTC stream for IP: ${ip}`);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    const offerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };

    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
      }
    });

    pc.addEventListener('iceconnectionstatechange', () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('WebRTC: ICE failed, check your network connectivity.');
      }
    });

    pc.addEventListener('track', (event) => {
      if (videoRef.current) {
        console.log('Track event:', event.streams);
        videoRef.current.srcObject = event.streams[0];
      }
    });

    pc.createOffer(offerOptions)
      .then(offer => {
        console.log('Created offer:', offer);
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        if (pc.localDescription && pc.localDescription.sdp) {
          console.log('Local description set:', pc.localDescription.sdp);
          return fetch(`http://${ip}:8889/cam/whep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: pc.localDescription.sdp
          });
        }
      })
      .then(response => response.text())
      .then(answer => {
        console.log('Received answer:', answer);
        const desc = new RTCSessionDescription({ type: 'answer', sdp: answer });
        return pc.setRemoteDescription(desc);
      })
      .catch(error => console.error('Error creating or setting offer:', error));
  };

  useEffect(() => {
    loadStream();
  }, [ip]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      style={{ width: '100%', height: 'auto' }}
      onLoadedData={(event) => {
        const videoElement = event.currentTarget;
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
          console.error('Video dimensions are invalid.');
        } else {
          console.log(`Loaded data for ${ip}: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        }
      }}
      onError={(error) => {
        console.error('Video element error:', error);
      }}
    />
  );
};

export default function Home() {
  const [streams, setStreams] = useState<{ [key: string]: string | MediaStream | null }>({});
  const [detecting, setDetecting] = useState<{ [key: string]: boolean }>({});

  const handleStartStream = (ip: string) => {
    console.log(`Start stream button clicked for IP: ${ip}`);
    setStreams((prev) => {
      const newStreams = { ...prev, [ip]: `http://${ip}:8889/cam/whep` }; // Use WHEP endpoint
      console.log(`Updated streams state:`, newStreams);
      return newStreams;
    });
  };

  const handleStopStream = (ip: string) => {
    console.log(`Stop stream button clicked for IP: ${ip}`);
    const stream = streams[ip];
    if (stream && typeof stream !== 'string') {
      (stream as MediaStream).getTracks().forEach((track) => track.stop());
    }
    setStreams((prev) => ({ ...prev, [ip]: null }));
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
                  <WebRTCVideo ip={camera.ip} />
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
                    <FlatButton color="primary" onClick={() => handleStopStream(camera.ip)}>
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