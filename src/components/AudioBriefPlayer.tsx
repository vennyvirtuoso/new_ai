"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { DOMAIN_MAP } from "@/lib/sources";
import type { NewsArticle } from "@/lib/types";

interface AudioBriefPlayerProps {
  stories: NewsArticle[];
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

const SPEEDS = [1, 1.25, 1.5] as const;

export function AudioBriefPlayer({
  stories,
  onClose,
  onSelectArticle,
}: AudioBriefPlayerProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [supported, setSupported] = useState(true);
  const speed = SPEEDS[speedIdx];
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      isMountedRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakStory = useCallback(
    (storyIndex: number, playbackRate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      const story = stories[storyIndex];
      if (!story) {
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      const domainLabel = DOMAIN_MAP[story.domain]?.label ?? "Frontier Tech";
      const script = `Story ${storyIndex + 1} of ${stories.length}, from ${domainLabel}. ${story.title}. ${story.summary}`;
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = playbackRate;
      utterance.lang = "en-US";

      utterance.onend = () => {
        if (!isMountedRef.current) return;
        if (storyIndex + 1 < stories.length) {
          setIndex(storyIndex + 1);
          speakStory(storyIndex + 1, playbackRate);
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = () => {
        if (isMountedRef.current) setIsPlaying(false);
      };

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    },
    [stories]
  );

  function handleTogglePlay() {
    if (!supported || stories.length === 0) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speakStory(index, speed);
    }
  }

  function handleStep(delta: number) {
    const next = Math.max(0, Math.min(stories.length - 1, index + delta));
    setIndex(next);
    if (isPlaying) {
      speakStory(next, speed);
    }
  }

  function handleCycleSpeed() {
    const nextIdx = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(nextIdx);
    if (isPlaying) {
      speakStory(index, SPEEDS[nextIdx]);
    }
  }

  const current = stories[index];
  if (!current) return null;

  return (
    <div className="audio-player-bar" role="region" aria-label="Morning Audio Brief">
      <div className="audio-player-left">
        <span className="audio-badge">
          <Headphones size={14} />
          <span>
            {index + 1}/{stories.length}
          </span>
        </span>
        <button
          type="button"
          className="audio-story-title"
          onClick={() => onSelectArticle(current)}
          title="Open story details"
        >
          {supported
            ? current.title
            : "Audio synthesis is not supported in this browser."}
        </button>
      </div>

      <div className="audio-player-controls">
        {supported && (
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
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
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
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
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
