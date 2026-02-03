import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AudioRecorder } from 'react-audio-voice-recorder';
import axios from 'axios';
import {
  Mic,
  Upload,
  User,
  Settings,
  Volume2,
  Play,
  Square,
  Trash2,
  Save,
  FileAudio,
  X,
  UploadCloud,
  Loader2,
  ScanText,
  Info,
  CheckCircle,
  Table,
  FileText,
  MessageSquare,
  Video,
  Monitor,
  StopCircle,
  FileVideo,
} from 'lucide-react';

const SpeechToText = ({ onProcessSpeech, meetings = [] }) => {
  const [speaker, setSpeaker] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaMode, setMediaMode] = useState('audio'); // 'audio', 'video', 'screen'
  const [transcriptionMode, setTranscriptionMode] = useState('upload');
  const [transcript, setTranscript] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenMediaRecorder, setScreenMediaRecorder] = useState(null);
  const [screenRecordingChunks, setScreenRecordingChunks] = useState([]);
  const [screenRecordingUrl, setScreenRecordingUrl] = useState(null);
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const {
    transcript: liveTranscript,
    listening,
    resetTranscript: resetLiveTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcriptionMode === 'live') {
      setTranscript(liveTranscript);
    }
  }, [liveTranscript, transcriptionMode]);

  useEffect(() => {
    const savedSpeakers = JSON.parse(localStorage.getItem('meeting_speakers')) || [];
    if (savedSpeakers.length > 0) {
      setSpeakers(savedSpeakers);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (screenRecordingUrl) {
        URL.revokeObjectURL(screenRecordingUrl);
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl, videoUrl, screenRecordingUrl, screenStream]);

  const saveSpeaker = () => {
    if (speaker.trim() && !speakers.includes(speaker.trim())) {
      const newSpeakers = [...speakers, speaker.trim()];
      setSpeakers(newSpeakers);
      localStorage.setItem('meeting_speakers', JSON.stringify(newSpeakers));
    }
  };

  const startListening = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
      interimResults: true,
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (mediaMode === 'audio') {
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file (MP3, WAV, M4A, etc.)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size too large. Please upload audio less than 50MB');
        return;
      }
      setAudioFile(file);
      setVideoFile(null);
      setTranscript('');
      setTranscriptionStatus('');

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    } else if (mediaMode === 'video') {
      if (!file.type.startsWith('video/')) {
        alert('Please upload a video file (MP4, WEBM, MOV, etc.)');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('File size too large. Please upload video less than 100MB');
        return;
      }
      setVideoFile(file);
      setAudioFile(null);
      setTranscript('');
      setTranscriptionStatus('');

      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleAudioRecordingComplete = (blob) => {
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });
    setAudioFile(file);
    setVideoFile(null);
    setTranscript('');
    setTranscriptionStatus('');

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  };

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setScreenStream(stream);
      setIsScreenRecording(true);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setScreenRecordingUrl(url);
        
        const file = new File([blob], `screen-recording-${Date.now()}.webm`, { type: blob.type });
        setVideoFile(file);
        setAudioFile(null);
        
        stream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setScreenRecordingChunks([]);
      };

      setScreenMediaRecorder(mediaRecorder);
      setScreenRecordingChunks(chunks);
      mediaRecorder.start();

    } catch (error) {
      console.error('Error starting screen recording:', error);
      alert('Screen recording failed or was cancelled.');
    }
  };

  const stopScreenRecording = () => {
    if (screenMediaRecorder && screenMediaRecorder.state !== 'inactive') {
      screenMediaRecorder.stop();
      setIsScreenRecording(false);
      setScreenMediaRecorder(null);
    }
  };

  const removeMedia = () => {
    if (mediaMode === 'audio' && audioFile) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioFile(null);
      setAudioUrl(null);
    } else if ((mediaMode === 'video' || mediaMode === 'screen') && videoFile) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (screenRecordingUrl) URL.revokeObjectURL(screenRecordingUrl);
      setVideoFile(null);
      setVideoUrl(null);
      setScreenRecordingUrl(null);
    }
    setUploadProgress(0);
    setTranscript('');
    setTranscriptionStatus('');
  };

  const getCurrentFile = () => {
    if (mediaMode === 'audio') return audioFile;
    if (mediaMode === 'video' || mediaMode === 'screen') return videoFile;
    return null;
  };

  const transcribeMedia = async () => {
    const file = getCurrentFile();
    if (!file) {
      alert(`Please ${mediaMode === 'screen' ? 'record' : 'upload'} a ${mediaMode} file first`);
      return;
    }

    setIsTranscribing(true);
    setUploadProgress(0);
    setTranscriptionStatus('Processing media...');

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('media_type', mediaMode);
      formData.append('language', 'en-US');
      if (speaker) {
        formData.append('speaker', speaker);
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Update your backend endpoint to handle different media types
      const response = await axios.post('/api/transcribe/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 90) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        setTranscript(response.data.transcript);
        setTranscriptionStatus(`${mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)} transcription completed successfully!`);

        setTimeout(() => {
          processTranscript(response.data.transcript);
        }, 1000);
      } else {
        setTranscriptionStatus('Transcription failed. Please try again.');
      }
    } catch (error) {
      console.error('Transcription error:', error);

      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        setTranscriptionStatus('Using demo transcription (API not configured)');

        const sampleTranscript = `
          We need to update the marketing campaign by next week. John will handle the social media posts.
          The budget needs approval from finance department. The deadline is 15/12/2024.
          Technical team should complete the API integration within 3 days.
          We must prioritize the customer feedback system as it's urgent.
          Design team will present mockups on Friday.
          Marketing needs to prepare the quarterly report by end of month.
          Sales team should follow up with potential clients next week.
          The new product launch is scheduled for next month.
        `;

        setTranscript(sampleTranscript);
        setUploadProgress(100);

        setTimeout(() => {
          processTranscript(sampleTranscript);
        }, 1000);
      } else {
        setTranscriptionStatus('Error transcribing media. Please try again.');
      }
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const determineCriticality = (text) => {
    const textLower = text.toLowerCase();
    const highPriorityWords = ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'essential'];
    const lowPriorityWords = ['optional', 'when possible', 'nice to have', 'low priority', 'not urgent'];

    if (highPriorityWords.some((word) => textLower.includes(word))) return 'high';
    if (lowPriorityWords.some((word) => textLower.includes(word))) return 'low';
    return 'medium';
  };

  const extractResponsibilities = (text) => {
    const teamPatterns = [
      /(?:assign|delegate|responsible)\s+(?:to|for)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
      /(?:team|department|group)\s+([A-Z][a-z]+)/g,
    ];

    const responsibilities = new Set();

    teamPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const name = match.replace(/(assign|delegate|responsible|to|for|team|department|group)\s+/gi, '').trim();
          if (name && name.length > 1) {
            responsibilities.add(name);
          }
        });
      }
    });

    const commonTeams = ['marketing', 'sales', 'finance', 'engineering', 'development', 'design', 'support', 'operations'];
    commonTeams.forEach((team) => {
      if (text.toLowerCase().includes(team)) {
        responsibilities.add(team.charAt(0).toUpperCase() + team.slice(1) + ' Team');
      }
    });

    return responsibilities.size > 0 ? Array.from(responsibilities).join(', ') : 'Team';
  };

  const calculateTargetDate = (text) => {
    const today = new Date();

    const datePatterns = [
      /(?:by|before|until)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(?:by|before|until)\s+(next\s+\w+)/i,
      /(?:in|within)\s+(\d+)\s+(?:day|week|month)/i,
      /(?:deadline|due)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1].toLowerCase().includes('next week')) {
            today.setDate(today.getDate() + 7);
            return today.toISOString().split('T')[0];
          } else if (match[1].toLowerCase().includes('next month')) {
            today.setMonth(today.getMonth() + 1);
            return today.toISOString().split('T')[0];
          }
          const dateMatch = match[1].match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
          if (dateMatch) {
            let [, month, day, year] = dateMatch;
            year = year.length === 2 ? `20${year}` : year;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (error) {
          console.error('Date parsing error:', error);
        }
      }
    }

    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  };

  const determineFunction = (text) => {
    const textLower = text.toLowerCase();

    if (textLower.includes('marketing') || textLower.includes('campaign') || textLower.includes('advertisement')) {
      return 'Marketing';
    } else if (textLower.includes('sales') || textLower.includes('customer') || textLower.includes('revenue')) {
      return 'Sales';
    } else if (textLower.includes('engineering') || textLower.includes('technical') || textLower.includes('develop')) {
      return 'Engineering';
    } else if (textLower.includes('finance') || textLower.includes('budget') || textLower.includes('cost')) {
      return 'Finance';
    } else if (textLower.includes('hr') || textLower.includes('human resources') || textLower.includes('employee')) {
      return 'HR';
    } else if (textLower.includes('operations') || textLower.includes('operational') || textLower.includes('process')) {
      return 'Operations';
    } else if (textLower.includes('it') || textLower.includes('technical support') || textLower.includes('system')) {
      return 'IT';
    } else if (textLower.includes('design') || textLower.includes('mockup') || textLower.includes('ui')) {
      return 'Design';
    }

    return 'General';
  };

  const extractProjectName = (text) => {
    const projectPatterns = [
      /project\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /initiative\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /"([^"]+)"\s+(?:project|initiative)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:project|initiative)/i,
    ];

    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    const words = text.split(' ').filter((word) => word.length > 3);
    if (words.length > 2) {
      return `${words[0]} ${words[1]}`;
    }

    return 'Project';
  };

  const processTranscript = async (textToProcess) => {
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    try {
      const sentences = textToProcess
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10)
        .map((s) => s.trim());

      const meetingPoints = sentences.map((sentence, index) => {
        const criticality = determineCriticality(sentence);
        const responsibility = extractResponsibilities(sentence);
        const targetDate = calculateTargetDate(sentence);
        const functionDept = determineFunction(sentence);
        const projectName = extractProjectName(sentence);

        return {
          id: Date.now() + index,
          sno: meetings.length + index + 1,
          function: functionDept,
          project_name: projectName,
          criticality: criticality,
          discussion_point: sentence + (sentence.match(/[.!?]$/) ? '' : '.'),
          responsibility: responsibility,
          target: targetDate,
          remainder: 'weekly',
          status: 'pending',
          action_taken_approval: 'pending-approval',
          created_at: new Date().toISOString(),
          speaker: speaker || 'Unknown',
          media_source: mediaMode,
        };
      });

      await onProcessSpeech(meetingPoints);

      if (transcriptionMode === 'live') {
        resetLiveTranscript();
      } else {
        setTranscript('');
      }
      setSpeaker('');
    } catch (error) {
      console.error('Error processing transcript:', error);
      alert('Error converting to meeting points');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!transcript.trim()) {
      alert('No transcript to process. Please transcribe media first.');
      return;
    }
    await processTranscript(transcript);
  };

  if (transcriptionMode === 'live' && !browserSupportsSpeechRecognition) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-sm text-red-700">
          Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for live transcription.
        </p>
        <button
          onClick={() => setTranscriptionMode('upload')}
          className="mt-3 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
        >
          Switch to Media Upload Mode
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-medium text-gray-900">Transcription Mode</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTranscriptionMode('live')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
              transcriptionMode === 'live'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mic className="h-5 w-5" />
            <span className="text-sm font-medium">Live Speech</span>
          </button>

          <button
            onClick={() => setTranscriptionMode('upload')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
              transcriptionMode === 'upload'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm font-medium">Upload Media</span>
          </button>
        </div>
      </div>

      {/* Media Type Selection (Only show in upload mode) */}
      {transcriptionMode === 'upload' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-gray-600" />
            <h3 className="text-base font-medium text-gray-900">Media Type</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMediaMode('audio')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                mediaMode === 'audio'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mic className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Audio</span>
              <span className="text-xs mt-1">MP3, WAV, etc.</span>
            </button>

            <button
              onClick={() => setMediaMode('video')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                mediaMode === 'video'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Video className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Video</span>
              <span className="text-xs mt-1">MP4, WEBM, etc.</span>
            </button>

            <button
              onClick={() => setMediaMode('screen')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                mediaMode === 'screen'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Monitor className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Screen</span>
              <span className="text-xs mt-1">Record screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Speaker Information */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-medium text-gray-900">Meeting Speaker</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter speaker name or select below"
            />
            <button
              onClick={saveSpeaker}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Save speaker"
            >
              <Save className="h-5 w-5" />
            </button>
          </div>

          {speakers.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Recent Speakers:</p>
              <div className="flex flex-wrap gap-2">
                {speakers.map((sp, index) => (
                  <button
                    key={index}
                    onClick={() => setSpeaker(sp)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Speech Section */}
      {transcriptionMode === 'live' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-5 w-5 text-gray-600" />
            <h3 className="text-base font-medium text-gray-900">Live Speech Controls</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <button
              onClick={startListening}
              disabled={listening}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
                listening
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {listening ? (
                <Mic className="h-6 w-6 mb-2 animate-pulse" />
              ) : (
                <Mic className="h-6 w-6 mb-2" />
              )}
              <span className="text-sm font-medium">{listening ? 'Listening...' : 'Start'}</span>
            </button>

            <button
              onClick={stopListening}
              disabled={!listening}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
                !listening
                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                  : 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
              }`}
            >
              <Square className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Stop</span>
            </button>

            <button
              onClick={resetLiveTranscript}
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Trash2 className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Clear</span>
            </button>

            <button
              onClick={() => processTranscript(transcript)}
              disabled={!transcript || isProcessing}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
                !transcript || isProcessing
                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Play className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">{isProcessing ? 'Processing...' : 'Convert'}</span>
            </button>
          </div>

          {listening && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-green-700 font-medium">Live transcription active</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media Upload/Recording Section */}
      {transcriptionMode === 'upload' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            {mediaMode === 'audio' && <Mic className="h-5 w-5 text-gray-600" />}
            {mediaMode === 'video' && <Video className="h-5 w-5 text-gray-600" />}
            {mediaMode === 'screen' && <Monitor className="h-5 w-5 text-gray-600" />}
            <h3 className="text-base font-medium text-gray-900">
              {mediaMode === 'audio' && 'Upload Audio Recording'}
              {mediaMode === 'video' && 'Upload Video Recording'}
              {mediaMode === 'screen' && 'Record Your Screen'}
            </h3>
          </div>

          <div className="space-y-6">
            {/* File Upload for Audio/Video */}
            {(mediaMode === 'audio' || mediaMode === 'video') && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center">
                  {mediaMode === 'audio' ? (
                    <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
                  ) : (
                    <FileVideo className="h-10 w-10 text-gray-400 mb-3" />
                  )}
                  <p className="text-sm text-gray-600 mb-2">
                    Upload recorded meeting {mediaMode}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {mediaMode === 'audio' 
                      ? 'Supports MP3, WAV, M4A, WEBM (max 50MB)'
                      : 'Supports MP4, WEBM, MOV, AVI (max 100MB)'}
                  </p>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={mediaMode === 'audio' ? 'audio/*' : 'video/*'}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      Choose {mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)} File
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Audio Recorder (only for audio mode) */}
            {mediaMode === 'audio' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Or record audio directly:</p>
                <div className="border border-gray-200 rounded-lg p-4">
                  <AudioRecorder
                    onRecordingComplete={handleAudioRecordingComplete}
                    audioTrackConstraints={{
                      noiseSuppression: true,
                      echoCancellation: true,
                    }}
                    showVisualizer={true}
                    downloadOnSavePress={false}
                    downloadFileExtension="webm"
                  />
                </div>
              </div>
            )}

            {/* Screen Recording Controls */}
            {mediaMode === 'screen' && (
              <div className="space-y-4">
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
                  <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Record your screen with audio</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Share your entire screen, application window, or browser tab
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    {!isScreenRecording ? (
                      <button
                        onClick={startScreenRecording}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Monitor className="h-5 w-5" />
                        Start Screen Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopScreenRecording}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <StopCircle className="h-5 w-5" />
                        Stop Recording
                      </button>
                    )}
                  </div>
                </div>

                {isScreenRecording && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-red-700 font-medium">Screen recording in progress</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Click "Stop Recording" when finished</p>
                  </div>
                )}
              </div>
            )}

            {/* Media Preview */}
            {(audioFile || videoFile || screenRecordingUrl) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {mediaMode === 'audio' ? (
                      <FileAudio className="h-6 w-6 text-blue-600" />
                    ) : (
                      <FileVideo className="h-6 w-6 text-purple-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {mediaMode === 'audio' 
                          ? audioFile?.name 
                          : mediaMode === 'video' 
                            ? videoFile?.name 
                            : 'Screen Recording'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mediaMode === 'audio' && audioFile
                          ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB • ${audioFile.type}`
                          : mediaMode === 'video' && videoFile
                          ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB • ${videoFile.type}`
                          : 'Screen recording'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeMedia}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Audio/Video Player */}
                {(audioUrl || videoUrl || screenRecordingUrl) && (
                  <div className="space-y-2">
                    {mediaMode === 'audio' ? (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={videoUrl || screenRecordingUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      Click play to preview the {mediaMode}
                    </p>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{transcriptionStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Transcribe Button */}
                <button
                  onClick={transcribeMedia}
                  disabled={isTranscribing}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-lg transition-all ${
                    isTranscribing
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Transcribing {mediaMode}...</span>
                    </>
                  ) : (
                    <>
                      <ScanText className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Transcribe {mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)} to Text
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Display */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-medium text-gray-900">
                {transcriptionMode === 'live' ? 'Live Transcript' : `${mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)} Transcript`}
              </h3>
              <p className="text-xs text-gray-600">
                {transcriptionMode === 'live'
                  ? 'Speech appears here in real-time'
                  : `Transcribed text from ${mediaMode} appears here`}
              </p>
            </div>
            {transcript && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  isProcessing ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Table className="h-4 w-4" />
                    Convert to Meeting Points
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
            {transcript ? (
              <div className="space-y-3">
                {transcript.split('. ').map(
                  (sentence, index) =>
                    sentence.trim() && (
                      <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {sentence.trim()}
                          {!sentence.endsWith('.') && '.'}
                        </p>
                      </div>
                    )
                )}
              </div>
            ) : transcriptionMode === 'live' ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Mic className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Start speaking to see transcript here</p>
                <p className="text-xs mt-1">Click "Start" button above</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                {mediaMode === 'audio' && <Mic className="h-10 w-10 mb-3 opacity-50" />}
                {mediaMode === 'video' && <Video className="h-10 w-10 mb-3 opacity-50" />}
                {mediaMode === 'screen' && <Monitor className="h-10 w-10 mb-3 opacity-50" />}
                <p className="text-sm">Upload and transcribe {mediaMode} to see transcript here</p>
                <p className="text-xs mt-1">Click "Transcribe {mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)} to Text" button above</p>
              </div>
            )}
          </div>

          {transcript && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>
                  <span className="font-medium">{transcript.split(' ').length}</span> words
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <MessageSquare className="h-4 w-4" />
                <span>
                  <span className="font-medium">{transcript.split('. ').filter((s) => s.trim()).length}</span> sentences
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <User className="h-4 w-4" />
                <span>
                  Speaker: <span className="font-medium text-blue-600">{speaker || 'Not specified'}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SpeechToText;