const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    posterUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        default: "Unknown artist",
    },
    mood: {
        type: String,
        required: true,
        enum: {
            values: ["Happy", "Surprised", "Sad", "Neutral"],
            message: "Invalid mood",
        },
    },
});

const songModel = mongoose.model("songs", songSchema);

module.exports = songModel;