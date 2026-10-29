
import { useContext } from "react";
import { SongContext } from "../song.context";
import { getSongs } from "../service/song.api";

export const useSong = () => {
  const context = useContext(SongContext);

  if (!context) {
    throw new Error(
      "useSong must be used within SongContextProvider"
    );
  }

  const {
    loading,
    setLoading,
    song,
    setSong,
    songs,
    setSongs,
    currentIndex,
    setCurrentIndex,
  } = context;

  async function handleGetSong({ mood }) {
    setLoading(true);

    try {
      const data = await getSongs({ mood });

      if (!data?.songs?.length) {
        throw new Error("No songs were returned for this mood.");
      }

      // Shuffle the queue so the starting song is random.
      const shuffledSongs = [...data.songs];

      for (let i = shuffledSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffledSongs[i], shuffledSongs[j]] = [
          shuffledSongs[j],
          shuffledSongs[i],
        ];
      }

      setSongs(shuffledSongs);
      setCurrentIndex(0);
      setSong(shuffledSongs[0]);

      return shuffledSongs[0];
    } catch (error) {
      setSongs([]);
      setSong(null);
      setCurrentIndex(0);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function playSongAtIndex(index) {
    if (index < 0 || index >= songs.length) return;

    setCurrentIndex(index);
    setSong(songs[index]);
  }

  function playNextSong() {
    if (songs.length === 0) return;

    const nextIndex = (currentIndex + 1) % songs.length;

    setCurrentIndex(nextIndex);
    setSong(songs[nextIndex]);
  }

  return {
    loading,
    song,
    songs,
    currentIndex,
    handleGetSong,
    playSongAtIndex,
    playNextSong,
  };
};
