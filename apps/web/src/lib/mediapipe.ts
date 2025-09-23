import {
  FaceDetector,
  FilesetResolver,
  Detection,
} from "@mediapipe/tasks-vision";

// 定义返回的人脸检测结果的类型，保持与后端DTO一致
export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

let faceDetector: FaceDetector | null = null;
let faceDetectorPromise: Promise<FaceDetector> | null = null;

const initializeFaceDetector = async (): Promise<FaceDetector> => {
  if (faceDetector) {
    return faceDetector;
  }
  if (faceDetectorPromise) {
    return faceDetectorPromise;
  }

  faceDetectorPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU" as const,
      },
      runningMode: "IMAGE",
    });
    faceDetector = detector;
    console.log("FaceDetector initialized successfully.");
    return detector;
  })();

  return faceDetectorPromise;
};

// 这个函数现在会返回所有检测到的人脸的包围盒(bounding box)数组
export const detectFaces = async (file: File): Promise<FaceBoundingBox[]> => {
  try {
    const detector = await initializeFaceDetector();
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const result = detector.detect(image);
        URL.revokeObjectURL(imageUrl);

        if (!result || result.detections.length === 0) {
          resolve([]);
        } else {
          const formattedDetections: FaceBoundingBox[] = result.detections
            .map((d) => d.boundingBox)
            .filter((b): b is Detection["boundingBox"] => !!b) // 确保 boundingBox 存在
            .map((box) =>
              box
                ? {
                    x: box.originX,
                    y: box.originY,
                    width: box.width,
                    height: box.height,
                  }
                : null
            )
            .filter((b): b is FaceBoundingBox => b !== null);
          resolve(formattedDetections);
        }
      };
      image.onerror = (err) => {
        URL.revokeObjectURL(imageUrl);
        reject(err);
      };
      image.src = imageUrl;
    });
  } catch (error) {
    console.error("Error in detectFaces:", error);
    return [];
  }
};
