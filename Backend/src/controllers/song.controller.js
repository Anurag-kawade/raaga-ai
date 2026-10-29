
const songModel = require("../models/song.model");
const storageService = require("../services/storage.service");
const id3 = require("node-id3");

async function uploadSong(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a song file.",
      });
    }

    const songBuffer = req.file.buffer;
    const { mood } = req.body;
    const tags = id3.read(songBuffer);

    if (!tags?.title || !tags?.image?.imageBuffer) {
      return res.status(400).json({
        message: "The song must contain a title and album artwork.",
      });
    }

    const [songFile, posterFile] = await Promise.all([
      storageService.uploadFile({
        buffer: songBuffer,
        filename: `${tags.title}.mp3`,
        folder: "Raaga-ai/songs",
      }),
      storageService.uploadFile({
        buffer: tags.image.imageBuffer,
        filename: `${tags.title}.jpeg`,
        folder: "Raaga-ai/posters",
      }),
    ]);

    const song = await songModel.create({
      title: tags.title,
      url: songFile.url,
      posterUrl: posterFile.url,
      mood,
    });

    return res.status(201).json({
      message: "Song created successfully.",
      song,
    });
  } catch (error) {
    console.error("Song upload failed:", error);

    return res.status(500).json({
      message: "Unable to upload the song.",
    });
  }
}

async function getSong(req, res) {
  try {
    const { mood } = req.query;
    const validMoods = ["Happy", "Surprised", "Sad", "Neutral"];

    if (!mood || !validMoods.includes(mood)) {
      return res.status(400).json({
        message: "Please provide a valid mood.",
      });
    }

    const songs = await songModel.find({ mood }).lean();

    if (songs.length === 0) {
      return res.status(404).json({
        message: `No songs found for the mood "${mood}".`,
      });
    }

    return res.status(200).json({
      message: "Songs fetched successfully.",
      mood,
      songs,
    });
  } catch (error) {
    console.error("Fetching songs failed:", error);

    return res.status(500).json({
      message: "Unable to fetch songs.",
    });
  }
}

module.exports = {
  uploadSong,
  getSong,
};
