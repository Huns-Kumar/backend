import mongoose, { isValidObjectId } from "mongoose"
// import {Like} from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    const userId = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(500, "Something went wrong while finding the video")
    }

    const hasLiked = video.likes.includes(userId);

    if (hasLiked) {
        video.likes = video.likes.filter(id => id.toString() !== userId.toString())
    } else {
        video.likes.push(userId)
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, { video, likesCount: video.likes.length }, "Like Toggle Succesfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    const userId = req.user?._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid Comment Id")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(500, "Something went wrong while finding the Comment")
    }

    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
        comment.likes = comment.likes.filter(id => id.toString() !== userId.toString())
    } else {
        comment.likes.push(userId)
    }

    await comment.save();

    return res.status(200).json(new ApiResponse(200, { comment, likesCount: comment.likes.length }, "Like in comment Toggle Succesfully"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while finding the Tweet")
    }

    const hasLiked = tweet.likes.includes(userId);

    if (hasLiked) {
        tweet.likes = tweet.likes.filter(id => id.toString() !== userId.toString())
    } else {
        tweet.likes.push(userId)
    }

    await tweet.save();

    return res.status(200).json(new ApiResponse(200, { tweet, likesCount: tweet.likes.length }, "Like in Tweet Toggle Succesfully"))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id

    const videos = await Video.find({ likes: userId })

    if (!videos) {
        throw new ApiError(500, "Something went wrong while finding the liked videos")
    }

    if (videos && videos.length > 0) {
        return res.status(200).json(new ApiResponse(200, videos, "Liked Videos fetched Successfully"))
    } else {
        return res.status(200).json(new ApiResponse(200, {}, "No any Liked Video found"))
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}