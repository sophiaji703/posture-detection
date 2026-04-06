/*Import mediapipe classes*/
import { 
    PoseLandmarker, 
    DrawingUtils,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";



console.log("Track.js is working!");
/*Implement variables*/

//Camera
const cameraButton = document.getElementById('camera-request');
const video = document.getElementById("camera");
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');


//Image processing
const img1 = new Image();
const img2 = new Image();
const keyPoints = [0, 11, 12, 23, 24]; //Nose, right shoulder, left shoulder, right hip, left hip
let reference1 = null;
let reference2 = null;
img2.src = 'WIN_20260223_19_57_10_Pro.jpg';
img1.src = 'WIN_20260223_19_57_18_Pro.jpg';
const status = document.getElementById('status');

//Timestamps
let totalDuration = 0;
let slouchTime = 0;
let trackingStartTime = 0;
let now = null;
let slouchStart = 0;
let endTime = 0;
let percentage = 0;

//Animation and MediaPipe
let imageLandmarker = null;
let poseLandmarker = null;
let isTracking = false;
let drawingUtils = null;
let lastVideoTime = -1;
let animationId = null;


let lastDetection = 0;



async function createPoseLandmarker() {
 const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, // or full/heavy
      delegate: 'CPU',
    },
    runningMode: "VIDEO", 
    numPoses: 1
  });
};

async function detectImageLandmark() {


    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    imageLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, // or full/heavy
     
        },
    runningMode: "IMAGE", 
    numPoses: 1
    });

    const resultsImg1 = imageLandmarker.detect(img1);
    const resultsImg2 = imageLandmarker.detect(img2);
    console.log(resultsImg1);
    console.log(resultsImg2);
    reference1 = resultsImg1.landmarks[0];
    reference2 = resultsImg2.landmarks[0];
}


function euclideanDistance(currentPose, reference) {
    let total = 0;
    for (let i of keyPoints) {
        const dx = currentPose[i].x - reference[i].x;
        const dy = currentPose[i].y - reference[i].y;
        const dz = currentPose[i].z - reference[i].z;
        total += dx * dx + dy * dy + dz * dz;
  }
  return Math.sqrt(total);

}



function predictPose() {
 
    
    /*Process video frame*/
    if (!isTracking) return;

    if (video.readyState < 2) {
        animationId = requestAnimationFrame(predictPose);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (video.currentTime !== lastVideoTime) {
       
        lastVideoTime = video.currentTime;
        
        const results = poseLandmarker.detectForVideo(video, performance.now());
        console.log(results);
     


        
    
    if (results.landmarks && drawingUtils) {
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(
                landmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: "rgb(114, 11, 134)", lineWidth: 5 }
            );

            drawingUtils.drawLandmarks(
                landmarks,
                { color: "#ebdb00", radius: 4 }
            );
        }
    }


    if (results.landmarks.length > 0 && reference1) {
        const current = results.landmarks[0];
        const dis1 = euclideanDistance(current, reference1);
        const dis2 = euclideanDistance(current, reference2);
        now = performance.now();
        console.log(now);

        if (dis1 > 1 || dis2 > 1) {
            status.textContent = 'Status: Poor'
            if (slouchStart == 0) {
                slouchStart = performance.now();
            };
            if (now - lastDetection > 8000) {
                console.log(now - lastDetection);
                new Notification("Sit upright!", {
                    body: "Poor posture was detected."
                });
                lastDetection = performance.now();
     
            } 
        } else {
            if (slouchStart > 0) {
                slouchTime += ((performance.now() - slouchStart) / 1000);
                console.log(slouchTime);
                
                slouchStart = 0;
                status.textContent = 'Status: Good'
            };
            
        }

    }
        
    
    

    };
    
    
    animationId = requestAnimationFrame(predictPose);


};





cameraButton.addEventListener("click", async () => {
    /*cameraButton.disabled = true;*/
    

    if (!poseLandmarker || !imageLandmarker) {
        await createPoseLandmarker();
        await detectImageLandmark();
   
    }

    
    
    if (!isTracking) {
        
        const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: 1280,
            height: 720,
            facingMode: "user"
            
        },
        audio: false
    });
        /*Attach video feed to <video> in track.html*/
        video.srcObject = stream;
        await video.play();
        trackingStartTime = performance.now();
        console.log(performance.now());
        
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        drawingUtils = new DrawingUtils(ctx);
        
      
        
        cameraButton.textContent = "Stop Tracking"
        isTracking = true;
        predictPose();
    

    } else {
        isTracking = false;
        endTime = performance.now();
        totalDuration = (endTime - trackingStartTime) / 1000;
        
        if (slouchTime > 0 && totalDuration) {
            percentage = Math.round(slouchTime / totalDuration * 100);
        } else {
            percentage = 0;
        }
        window.location.href = 'analysis.html';
        
        localStorage.setItem('slouchTime', slouchTime);
        localStorage.setItem('percentage', percentage);
        localStorage.setItem('totalTime', totalDuration);

        if (animationId) cancelAnimationFrame(animationId);
        
        
    };

});

    







 







