
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';

// Helper functions for manual encoding/decoding as required by Gemini Live API guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface VoiceCoachProps {
  language?: string;
}

const VoiceCoach: React.FC<VoiceCoachProps> = ({ language = "tr" }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionPromiseRef.current = geminiService.connectVoiceCoach({
        onopen: () => {
          setIsConnecting(false);
          setIsActive(true);
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            
            const base64Data = encode(new Uint8Array(int16.buffer));
            
            sessionPromiseRef.current?.then((session) => {
              session.sendRealtimeInput({ 
                media: { 
                  data: base64Data, 
                  mimeType: 'audio/pcm;rate=16000' 
                } 
              });
            });
          };
          source.connect(processor);
          processor.connect(audioContextRef.current!.destination);
        },
        onmessage: async (msg: any) => {
          const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64 && outputContextRef.current) {
            nextStartTimeRef.current = Math.max(
              nextStartTimeRef.current,
              outputContextRef.current.currentTime,
            );
            
            const audioBuffer = await decodeAudioData(
              decode(audioBase64),
              outputContextRef.current,
              24000,
              1,
            );
            
            const source = outputContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputContextRef.current.destination);
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
          }

          if (msg.serverContent?.interrupted) {
             nextStartTimeRef.current = 0;
          }
        },
        onclose: () => stopSession(),
        onerror: (e: any) => {
          console.error('Voice Coach connection error:', e);
          stopSession();
        }
      }, language);
    } catch (e) {
      console.error('Failed to start Voice Coach session:', e);
      stopSession();
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    audioContextRef.current?.close();
    outputContextRef.current?.close();
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button 
        onClick={isActive ? stopSession : startSession}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isActive ? 'bg-red-500 scale-110' : 'bg-indigo-600 hover:scale-105'
        }`}
      >
        {isConnecting ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : isActive ? (
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        )}
      </button>
      {isActive && (
        <div className="absolute bottom-20 right-0 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          Canlı Yazım Koçu Bağlı ({language})
        </div>
      )}
    </div>
  );
};

export default VoiceCoach;