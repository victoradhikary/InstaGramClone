import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check",
                success: false,
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "Try another Email ID",
                success: false,
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password
        });

        return res.status(201).json({
            message: "Account Created Successfully",
            success: false,
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error, please try again later",
            success: false,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!email || !password) {
            return res.status(401).json({
                message: "Incorrect Email or Password",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect Email or Password",
                success: false,
            });
            
            //populate

            const populatedPosts = await Promise.all(
                user.posts.map(async(postId)=>{
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            
            })
            )

            user = {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                posts: user.posts
            }

        }

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 1000 }).json({
            message: `Welcome Back ${user.username}`,
            succes: true,
            user
        });

    } catch (error) {
        console.log(error)
    }
};
export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logout Successfully',
            success: true,
        });
    } catch (error) {
        console.log(error)
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password');
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error)
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;

        let cloudRespose;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudRespose = await cloudinary.uploader.upload(fileUri);
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false

            })
        }
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudRespose.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated',
            success: true,
            user

        })


    } catch (error) {
        console.log(error)
    }
};
export const getSuggestedUsers = async (req, res) => {
    try {
        const getSuggestedUsers = await User.find({ _id: { $ne: req.id } }).select("password");
        if (!getSuggestedUsers) {
            return res.status(404).json({
                message: 'Currently do not have any users',

            })
        };

        return res.status(200).json({
            succes: true,
            users: suggestedUsers

        })

    } catch (error) {
        console.lod(error);
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const followKarneWala = req.id;
        const jiskoFolllowKrunga = req.params.id;
        if (followKarneWala === jiskoFolllowKrunga) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: fasle
            });
        }

        const user = await User.findById(followKarneWala);
        const targetUser = await User.findById(jiskoFolllowKrunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: fasle
            });
        }

        const isFollowing = user.following.includes(jiskoFolllowKrunga);
        if (isFollowing) {
            await Promise.all([
                User.updateOne({ _id: followKarneWala }, { $pull: { following: jiskoFolllowKrunga } }),
                User.updateOne({ _id: jiskoFolllowKrunga }, { $pull: { followers: followKarneWala } }),
            ])
            return res.status(200).json({message:'Unfollowed successfully', success:true});

        } else {

            await Promise.all([
                User.updateOne({ _id: followKarneWala }, { $push: { following: jiskoFolllowKrunga } }),
                User.updateOne({ _id: jiskoFolllowKrunga }, { $push: { followers: followKarneWala } }),
            ])
            return res.status(200).json({message:'followed successfully', success:true});

        }
    } catch (error) {
        console.log(error);
    }
}