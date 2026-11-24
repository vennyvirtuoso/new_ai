"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Headphones,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { DOMAIN_MAP } from "@/lib/sources";
import type { NewsArticle } from "@/lib/types";

interface AudioBriefPlayerProps {
  stories: NewsArticle[];
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

const SPEEDS = [1, 1.15, 1.3] as const;

const UK_FEMALE_NAMES =
  /\b(google uk english female|sonia|libby|maisie|serena|kate|martha|stephanie|shelley|fiona)\b/i;

const MALE_NAMES =
  /\b(male|daniel|arthur|oliver|george|ryan|thomas|alfie|elliot|gordon|malcolm|jamie)\b/i;

function pickUkEnglishFemaleVoice(allVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const scored = allVoices
    .map((voice) => {
      const name = voice.name;
      const lang = voice.lang.toLowerCase();
      let score = -100;

      if (/google uk english female/i.test(name)) {
        score = 1000;
      } else if (lang.startsWith("en-gb") && UK_FEMALE_NAMES.test(name)) {
        score = 800;
        if (/natural|neural|online|premium|enhanced/i.test(name)) score += 100;
      } else if (lang.startsWith("en-gb") && !MALE_NAMES.test(name)) {
        score = 500;
        if (/female/i.test(name)) score += 150;
        if (/natural|neural|online|premium|enhanced/i.test(name)) score += 100;
      } else if (lang.startsWith("en-gb")) {
        score = 200;
      } else if (UK_FEMALE_NAMES.test(name)) {
        score = 150;
      }

      return { voice, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? null;
}

function cleanForBroadcast(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\bcs\.(AI|LG|CL|CV)\b/gi, "A I")
    .replace(/\bquant-ph\b/gi, "quantum physics")
    .replace(/\barXiv\b/gi, "archive")
    .replace(/\bAI\/ML\b/gi, "A I and machine learning")
    .replace(/\bLLMs\b/g, "large language models")
    .replace(/\bLLM\b/g, "large language model")
    .replace(/\bGPUs\b/g, "G P Us")
    .replace(/\bGPU\b/g, "G P U")
    .replace(/\bvs\.\b/gi, "versus")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[•|—–]+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBroadcastChunks(story: NewsArticle, storyIndex: number, total: number): string[] {
  const domainLabel = DOMAIN_MAP[story.domain]?.label ?? "Frontier Tech";
  const intro = `Story ${storyIndex + 1} of ${total}, from ${domainLabel}.`;
  const headline = cleanForBroadcast(story.title);
  const body = cleanForBroadcast(story.summary);

  // Split summary into natural sentences so browsers don't cut off or rush
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 3);

  return [intro, headline, ...sentences];
}

export function AudioBriefPlayer({
  stories,
  onClose,
  onSelectArticle,
}: AudioBriefPlayerProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [studioMode, setStudioMode] = useState(false);
  const [ukVoice, setUkVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [supported, setSupported] = useState(true);

  const speed = SPEEDS[speedIdx];
  const isMountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackSessionRef = useRef(0);

  const stopAllAudio = useCallback(() => {
    playbackSessionRef.current += 1;
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsLoadingAudio(false);
    setIsPlaying(false);
  }, []);

  // Check if Studio Neural TTS (/api/tts) is configured + load best browser voices
  useEffect(() => {
    isMountedRef.current = true;

    fetch("/api/tts")
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (isMountedRef.current && info?.studioAvailable) {
          setStudioMode(true);
        }
      })
      .catch(() => {});

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const best = pickUkEnglishFemaleVoice(all);
      if (best && isMountedRef.current) {
        setUkVoice(best);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      isMountedRef.current = false;
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const speakStory = useCallback(
    async (storyIndex: number, playbackRate: number) => {
      const story = stories[storyIndex];
      if (!story) {
        stopAllAudio();
        return;
      }

      stopAllAudio();
      const sessionId = playbackSessionRef.current;

      // Mode 1: Studio Neural TTS (OpenAI / ElevenLabs) via cached /api/tts endpoint
      if (studioMode) {
        setIsLoadingAudio(true);
        const chunks = buildBroadcastChunks(story, storyIndex, stories.length);
        const script = chunks.join(" ");
        const url = `/api/tts?text=${encodeURIComponent(script)}`;

        const audio = new Audio(url);
        audio.playbackRate = playbackRate;
        audioRef.current = audio;

        audio.onplaying = () => {
          if (sessionId !== playbackSessionRef.current) return;
          setIsLoadingAudio(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          if (sessionId !== playbackSessionRef.current) return;
          if (storyIndex + 1 < stories.length) {
            setIndex(storyIndex + 1);
            void speakStory(storyIndex + 1, playbackRate);
          } else {
            setIsPlaying(false);
          }
        };
        audio.onerror = () => {
          if (sessionId !== playbackSessionRef.current) return;
          setIsLoadingAudio(false);
          setIsPlaying(false);
        };

        try {
          await audio.play();
          return;
        } catch {
          setIsLoadingAudio(false);
        }
      }

      // Mode 2: Browser Speech Synthesis locked to UK English Female
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const chunks = buildBroadcastChunks(story, storyIndex, stories.length);
      const chosenVoice =
        ukVoice ?? pickUkEnglishFemaleVoice(window.speechSynthesis.getVoices());

      setIsPlaying(true);

      const speakChunk = (chunkIdx: number) => {
        if (!isMountedRef.current || sessionId !== playbackSessionRef.current) return;
        if (chunkIdx >= chunks.length) {
          if (storyIndex + 1 < stories.length) {
            pauseTimerRef.current = setTimeout(() => {
              if (sessionId !== playbackSessionRef.current) return;
              setIndex(storyIndex + 1);
              void speakStory(storyIndex + 1, playbackRate);
            }, 450);
          } else {
            setIsPlaying(false);
          }
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIdx]);
        if (chosenVoice) {
          utterance.voice = chosenVoice;
          utterance.lang = chosenVoice.lang;
        } else {
          utterance.lang = "en-GB";
        }
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          if (!isMountedRef.current || sessionId !== playbackSessionRef.current) return;
          // Brief natural breath pause between headline and sentences
          const pauseMs = chunkIdx <= 1 ? 280 : 180;
          pauseTimerRef.current = setTimeout(() => speakChunk(chunkIdx + 1), pauseMs);
        };

        utterance.onerror = () => {
          if (isMountedRef.current && sessionId === playbackSessionRef.current) {
            setIsPlaying(false);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakChunk(0);
    },
    [stories, studioMode, ukVoice, stopAllAudio]
  );

  function handleTogglePlay() {
    if ((!supported && !studioMode) || stories.length === 0) return;
    if (isPlaying || isLoadingAudio) {
      stopAllAudio();
    } else {
      void speakStory(index, speed);
    }
  }

  function handleStep(delta: number) {
    const next = Math.max(0, Math.min(stories.length - 1, index + delta));
    setIndex(next);
    if (isPlaying) {
      void speakStory(next, speed);
    }
  }

  function handleCycleSpeed() {
    const nextIdx = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(nextIdx);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[nextIdx];
    } else if (isPlaying) {
      void speakStory(index, SPEEDS[nextIdx]);
    }
  }

  const current = stories[index];
  if (!current) return null;

  return (
    <div className="audio-player-bar" role="region" aria-label="Morning Audio Brief">
      <div className="audio-player-left">
        <span className="audio-badge">
          {studioMode ? <Sparkles size={13} /> : <Headphones size={13} />}
          <span>
            {studioMode ? "Studio HD · " : ""}
            {index + 1}/{stories.length}
          </span>
        </span>
        <button
          type="button"
          className="audio-story-title"
          onClick={() => onSelectArticle(current)}
          title="Open story details"
        >
          {supported || studioMode
            ? current.title
            : "Audio playback is not supported in this browser."}
        </button>
      </div>

      <div className="audio-player-controls">
        {(supported || studioMode) && (
          <>
            <button
              type="button"
              className="micro-btn"
              onClick={() => handleStep(-1)}
              disabled={index === 0}
              aria-label="Previous story"
            >
              <SkipBack size={15} />
            </button>

            <button
              type="button"
              className="audio-play-btn"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Pause briefing" : "Play briefing"}
            >
              {isLoadingAudio ? (
                <Loader2 size={15} className="spin" />
              ) : isPlaying ? (
                <Pause size={15} />
              ) : (
                <Play size={15} />
              )}
              <span>
                {isLoadingAudio ? "Loading" : isPlaying ? "Pause" : "Play"}
              </span>
            </button>

            <button
              type="button"
              className="micro-btn"
              onClick={() => handleStep(1)}
              disabled={index === stories.length - 1}
              aria-label="Next story"
            >
              <SkipForward size={15} />
            </button>

            <button
              type="button"
              className="audio-speed-btn"
              onClick={handleCycleSpeed}
              aria-label="Change playback speed"
            >
              {speed}x
            </button>
          </>
        )}

        <button
          type="button"
          className="micro-btn"
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          aria-label="Close audio briefing"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
