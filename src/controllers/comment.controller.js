import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


// fetched comments as oldest and newest is remaining
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    // const { page = 1, limit = 10 } = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Video id is incorrect")
    }

    const allComments = await Comment.find({video: videoId})

    if(!allComments){
        throw new ApiError(500, "Something went wrong while finding the comments")
    }

    return res.status(200).json(new ApiResponse(200, allComments, "All Comments fetched Successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Video Id is not Valid")
    }

    const oldComment = await Comment.findOne({ content })
    if (oldComment) {
        if (oldComment.owner.equals(req.user._id)) {
            throw new ApiError(401, "Comment Already Added")
        }
    }

    if (content?.trim() === "") {
        throw new ApiError(401, "Content is required")
    }

    const comment = await Comment.create({
        content, video: videoId, owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while creating the comment")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment Added Succesfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { content } = req.body
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "Comment Id is not Valid")
    }

    if (!content || content?.trim() === "") {
        throw new ApiError(401, "Content is required")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(401, "Comment not found")
    }

    if (comment.content === content) {
        throw new ApiError(401, "Comment Already Updated")
    }

    comment.content = content
    await comment.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, comment, "Comment Updated Succesfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(401, "Comment Id is incorrect")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(new ApiResponse(200, {}, "Comment Deleted Successfully"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}