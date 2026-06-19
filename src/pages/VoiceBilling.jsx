import { useState, useRef } from 'react';
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
    <div className="w-full">
      <div className="max-w-xl mx-auto space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Voice Assistant')}</h1>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 sm:mt-1.5">{t('Record voice or type manually')}</p>
          <p className="text-xs sm:text-sm font-medium text-[#093C5D] mt-1.5 sm:mt-2 px-4">
            "{t('Example:')} Ankit Singh ko 100 rupya udhar diya"
          </p>
        </div>

        {/* Mode Toggle - Mobile Optimized */}
        <div className="flex justify-center animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex bg-white/80 backdrop-blur-md rounded-xl p-1 border border-gray-200 w-full max-w-md">
            <button
              onClick={() => setInputMode('voice')}
              className={`cursor-pointer flex items-center justify-center gap-2 flex-1 px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                inputMode === 'voice'
                  ? 'bg-[#093C5D] text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mic className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('Voice Input')}</span>
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`cursor-pointer flex items-center justify-center gap-2 flex-1 px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                inputMode === 'manual'
                  ? 'bg-[#093C5D] text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Keyboard className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('Manual Input')}</span>
            </button>
          </div>
        </div>

        {/* Voice Input Mode */}
        {inputMode === 'voice' && (
          <div className="bg-gradient-to-br from-[#F5F5F5] via-purple-50 to-white rounded-xl p-6 md:p-8 lg:p-10 text-center flex flex-col items-center justify-center min-h-[400px] md:min-h-[450px] relative overflow-hidden animate-slide-up border border-[#E5E7EB]" style={{ animationDelay: '200ms' }}>
            
            {/* Animated Background Circles */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 md:w-48 md:h-48 bg-[#D1D5DB] rounded-full animate-ping opacity-60"></div>
                <div className="absolute w-56 h-56 md:w-64 md:h-64 bg-[#E5E7EB] rounded-full animate-ping opacity-40"></div>
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center w-full space-y-6">
              {/* Large Circular Mic Button */}
              <button
                onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isProcessing}
                className={`cursor-pointer w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/40 focus:ring-offset-4 ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-red-500/30 border-4 border-red-300' 
                    : 'bg-[#093C5D] hover:bg-[#082a42] text-white shadow-[#093C5D]/30 border-4 border-[#093C5D]/20'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 animate-spin" />
                ) : (
                  <Mic className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${isRecording ? 'animate-pulse' : ''}`} />
                )}
              </button>

              {/* Tap to speak text */}
              <p className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 px-4">
                {transcript || (isRecording ? t('Listening...') : t('Tap to speak'))}
              </p>
              
              {isRecording && (
                <p className="text-sm font-medium text-gray-600 animate-pulse">
                  {t('Speak now...')}
                </p>
              )}

              {/* Requirements Box - Orange Theme */}
              {!isRecording && !isProcessing && (
                <div className="mt-4 w-full max-w-sm text-left space-y-3 bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-5 rounded-xl border border-orange-200">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-orange-500 text-lg flex-shrink-0">⚠️</div>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-orange-800">{t('Voice Recognition Requirements:')}</p>
                      <ul className="space-y-1 text-gray-700 font-medium">
                        <li>• {t('Internet connection required')}</li>
                        <li>• {t('Works best in Chrome/Edge browser')}</li>
                        <li>• {t('Microphone permission needed')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-orange-200">
                    <div className="text-lg flex-shrink-0">💡</div>
                    <p className="text-[#093C5D] font-semibold text-sm">{t('Tip: Use Manual Input for offline operation')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Input Mode */}
        {inputMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 lg:p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                  ⌨️ {t('Type your command')}
                </label>
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  placeholder="Ankit Singh ko 100 rupya udhar diya"
                  disabled={isProcessing}
                  autoFocus
                />
                <div className="mt-3 text-sm font-medium text-gray-600 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-800">📝 {t('Format:')}</p>
                  <p>• [Customer Name] ko [Amount] rupya udhar diya</p>
                  <p>• [Customer Name] se [Amount] rupya liya</p>
                  <p className="font-semibold text-gray-800 mt-2">✅ {t('Examples:')}</p>
                  <p>• Rahul ko 500 rupya udhar diya</p>
                  <p>• Priya se 200 rupya liya</p>
                  <p>• Ankit Singh ko 1000 rupya udhar diya</p>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing || !manualText.trim()}
                className="cursor-pointer w-full flex justify-center items-center px-5 md:px-6 lg:px-7 py-2.5 md:py-3 lg:py-3.5 rounded-xl text-xs md:text-sm font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 shadow-lg focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:ring-offset-2"
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
              <div className="mt-4 p-4 bg-[#F5F5F5] rounded-xl border border-[#D1D5DB]">
                <p className="text-sm font-medium text-gray-700">{transcript}</p>
              </div>
            )}
          </form>
        )}

        {/* Result Display */}
        {result && result.parsedIntent && !showForm && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 md:p-6 lg:p-8 border border-green-200 animate-scale-in">
            <div className="flex items-center text-green-700 mb-4 md:mb-5">
              <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 mr-2 flex-shrink-0" />
              <h3 className="text-base md:text-lg lg:text-xl font-semibold">{t('Command Recognized')}</h3>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('Action')}</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{result.parsedIntent.intent}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('Amount')}</p>
                  <p className="font-semibold text-[#093C5D] text-lg md:text-xl">₹{result.parsedIntent.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('Customer')}</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm truncate">{result.parsedIntent.customerName || t('Unknown')}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm font-medium text-gray-700 mt-4 md:mt-5 text-center px-2">
              {t('Data has been processed. You can review and edit below.')}
            </p>
          </div>
        )}

        {/* Editable Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 lg:p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('Review & Edit Transaction')}</h3>
              <button
                onClick={handleCancelForm}
                className="cursor-pointer text-gray-400 hover:text-gray-600 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95 focus:outline-none focus:ring-1 focus:ring-gray-400 flex-shrink-0"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 md:space-y-5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                  👤 {t('Customer Name')}
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  placeholder={t('Enter customer name')}
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                  💰 {t('Amount')} (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  placeholder={t('Enter amount')}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                  🎯 {t('Transaction Type')}
                </label>
                <select
                  name="intent"
                  value={formData.intent}
                  onChange={handleFormChange}
                  className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                >
                  <option value="UDHAR">{t('Udhar (Given)')}</option>
                  <option value="PAYMENT">{t('Payment (Received)')}</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                  💳 {t('Payment Mode')}
                </label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleFormChange}
                  className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                >
                  <option value="CASH">{t('Cash')}</option>
                  <option value="UPI">{t('UPI')}</option>
                  <option value="CARD">{t('Card')}</option>
                  <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
                </select>
              </div>

              {/* Original Command */}
              {transcript && (
                <div className="bg-[#F5F5F5] rounded-xl p-4 border border-[#D1D5DB]">
                  <p className="text-xs font-semibold text-[#093C5D] mb-1">{t('Original Command:')}</p>
                  <p className="text-sm font-medium text-gray-800 break-words">{transcript}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="cursor-pointer flex-1 px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-2"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cursor-pointer flex-1 px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center shadow-lg focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:ring-offset-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t('Saving...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {t('Save Transaction')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceBilling;
