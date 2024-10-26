import dotenv from "dotenv"
import connectDB from './db/index.js'

import {app} from './app.js'

dotenv.config({
    path: './env'
})
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("DB connection failed",error);
        process.exit(1);
    })
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongo db connection failed",error);
})



















// import express from 'express'
// const app=express()

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log(error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is runninng  on port ${process.env.PORT}`)
//         })


//     }
//     catch(error){
//         console.log(error);
//         throw error
//     }
// })
