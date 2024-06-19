import React, { useRef, useCallback, useEffect } from 'react';

interface WebRTCVideoProps {
  ip: string;
  onStreamReady: (stream: MediaStream) => void;
}

const WebRTCVideo: React.FC<WebRTCVideoProps> = ({ ip, onStreamReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadStream = useCallback(() => {
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
        const stream = event.streams[0];
        videoRef.current.srcObject = stream;
        onStreamReady(stream);  // Pass the MediaStream to the parent component
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
      .then(response => response!.text())
      .then(answer => {
        console.log('Received answer:', answer);
        const desc = new RTCSessionDescription({ type: 'answer', sdp: answer });
        return pc.setRemoteDescription(desc);
      })
      .catch(error => console.error('Error creating or setting offer:', error));
  }, [ip]);

  useEffect(() => {
    loadStream();
  }, [loadStream]);

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
      onError={(event) => {
        console.error('Error loading video element:', event);
      }}
    />
  );
};

export default WebRTCVideo;