import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import * as Icons from 'lucide-react';
import { CRITICALITY_OPTIONS, STATUS_OPTIONS } from './constants';

const SpeechToText = ({ onProcessSpeech, meetings = [] }) => {
  const [speaker, setSpeaker] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakers, setSpeakers] = useState(['John Doe', 'Jane Smith', 'Robert Johnson']);
  const [language, setLanguage] = useState('en-US');
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  useEffect(() => {
    const savedSpeakers = JSON.parse(localStorage.getItem('meeting_speakers')) || [];
    if (savedSpeakers.length > 0) {
      setSpeakers(savedSpeakers);
    }
  }, []);

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
      language: language,
      interimResults: true
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  // Helper function to determine criticality based on keywords
  const determineCriticality = (text) => {
    const textLower = text.toLowerCase();
    const highPriorityWords = ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'essential'];
    const lowPriorityWords = ['optional', 'when possible', 'nice to have', 'low priority', 'not urgent'];
    
    if (highPriorityWords.some(word => textLower.includes(word))) return 'high';
    if (lowPriorityWords.some(word => textLower.includes(word))) return 'low';
    return 'medium'; // Default to medium
  };

  // Improved action item extraction
  const extractActionItems = (text) => {
    const actionPatterns = [
      /(?:need to|should|must|will|going to|plan to|have to)\s+([^.!?]+)/gi,
      /(?:action|task|todo)\s*:\s*([^.!?]+)/gi,
      /(?:assign|delegate|responsible)\s+for\s+([^.!?]+)/gi
    ];
    
    const actions = [];
    
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        actions.push(...matches.map(match => match.replace(/(need to|should|must|will|going to|plan to|have to|action|task|todo|assign|delegate|responsible for)\s*:\s*/i, '').trim()));
      }
    });
    
    return actions.length > 0 ? actions.join('; ') : 'No specific action identified';
  };

  // Improved responsibility extraction
  const extractResponsibilities = (text) => {
    const teamPatterns = [
      /(?:assign|delegate|responsible)\s+(?:to|for)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
      /(?:team|department|group)\s+([A-Z][a-z]+)/g,
      /(?:@|to)\s+([A-Z][a-z]+)/g
    ];
    
    const responsibilities = new Set();
    
    teamPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const name = match.replace(/(assign|delegate|responsible|to|for|team|department|group|@)\s+/gi, '').trim();
          if (name && name.length > 1) {
            responsibilities.add(name);
          }
        });
      }
    });
    
    // Also check for common team names
    const commonTeams = ['marketing', 'sales', 'finance', 'engineering', 'development', 'design', 'support', 'operations'];
    commonTeams.forEach(team => {
      if (text.toLowerCase().includes(team)) {
        responsibilities.add(team.charAt(0).toUpperCase() + team.slice(1));
      }
    });
    
    return responsibilities.size > 0 ? Array.from(responsibilities).join(', ') : 'Team';
  };

  // Calculate target date based on content
  const calculateTargetDate = (text) => {
    const today = new Date();
    
    // Look for date references
    const datePatterns = [
      /(?:by|before|until)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(?:by|before|until)\s+(next\s+\w+)/i,
      /(?:in|within)\s+(\d+)\s+(?:day|week|month)/i,
      /(?:deadline|due)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        // Try to parse the date
        try {
          // Handle "next week", "next month" etc.
          if (match[1].toLowerCase().includes('next week')) {
            today.setDate(today.getDate() + 7);
            return today.toISOString().split('T')[0];
          } else if (match[1].toLowerCase().includes('next month')) {
            today.setMonth(today.getMonth() + 1);
            return today.toISOString().split('T')[0];
          }
          // Handle numeric dates
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
    
    // Default: 7 days from now
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  };

  // Determine function/department based on content
  const determineFunction = (text) => {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('marketing') || textLower.includes('campaign') || textLower.includes('advertisement')) {
      return 'marketing';
    } else if (textLower.includes('sales') || textLower.includes('customer') || textLower.includes('revenue')) {
      return 'sales';
    } else if (textLower.includes('engineering') || textLower.includes('technical') || textLower.includes('develop')) {
      return 'engineering';
    } else if (textLower.includes('finance') || textLower.includes('budget') || textLower.includes('cost')) {
      return 'finance';
    } else if (textLower.includes('hr') || textLower.includes('human resources') || textLower.includes('employee')) {
      return 'hr';
    } else if (textLower.includes('operations') || textLower.includes('operational') || textLower.includes('process')) {
      return 'operations';
    } else if (textLower.includes('it') || textLower.includes('technical support') || textLower.includes('system')) {
      return 'it';
    }
    
    return 'general'; // Default
  };

  // Extract project name from text
  const extractProjectName = (text) => {
    // Look for project references
    const projectPatterns = [
      /project\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /initiative\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /"([^"]+)"\s+(?:project|initiative)/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Default project name
    return 'Project Alpha';
  };

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    try {
      // Split transcript into sentences
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      const meetingPoints = sentences.map((sentence, index) => ({
        id: Date.now() + index,
        sno: meetings.length + index + 1,
        function: determineFunction(sentence),
        project_name: extractProjectName(sentence),
        criticality: determineCriticality(sentence),
        discussion_point: sentence.trim() + (sentence.trim().match(/[.!?]$/) ? '' : '.'),
        responsibility: extractResponsibilities(sentence),
        target: calculateTargetDate(sentence),
        remainder: 'weekly',
        status: 'pending',
        action_taken_approval: 'pending-approval',
        created_at: new Date().toISOString()
      }));
      
      await onProcessSpeech(meetingPoints);
      resetTranscript();
      setSpeaker('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-red-700">
          Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Speaker Selection */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icons.User className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm sm:text-base font-medium text-gray-900">Speaker Information</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
              placeholder="Enter speaker name or select below"
            />
            <button
              onClick={saveSpeaker}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              <Icons.Save className="h-4 w-4" />
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
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speech Controls */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icons.Volume2 className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm sm:text-base font-medium text-gray-900">Speech Controls</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={startListening}
            disabled={listening}
            className={`flex flex-col items-center justify-center p-3 rounded transition-all ${
              listening 
                ? 'bg-green-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {listening ? (
              <Icons.Mic className="h-5 w-5 mb-1 animate-pulse" />
            ) : (
              <Icons.Mic className="h-5 w-5 mb-1" />
            )}
            <span className="text-xs font-medium">
              {listening ? 'Listening...' : 'Start'}
            </span>
          </button>
          
          <button
            onClick={stopListening}
            disabled={!listening}
            className={`flex flex-col items-center justify-center p-3 rounded transition-all ${
              !listening 
                ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                : 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
            }`}
          >
            <Icons.Square className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Stop</span>
          </button>
          
          <button
            onClick={resetTranscript}
            className="flex flex-col items-center justify-center p-3 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-all"
          >
            <Icons.Trash2 className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Clear</span>
          </button>
          
          <button
            onClick={handleProcess}
            disabled={!transcript || isProcessing}
            className={`flex flex-col items-center justify-center p-3 rounded transition-all ${
              !transcript || isProcessing
                ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Icons.Play className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">
              {isProcessing ? 'Processing...' : 'Convert'}
            </span>
          </button>
        </div>
        
        {listening && (
          <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs text-green-700 font-medium">Live transcription active</span>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Live Transcript</h3>
          <p className="text-xs text-gray-600">Speech will appear here in real-time</p>
        </div>
        
        <div className="p-3">
          <div className="h-48 overflow-y-auto bg-gray-50 rounded p-3 border border-gray-200">
            {transcript ? (
              <div className="space-y-2">
                {transcript.split('. ').map((sentence, index) => (
                  sentence.trim() && (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        {sentence.trim()}
                        {!sentence.endsWith('.') && '.'}
                      </p>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Icons.Mic className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Start speaking to see transcript here</p>
                <p className="text-xs mt-1">Click "Start" button above</p>
              </div>
            )}
          </div>
          
          {transcript && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-3">
                <span>
                  <span className="font-medium">{transcript.split(' ').length}</span> words
                </span>
                <span>
                  <span className="font-medium">{transcript.split('. ').filter(s => s.trim()).length}</span> sentences
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Speaker:</span>
                <span className="font-medium text-blue-600">
                  {speaker || 'Not specified'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icons.Info className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-800">How it works:</h4>
        </div>
       
      </div>
    </div>
  );
};

export default SpeechToText;