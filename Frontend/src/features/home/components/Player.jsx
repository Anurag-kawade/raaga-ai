
import { useContext, useEffect, useRef, useState } from "react";
import { SongContext } from "../song.context";
import { useSong } from "../hooks/useSong";
import "../style/Player.scss";

const Player = () => {
  const { song, songs, currentIndex } = useContext(SongContext);
  const { playSongAtIndex, playNextSong } = useSong();

  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !song?.url) return;

    let cancelled = false;

    audio.pause();
    audio.currentTime = 0;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackError("");

    async function startPlayback() {
      try {
        audio.load();
        await audio.play();

        if (!cancelled) {
          setIsPlaying(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Autoplay was blocked:", error);
          setIsPlaying(false);
          setPlaybackError("Press Play to start your song.");
        }
      }
    }

    startPlayback();

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, [song?.url]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !song?.url) return;

    if (audio.paused) {
      try {
        setPlaybackError("");
        await audio.play();
      } catch (error) {
        console.error("Unable to play song:", error);
        setPlaybackError("Unable to play this song. Please try again.");
      }
    } else {
      audio.pause();
    }
  };

  const skip = (seconds) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration)) return;

    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, audio.duration)
    );
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleRecommendationClick = (index) => {
    if (index === currentIndex) {
      togglePlay();
      return;
    }

    setPlaybackError("");
    playSongAtIndex(index);
  };

  if (!song?.url) {
    return (
      <main className="player-page">
        <div className="player-card player-empty">
          <p>No song selected yet.</p>
          <span>Detect your expression to get songs for your mood.</span>
        </div>
      </main>
    );
  }

  const recommendedSongs = songs
    .map((item, index) => ({
      ...item,
      queueIndex: index,
    }))
    .filter((item) => item.queueIndex !== currentIndex);

  return (
    <main className="player-page">
      <div className="player-layout">
        <section className="player-card">
          <div className="player-poster">
            <img
              src={song.posterUrl}
              alt={`${song.title || "Song"} cover`}
            />
          </div>

          <div className="player-song-info">
            <h1>{song.title || "Unknown song"}</h1>
            <p>{song.artist || song.singer || "Unknown artist"}</p>

            {song.mood && (
              <span className="player-mood">{song.mood}</span>
            )}
          </div>

          <audio
            ref={audioRef}
            src={song.url}
            preload="auto"
            onTimeUpdate={(event) =>
              setCurrentTime(event.currentTarget.currentTime)
            }
            onLoadedMetadata={(event) =>
              setDuration(event.currentTarget.duration)
            }
            onEnded={playNextSong}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setIsPlaying(false);
              setPlaybackError("This song could not be loaded.");
            }}
          />

          <div className="player-progress">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Number(
                    event.target.value
                  );
                }
              }}
              aria-label="Song progress"
            />

            <div className="player-time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-controls">
            <button
              type="button"
              onClick={() => skip(-5)}
              aria-label="Backward 5 seconds"
              title="Backward 5 seconds"
            >
              <span className="skip-icon">↶</span>
              <small>5</small>
            </button>

            <button
              type="button"
              className="play-button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause song" : "Play song"}
            >
              {isPlaying ? "Ⅱ" : "▶"}
            </button>

            <button
              type="button"
              onClick={() => skip(5)}
              aria-label="Forward 5 seconds"
              title="Forward 5 seconds"
            >
              <span className="skip-icon">↷</span>
              <small>5</small>
            </button>
          </div>

          {playbackError && (
            <p className="player-error" role="status">
              {playbackError}
            </p>
          )}
        </section>

        <aside className="recommendations-card">
          <div className="recommendations-header">
            <div>
              <span className="recommendations-eyebrow">
                YOUR MOOD MIX
              </span>
              <h2>Recommended Songs</h2>
            </div>

            <span className="recommendations-count">
              {songs.length}
            </span>
          </div>

          <p className="recommendations-subtitle">
            More music matching your {song.mood || "current"} mood.
          </p>

          <div className="recommendations-list">
            {recommendedSongs.length > 0 ? (
              recommendedSongs.map((item) => (
                <button
                  type="button"
                  key={item._id || item.url}
                  className="recommendation-item"
                  onClick={() =>
                    handleRecommendationClick(item.queueIndex)
                  }
                >
                  <img
                    src={item.posterUrl}
                    alt=""
                    className="recommendation-poster"
                  />

                  <span className="recommendation-info">
                    <span className="recommendation-title">
                      {item.title || "Unknown song"}
                    </span>

                    <span className="recommendation-artist">
                      {item.artist || item.singer || "Unknown artist"}
                    </span>
                  </span>

                  <span className="recommendation-play" aria-hidden="true">
                    ▶
                  </span>
                </button>
              ))
            ) : (
              <p className="recommendations-empty">
                No other songs for this mood yet.
              </p>
            )}
          </div>

          <div className="queue-footer">
            <span className="queue-dot" />
            Songs are queued for continuous playback
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Player;
