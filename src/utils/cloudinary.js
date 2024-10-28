import {v2 as cloudinary} from "cloudinary";
import fs from 'fs';
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath) return null
        const response=cloudinary.uploader.upload(localFilePath, {
            resource__type: "auto"
        })
        //file has uploaded successfully
        console.log("file has uploaded successfully",response.url)
        console.log(response);
        return response

    }
    catch(error){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;

    }
}

export { uploadOnCloudinary }