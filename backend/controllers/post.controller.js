import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { populate } from "dotenv";
import { Comment } from "../models/comment.model.js";

export const addNewPost = async (req,res) => {
    try {
        const {caption} =req.body;
        const image = req.file;
        const authorId = req.id;

        if(!image) return res.status(400).json({message:'Image Required'});

        //image upload
        //npm sharp
        const optimizedImageBuffer = await sharp(image.buffer)
        .resize({width:800,height:800,fit:'inside'})
        .toFormat('jpeg', {quality:80})
        .toBuffer();

        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudRespose = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image:cloudRespose.secure_url,
            author:authorId
        });

        const user = await User.findById(authorId);
        if(user){
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({path:'author',select:'password'});

        return res.status(201).json({
            message:'New Post added',
            post,
            success:true,
        })
        
    } catch (error) {
        console.log(error);
}
}


export const getAllPost = async (rea,req) => {
    try {
        const post = await Post.find().sort({createdAt:-1}).populate({path:'author',select:'username, profilePicture'})
        .populate({
            path:'comments',
            sort:{createdAt:-1},
            populate:{
                path:'author',
                select:'username,profilePicture'
            }
        });

        return res.status(200).json({
            posts,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
};

export const getUserPost = async (req , res) => {
    try {
        const authorId = req.Id;
        const post = await Post.find({author:'authorId'}).sort({createdAt:-1}).populate({
            path:'author',
            select:'username, profilePicture'
        }).populate({
            path:'comments',
            sort:{createdAt:-1},
            populate:{
                path:'author',
                select:'username,profilePicture'
            }
        });
       
        return res.status(200).json({
            posts,
            success:true
        })

        
    } catch (error) {
        console.log(error)
    }
}

export const likePost = async (req,res) => {
    try {
        const likeKrneWalaUserKiId = req.Id;
        const postId = req.parmas.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'post not found', success:false});

        await post.updateOne({$addToSet:{likes:likeKrneWalaUserKiId}});

        await post.save();

        // socket io for real time notification


        return res.status(200).json({message:'post liked', success:true});
    } catch (error) {
        
    }
}

export const dislikePost = async (req,res) => {
    try {
        const likeKrneWalaUserKiId = req.Id;
        const postId = req.parmas.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'post not found', success:false});

        await post.updateOne({$pull:{likes:likeKrneWalaUserKiId}});

        await post.save();

        // socket io for real time notification


        return res.status(200).json({message:'post disliked', success:true});
    } catch (error) {
        console.log(error);
    }
}

export const addComment = async (req,res) => {
    try {
        const postId = req.parmas.id;
        const commentKrnewalaUserKiId = req.id;

        const {text} = req.body;
        const post = await Post.findById(postId);
        if(!text) return res.status(400).json({message:'text is required',sucsess:false});

        const comment = await Comment.create({
            text,
            author:commentKrnewalaUserKiId,
            post:postId
        }).populate({
          
            path:'author',
            select:"username,profilePicture"

        });

        post.comments.push(comment.id);
        await post.save();

        return res.status(201).json({
            message:'Comment added',
            comment,
            sucsess:true
        })

        

    } catch (error) {
        console.log(error);
    }
};

export const getCommentofPost = async (req,res) => {
    try {
        const postId = req.parmas.id;
        const comments = await Comment.find({post:postId}).populate('author','username,profilePicture');
        if(!comments) return res.status(404).json({message:'No comments in this post', success:false});

        return res.status(200).json({success:true,comments});
    } catch (error) {
        console.log(error);
    }
}

export const deletePost = async (req,res) =>{
    try {
        const postId = req.parmas.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({
            message:'post not found',
            success:false

        });

        //check to see loggedin user is the owner of the post
        if(post.author.toString() != authorId) return res.status(403).json({message:'Unauthorised'});

        //delet post
        await Post.findByIdAndDelete(postId);

        // remove the post from user
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() != postId);
        await user.save();

        //delete assosiated comments
        await Comments.deleteMany({post:postId});

        return res.status(200).json({
            message:'post deleted',
            success:true,
        })
    } catch (error) {
        console.log(error);
    }
}

export const bookmarkPost = async (req,res) => {
    try {
        const postId = req.parmas.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'post not found', succese:false});

        const user = user.findById(authorId);
        if(user.bookmark.includes(post._id)){
            await user.updateOne({$pull:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'unsaved',message:'post removed from bookmark',success:true});
 
        }else{
            await user.updateOne({$addToSet:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'saved',message:'post bookmarked',success:true});
        }
    } catch (error) {
        
    }
}