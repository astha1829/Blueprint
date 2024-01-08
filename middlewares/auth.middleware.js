// auth.middleware.js

import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

var checkUserAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;

    console.log("Received Headers:", req.headers);

    if (authorization && authorization.startsWith('Bearer')) {
        try {
            token = authorization.slice(7); // Remove "Bearer " from the token
            console.log("Token", token);

            // Verify Token
            const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // Get User From Token
            req.user = await UserModel.findById(userID).select('-password');

            next();
        } catch (error) {
            console.log(error);
            res.status(401).send({ "status": "failed", "message": "Unauthorized User" });
        }
    } else {
        res.status(401).send({ "status": "failed", "message": "Unauthorized User, No Token" });
    }
};

export default checkUserAuth;
