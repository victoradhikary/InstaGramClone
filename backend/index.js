import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config({});
const app = express();

const PORT = process.env.PORT || 3000;


app.get("/",(_,res) => {
    return res.status(200).json({
        message:"I'm coming from Backend",
        success:true
    })
})
//middlewares

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended:true}));
const corsOption = {
    origin:'http://localhost:5173',
    credentials:true
}
app.use(cors(corsOption));


//api
app.use("/api/v1/user",userRoute);
app.use("/api/v1/post",postRoute);
app.use("/api/v1/message",messageRoutes);


app.listen(PORT,()=>{
    connectDB();
    console.log(`Server listen at  ${PORT}`)
})