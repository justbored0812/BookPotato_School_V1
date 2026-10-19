import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookshelfCameraProps {
  onCapture: (image: string) => void;
  onCancel: () => void;
}

export function BookshelfCamera({ onCapture, onCancel }: BookshelfCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    const stop = () => stream?.getTracks().forEach(track => track.stop());
    const openCamera = async () => {
      setReady(false);
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is unavailable in this browser. Open this app in Chrome or Edge using localhost or HTTPS, then try again.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stop(); return; }
        const video = videoRef.current;
        if (!video) { stop(); return; }
        video.srcObject = stream;
        await video.play();
        if (cancelled) { stop(); return; }
        for (const track of stream.getVideoTracks()) {
          track.onended = () => {
            if (!cancelled) { setReady(false); setError("The camera stopped. Try again to reopen it."); }
          };
        }
      } catch (cause) {
        stop();
        if (cancelled) return;
        const name = cause instanceof Error ? cause.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access was blocked. Allow camera access in your browser settings, then try again. If you're using the VS Code preview, open the app in Chrome or Edge."
          : name === "NotFoundError"
            ? "No camera was found. Connect a camera and try again."
            : name === "NotReadableError"
              ? "The camera could not start. Close other apps using it, then try again."
              : "Could not open the camera. Check your camera and browser permissions, then try again.");
      }
    };
    void openCamera();
    return () => {
      cancelled = true;
      stop();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [attempt]);

  const capture = () => {
    const video = videoRef.current;
    if (!ready || !video?.videoWidth || !video.videoHeight) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image capture unavailable");
      context.drawImage(video, 0, 0);
      onCapture(canvas.toDataURL("image/jpeg", 0.92));
    } catch {
      setError("Could not capture the photo. Try reopening the camera.");
      setReady(false);
    }
  };

  return <div className="space-y-4">
    <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-[4/3]">
      <video ref={videoRef} autoPlay playsInline muted aria-label="Live bookshelf camera preview" className="h-full w-full object-contain" onLoadedData={() => setReady(true)} />
      {!ready && !error && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-white text-sm"><Loader2 className="h-5 w-5 animate-spin" />Opening camera…</div>}
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <p className="text-sm text-muted-foreground">Point your camera at the bookshelf. Keep the book titles clear and well lit.</p>
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
      {error ? <Button className="flex-1" onClick={() => setAttempt(value => value + 1)}>Try Again</Button> : <Button className="flex-1 gap-2" disabled={!ready} onClick={capture}><Camera className="h-4 w-4" />Capture Photo</Button>}
    </div>
  </div>;
}
