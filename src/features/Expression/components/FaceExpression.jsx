import "../components/FaceExpression.css"
import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import "./FaceExpression.css";

export default function FaceExpression() {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [expression, setExpression] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    let stream = null;
    let isActive = true;
    let landmarker = null;

    const init = async () => {
      try {
        setError("");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        if (!isActive) return;

        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!isActive) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          landmarker.close();
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (isActive) {
          setIsReady(true);
        }
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

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  const detectExpression = () => {
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
      const video = videoRef.current;

      if (video.readyState < 2) {
        setError("Camera is not ready. Please try again.");
        return;
      }

      // Detect only when the button is clicked.
      const results = landmarkerRef.current.detectForVideo(
        video,
        performance.now(),
      );

      if (!results.faceBlendshapes?.length) {
        setExpression("No face detected");
        return;
      }

      const blendshapes = results.faceBlendshapes[0].categories;

      const getScore = (name) =>
        blendshapes.find((item) => item.categoryName === name)?.score ?? 0;

      const smileLeft = getScore("mouthSmileLeft");
      const smileRight = getScore("mouthSmileRight");

      const jawOpen = getScore("jawOpen");
      const browUp = getScore("browInnerUp");

      const frownLeft = getScore("mouthFrownLeft");
      const frownRight = getScore("mouthFrownRight");

      const happyScore = (smileLeft + smileRight) / 2;
      const sadScore = (frownLeft + frownRight) / 2;
      const surprisedScore = Math.min(jawOpen, browUp);

      console.log({
        happyScore,
        sadScore,
        surprisedScore,
        jawOpen,
        browUp,
      });

      let detectedExpression = "Neutral 😐";

      // Select the strongest matching expression.
      if (
        happyScore > 0.35 &&
        happyScore >= sadScore &&
        happyScore >= surprisedScore
      ) {
        detectedExpression = "Happy 😄";
      } else if (
        jawOpen > 0.35 &&
        browUp > 0.2 &&
        surprisedScore >= happyScore &&
        surprisedScore >= sadScore
      ) {
        detectedExpression = "Surprised 😲";
      } else if (sadScore > 0.2 && sadScore > happyScore) {
        detectedExpression = "Sad 😢";
      }

      setExpression(detectedExpression);
    } catch (err) {
      console.error("Expression detection failed:", err);
      setError("Detection failed. Please try again.");
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
          onClick={detectExpression}
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
