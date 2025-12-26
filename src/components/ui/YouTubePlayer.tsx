"use client";

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Declarar tipos para la API de YouTube
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
  autoplay?: boolean;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

// Variable global para rastrear si la API ya está cargada
let apiLoaded = false;
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) {
    return Promise.resolve();
  }

  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise((resolve) => {
    // Verificar si ya existe el script
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      if (window.YT && window.YT.Player) {
        apiLoaded = true;
        resolve();
        return;
      }
    }

    // Crear el script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    // Callback cuando la API está lista
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });

  return apiLoadPromise;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, className, autoplay = false, startTime = 0, onTimeUpdate }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const playerIdRef = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, true);
          playerRef.current.playVideo();
        }
      },
      play: () => {
        playerRef.current?.playVideo();
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() ?? 0;
      },
    }));

    // Cargar API e inicializar player
    useEffect(() => {
      let mounted = true;

      const initPlayer = async () => {
        await loadYouTubeAPI();

        if (!mounted || !containerRef.current) return;

        // Crear div para el player
        const playerDiv = document.createElement("div");
        playerDiv.id = playerIdRef.current;
        containerRef.current.appendChild(playerDiv);

        playerRef.current = new window.YT.Player(playerIdRef.current, {
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            start: startTime,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (mounted) {
                setIsReady(true);
              }
            },
            onStateChange: (event) => {
              if (mounted) {
                setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              }
            },
          },
        });
      };

      initPlayer();

      return () => {
        mounted = false;
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }, [videoId, autoplay, startTime]);

    // Actualizar tiempo actual periódicamente
    useEffect(() => {
      if (!isReady || !onTimeUpdate) return;

      const interval = setInterval(() => {
        if (playerRef.current && isPlaying) {
          onTimeUpdate(playerRef.current.getCurrentTime());
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [isReady, isPlaying, onTimeUpdate]);

    const togglePlay = useCallback(() => {
      if (!playerRef.current) return;
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
      if (!playerRef.current) return;
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }, [isMuted]);

    const handleFullscreen = useCallback(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        }
      }
    }, []);

    const restart = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
    }, []);

    return (
      <div
        className={cn("relative bg-black rounded-lg overflow-hidden group", className)}
        ref={containerRef}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Loading state */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-pulse text-muted-foreground">Cargando video...</div>
          </div>
        )}

        {/* Custom controls overlay */}
        {isReady && showControls && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white" />
                )}
              </button>

              <button
                onClick={restart}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-white" />
                )}
              </button>

              <div className="flex-1" />

              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Pantalla completa"
              >
                <Maximize className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
