import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, X, Loader, CheckCircle2 } from 'lucide-react';
import './CameraScanner.css';

export function CameraScanner({ onCodeDetected }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedCode, setDetectedCode] = useState(null);
    const [rawText, setRawText] = useState("");
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleCapture = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            setPreview(evt.target.result);
            processImage(evt.target.result);
        };
        reader.readAsDataURL(file);
    };

    const processImage = async (imageData) => {
        setIsProcessing(true);
        setDetectedCode(null);
        setRawText("");

        try {
            const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
                logger: () => { } // silent
            });

            // Guarda o texto cru para debug se precisar
            setRawText(text.trim());

            // Regex extremamente perdoável para "BN96-12345A"
            // Aceita '8' no lugar de B, 'M' ou 'H' no lugar de N, etc.
            const match = text.match(/[B8][NHM]\s*[9gq]\s*[6b]\s*[-–_.]?\s*\d{4,}\s*[A-Z]*/i) || text.match(/BN\s*\d{2}\s*[-–_.]?\s*\d{4,}\s*[A-Z]*/i);

            if (match) {
                // Limpa o lixo que o OCR possa ter gerado e normaliza para BN96-XXXXX
                let code = match[0].replace(/\s/g, '').replace(/[–_.]/g, '-').toUpperCase();
                // Corrige se leu 8N96 em vez de BN96
                if (code.startsWith('8')) code = 'B' + code.substring(1);

                setDetectedCode(code);
                onCodeDetected(code);
            } else {
                setDetectedCode('NOT_FOUND');
            }
        } catch (err) {
            console.error(err);
            setDetectedCode('ERROR');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setPreview(null);
        setDetectedCode(null);
        setRawText("");
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleRetry = () => {
        setPreview(null);
        setDetectedCode(null);
        setRawText("");
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
            fileInputRef.current.click();
        }
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                className="btn-secondary scanner-trigger"
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                title="Ler código da peça por foto"
            >
                <Camera size={18} />
                Ler Peça
            </button>
        );
    }

    return (
        <div className="scanner-overlay">
            <div className="scanner-modal">
                <button className="scanner-close" onClick={handleClose} type="button">
                    <X size={20} />
                </button>

                <h3 className="scanner-title">
                    <Camera size={20} /> Leitor OpenCV / Tesseract
                </h3>
                <p className="scanner-subtitle">
                    Tire a foto <strong>NA HORIZONTAL (Deitada)</strong>. O sistema não consegue ler texto de lado ou de cabeça para baixo.
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    style={{ display: 'none' }}
                />

                {preview && (
                    <div className="scanner-preview">
                        <img src={preview} alt="Foto capturada" />
                    </div>
                )}

                {isProcessing && (
                    <div className="scanner-status processing">
                        <Loader size={20} className="spin" />
                        <span>Processando imagem com OCR...</span>
                    </div>
                )}

                {detectedCode && detectedCode !== 'NOT_FOUND' && detectedCode !== 'ERROR' && (
                    <div className="scanner-status success">
                        <CheckCircle2 size={20} />
                        <span>Código detectado: <strong>{detectedCode}</strong></span>
                    </div>
                )}

                {detectedCode === 'NOT_FOUND' && (
                    <div className="scanner-status error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span>⚠️ Nenhum código BN encontrado. A foto estava deitada (horizontal)?</span>
                        {rawText && (
                            <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', maxHeight: '60px', overflow: 'hidden' }}>
                                OCR leu: {rawText.substring(0, 80)}...
                            </div>
                        )}
                    </div>
                )}

                {detectedCode === 'ERROR' && (
                    <div className="scanner-status error">
                        <span>Erro ao processar imagem. Tente novamente.</span>
                    </div>
                )}

                <div className="scanner-actions">
                    {!isProcessing && (
                        <button type="button" className="btn-secondary" onClick={handleRetry}>
                            <Camera size={16} /> Nova Foto
                        </button>
                    )}
                    {detectedCode && detectedCode !== 'NOT_FOUND' && detectedCode !== 'ERROR' && (
                        <button type="button" className="btn-primary" onClick={handleClose}>
                            Confirmar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
