import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

function ImageUploader({ onOcrComplete }) {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processImage = async (file) => {
        setProcessing(true);
        setProgress(0);
        setProgressStatus('Initializing OCR...');

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                        setProgressStatus('Recognizing text...');
                    } else if (m.status === 'loading language traineddata') {
                        setProgressStatus('Loading language model...');
                        setProgress(10);
                    } else if (m.status === 'initializing tesseract') {
                        setProgressStatus('Initializing OCR engine...');
                        setProgress(5);
                    }
                },
            });

            const extractedText = result.data.text;
            onOcrComplete(extractedText);
            setProgressStatus('Complete!');
            setProgress(100);
        } catch (error) {
            console.error('OCR Error:', error);
            setProgressStatus('Error processing image');
        } finally {
            setProcessing(false);
        }
    };

    const handleFileSelect = useCallback((file) => {
        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        setImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Process with OCR
        processImage(file);
    }, []);

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        setImage(null);
        setPreview(null);
        setProgress(0);
        setProgressStatus('');
        onOcrComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            {!preview ? (
                <div
                    className={`image-uploader ${dragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Upload className="image-uploader__icon" size={64} />
                    <p className="image-uploader__text">
                        <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        PNG, JPG, or JPEG (scanned survey form)
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInputChange}
                    />
                </div>
            ) : (
                <div>
                    <div className="image-preview">
                        <img src={preview} alt="Survey form preview" />
                        <button
                            type="button"
                            className="image-preview__remove"
                            onClick={handleRemove}
                            disabled={processing}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {(processing || progress > 0) && (
                        <div className="ocr-progress">
                            <div className="ocr-progress__bar">
                                <div
                                    className="ocr-progress__fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="ocr-progress__text">
                                <span>
                                    {processing && <Loader2 size={14} className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }} />}
                                    {progressStatus}
                                </span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                marginTop: '1rem',
                textAlign: 'center'
            }}>
                For best results, use a clear image with typed text. Format example:<br />
                <code style={{ color: 'var(--color-primary)' }}>Age: 42 • Smoker: yes • Exercise: rarely • Diet: high sugar</code>
            </p>
        </div>
    );
}

export default ImageUploader;
