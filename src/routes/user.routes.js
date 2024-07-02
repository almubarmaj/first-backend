import { Routes } from "express"
import { registerUser } from "../controller/user.controller.js"
import {upload} from "../middlewares/multer.js"

const router = Routes()

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

export default router