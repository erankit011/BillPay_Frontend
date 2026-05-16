import React, { useState, useRef } from 'react';
import { Mic, Loader2, CheckCircle2, Keyboard } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const VoiceBilling = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [manualText, setManualText] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'voice'
  
  // Form data state for editing parsed data
  const [formData, setFormData] = useState({
    customerName: '',
    amount: '',
    intent: 'UDHAR',
    paymentMode: 'CASH'
  });
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const recognitionRef = useRef(null);

  const startVoiceRecognition = () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert(t('Voice recognition not supported. Please use manual input.'));
        setInputMode('manual');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setResult(null);
        setTranscript(t('Listening... Speak now!'));
      };

      recognition.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;
        console.log('Speech recognized:', speechResult);
        setTranscript(speechResult);
        setIsRecording(false);
        await processCommand(speechResult);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        if (event.error === 'network') {
          setTranscript(t('Network error. Switching to manual input...'));
          // Auto-switch to manual input after 2 seconds
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        } else if (event.error === 'not-allowed') {
          setTranscript(t('Microphone access denied. Please use manual input.'));
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        } else if (event.error === 'no-speech') {
          setTranscript(t('No speech detected. Please try again or use manual input.'));
        } else {
          setTranscript(t('Error: ') + event.error + '. Switching to manual input...');
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsRecording(false);
      alert(t('Failed to start voice recognition. Please use manual input.'));
      setInputMode('manual');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    setIsRecording(false);
  };

  const processCommand = async (text) => {
    setIsProcessing(true);
    setTranscript(t('Processing your command...'));

    const dummyBlob = new Blob(['dummy'], { type: 'audio/webm' });
    const formDataToSend = new FormData();
    formDataToSend.append('audio', dummyBlob, 'voice-entry.webm');
    formDataToSend.append('type', 'GENERAL');
    formDataToSend.append('manualTranscript', text);

    try {
      const res = await api.post('/voice/process', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResult(res.data.data);
        setTranscript(res.data.data.transcript || text);
        
        // Populate form with parsed data
        if (res.data.data.parsedIntent) {
          const parsed = res.data.data.parsedIntent;
          setFormData({
            customerName: parsed.customerName || '',
            amount: parsed.amount || '',
            intent: parsed.intent || 'UDHAR',
            paymentMode: parsed.paymentMode || 'CASH'
          });
          setShowForm(true);
        }
      }
    } catch (error) {
      console.error(error);
      setTranscript(t('Error processing command. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    await processCommand(manualText);
    setManualText('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName.trim() || !formData.amount) {
      alert(t('Please fill in customer name and amount'));
      return;
    }

    setIsSaving(true);
    try {
      // Create transaction with the edited data
      const response = await api.post('/transactions', {
        customerName: formData.customerName,
        amount: parseFloat(formData.amount),
        type: formData.intent,
        paymentMode: formData.paymentMode,
        description: transcript
      });

      if (response.data.success) {
        alert(t('Transaction saved successfully!'));
        // Reset form
        setFormData({
          customerName: '',
          amount: '',
          intent: 'UDHAR',
          paymentMode: 'CASH'
        });
        setShowForm(false);
        setResult(null);
        setTranscript('');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(t('Error saving transaction. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({
      customerName: '',
      amount: '',
      intent: 'UDHAR',
      paymentMode: 'CASH'
    });
    setResult(null);
    setTranscript('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900">{t('Voice Assistant')}</h1>
        <p className="text-gray-500 mt-2">{t('Record voice or type manually')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('Example:')} "Ankit Singh ko 100 rupya udhar diya"</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setInputMode('voice')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            inputMode === 'voice'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
          }`}
        >
          <Mic className="w-5 h-5" />
          {t('Voice Input')}
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            inputMode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
          }`}
        >
          <Keyboard className="w-5 h-5" />
          {t('Manual Input')}
        </button>
      </div>

      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden animate-slide-up card-hover" style={{ animationDelay: '200ms' }}>
          
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="absolute w-48 h-48 bg-blue-50 rounded-full animate-ping opacity-50"></div>
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <button
              onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <Mic className={`w-10 h-10 ${isRecording ? 'animate-pulse' : ''}`} />
              )}
            </button>

            <p className="mt-8 text-lg font-medium text-gray-700">
              {transcript || (isRecording ? t('Listening...') : t('Tap to speak'))}
            </p>
            
            {isRecording && (
              <p className="mt-2 text-sm text-gray-500 animate-pulse">
                {t('Speak now...')}
              </p>
            )}

            {!isRecording && !isProcessing && (
              <div className="mt-6 text-xs text-gray-500 space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-800">⚠️ {t('Voice Recognition Requirements:')}</p>
                <p>• {t('Internet connection required')}</p>
                <p>• {t('Works best in Chrome/Edge browser')}</p>
                <p>• {t('Microphone permission needed')}</p>
                <p className="text-blue-600 font-medium mt-2">💡 {t('Tip: Use Manual Input for offline operation')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Input Mode */}
      {inputMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 animate-slide-up card-hover" style={{ animationDelay: '200ms' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⌨️ {t('Type your command')}
              </label>
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Ankit Singh ko 100 rupya udhar diya"
                disabled={isProcessing}
                autoFocus
              />
              <div className="mt-3 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">📝 {t('Format:')}</p>
                <p>• [Customer Name] ko [Amount] rupya udhar diya</p>
                <p>• [Customer Name] se [Amount] rupya liya</p>
                <p className="font-medium text-gray-700 mt-2">✅ {t('Examples:')}</p>
                <p>• Rahul ko 500 rupya udhar diya</p>
                <p>• Priya se 200 rupya liya</p>
                <p>• Ankit Singh ko 1000 rupya udhar diya</p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isProcessing || !manualText.trim()}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 btn-hover-lift transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('Processing...')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {t('Process Command')}
                </>
              )}
            </button>
          </div>
          
          {transcript && !isProcessing && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
          )}
        </form>
      )}

      {/* Result Display */}
      {result && result.parsedIntent && !showForm && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200 animate-scale-in">
          <div className="flex items-center text-green-800 mb-4">
            <CheckCircle2 className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-bold">{t('Command Recognized')}</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t('Action')}</p>
                <p className="font-semibold text-gray-900">{result.parsedIntent.intent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Amount')}</p>
                <p className="font-semibold text-gray-900 text-lg">₹{result.parsedIntent.amount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">{t('Customer')}</p>
                <p className="font-semibold text-gray-900">{result.parsedIntent.customerName || t('Unknown')}</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-4 text-center">
            {t('Data has been processed. You can review and edit below.')}
          </p>
        </div>
      )}

      {/* Editable Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{t('Review & Edit Transaction')}</h3>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 {t('Customer Name')}
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('Enter customer name')}
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 {t('Amount')} (₹)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('Enter amount')}
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 {t('Transaction Type')}
              </label>
              <select
                name="intent"
                value={formData.intent}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UDHAR">{t('Udhar (Given)')}</option>
                <option value="PAYMENT">{t('Payment (Received)')}</option>
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💳 {t('Payment Mode')}
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CASH">{t('Cash')}</option>
                <option value="UPI">{t('UPI')}</option>
                <option value="CARD">{t('Card')}</option>
                <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
              </select>
            </div>

            {/* Original Command */}
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">{t('Original Command:')}</p>
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    {t('Saving...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 inline mr-2" />
                    {t('Save Transaction')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VoiceBilling;
