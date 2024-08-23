import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    //TODO: create tweet

    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(401, "user not found")
    }

    const tweet = await Tweet.create({
        owner: user._id,
        content
    })

    if (!tweet) {
        throw new ApiError(401, "Server error")
    }

    return res.status(200)
        .json(new ApiResponse(200, tweet, "Tweet Created Successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if (!userId?.trim()) {
        throw new ApiError(401, "User id is required")
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid user id")
    }
    // console.log("userid:", userId)

    const tweets = await Tweet.find({ owner: userId })

    // console.log("tweets:", tweets)
    if (!tweets) {
        throw new ApiError(500, "Something went wrong while fectching the tweets")
    }

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched Successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Unauthorized Request")
    }
    if (!tweetId?.trim()) {
        throw new ApiError(401, "Unauthorized Request")
    }
    if (!content) {
        throw new ApiError(401, "content is required")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, { content }, { new: true })
    if (!tweet) {
        throw new ApiError(500, "Something wrong while updating the user")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Unauthorized Request")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(new ApiResponse(200, {}, "tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}