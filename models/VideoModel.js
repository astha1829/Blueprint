import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  filename: String,
  // description: String,
  filePath: { type: String, required: true },
  url: String,
});


const VideoModel = mongoose.model('video', videoSchema);

export default VideoModel;

