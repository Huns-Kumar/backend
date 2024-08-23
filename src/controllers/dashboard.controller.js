import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: req.user._id
            }
        },
        {
            $group: {
                _id: "$owner",
                totalVideos: { $sum: 1 },                   // Count total videos
                totalLikes: { $sum: { $size: "$likes" } },  // Sum the size of the likes array
                totalViews: {
                    $sum: {
                        $toInt: "$views"                   // Convert views from string to integer and sum them
                    }
                }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
            }
        },
        {
            $project: {
                totalVideos: 1,        // Include totalVideos
                totalLikes: 1,         // Include totalLikes
                totalViews: 1,         // Include totalViews
                subscribersCount: 1
            }
        }
    ])

    if (!channelStats || channelStats.length === 0) {
        return res.status(200).json(new ApiResponse(200, null, "Channel stats not found"))
    }
    else {
        return res.status(200).json(new ApiResponse(200, channelStats[0], "Channel stats fetched successfully"))
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const allVideos = await Video.find({ owner: req.user._id })

    if (!allVideos) {
        throw new ApiError(500, "Something went wrong while finding the videos")
    }

    if (allVideos && allVideos.length > 0) {
        return res.status(200).json(new ApiResponse(200, allVideos, "Videos Fetched Successfully"))
    } else {
        return res.status(200).json(new ApiResponse(200, allVideos, "No videos uploaded"))
    }

})

export {
    getChannelStats,
    getChannelVideos
}