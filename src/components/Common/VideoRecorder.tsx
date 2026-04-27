import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'requesting' | 'previewing' | 'recording' | 'stopped';

export interface RecordedVideo {
    url: string;
    blob: Blob;
    duration: number;
    recordedAt: Date;
}

interface VideoRecorderProps {
    onVideoRecorded?: (video: RecordedVideo) => void;
    onAnalyzeVideo?: (video: RecordedVideo) => void;
    isAnalyzing?: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconVideo = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const IconVideoOff = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const IconTrash = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconDownload = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onAnalyzeVideo, isAnalyzing = false }) => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const playbackVideoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Start camera preview
    const handleStartPreview = async () => {
        setErrorMsg(null);
        setRecordingState('requesting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            setRecordingState('previewing');
            requestAnimationFrame(() => {
                if (liveVideoRef.current) {
                    liveVideoRef.current.srcObject = stream;
                    liveVideoRef.current.play().catch(() => {});
                }
            });
        } catch {
            setRecordingState('idle');
            setErrorMsg('No se pudo acceder a la cámara o micrófono. Revisa los permisos del navegador.');
        }
    };

    /* const handleStartPreview = async () => {
        setErrorMsg(null);
        setRecordingState('requesting');
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            // Usa el último dispositivo de video disponible (DroidCam suele aparecer al final)
            const deviceId = videoDevices.at(-1)?.deviceId;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: true,
            });
            streamRef.current = stream;
            setRecordingState('previewing');
            requestAnimationFrame(() => {
                if (liveVideoRef.current) {
                    liveVideoRef.current.srcObject = stream;
                    liveVideoRef.current.play().catch(() => { });
                }
            });
        } catch {
            setRecordingState('idle');
            setErrorMsg('No se pudo acceder a la cámara o micrófono. Revisa los permisos del navegador.');
        }
    }; */

    // Start recording
    const handleStartRecording = () => {
        if (!streamRef.current) return;
        chunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm';

        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
            const video: RecordedVideo = { url, blob, duration, recordedAt: new Date() };
            setRecordedVideo(video);
            setRecordingState('stopped');
            stopStream();
            onVideoRecorded?.(video);
        };

        recorder.start(250);
        startTimeRef.current = Date.now();
        setElapsedSeconds(0);
        setRecordingState('recording');
        timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
    };

    // Stop recording
    const handleStopRecording = () => {
        clearTimer();
        mediaRecorderRef.current?.stop();
    };

    // Discard and reset
    const handleDiscard = () => {
        if (recordedVideo) {
            URL.revokeObjectURL(recordedVideo.url);
        }
        setRecordedVideo(null);
        setRecordingState('idle');
        setElapsedSeconds(0);
        stopStream();
    };

    // Download recorded video
    const handleDownload = () => {
        if (!recordedVideo) return;
        const a = document.createElement('a');
        a.href = recordedVideo.url;
        a.download = `comentario_video_${recordedVideo.recordedAt.toISOString().slice(0, 10)}.webm`;
        a.click();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimer();
            stopStream();
            if (recordedVideo) URL.revokeObjectURL(recordedVideo.url);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Attach stream to live video when state changes to previewing
    useEffect(() => {
        if ((recordingState === 'previewing' || recordingState === 'recording') && liveVideoRef.current && streamRef.current) {
            liveVideoRef.current.srcObject = streamRef.current;
            liveVideoRef.current.play().catch(() => {});
        }
    }, [recordingState]);

    return (
        <div className="space-y-4">
            {/* Error */}
            {errorMsg && (
                <div className="alert alert-error text-sm py-2 px-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMsg}
                </div>
            )}

            {/* Idle state */}
            {recordingState === 'idle' && !recordedVideo && (
                <div className="border-2 border-dashed border-base-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-base-50 text-center">
                    <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium text-base-content text-sm">Sin grabación</p>
                        <p className="text-xs text-base-content/50 mt-0.5">
                            Graba un video como comentario adicional a tu evaluación
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleStartPreview}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        <IconVideo />
                        Iniciar cámara
                    </button>
                </div>
            )}

            {/* Requesting permission */}
            {recordingState === 'requesting' && (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="text-sm text-base-content/60">Solicitando acceso a cámara y micrófono...</p>
                </div>
            )}

            {/* Live preview / recording */}
            {(recordingState === 'previewing' || recordingState === 'recording') && (
                <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                        <video
                            ref={liveVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Recording badge */}
                        {recordingState === 'recording' && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2.5 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                                {formatTime(elapsedSeconds)}
                            </div>
                        )}

                        {/* Preview badge */}
                        {recordingState === 'previewing' && (
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                                Vista previa
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2">
                        {recordingState === 'previewing' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleDiscard}
                                    className="btn btn-ghost btn-sm gap-2"
                                >
                                    <IconVideoOff />
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStartRecording}
                                    className="btn btn-error btn-sm gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                    Iniciar grabación
                                </button>
                            </>
                        )}

                        {recordingState === 'recording' && (
                            <button
                                type="button"
                                onClick={handleStopRecording}
                                className="btn btn-error btn-sm gap-2"
                            >
                                <span className="w-3 h-3 rounded-sm bg-white" />
                                Detener grabación
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Playback of recorded video */}
            {recordingState === 'stopped' && recordedVideo && (
                <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                        <video
                            ref={playbackVideoRef}
                            src={recordedVideo.url}
                            controls
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <IconCheck />
                            Grabado · {formatTime(recordedVideo.duration)}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-success font-medium">
                            Video grabado correctamente — {formatTime(recordedVideo.duration)} de duración
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            type="button"
                            onClick={handleDiscard}
                            className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                        >
                            <IconTrash />
                            Descartar y grabar de nuevo
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="btn btn-outline btn-sm gap-2"
                        >
                            <IconDownload />
                            Descargar video
                        </button>
                        {onAnalyzeVideo && (
                            <button
                                type="button"
                                onClick={() => onAnalyzeVideo(recordedVideo)}
                                disabled={isAnalyzing}
                                className="btn btn-primary btn-sm gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs" />
                                        Analizando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Analizar con IA
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="btn btn-outline btn-sm gap-2"
                        >
                            <IconDownload />
                            Descargar video
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoRecorder;
