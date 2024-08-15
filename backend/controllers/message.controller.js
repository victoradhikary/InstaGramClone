import {Conversation, conversation} from "../models/conversation.model.js";

export const sendMessage = async(req,res) =>{
    try {
        const senderId = req.id;
        const reciverId = req.params.id;
        const {message} = req.body;

        let converstion = await Conversation.findOne({
            participants:{$all:[senderId, reciverId]}
        });

        if(!converstion){
            converstion = await Conversation.create({
                participants:[senderId, reciverId]
            })
        };
        const newMessage = await Message.create({
            senderId,
            reciverId,
            message
        });

        if(newMessage) converstion.messages.push(newMessage._id);
        await Promise.all([converstion.save(),newMessage.save()])
        
        //socket io



        return res.status(201).json({
            success:true,
            newMessage
        })
    } catch (error) {
        console.log(error);
        
    }
}

export const getMessage = async (req,res) => {
    try {
        const senderId = rew.id;
        const reciverId = req.params.id;
        const conversation = await Conversation.find({
            participants:{$all: [senderId, reciverId]}
        });
        if(!conversation) return res,status(200).json({success:'true',messages:[]});
        
        return res.status(200).json({
            success:true, message:conversation?.messages
        });


    } catch (error) {
        console.log(error);
        
    }
}