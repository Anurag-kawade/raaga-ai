
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  initializeExpressionDetector,
  detectExpression,
} from "../utils/utils.js";
import { useSong } from "../../home/hooks/useSong";
import "./FaceExpression.scss";

const FaceExpression = () => {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const navigate = useNavigate();

  const { loading, handleGetSong } = useSong();

  const [detectorReady, setDetectorReady] = useState(false);
  const [detectedMood, setDetectedMood] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function setupCamera() {
      try {
        const detector = await initializeExpressionDetector(
          videoRef.current
        );

        if (cancelled) {
          detector.cleanup();
          return;
        }

        detectorRef.current = detector;
        setDetectorReady(true);
      } catch (err) {
        console.error("Expression detector initialization failed:", err);

        if (!cancelled) {
          setError(
            "Unable to start the camera. Please check camera permissions."
          );
        }
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      detectorRef.current?.cleanup();
      detectorRef.current = null;
    };
  }, []);

  async function handleDetectExpression() {
    setError("");

    try {
      if (!detectorRef.current || !videoRef.current) {
        setError("Camera is not ready. Please try again.");
        return;
      }

      const mood = detectExpression(
        detectorRef.current.landmarker,
        videoRef.current
      );

      if (mood === null) {
        setDetectedMood("");
        setError(
          "No face detected. Please face the camera and try again."
        );
        return;
      }

      setDetectedMood(mood);

      await handleGetSong({ mood });

      navigate("/player");
    } catch (err) {
      console.error("Failed to detect expression or fetch song:", err);

      setError(
        err.response?.status === 404
          ? `No songs are available for "${detectedMood}" yet.`
          : err.response?.data?.message ||
            "Unable to fetch a song. Please try again."
      );
    }
  }

  return (
    <main className="expression-page">
      <section className="expression-card">
        <header className="expression-header">
          <span className="expression-eyebrow">
            RAAGA AI · EMOTION PLAYER
          </span>

          <h1>Feel the Music.</h1>

          <p>
            Let your expression guide your next song.
            Look into the camera and discover music
            that matches your mood.
          </p>
        </header>

        <div className="camera-container">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />

          {!detectorReady && (
            <div className="camera-overlay">
              {error ? (
                <>
                  <span>Camera unavailable</span>
                  <p>{error}</p>
                </>
              ) : (
                <>
                  <div className="loading-spinner" />
                  <p>Preparing your camera...</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="expression-result" aria-live="polite">
          <span className="result-label">
            {detectedMood ? "YOUR DETECTED MOOD" : "READY TO DISCOVER?"}
          </span>

          <h2>
            {detectedMood || "Let your mood decide"}
          </h2>
        </div>

        <button
          className="detect-button"
          type="button"
          onClick={handleDetectExpression}
          disabled={!detectorReady || loading}
        >
          {loading
            ? "Finding your song..."
            : "Detect My Expression"}
        </button>

        {error && (
          <p className="expression-error" role="alert">
            {error}
          </p>
        )}

        <p className="expression-hint">
          Your camera is used to detect facial expressions.
          No microphone is required.
        </p>
      </section>
    </main>
  );
};

export default FaceExpression;
