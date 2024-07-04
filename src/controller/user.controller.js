import { asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { options } from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforSAve: false })

       return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user detail from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from responce
    // check for user creation
    // return res

    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all field are required")
    }

    const existedUser = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username are already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is requried")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is requried") 
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await user.findbyId(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something want wrong")
    }

    return res.status(201).json(
        new ApiResponce(200, createdUser, "user registered succesfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
// req bodyc--> data
// username or email
// find the useer
// password check
// access and refresh token
// send cookie
// 

  const {email, username, password} = req.body

  if (!username || !email) {
    throw new ApiError(400, "username or password are required")

  }
  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user) {
    throw new ApiError(404, "user does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const option = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refrehToken", refreshToken, options)
  .json(
    new ApiResponce(
        200,
        {
            user: loggedInUser, accessToken,
            refreshToken
        },
        "User logged In Successfully"
    )
  )



})


const logoutUser = asyncHandler(async(req, res) => {
    user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponce(200, {}, "User looged Out"))

    
})

export {
    registerUser,
    loginUser,
    logoutUser,
}