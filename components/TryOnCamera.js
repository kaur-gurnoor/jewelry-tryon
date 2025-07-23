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

  // Preload images once
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
      // Load MediaPipe scripts dynamically
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      const FaceMesh = window.FaceMesh;
      const Camera = window.Camera;

      if (!FaceMesh || !Camera) {
        console.error("MediaPipe FaceMesh or Camera not loaded.");
        return;
      }

      const faceMeshInstance = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMeshInstance.onResults((results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.image) {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const leftEar = landmarks[234];
          const rightEar = landmarks[454];
          const chin = landmarks[152];

          const earringImg = earringImgRef.current;
          const necklaceImg = necklaceImgRef.current;

          // Draw earrings if image loaded
          if (earringImg && earringImg.complete) {
            const size = 40;
            ctx.drawImage(
              earringImg,
              leftEar.x * canvas.width - size / 2,
              leftEar.y * canvas.height - size / 2 + 30,
              size,
              size
            );
            ctx.drawImage(
              earringImg,
              rightEar.x * canvas.width - size / 2 + 5,
              rightEar.y * canvas.height - size / 2 + 30,
              size,
              size
            );
          }

          // Draw necklace if image loaded
          if (necklaceImg && necklaceImg.complete) {
            const size = 150;
            ctx.drawImage(
              necklaceImg,
              chin.x * canvas.width - size / 2,
              chin.y * canvas.height,
              size,
              size / 2
            );
          }
        }
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMeshInstance.send({ image: videoRef.current });
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
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
      />
    </div>
  );
}
