import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import {
    Video as IconVideo,
    VideoOff as IconVideoOff,
    Check as IconCheck,
    Trash2 as IconTrash,
    Download as IconDownload,
    AlertTriangle,
    CircleCheck,
    Zap,
} from '../Common/Icon';

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
                    <AlertTriangle size={16} className="shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Idle state */}
            {recordingState === 'idle' && !recordedVideo && (
                <div className="border-2 border-dashed border-base-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-base-50 text-center">
                    <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
                        <IconVideo size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="font-medium text-base-content text-sm">Sin grabación</p>
                        <p className="text-xs text-base-content/50 mt-0.5">
                            Graba un video como comentario adicional a tu evaluación
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartPreview}
                        leftIcon={IconVideo}
                    >
                        Iniciar cámara
                    </Button>
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDiscard}
                                    leftIcon={IconVideoOff}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="error"
                                    size="sm"
                                    onClick={handleStartRecording}
                                >
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                    Iniciar grabación
                                </Button>
                            </>
                        )}

                        {recordingState === 'recording' && (
                            <Button
                                variant="error"
                                size="sm"
                                onClick={handleStopRecording}
                            >
                                <span className="w-3 h-3 rounded-sm bg-white" />
                                Detener grabación
                            </Button>
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
                            <IconCheck size={14} />
                            Grabado · {formatTime(recordedVideo.duration)}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <CircleCheck size={16} className="text-success shrink-0" />
                        <p className="text-xs text-success font-medium">
                            Video grabado correctamente — {formatTime(recordedVideo.duration)} de duración
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            onClick={handleDiscard}
                            leftIcon={IconTrash}
                        >
                            Descartar y grabar de nuevo
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            leftIcon={IconDownload}
                        >
                            Descargar video
                        </Button>
                        {onAnalyzeVideo && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAnalyzeVideo(recordedVideo)}
                                disabled={isAnalyzing}
                                loading={isAnalyzing}
                                leftIcon={Zap}
                            >
                                Analizar con IA
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            leftIcon={IconDownload}
                        >
                            Descargar video
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoRecorder;
