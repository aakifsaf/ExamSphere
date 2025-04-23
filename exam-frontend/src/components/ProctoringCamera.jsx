/*
  ProctoringCamera Component:
  This component is responsible for accessing the user's webcam, displaying a live video feed, and periodically capturing frames to send to the backend for proctoring purposes.
  It tracks violations and auto-submits the exam if the user exceeds the allowed number of violations.
*/
/*
import React, { useEffect, useRef, useState } from "react";
import { uploadProctorFrame } from "../services/api";

const ProctoringCamera = ({ examId, studentId, handleAutoSubmit }) => {
  const videoRef = useRef(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const requestConsent = () => {
    if (window.confirm("This exam requires webcam access for proctoring. Do you consent to enable your webcam?")) {
      setConsentGiven(true);
    } else {
      alert("Webcam access is required to proceed with the exam.");
    }
  };

  useEffect(() => {
    const getCameraAccess = async () => {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera access granted.");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        alert("Unable to access the webcam. Please check your browser settings.");
      }
    };

    if (consentGiven) {
      getCameraAccess();
    } else {
      console.log("Camera access not requested as consent is not given.");
    }
  }, [consentGiven]);

  useEffect(() => {
    if (!consentGiven) return;

    const captureAndSend = async () => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg");
      const blob = await (await fetch(dataUrl)).blob();

      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");
      formData.append("exam_id", examId);
      formData.append("student_id", studentId);

      try {
        const result = await uploadProctorFrame(formData);
        if (result && result.alert) {
          console.warn("Proctor alert:", result.alert);
          setViolationCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error sending frame:", error);
      }
    };

    const interval = setInterval(captureAndSend, 15000);
    return () => clearInterval(interval);
  }, [consentGiven, examId, studentId]);

  useEffect(() => {
    if (violationCount > 5) {
      alert("You have violated the rules too many times. The exam will now be auto-submitted.");
      handleAutoSubmit();
    }
  }, [violationCount]);

  useEffect(() => {
    if (violationCount > 0) {
      alert(`Warning: You have violated the rules ${violationCount} time(s).`);
    }
  }, [violationCount]);

  useEffect(() => {
    requestConsent();
  }, []);

  return (
    <div className="fixed bottom-0 right-0 rounded-lg border p-2 w-[220px] bg-gray-100 shadow-md">
      <p className="text-center text-sm mb-2 font-semibold">Proctoring Camera</p>
      {consentGiven ? (
        <video ref={videoRef} autoPlay muted className="w-full rounded-lg" />
      ) : (
        <p className="text-center text-red-500">Webcam access is required.</p>
      )}
    </div>
  );
};

export default ProctoringCamera;
*/
