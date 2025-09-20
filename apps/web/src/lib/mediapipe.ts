import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { toast } from "sonner";

let faceDetector: FaceDetector | null = null;
let isInitializing = false;

// Function to initialize the MediaPipe FaceDetector.
// This should be called once when the application loads.
export async function initializeFaceDetector() {
  // If initialization is already in progress or completed, do nothing.
  if (faceDetector || isInitializing) {
    return;
  }
  isInitializing = true;
  try {
    console.log("Initializing MediaPipe Face Detector...");
    // Create the task from the WASM files hosted on the CDN.
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        // Use a model that's fast and optimized for web.
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU", // Use GPU for better performance.
      },
      runningMode: "IMAGE",
    });
    console.log("MediaPipe Face Detector initialized successfully.");
  } catch (error) {
    console.error("Error initializing MediaPipe Face Detector:", error);
    toast.error(
      "Could not load AI models for face detection. Please refresh the page."
    );
    faceDetector = null; // Ensure it's null on failure.
  } finally {
    isInitializing = false;
  }
}

// Function to detect a face in an image using the initialized detector.
export async function detectFace(image: HTMLImageElement): Promise<boolean> {
  // Wait if initialization is still in progress.
  while (isInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!faceDetector) {
    console.log("Face detector not ready, attempting to initialize now...");
    await initializeFaceDetector();
    // If it still fails after an explicit attempt, report the error.
    if (!faceDetector) {
      toast.error("Face detection models are not available. Please try again.");
      return false;
    }
  }

  try {
    const detections = faceDetector.detect(image);
    // If the detections array is not empty, it means at least one face was found.
    return detections.detections.length > 0;
  } catch (error) {
    console.error("Error during face detection:", error);
    toast.error("An error occurred during face detection.");
    return false;
  }
}
