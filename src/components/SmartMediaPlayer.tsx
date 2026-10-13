"use client";

import React, { useState, useRef, useEffect } from "react";
import { resolveMediaInfo, ResolvedMediaInfo } from "@/lib/mediaResolver";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Flame,
  AlertCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface SmartMediaPlayerProps {
  mediaUrl: string;
  mediaType?: "video" | "image";
  title?: string;
  posterUrl?: string;
  className?: string;
  ctaLink?: string;
  ctaText?: string;
}

export default function SmartMediaPlayer({
  mediaUrl,
  mediaType,
  title = "العرض الحصري",
  posterUrl,
  className = "",
  ctaLink,
  ctaText,
}: SmartMediaPlayerProps) {
  const [info, setInfo] = useState<ResolvedMediaInfo>(() => resolveMediaInfo(mediaUrl));
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("0:00");
  const [duration, setDuration] = useState<string>("0:00");

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update resolved info whenever mediaUrl changes
  useEffect(() => {
    let active = true;
    const resolved = resolveMediaInfo(mediaUrl);
    // If mediaType was explicitly passed as video and resolved kind was image (or vice versa), respect explicit video
    if (mediaType === "video" && resolved.kind === "image") {
      resolved.kind = "video";
    } else if (mediaType === "image" && resolved.kind === "video" && !mediaUrl.match(/\.(mp4|mov|webm)/i)) {
      resolved.kind = "image";
    }
    setInfo(resolved);
    setHasError(false);
    setIsLoading(true);

    // If it's an ImgBB viewer link (ibb.co/...), fetch the direct CDN URL from API
    if (mediaUrl && mediaUrl.includes("ibb.co/") && !mediaUrl.includes("i.ibb.co/")) {
      fetch(`/api/resolve-media?url=${encodeURIComponent(mediaUrl)}`)
        .then((res) => res.json())
        .then((data) => {
          if (active && data.success && data.resolvedUrl) {
            setInfo((prev) => ({
              ...prev,
              url: data.resolvedUrl,
              platform: "ImgBB",
              kind: "image",
            }));
            setIsLoading(false);
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [mediaUrl, mediaType]);

  // Autoplay attempt on mount & user interaction
  useEffect(() => {
    if (info.kind !== "video" || !videoRef.current) return;
    const vid = videoRef.current;

    // Attributes for iOS Safari & CDNs
    vid.setAttribute("referrerpolicy", "no-referrer");
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("playsinline", "true");

    // Mobile safe autoplay with muted
    vid.muted = true;
    setIsMuted(true);

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          // Autoplay was prevented by browser policy, pause and wait for tap
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  }, [info.url]);

  // Format time (seconds to mm:ss)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(formatTime(current));
    if (dur > 0) {
      setProgress((current / dur) * 100);
      setDuration(formatTime(dur));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetHideTimer();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
    resetHideTimer();
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
    resetHideTimer();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newProgress = parseFloat(e.target.value);
    const dur = videoRef.current.duration || 0;
    if (dur > 0) {
      videoRef.current.currentTime = (newProgress / 100) * dur;
      setProgress(newProgress);
    }
  };

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !hasError) {
        setShowControls(false);
      }
    }, 3500);
  };

  // If resolved as an Embed (YouTube, Streamable, Google Drive, Vimeo)
  if (info.kind === "embed" && info.embedUrl) {
    return (
      <div
        ref={containerRef}
        className={`w-full relative rounded-2xl overflow-hidden glass-panel-luxury border border-white/15 shadow-2xl bg-black aspect-video flex items-center justify-center ${className}`}
      >
        <iframe
          src={info.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer"
          className="w-full h-full border-0 rounded-2xl"
        />
        <div className="absolute top-3 right-3 pointer-events-none z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-white/90">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>{info.platform} · جودة فائقة</span>
        </div>
      </div>
    );
  }

  // If resolved as an Image
  if (info.kind === "image") {
    return (
      <div
        className={`w-full relative rounded-2xl overflow-hidden glass-panel-luxury border border-white/15 shadow-2xl group aspect-video bg-black flex items-center justify-center ${className}`}
      >
        <img
          src={info.url}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (info.url && (info.url.includes("ibb.co") || !info.url.includes("i.ibb.co"))) {
              fetch(`/api/resolve-media?url=${encodeURIComponent(info.url)}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.success && data.resolvedUrl && data.resolvedUrl !== info.url) {
                    setInfo((prev) => ({ ...prev, url: data.resolvedUrl }));
                  }
                })
                .catch(() => {});
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white/90 pointer-events-none z-20">
          <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            جودة أصلية Ultra HD 4K
          </span>
          <span className="bg-rose-600 font-extrabold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
            حصري للمشتركين
          </span>
        </div>
      </div>
    );
  }

  // Direct HTML5 Video Player (MP4, MOV, WebM, Videy, Catbox, Dropbox, etc.)
  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={togglePlay}
      className={`w-full relative rounded-2xl overflow-hidden glass-panel-luxury border border-white/15 shadow-2xl group aspect-video bg-black flex items-center justify-center cursor-pointer select-none ${className}`}
    >
      {/* HTML5 Native Video Tag with Multi-Source */}
      <video
        ref={videoRef}
        src={info.url}
        poster={posterUrl || info.posterUrl}
        playsInline
        autoPlay
        muted
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className="w-full h-full object-cover rounded-2xl pointer-events-none"
      >
        <source src={info.url} type="video/mp4" />
        <source src={info.url} type="video/webm" />
        <source src={info.url} type="video/quicktime" />
      </video>

      {/* Luxury Badges Header (Top of player) */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none z-20">
        <span className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[11px] text-white font-semibold shadow-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>بث فائق الدقة Ultra HD</span>
        </span>

        <span className="flex items-center gap-1 bg-rose-600/90 backdrop-blur-md px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-white shadow-lg animate-pulse">
          <Flame className="w-3.5 h-3.5 text-yellow-300" />
          <span>مباشر</span>
        </span>
      </div>

      {/* Floating Unmute Button Overlay (Crucial for Mobile & Autoplay) */}
      {isMuted && isPlaying && !hasError && (
        <button
          onClick={toggleMute}
          className="absolute top-14 right-3 z-30 flex items-center gap-2 bg-brand-500/90 hover:bg-brand-500 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-xl backdrop-blur-md border border-white/20 transition-all active:scale-95 animate-bounce"
        >
          <VolumeX className="w-4 h-4 text-yellow-300" />
          <span>اضغط لتشغيل الصوت 🔊</span>
        </button>
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500/30 border-t-brand-400 animate-spin" />
        </div>
      )}

      {/* Centered Play Button when paused */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-2xl border border-white/20 hover:scale-110 active:scale-95 transition-transform"
          >
            <Play className="w-8 h-8 mr-1 fill-white" />
          </button>
        </div>
      )}

      {/* Error Fallback Card: When stream fails or CORS blocks it, provide friendly retry and external link */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center z-30 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">جاري تحضير البث المباشر</h4>
          <p className="text-xs text-gray-400 max-w-sm">
            يمكنك متابعة المشاهدة مباشرة بالنقر على زر المتابعة بالأسفل أو إعادة المحاولة
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            {ctaLink && (
              <a
                href={ctaLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-accent-glow px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
              >
                <span>{ctaText || "فتح المشاهدة الآن"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Bottom Professional Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="w-full flex items-center mb-2 group/slider">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-brand-400 transition-all"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1 hover:text-brand-400 transition-colors"
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="p-1 hover:text-brand-400 transition-colors"
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-yellow-300" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time display */}
            <span className="text-[11px] font-mono text-gray-300">
              {currentTime} / {duration}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
              4K 60FPS
            </span>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:text-brand-400 transition-colors"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
