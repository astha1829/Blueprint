import mongoose from "mongoose";
import fs from "fs/promises";

const usermasterSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String,  trim: true },
  password: { type: String,  trim: true },
  city: { type: String,  trim: true },
  gender: { type: String,  trim: true },
  tc: { type: Boolean },
  profile_pic:{
    _id:false,
    filename: String,
    description: String,
    filePath: String,
   url: String
  },
  gallary: [
    {
      _id:false,
      filename: String,
      description: String,
      filePath: String,
      url: String
    }
  ]
});

// Add a removeFile method to the usermasterSchema
usermasterSchema.methods.removeFile = async function () {
  try {
    // Implement your file removal logic here
    // This might involve using the file path stored in 'this.gallery[i].filePath' to delete the file
    // Example: fs.unlinkSync(this.gallery[i].filePath);

    // Placeholder implementation, replace it with your actual logic
    for (let i = 0; i < this.gallery.length; i++) {
      console.log('Removing old file:', this.gallery[i].filePath);
      await fs.unlink(this.gallery[i].filePath);
    }

    console.log('Files removed successfully');
  } catch (error) {
    console.error('Error removing file:', error);
    throw error; // Propagate the error to the caller
  }
};


const UsermasterModel = mongoose.model("usermaster", usermasterSchema);

export default UsermasterModel;




  