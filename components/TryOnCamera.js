import React, { useRef, useEffect } from 'react';

// Utility to dynamically load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

export default function TryOnCamera({ earringImage, necklaceImage }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const earringImgRef = useRef(null);
  const necklaceImgRef = useRef(null);

  // Preload images
  useEffect(() => {
    const earringImg = new Image();
    earringImg.src = earringImage;
    earringImgRef.current = earringImg;

    const necklaceImg = new Image();
    necklaceImg.src = necklaceImage;
    necklaceImgRef.current = necklaceImg;
  }, [earringImage, necklaceImage]);

  useEffect(() => {
    async function setupFaceMesh() {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      const FaceMesh = window.FaceMesh;
      const Camera = window.Camera;

      if (!FaceMesh || !Camera) {
        console.error("MediaPipe FaceMesh or Camera not loaded.");
        return;
      }

      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw mirrored image manually
        if (results.image) {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        if (results.multiFaceLandmarks?.length) {
          const landmarks = results.multiFaceLandmarks[0];

          const flipX = (x) => 1 - x;

          const leftEar = landmarks[234];
          const rightEar = landmarks[454];
          const chin = landmarks[152];

          const earringImg = earringImgRef.current;
          const necklaceImg = necklaceImgRef.current;

          const size = 40;
          if (earringImg?.complete) {
            ctx.drawImage(
              earringImg,
              flipX(leftEar.x) * canvas.width - size / 2,
              leftEar.y * canvas.height - size / 2 + 30,
              size,
              size
            );
            ctx.drawImage(
              earringImg,
              flipX(rightEar.x) * canvas.width - size / 2,
              rightEar.y * canvas.height - size / 2 + 30,
              size,
              size
            );
          }

          if (necklaceImg?.complete) {
            const neckSize = 140;
            ctx.drawImage(
              necklaceImg,
              flipX(chin.x) * canvas.width - neckSize / 2,
              chin.y * canvas.height,
              neckSize,
              neckSize / 2
            );
          }
        }
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    }

    setupFaceMesh();
  }, [earringImage, necklaceImage]);

  return (
    <div style={{ position: 'relative', width: '640px', margin: 'auto' }}>
      <video
        ref={videoRef}
        style={{
          display: 'none',
        }}
        playsInline
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
        }}
      />
    </div>
  );
}
