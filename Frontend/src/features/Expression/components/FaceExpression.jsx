import { useEffect, useRef, useState } from "react";
import "./FaceExpression.css";

import {
  initializeExpressionDetector,
  detectExpression as getDetectedExpression,
} from "../utils/utils.js";

export default function FaceExpression() {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const cleanupRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [expression, setExpression] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize the camera and MediaPipe when the component mounts.
  useEffect(() => {
    let isActive = true;
    let initialization = null;

    const init = async () => {
      try {
        setError("");

        initialization = await initializeExpressionDetector(videoRef.current);

        // If the component unmounted while initializing, release resources.
        if (!isActive) {
          initialization.cleanup();
          return;
        }

        landmarkerRef.current = initialization.landmarker;
        cleanupRef.current = initialization.cleanup;

        setIsReady(true);
      } catch (err) {
        console.error("Camera or MediaPipe error:", err);

        if (isActive) {
          setError(
            "Unable to start detection. Please allow camera access and check your internet connection.",
          );
        }
      }
    };

    init();

    return () => {
      isActive = false;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      } else if (initialization) {
        initialization.cleanup();
      }

      landmarkerRef.current = null;
    };
  }, []);

  // Detection runs only when the user clicks the button.
  const handleDetectExpression = () => {
    if (
      !isReady ||
      !landmarkerRef.current ||
      !videoRef.current ||
      isDetectingRef.current
    ) {
      return;
    }

    isDetectingRef.current = true;
    setIsDetecting(true);
    setError("");

    try {
      const detectedExpression = getDetectedExpression(
        landmarkerRef.current,
        videoRef.current,
      );

      setExpression(detectedExpression);
    } catch (err) {
      console.error("Expression detection failed:", err);

      setError(err.message || "Detection failed. Please try again.");
    } finally {
      isDetectingRef.current = false;
      setIsDetecting(false);
    }
  };

  return (
    <main className="expression-page">
      <section className="expression-card">
        <div className="expression-header">
          <span className="expression-eyebrow">RAAGA · AI VISION</span>

          <h1>Expression Detector</h1>

          <p>
            Let your face express itself. Click the button to detect your
            current facial expression.
          </p>
        </div>

        <div className="camera-container">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />

          {!isReady && !error && (
            <div className="camera-overlay">
              <span className="loading-spinner" />
              <p>Preparing your camera...</p>
            </div>
          )}
        </div>

        <div className="expression-result" aria-live="polite">
          <span className="result-label">DETECTED EXPRESSION</span>

          <h2>{expression || "Ready when you are"}</h2>
        </div>

        <button
          className="detect-button"
          onClick={handleDetectExpression}
          disabled={!isReady || isDetecting}
        >
          {isDetecting ? "Detecting..." : "Detect Expression"}
        </button>

        {error && <p className="expression-error">{error}</p>}

        <p className="expression-hint">
          {isReady
            ? "Each click captures a fresh expression."
            : "Allow camera access to get started."}
        </p>
      </section>
    </main>
  );
}
