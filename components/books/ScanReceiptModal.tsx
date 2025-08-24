
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { extractTransactionFromImage } from '../../services/geminiService';
import { Spinner } from '../Spinner';
import { CameraIcon, CheckCircleIcon, SparklesIcon, XIcon, RefreshCwIcon } from '../icons';

interface ScanReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { date: string; description: string; amount: number; accountId: string; attachmentUrl: string; attachmentFilename: string; }) => void;
}

type ScanStage = 'camera' | 'processing' | 'confirm' | 'error';

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [stage, setStage] = useState<ScanStage>('camera');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Camera access is required. Please enable it in your browser settings.");
            setStage('error');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            handleRetry(); // Reset state every time modal opens
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const handleCapture = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageUrl);
                stopCamera();
                setStage('processing');

                try {
                    const base64String = imageUrl.split(',')[1];
                    const data = await extractTransactionFromImage({
                        inlineData: { data: base64String, mimeType: 'image/jpeg' }
                    });
                    setExtractedData(data);
                    setStage('confirm');
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to process receipt.");
                    setStage('error');
                }
            }
        }
    };

    const handleConfirm = () => {
        if (extractedData && capturedImage) {
            onConfirm({
                ...extractedData,
                attachmentUrl: capturedImage,
                attachmentFilename: `receipt-${new Date().toISOString()}.jpg`
            });
        }
    };
    
    const handleRetry = () => {
        setStage('camera');
        setCapturedImage(null);
        setExtractedData(null);
        setError(null);
        startCamera();
    };


    const renderContent = () => {
        switch (stage) {
            case 'camera':
                return (
                    <>
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button onClick={handleCapture} className="button button-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            <CameraIcon /> Capture Receipt
                        </button>
                    </>
                );
            case 'processing':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                        <Spinner />
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Analyzing receipt...</p>
                    </div>
                );
            case 'confirm':
                return (
                    <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem'}}>
                            <SparklesIcon />
                            <h4 style={{margin: 0}}>AI Extracted Data</h4>
                        </div>
                        {capturedImage && <img src={capturedImage} alt="Captured receipt" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />}
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input type="text" className="input" value={extractedData?.description || ''} onChange={e => setExtractedData({ ...extractedData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2">
                             <div className="form-group">
                                <label className="form-label">Date</label>
                                <input type="date" className="input" value={extractedData?.date || ''} onChange={e => setExtractedData({ ...extractedData, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount</label>
                                <input type="number" className="input" value={extractedData?.amount || 0} onChange={e => setExtractedData({ ...extractedData, amount: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={handleRetry} className="button button-secondary"><RefreshCwIcon /> Retry</button>
                            <button onClick={handleConfirm} className="button button-primary"><CheckCircleIcon /> Confirm & Create</button>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', textAlign: 'center' }}>
                         <XIcon style={{width: '48px', height: '48px', color: 'var(--color-error)'}}/>
                        <h3 style={{marginTop: '1rem'}}>An Error Occurred</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
                        <button onClick={handleRetry} className="button button-secondary" style={{marginTop: '1rem'}}>
                           <RefreshCwIcon /> Try Again
                        </button>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>Scan Receipt</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                {renderContent()}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
};
