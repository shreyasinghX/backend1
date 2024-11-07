import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { trusted } from "mongoose";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens= async(userId)=>{
   try{
      const user=await User.findById(userId)
      const accessToken =user.generateAccessToken();
      const refreshToken =user.generateRefreshToken();

      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false})

      return {accessToken,refreshToken};

   }
   catch(error){
      throw new ApiErrors(500,"Something went wrong while generating tokens")
   }
}

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

const loginUser=asyncHandler(async(req,res)=>{
   const {email,username,password}=req.body;
   if(!(username || email)){
      throw new ApiErrors(400,"Username or email is required")
   }

   const user=await User.findOne({
      $or:[{email}, {username}]
   })

   if(!user){
      throw new ApiErrors(404,"User not found") 
   }
   if(!password){
      throw new ApiErrors(400,"Password is required")
   }

   const isPasswordCorrect=await user.isPasswordCorrect(password)

   if(!isPasswordCorrect){
      throw new ApiErrors(403,"Incorrect password");

   }

  const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)  ;
  const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
  const options={
   httpOnly:true,
   secure:true
  }

  return res.
  status(200)
  .cookie("accessToken",accessToken,options)

  .cookie("refreshToken",refreshToken,options)
  .json(
   new ApiResponse(200,
      {
         user:loggedInUser,
         accessToken,
         refreshToken
      },
      "User logged in successfully"
   )
  )


})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
      req.user.id,
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new:true
      }
    )

    const options={
      httpOnly:true,
      secure:true
    }

    return res.
    status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
      new ApiResponse(200,{},"User logged out successfully")
    )



})


const refreshAccessToken=asyncHandler(async(req,res)=>{
  
   try {
      const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
      if(!incomingRefreshToken){
         throw new ApiErrors(401,"unauthorized request");
      }
      
      const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET) ;
      const user=await User.findById(decodedToken?._id);
   
      if(!user){
         throw new ApiErrors(401,"Invalid refresh tOken")
      }
   
      if(!incomingRefreshToken !== user?.refreshToken){
         throw new ApiErrors(401,"RefreshToken is expired or invalid")
      }
      const options={
         httpOnly:true,
         secure:true
      }
   
      const {accessToken, newrefreshToken}=await generateAccessAndRefreshTokens(user._id);
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newrefreshToken,options)
      .json(
         new ApiResponse(200,
            {
               accessToken,
               newrefreshToken
            },
            "Access token refreshed successfully"
         )  
      )
   } catch (error) {
      throw new ApiErrors(401, error?.message || "Invalid refresh tOken")
      
   }
})

export {loginUser,logoutUser,registerUser,refreshAccessToken}