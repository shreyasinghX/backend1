import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"



const registerUser = asyncHandler(async(req,res)=>{
   //get user details form frontend
   //validation -not empty
   //check if user already exists
   //check for images, avatar, coverImage
   //upload images to cloudinary
   //create user object -add to db
   //remove password and refresh token field from response
   //check for user creation 
   //return response 


   const {fullname,email,username,password}=req.body;
   console.log("req.body",req.body);


   if(
      [fullname,email,username,password].some((field)=>
         field?.trim()===""
      )

   ){
      throw new ApiErrors(400,"All fields are required")

   }

   const existedUser=await User.findOne({
      $or:[{email},{username}]
   })
    if(existedUser){
      throw new ApiErrors(409,"User already exists")
   }

   console.log("req.files",req.files);

   const avatarLocalPath=req.files?.avatar[0]?.path;
   // const coverImageLocalPath=req.files?.coverImage[0]?.path;

   console.log("avatarLocalPath",avatarLocalPath);
   // console.log("coverImageLocalPath",coverImageLocalPath);
   if(!avatarLocalPath){
      throw new ApiErrors(400,"Avatar is required")
   }
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath=req.files.coverImage[0].path;
   }

   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar ){
      throw new ApiErrors(400,"Avatar file is required")
   }

   const user=await User.create({
      fullname,
      avatar:avatar.url,
      coverImage:coverImage.url || "",
      email,
      password,
      username
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )
   if(!createdUser){
      throw new ApiErrors(500,"Something went wrong while registering user")
   }

   return res.status(201).json(
      new ApiResponse(200,createdUser,"User registered successfully")
   )

})

export {registerUser}