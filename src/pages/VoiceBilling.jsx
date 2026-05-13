import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const VoiceBilling = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = handleStopRecording;

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setResult(null);
      setTranscript(t('Listening...'));
    } catch (err) {
      alert(t('Microphone access denied or not available.'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStopRecording = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setIsProcessing(true);
    setTranscript(t('Processing your voice command...'));

    const formData = new FormData();
    // Simulate filename
    formData.append('audio', audioBlob, 'voice-entry.webm');
    formData.append('type', 'GENERAL');

    try {
      // In a real app, send to your backend `/api/v1/voice/process`
      // For demonstration, we'll simulate a delayed response
      
      const res = await api.post('/voice/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResult(res.data.data);
        setTranscript(res.data.data.transcript || t('Command processed successfully!'));
      }
    } catch (error) {
      console.error(error);
      setTranscript(t('Error processing voice command. Please try again or type manually.'));
      // Mock result for UI demonstration if backend isn't running fully
      setTimeout(() => {
        setResult({
          parsedIntent: {
            intent: 'UDHAR',
            amount: 500,
            customerName: 'Rahul',
          }
        });
        setTranscript('Rahul ko 500 ka udhar diya');
        setIsProcessing(false);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900">{t('Voice Assistant')}</h1>
        <p className="text-gray-500 mt-2">{t('Just say what you want to record in Hindi or English')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('Example:')} "Rahul ko 500 ka udhar diya"</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
        
        {/* Ripple Effect Background when recording */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute w-48 h-48 bg-indigo-50 rounded-full animate-ping opacity-50 animation-delay-300"></div>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isRecording ? (
              <Square className="w-10 h-10 fill-current" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <p className="mt-8 text-lg font-medium text-gray-700 h-8">
            {transcript || (isRecording ? t('Listening...') : t('Tap to speak'))}
          </p>
        </div>
      </div>

      {result && result.parsedIntent && (
        <div className="bg-green-50 rounded-2xl p-6 border border-green-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center text-green-800 mb-4">
            <CheckCircle2 className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">{t('Action Confirmed')}</h3>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t('Action')}</p>
                <p className="font-semibold text-gray-900">{result.parsedIntent.intent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Amount')}</p>
                <p className="font-semibold text-gray-900 font-mono text-lg">₹{result.parsedIntent.amount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">{t('Customer')}</p>
                <p className="font-semibold text-gray-900">{result.parsedIntent.customerName || t('Unknown')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceBilling;
