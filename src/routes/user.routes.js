import { Router } from "express";
import { logoutUser, registerUser, loginUser, refreshAccessToken } from "../controller/user.controller.js"
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "jsonwebtoken";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)



export default router