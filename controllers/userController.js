import UserModel from "../models/User.js";

import ImageModel from "../models/image.js";
import bcrypt from "bcrypt";
//import express from "express";
import jwt from "jsonwebtoken";
import transporter from "../config/emailConfig.js";
import { promisify } from "util";
// const jwt = require("jsonwebtoken");
// const { promisify } = require("util");
const verify = promisify(jwt.verify);
import { ObjectId } from 'mongodb'; 
import fs from 'fs/promises'; 

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
      const { filename, description } = req.file;
    
      const image = new ImageModel({
        filename,
        description,
      });

      await image.save();
    
      res.status(201).json({ message: 'Image added successfully' });
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
        return res.status(404).json({ message: 'Image not found' });
      }

      res.json({ message: 'Image deleted successfully', deletedImage });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }static async deleteImage(req, res) {
    try {
      const imageId = req.params.id.trim();
  
      // Find the image by ID and retrieve its file path
      const deletedImage = await ImageModel.findByIdAndDelete(imageId);
  
      if (!deletedImage) {
        return res.status(404).json({ message: 'Image not found' });
      }
  
      // Extract the file path from the deletedImage object
      const imagePath = deletedImage.filePath;
  
      // Use fs.unlink to delete the image file from the folder
      if (imagePath) {
        await fs.unlink(imagePath);
      }
  
      res.json({ message: 'Image deleted successfully', deletedImage });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async gallaryimage(req, res) {
    try {
      const files = req.files; // Assuming files is an array of uploaded files
  
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }
  
      const imagesData = files.map((file) => ({
        filename: file.filename,
        description: file.originalname,
        // Add other properties like filePath and url as needed
      }));
  
      const newImages = new ImageModel({ images: imagesData });
      
      // Perform any further processing or save the images to a database if needed
      newImages.save();
  
      res.status(201).json({ message: 'Images added successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  

//   static async uploadVideo(req, res) {
//     try {
//       const videoFile = req.file;
//       if (!videoFile) {
//         return res.status(400).json({ message: 'No video file provided' });
//       }

//       // Process the uploaded video file, save to database, etc.

//       res.json({ message: 'Video uploaded successfully', video: videoFile });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: error.message });
//     }
//   }

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
}




export default UserController;
