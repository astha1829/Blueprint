import express from 'express';
const router = express.Router();
import UserController from '../controllers/userController.js';
import checkUserAuth from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.js';



//Route Level Middleware- to Protected Route
router.use('/changepassword', checkUserAuth)
router.use('/loggeduser', checkUserAuth)



//public Routes
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)
router.post('/send-reset-password-email', UserController.sendUserPasswordResetEmail)
router.post('/reset-password/:id/:token', UserController.userPasswordReset)
router.patch('/update-profile', UserController.updateUserProfile); 
router.post('/upload-image', upload.single('image'), UserController.uploadimage);
router.put('/replaceimage/:id', (req, res, next) => {
    // Use upload.single('image') as middleware to handle the file upload
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Error uploading image:', err);
        return res.status(500).json({ error: 'Error uploading image' });
      }
  
      try {
        // Log the request body and file information
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
  
        // Call the UserController.replaceimage function to handle the logic for replacing the image
        await UserController.replaceimage(req, res);
      } catch (error) {
        console.error('Error in replaceimage function:', error);
        res.status(500).json({ error: 'Error processing image replacement' });
      }
    });
  });
  

  router.delete('/deleteimage/:id', UserController.deleteImage);
  
  router.post('/gallaryimage', upload.array('images', Infinity),UserController.gallaryimage);



//Protected Routes
router.post('/changepassword', UserController.changeUserPassword)
router.get('/loggeduser', UserController.loggeduser)



export default router;