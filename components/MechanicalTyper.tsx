'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Web Audio Context & Sound Synthesis ---
// We use a singleton ref pattern for the AudioContext to ensure it persists
// and complies with browser autoplay policies (resuming on first interaction).

const useMechanicalAudio = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playClick = useCallback((type = 'down') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    // Oscillator for the "thock" body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Noise buffer for the "click" texture
    const bufferSize = ctx.sampleRate * 0.01; // Short burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();

    // Wiring
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    if (type === 'down') {
      // Downstroke: Deeper, fuller sound
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);
      osc.type = 'square';

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.05);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      // Add a bit of high frequency click
      noiseGain.gain.setValueAtTime(0.1, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);

      osc.start(t);
      osc.stop(t + 0.05);
      noise.start(t);
      noise.stop(t + 0.05);

    } else {
      // Upstroke: Lighter, plastic return sound
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
      osc.type = 'triangle';

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

      osc.start(t);
      osc.stop(t + 0.03);
    }
  }, []);

  return { initAudio, playClick };
};

// --- OS Detection ---
const getOS = () => {
  if (typeof window === 'undefined') return 'windows';
  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) return 'mac';
  if (platform.includes('win') || userAgent.includes('win')) return 'windows';
  return 'linux';
};

// --- Keyboard Layout Data ---
const getKeyboardLayout = (os: string) => {
  const baseLayout = [
    [
      { key: '`', code: 'Backquote', width: 1 },
      { key: '1', code: 'Digit1', width: 1 },
      { key: '2', code: 'Digit2', width: 1 },
      { key: '3', code: 'Digit3', width: 1 },
      { key: '4', code: 'Digit4', width: 1 },
      { key: '5', code: 'Digit5', width: 1 },
      { key: '6', code: 'Digit6', width: 1 },
      { key: '7', code: 'Digit7', width: 1 },
      { key: '8', code: 'Digit8', width: 1 },
      { key: '9', code: 'Digit9', width: 1 },
      { key: '0', code: 'Digit0', width: 1 },
      { key: '-', code: 'Minus', width: 1 },
      { key: '=', code: 'Equal', width: 1 },
      { key: 'Bksp', code: 'Backspace', width: 2 },
    ],
    [
      { key: 'Tab', code: 'Tab', width: 1.5 },
      { key: 'Q', code: 'KeyQ', width: 1 },
      { key: 'W', code: 'KeyW', width: 1 },
      { key: 'E', code: 'KeyE', width: 1 },
      { key: 'R', code: 'KeyR', width: 1 },
      { key: 'T', code: 'KeyT', width: 1 },
      { key: 'Y', code: 'KeyY', width: 1 },
      { key: 'U', code: 'KeyU', width: 1 },
      { key: 'I', code: 'KeyI', width: 1 },
      { key: 'O', code: 'KeyO', width: 1 },
      { key: 'P', code: 'KeyP', width: 1 },
      { key: '[', code: 'BracketLeft', width: 1 },
      { key: ']', code: 'BracketRight', width: 1 },
      { key: '\\', code: 'Backslash', width: 1.5 },
    ],
    [
      { key: 'Caps', code: 'CapsLock', width: 1.8 },
      { key: 'A', code: 'KeyA', width: 1 },
      { key: 'S', code: 'KeyS', width: 1 },
      { key: 'D', code: 'KeyD', width: 1 },
      { key: 'F', code: 'KeyF', width: 1 },
      { key: 'G', code: 'KeyG', width: 1 },
      { key: 'H', code: 'KeyH', width: 1 },
      { key: 'J', code: 'KeyJ', width: 1 },
      { key: 'K', code: 'KeyK', width: 1 },
      { key: 'L', code: 'KeyL', width: 1 },
      { key: ';', code: 'Semicolon', width: 1 },
      { key: "'", code: 'Quote', width: 1 },
      { key: 'Enter', code: 'Enter', width: 2.2 },
    ],
    [
      { key: 'Shift', code: 'ShiftLeft', width: 2.4 },
      { key: 'Z', code: 'KeyZ', width: 1 },
      { key: 'X', code: 'KeyX', width: 1 },
      { key: 'C', code: 'KeyC', width: 1 },
      { key: 'V', code: 'KeyV', width: 1 },
      { key: 'B', code: 'KeyB', width: 1 },
      { key: 'N', code: 'KeyN', width: 1 },
      { key: 'M', code: 'KeyM', width: 1 },
      { key: ',', code: 'Comma', width: 1 },
      { key: '.', code: 'Period', width: 1 },
      { key: '/', code: 'Slash', width: 1 },
      { key: 'Shift', code: 'ShiftRight', width: 2.6 },
    ],
  ];

  // Bottom row varies by OS
  const bottomRow = os === 'mac'
    ? [
        { key: 'Ctrl', code: 'ControlLeft', width: 1.25 },
        { key: '⌥', code: 'AltLeft', width: 1.25 }, // Option
        { key: '⌘', code: 'MetaLeft', width: 1.5 }, // Command
        { key: 'Space', code: 'Space', width: 6 },
        { key: '⌘', code: 'MetaRight', width: 1.5 }, // Command
        { key: '⌥', code: 'AltRight', width: 1.25 }, // Option
        { key: 'Fn', code: 'Fn', width: 1.25 },
      ]
    : os === 'linux'
    ? [
        { key: 'Ctrl', code: 'ControlLeft', width: 1.5 },
        { key: 'Super', code: 'MetaLeft', width: 1.25 },
        { key: 'Alt', code: 'AltLeft', width: 1.25 },
        { key: 'Space', code: 'Space', width: 6.5 },
        { key: 'Alt', code: 'AltRight', width: 1.25 },
        { key: 'Menu', code: 'ContextMenu', width: 1.25 },
        { key: 'Ctrl', code: 'ControlRight', width: 1.5 },
      ]
    : [ // Windows
        { key: 'Ctrl', code: 'ControlLeft', width: 1.5 },
        { key: '⊞', code: 'MetaLeft', width: 1.25 }, // Windows key
        { key: 'Alt', code: 'AltLeft', width: 1.25 },
        { key: 'Space', code: 'Space', width: 6.5 },
        { key: 'Alt', code: 'AltRight', width: 1.25 },
        { key: 'Fn', code: 'Fn', width: 1.25 },
        { key: 'Ctrl', code: 'ControlRight', width: 1.5 },
      ];

  return [...baseLayout, bottomRow];
};

