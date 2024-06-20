# LockerBox AI

LockerBox AI is an advanced media streaming and AI/ML integration platform. Our goal is to capture and broadcast media streams, providing a seamless experience for users to control and integrate these streams with various AI and machine learning projects. Currently, we have implemented technologies like Next.js for the front end, TensorFlow.js for object detection, and MediaPipe for face detection.

## Getting Started

There are 2 Parts to this project:

1. **Media Streaming Capture and Broadcasting:** Setting up the infrastructure to capture and broadcast media streams.
2. **App for Controlling Media Streams and Integrating AI/ML:** Building an application to control these media streams and integrate them with AI/ML based projects.

## Installation

### Prerequisites

Ensure you have the following installed on your system:

- Node.js
- NPM (Node Package Manager)
- Docker
- MediaMTX (formerly rtsp-simple-server)

### Installing Dependencies

Install the project dependencies by running:

```bash
npm install
```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build and Start the Next.js App

First, build your Next.js project for production:

```bash
npm run build
```

Since the files are created in the `out/` directory, start the Nginx webserver:

```bash
docker run -d -p 80:80 -v $PWD/out:/usr/share/nginx/html/out -v $PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro --name nginx-server nginx
```

### Setting up MediaMTX

1. **Download and Install MediaMTX:**

   Download the latest release from the [MediaMTX GitHub repository](https://github.com/bluenviron/mediamtx).

2. **Configure MediaMTX:**

   Create a configuration file `mediamtx.yml`:

   "yaml
   server:
     protocols: [tcp, udp]
     rtspAddress: :8554
     rtmpAddress: :1935
   paths:
     all:
   "

3. **Run MediaMTX:**

   ```bash
   ./mediamtx mediamtx.yml
   ```

4. **Stream from a camera:**

   ```bash
   ffmpeg -i <input_stream> -c copy -f rtsp rtsp://localhost:8554/mystream
   ```

## Usage

### Object Detection

To enable object detection on a video stream, click the "Detect" button next to the respective camera feed. The application uses TensorFlow.js for object detection.

### Face Detection

To enable face detection, click the "Face Detect" button. The application uses MediaPipe for face detection, overlaying detection results on the video stream.



