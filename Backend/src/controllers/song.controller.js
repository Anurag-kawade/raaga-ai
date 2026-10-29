const songModel = require("../models/song.model");
const storageService = require("../services/storage.service");
const id3 = require("node-id3");

async function uploadSong(req, res) {
  const songBuffer = req.file.buffer;
  const { mood } = req.body;

  const tags = id3.read(songBuffer);

  const [songFile, posterFile] = await Promise.all([
    storageService.uploadFile({
      buffer: songBuffer,
      filename: tags.title + ".mp3",
      folder: "Raaga-ai/songs",
    }),
    storageService.uploadFile({
      buffer: tags.image.imageBuffer,
      filename: tags.title + ".jpeg",
      folder: "Raaga-ai/posters",
    }),
  ]);

  const song = await songModel.create({
    title: tags.title,
    url: songFile.url,
    posterUrl: posterFile.url,
    mood,
  });

  res.status(201).json({
    message: "song created successfully.",
    song,
  });
}

async function getSong(req, res) {
    const { mood } = req.query;

    const songs = await songModel.find({ mood });

    if (songs.length === 0) {
        return res.status(404).json({
            message: "No songs found for this mood.",
        });
    }

    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];

    res.status(200).json({
        message: "Random song fetched successfully.",
        song,
    });
}

module.exports = { uploadSong,getSong};