// --- Main App Component ---
export default function MechanicalTyper() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [text, setText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const { initAudio, playClick } = useMechanicalAudio();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [os, setOs] = useState<string>('windows');
  const [keyboardLayout, setKeyboardLayout] = useState<any[]>([]);

  // Detect OS on mount
  useEffect(() => {
    const detectedOS = getOS();
    setOs(detectedOS);
    setKeyboardLayout(getKeyboardLayout(detectedOS));
  }, []);

  // Focus management to keep typing active
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Start the typing experience
  const handleStart = () => {
    setIsStarted(true);
    initAudio();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // WPM Calculation Loop
  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        // Standard WPM calculation: (all characters / 5) / minutes
        const currentWpm = Math.round((charCount / 5) / elapsedMinutes);
        setWpm(isFinite(currentWpm) ? currentWpm : 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, charCount]);

  // Key Event Handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const code = e.code;

    // Prevent default for Tab and other special keys that might cause focus issues
    if (code === 'Tab') {
      e.preventDefault();
    }

    // Start timer on first actual keypress
    if (!startTime) setStartTime(Date.now());

    // Play sound only if key wasn't already held down (repeat)
    if (!activeKeys.has(code)) {
      playClick('down');
      setActiveKeys(prev => new Set(prev).add(code));
      // Only count character keys, not modifiers
      const isModifier = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
                          'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock', 'Fn', 'ContextMenu'].includes(code);
      if (!isModifier) {
        setCharCount(prev => prev + 1);
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const code = e.code;
    playClick('up');
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(code);
      return newSet;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 selection:bg-orange-200 selection:text-orange-900"
      style={{
        backgroundColor: '#F7F5EB', // Very light khaki
        color: '#5C5446' // Darker khaki/brown text
      }}
      onClick={isStarted ? focusInput : undefined}
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full border border-orange-200/50"
         />
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-1/2 -left-20 w-64 h-64 rounded-full border-2 border-orange-100/50"
         />
      </div>

      {/* Start Screen */}
      <AnimatePresence>
        {!isStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="z-50 flex flex-col items-center gap-8"
          >
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl font-light tracking-widest text-stone-700 uppercase">Blokwriter</h1>
            <p className="text-stone-500 text-lg tracking-wide">A mechanical typewriter experience</p>
          </div>

          <button
            onClick={handleStart}
            className="group relative px-12 py-5 rounded-xl bg-gradient-to-b from-orange-400 to-orange-500
                       shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span className="text-white font-bold text-xl tracking-wider uppercase">
              Start Typing
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="flex flex-col items-center gap-2 mt-8 text-stone-400 text-sm">
            <p>• Hear realistic mechanical keyboard sounds</p>
            <p>• Track your typing speed in real-time</p>
            <p>• Beautiful visual feedback</p>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      {isStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full max-w-5xl flex flex-col items-center gap-8"
        >

        {/* Header / Stats */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="text-4xl font-light tracking-widest text-stone-600 uppercase">Typewriter</h1>
          <div className="flex gap-8 mt-4 text-sm font-mono tracking-wider">
            <div className="flex flex-col items-center">
               <span className="text-orange-400 text-xs uppercase">Speed</span>
               <span className="text-2xl font-bold text-stone-700">{wpm} <span className="text-xs font-normal text-stone-400">WPM</span></span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-orange-400 text-xs uppercase">Chars</span>
               <span className="text-2xl font-bold text-stone-700">{charCount}</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-orange-400 text-xs uppercase">Status</span>
               <div className={`flex items-center gap-2 mt-1 ${isFocused ? 'text-green-600' : 'text-orange-400'}`}>
                 <div className={`w-2 h-2 rounded-full ${isFocused ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`}></div>
                 <span className="text-xs">{isFocused ? 'ACTIVE' : 'CLICK TO TYPE'}</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Input Display Area */}
        <motion.div
          className="w-full relative group"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* The Hidden Input that captures real typing */}
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none z-20"
          />

          {/* The Visual Display of text */}
          <div
            className={`
              w-full h-48 p-8 rounded-lg border-2 transition-all duration-300
              font-mono text-lg leading-relaxed whitespace-pre-wrap overflow-hidden shadow-sm
              ${isFocused
                ? 'border-orange-300 bg-[#FFFDF5] shadow-[0_0_30px_-10px_rgba(253,186,116,0.3)]'
                : 'border-stone-200 bg-[#FBF9F1]'}
            `}
          >
            {text || <span className="text-stone-300 italic">Start typing...</span>}
            {isFocused && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2.5 h-5 bg-orange-400 ml-1 align-middle"
              />
            )}
          </div>
        </motion.div>

        {/* The Mechanical Keyboard */}
        <div
          className="p-6 rounded-2xl bg-[#EBE9DE] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_10px_30px_-10px_rgba(92,84,70,0.1)] border border-stone-200"
        >
          <div className="flex flex-col gap-2">
            {keyboardLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 justify-center">
                {row.map((keyItem) => {
                  const isActive = activeKeys.has(keyItem.code);

                  return (
                    <motion.div
                      key={keyItem.code}
                      className={`
                        relative flex items-center justify-center
                        rounded-lg border-b-4 transition-colors duration-75 select-none
                        text-stone-600 font-bold text-sm
                        ${isActive
                          ? 'bg-orange-100 border-orange-200 translate-y-1 shadow-inner text-orange-600'
                          : 'bg-[#F5F3EB] border-[#D6D3C4] hover:bg-white'}
                      `}
                      style={{
                        width: `${keyItem.width * 3.5}rem`,
                        height: '3.5rem',
                      }}
                      animate={isActive ? { y: 4, borderBottomWidth: '0px' } : { y: 0, borderBottomWidth: '4px' }}
                      transition={{ duration: 0.05 }}
                    >
                      {/* Keycap Legend */}
                      <span className="z-10">{keyItem.key}</span>

                      {/* Subtle shine on top */}
                      {!isActive && (
                        <div className="absolute top-1 left-2 right-2 h-2 bg-white/40 rounded-full blur-[1px]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Instructions */}
        <div className="text-stone-400 text-xs font-mono mt-8 flex flex-col items-center gap-1 opacity-60">
           <p>WEB AUDIO API ENABLED • REACT • FRAMER MOTION</p>
           <p>Type to hear the mechanics</p>
        </div>

        </motion.div>
      )}
    </div>
  );
}
