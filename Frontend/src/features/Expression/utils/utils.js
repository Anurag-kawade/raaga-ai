import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function initializeExpressionDetector(videoElement) {
    let landmarker = null;
    let stream = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });

        videoElement.srcObject = stream;
        await videoElement.play();

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: MODEL_URL,
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1,
        });

        return {
            landmarker,
            cleanup() {
                stream?.getTracks().forEach((track) => track.stop());

                if (videoElement.srcObject === stream) {
                    videoElement.srcObject = null;
                }

                landmarker?.close();
                stream = null;
                landmarker = null;
            },
        };
    } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());

        if (videoElement.srcObject === stream) {
            videoElement.srcObject = null;
        }

        landmarker?.close();
        throw error;
    }
}

export function detectExpression(landmarker, videoElement) {
    if (!landmarker || !videoElement) {
        throw new Error("The expression detector is not initialized.");
    }

    if (videoElement.readyState < 2) {
        throw new Error("Camera is not ready. Please try again.");
    }

    const results = landmarker.detectForVideo(
        videoElement,
        performance.now()
    );

    if (!results.faceBlendshapes?.length) {
        return null;
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

    if (
        happyScore > 0.35 &&
        happyScore >= sadScore &&
        happyScore >= surprisedScore
    ) {
        return "Happy";
    }

    if (
        jawOpen > 0.35 &&
        browUp > 0.2 &&
        surprisedScore >= happyScore &&
        surprisedScore >= sadScore
    ) {
        return "Surprised";
    }

    if (sadScore > 0.2 && sadScore > happyScore) {
        return "Sad";
    }

    return "Neutral";
}