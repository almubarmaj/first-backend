import { Routes } from "express"
import { registerUser } from "../controller/user.controller.js"

const router = Routes()

router.route("/register").post(registerUser)

export default router