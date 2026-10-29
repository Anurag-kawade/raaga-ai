
import { createContext, useState } from "react";

export const SongContext = createContext(null);

export const SongContextProvider = ({ children }) => {
  const [song, setSong] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <SongContext.Provider
      value={{
        song,
        setSong,
        songs,
        setSongs,
        currentIndex,
        setCurrentIndex,
        loading,
        setLoading,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};
