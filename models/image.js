import mongoose from "mongoose";
import fs from "fs/promises"; // Assuming you are using Node.js version >= 14

const imageSchema = new mongoose.Schema({
  images: [
    {
      filename: String,
      destination: String,
      filePath: String,
      url: String,
    }
  ]
});
``
// Add a removeFile method to the imageSchema
imageSchema.methods.removeFile = async function() {
  try {
    // Implement your file removal logic here
    // This might involve using the file path stored in 'this.filePath' to delete the file
    // Example: fs.unlinkSync(this.filePath);

    // Placeholder implementation, replace it with your actual logic
    console.log('Removing old file:', this.filePath);

    // For demonstration purposes, let's remove the file using fs.promises.unlink
    await fs.unlink(this.filePath);

    console.log('File removed successfully');
  } catch (error) {
    console.error('Error removing file:', error);
    throw error; // Propagate the error to the caller
  }
};

const ImageModel = mongoose.model("images", imageSchema);

export default ImageModel;


 