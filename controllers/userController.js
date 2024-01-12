import UserModel from "../models/User.js";
import path from "path";
import ImageModel from "../models/image.js";
import UsermasterModel from "../models/MergeModel.js";
import bcrypt from "bcrypt";
//import express from "express";
import jwt from "jsonwebtoken";
import transporter from "../config/emailConfig.js";
import { promisify } from "util";
// const jwt = require("jsonwebtoken");
// const { promisify } = require("util");
const verify = promisify(jwt.verify);
import { ObjectId } from "mongodb";
import fs from 'fs/promises';
import VideoModel from '../models/VideoModel.js';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";

// import multer from 'multer';

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '_' + file.originalname);
//   },
// });

// const upload = multer({ storage });
const currentModulePath = fileURLToPath(import.meta.url);
class UserController {
  static userRegistration = async (req, res) => {
    const { name, email, password, password_confirmation, tc, city, gender } =
      req.body;

    try {
      const user = await UserModel.findOne({ email: email });

      if (user) {
        res.send({ status: "failed", message: "Email already exists" });
      } else {
        if (
          name &&
          email &&
          password &&
          password_confirmation &&
          city &&
          gender &&
          tc
        ) {
          if (password === password_confirmation) {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            const doc = new UserModel({
              name: name,
              email: email,
              password: hashPassword,
              city: city,
              gender: gender,

              tc: tc,
            });

            await doc.save();
            console.log(doc);
            const saved_user = await UserModel.findOne({ email: email });

            // Generate JWT Token
            const token = jwt.sign(
              { userID: saved_user._id },
              process.env.JWT_SECRET_KEY,

              { expiresIn: "7d" }
            );

            res.status(201).send({
              status: "success",
              message: "Registration success",
              token: token,
            });
          } else {
            res.send({
              status: "failed",
              message: "Password and confirm password don't match",
            });
          }
        } else {
          res.send({ status: "failed", message: "All fields are required" });
        }
      }
    } catch (error) {
      console.log(error);
      res.send({ status: "failed", message: "Unable to Register" });
    }
  };

  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (email && password) {
        const user = await UserModel.findOne({ email: email });

        if (user !== null) {
          const isMatch = await bcrypt.compare(password, user.password);

          if (isMatch) {
            // Generate JWT Token
            const token = jwt.sign(
              { userID: user._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "7d" }
            );

            console.log("Generated Token:", token); // Log the generated token

            res.send({
              status: "success",
              message: "Login Success",
              token: token,
              city: user.city, // Include city in the response
              gender: user.gender, // Include gender in the response
            });
          } else {
            res.send({
              status: "failed",
              message: "Email or Password is not Valid",
            });
          }
        } else {
          res.send({
            status: "failed",
            message: "You are not a Registered User",
          });
        }
      } else {
        res.send({ status: "failed", message: "All fields are required" });
      }
    } catch (error) {
      console.error("Error:", error); // Log the error
      res.send({ status: "failed", message: "Unable to Login" });
    }
  };

  static changeUserPassword = async (req, res) => {
    const { password, password_confirmation } = req.body;
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({
          status: "failed",
          message: "New Password and Confirm New Password doesn't match",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const newhashPassword = await bcrypt.hash(password, salt);
        await UserModel.findByIdAndUpdate(req.user._id, {
          $set: { password: newhashPassword },
        });
        res.send({
          status: "success",
          message: "PassWord Changed Succesfully",
        });
      }
    } else {
      res.send({ status: "failed", message: "All fields are required" });
    }
  };

  static loggeduser = async (req, res) => {
    res.send({ user: req.user });
  };
  static sendUserPasswordResetEmail = async (req, res) => {
    const { email } = req.body;
    if (email) {
      const user = await UserModel.findOne({ email: email });
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY;
        const token = jwt.sign({ userID: user._id }, secret, {
          expiresIn: "15m",
        });
        const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`;
        console.log(link);
        //send Email
        let info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "GeekShop - PassWord Reset Link",
          html: `<a href =${link}>Click Here</a> to Reset Your PassWord`,
        });

        res.send({
          status: "success",
          message: "Password Reset Email Sent... Please Check Your Email",
          info: info,
        });
      } else {
        res.send({ status: "failed", message: "Email doesn't exists" });
      }
    } else {
      res.send({ status: "failed", message: "Email Field is Required" });
    }
  };

  static userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body;
    const { id, token } = req.params;
    const user = await UserModel.findById(id);
    const new_secret = user._id + process.env.JWT_SECRET_KEY;
    try {
      jwt.verify(token, new_secret);
      if (password && password_confirmation) {
        if (password !== password_confirmation) {
          res.send({
            status: "failed",
            message: "New Password and Confirm New Password doesn't match",
          });
        } else {
          const salt = await bcrypt.genSalt(10);
          const newHashPassword = await bcrypt.hash(password, salt);
          await UserModel.findByIdAndUpdate(user._id, {
            $set: { password: newHashPassword },
          });
          res.send({
            status: "success",
            message: "Password Reset Successfully",
          });
        }
      } else {
        res.send({ status: "failed", message: "All Fields are Required" });
      }
    } catch (error) {
      console.log(error);
      res.send({ status: "failed", message: "Invalid Token" });
    }
  };

  static async uploadimage(req, res) {
    try {
      const { filename, destination, path } = req.file;
      console.log(req.file);

      const image = new ImageModel({
        filename: filename,
        destination: destination,
        filePath: path,
      });

      await image.save();

      res.status(201).json({ message: "Image added successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async replaceimage(req, res) {
    try {
      const { description } = req.body;
      const imageId = req.params.id.trim();

      // Check if the image with the given ID exists
      const existingImage = await ImageModel.findById(imageId);

      if (!existingImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Check if a new image file is uploaded
      if (req.file) {
        const baseurl = `http://localhost:8000/uploads/${req.file.filename}`;

        // Remove the existing file (if any)
        if (existingImage.filePath) {
          // Use fs.unlink to remove the existing file
          try {
            await fs.unlink(existingImage.filePath);
          } catch (error) {
            console.error("Error removing existing file:", error);
          }
        }

        // Set the image file path and properties in the database
        existingImage.filePath = req.file.path;
        existingImage.filename = req.file.filename;
        existingImage.url = baseurl;
      }

      // Update image properties (description)
      existingImage.description = description || existingImage.description;

      // Save the updated image to the database
      const updatedImage = await existingImage.save();

      res.json({ message: "Image updated successfully", image: updatedImage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  //controller file
  static async deleteImage(req, res) {
    try {
      const imageId = req.params.id.trim();

      const deletedImage = await ImageModel.findByIdAndDelete(imageId);

      if (!deletedImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json({ message: "Image deleted successfully", deletedImage });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  static async deleteImage(req, res) {
    try {
      const imageId = req.params.id.trim();

      // Find the image by ID and retrieve its file path
      const deletedImage = await ImageModel.findByIdAndDelete(imageId);

      if (!deletedImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Extract the file path from the deletedImage object
      const imagePath = deletedImage.filePath;

      // Use fs.unlink to delete the image file from the folder
      if (imagePath) {
        await fs.unlink(imagePath);
      }

      res.json({ message: "Image deleted successfully", deletedImage });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async gallaryimage(req, res) {
    try {
      const files = req.files; // Assuming files is an array of uploaded files

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }
      const baseurl =
        "C:\\Users\\91990\\OneDrive\\Desktop\\develope\\1st_project\\";
      const imagesData = files.map((file) => ({
        filename: file.filename,
        description: file.originalname,
        filePath: baseurl + file.path,
        // Add other properties like url as needed
      }));

      const newImages = new ImageModel({ images: imagesData });

      // Perform any further processing or save the images to a database if needed
      newImages.save();

      res.status(201).json({ message: "Images added successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deletebyimagenames(req, res) {
    try {
      const filenames = req.body.filenames; // Assuming filenames is an array in the request body

      if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or empty array of filenames provided" });
      }

      // Find images by filenames
      const deletedImages = await ImageModel.find({
        "images.filename": { $in: filenames },
      });

      if (!deletedImages || deletedImages.length === 0) {
        return res.status(404).json({ message: "Images not found" });
      }

      // Delete files and update the database
      for (const deletedImage of deletedImages) {
        for (const filename of filenames) {
          const imageToDelete = deletedImage.images.find(
            (img) => img.filename === filename
          );

          if (imageToDelete) {
            // Extract the file path from the imageToDelete object
            const imagePath = imageToDelete.filePath;

            // Use fs.unlink to delete the image file from the folder
            if (imagePath) {
              await fs.unlink(imagePath);
            }

            // Remove the image from the images array in the database
            deletedImage.images = deletedImage.images.filter(
              (img) => img.filename !== filename
            );
          }
        }

        // Save the updated document
        await deletedImage.save();
      }

      res.json({ message: "Images deleted successfully", deletedImages });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // static async handleAllActions(req, res) {
  //   try {
  //     const { action } = req.body;

  //     switch (action) {
  //       case 'register':
  //         await UserController.userRegistration(req, res);
  //         break;

  //       case 'login':
  //         await UserController.userLogin(req, res);
  //         break;

  //       case 'changePassword':
  //         await UserController.changeUserPassword(req, res);
  //         break;

  //       case 'uploadImage':
  //         await UserController.uploadImage(req, res);
  //         break;

  //       case 'replaceImage':
  //         await UserController.replaceImage(req, res);
  //         break;

  //       case 'deleteImage':
  //         await UserController.deleteImage(req, res);
  //         break;

  //       case 'galleryImage':
  //         await UserController.galleryImage(req, res);
  //         break;

  //       case 'deleteByImageNames':
  //         await UserController.deleteByImageNames(req, res);
  //         break;

  //       case 'uploadAllFields':
  //         await UserController.uploadAllFields(req, res);
  //         break;

  //       case 'updateUserProfile':
  //         await UserController.updateUserProfile(req, res);
  //         break;

  //       case 'sendPasswordResetEmail':
  //         await UserController.sendUserPasswordResetEmail(req, res);
  //         break;

  //       case 'userPasswordReset':
  //         await UserController.userPasswordReset(req, res);
  //         break;

  //       default:
  //         res.status(400).json({ status: 'failed', message: 'Invalid action' });
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     res.status(500).json({ status: 'failed', message: 'Internal Server Error' });
  //   }
  // }

  static async uploadAllFields(req, res) {
    try {
      const { name, email, password, tc, city, gender, profile_pic, gallary } =
        req.body;

      // Assuming 'profile_pic' is a single file and 'gallary' is an array of files
      const profilePic = req.files["profile_pic"][0];
      const gallaryImages = req.files["gallary"];

      // Define the base URL where the files are served
      const baseUrl = `http://localhost:8000/uploads`;
      // Handle 'profile_pic' and 'gallary' images as needed
      // You can save file details to the database, etc.

      const user = new UsermasterModel({
        name: name,
        email: email,
        password: password,
        city: city,
        gender: gender,
        tc: tc,
        profile_pic: {
          filename: profilePic.filename,
          description: profilePic.originalname,
          filePath: profilePic.path,
          url: `${baseUrl}/${profilePic.filename}`, // Set the URL here
        },
        gallary: gallaryImages.map((file) => ({
          filename: file.filename,
          description: file.originalname,
          filePath: file.path,
          url: `${baseUrl}/${file.filename}`, // Set the URL here
        })),
      });

      await user.save();

      console.log("User created successfully:", user);
      res.status(201).json(user); // Respond with the created user
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async updateUserProfile(req, res) {
    try {
      const { name, city, gender } = req.body;
      const token = req.headers.authorization.replace("Bearer ", "");

      console.log("Token:", token);

      const decodeToken = await verify(token, process.env.JWT_SECRET_KEY);
      const userId = decodeToken.sub;

      console.log("Decoded Token:", decodeToken);
      console.log("User ID:", userId);

      // Validate input fields
      if (!name && !city && !gender) {
        console.log("No fields to update");
        return res.send({ status: "failed", message: "No fields to update" });
      }

      // Construct update object based on provided fields
      const updateFields = {};
      if (name) updateFields.name = name;
      if (city) updateFields.city = city;
      if (gender) updateFields.gender = gender;

      // Update user profile using findByIdAndUpdate
      const userObjectId = new ObjectId(userId);
      const updatedUser = await UserModel.findByIdAndUpdate(
        userObjectId,
        { $set: updateFields },
        { new: true }
      ).catch((error) => console.error("findByIdAndUpdate Error:", error));

      if (!updatedUser) {
        console.log("User not found");
        return res.send({
          status: "failed",
          message: "User not found or unable to update profile",
        });
      }

      console.log("Updated User:", updatedUser);

      res.send({
        status: "success",
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.send({ status: "failed", message: "Unable to update profile" });
    }
  }

  static async updateUserProfile(req, res) {
    try {
      const { name, city, gender } = req.body;
      const token = req.headers.authorization.replace("Bearer ", "");

      console.log("Token:", token);

      const decodeToken = await verify(token, process.env.JWT_SECRET_KEY);
      const userId = decodeToken.userID;

      console.log("Decoded Token:", decodeToken);
      console.log("User ID:", userId);

      // Validate input fields
      if (!name && !city && !gender) {
        console.log("No fields to update");
        return res.send({ status: "failed", message: "No fields to update" });
      }

      // Construct update object based on provided fields
      const updateFields = {};
      if (name) updateFields.name = name;
      if (city) updateFields.city = city;
      if (gender) updateFields.gender = gender;

      // Update user profile using findByIdAndUpdate
      const userObjectId = new ObjectId(userId);
      const updatedUser = await UserModel.findByIdAndUpdate(
        userObjectId,
        { $set: updateFields },
        { new: true }
      ).catch((error) => console.error("findByIdAndUpdate Error:", error));

      if (!updatedUser) {
        console.log("User not found");
        return res.send({
          status: "failed",
          message: "User not found or unable to update profile",
        });
      }

      console.log("Updated User:", updatedUser);

      res.send({
        status: "success",
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.send({ status: "failed", message: "Unable to update profile" });
    }
  }

 

  static async uploadVideo(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video uploaded.' });
        }

        const baseUrl = `http://localhost:8000/uploads`;

        // Resolve the absolute file path by combining the current module's directory and the relative path
        const absoluteFilePath = path.resolve(path.dirname(currentModulePath), '..', 'uploads', req.file.filename);

        const videoData = {
            filename: req.file.filename,
            // description: req.body.description || '',
            filePath: absoluteFilePath,
            url: `${baseUrl}/${req.file.filename}`,
        };

        // Create a new instance of the VideoModel with videoData
        const newVideoInstance = new VideoModel(videoData);

        // Save the video details to the database using save() method
        await newVideoInstance.save();

        res.status(201).json({ message: 'Video added successfully', video: newVideoInstance });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}



static async deleteVideosByFilenames(req, res) {
  try {
    const filenames = req.body.filenames;

    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or empty array of filenames provided" });
    }

    // Find videos by filenames
    const deletedVideos = await VideoModel.find({ filename: { $in: filenames } });

    if (!deletedVideos || deletedVideos.length === 0) {
      return res.status(404).json({ message: "Videos not found" });
    }

    // Delete files and update the database
    for (const deletedVideo of deletedVideos) {
      const videoPath = deletedVideo.filePath;

      // Use try-catch for error handling during file deletion
      try {
        // Check if the file exists before attempting deletion
        if (videoPath) {
          await fs.access(videoPath); // This will throw an error if the file doesn't exist
          await fs.unlink(videoPath);
        }

        // Remove the video from the database
        await VideoModel.findByIdAndDelete(deletedVideo._id);
      } catch (unlinkError) {
        if (unlinkError.code === 'ENOENT') {
          console.log('File not found:', videoPath);
        } else {
          console.error('Error deleting video file:', unlinkError);
          // Handle unlink error as needed
        }
      }
    }

    res.json({ message: "Videos deleted successfully", deletedVideos });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

}
export default UserController;
