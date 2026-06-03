import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../icons/Icon";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface VoiceMessageBubbleProps {
  src: string;
  duration?: number;
  time?: string;
  outgoing?: boolean;
  priority?: boolean;
  avatarUrl?: string;
}

export function VoiceMessageBubble({
  src,
  duration: durationProp,
  time,
  outgoing = true,
  priority,
  avatarUrl,
}: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationProp ?? 0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setDuration(Math.ceil(el.duration));
      }
    };
    const onTime = () => {
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  const displayDuration = durationProp ?? duration;

  return (
    <div className={`wa-voice-bubble ${outgoing ? "wa-voice-bubble--out" : "wa-voice-bubble--in"}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="wa-voice-bubble__main">
        <div className="wa-voice-bubble__avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="wa-voice-bubble__avatar" />
          ) : (
            <span className="wa-voice-bubble__avatar wa-voice-bubble__avatar--placeholder" />
          )}
          <span className="wa-voice-bubble__mic-badge" aria-hidden>
            <Icon name="mic" size={10} className="wa-icon--muted" />
          </span>
        </div>
        <button
          type="button"
          className="wa-voice-bubble__play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
        >
          <Icon
            name={playing ? "pause" : "play"}
            size={20}
            strokeWidth={2.5}
            className={outgoing ? "wa-voice-bubble__play-icon--out" : "wa-icon--muted"}
          />
        </button>
        <div className="wa-voice-bubble__track-wrap">
          <div className="wa-voice-bubble__track-row">
            <div
              className="wa-voice-bubble__track"
              onClick={seek}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className="wa-voice-bubble__fill" style={{ width: `${progress * 100}%` }} />
              <span
                className="wa-voice-bubble__knob"
                style={{ left: `${progress * 100}%` }}
              />
            </div>
            <span className="wa-voice-bubble__duration">{formatDuration(displayDuration)}</span>
          </div>
        </div>
      </div>
      {time && (
        <div className="wa-voice-bubble__meta">
          <span>{time}</span>
          {outgoing && (
            <Icon name="check-double" size={14} className="wa-voice-bubble__checks" />
          )}
          {priority && outgoing && (
            <Icon name="star" size={12} style={{ fill: "currentColor", stroke: "currentColor" }} />
          )}
        </div>
      )}
    </div>
  );
}
