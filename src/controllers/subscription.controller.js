import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id")
    }

    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(404, "You Could Not Subscribe to Your Channel")
    }

    let responseMessage;

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id })
        responseMessage = "Unsubscribe Successfully"
    } else {
        await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })
        responseMessage = "Channel Subscribe Successfully"
    }

    return res.status(200).json(new ApiResponse(200, null, responseMessage))
})

// confusion ======================== need to redesign


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id")
    }

    const ChannelsAllSubscribers = await Subscription.find({ channel: channelId })

    if (!ChannelsAllSubscribers) {
        throw new ApiError(404, "Something went wrong while finding the subscribers")
    }

    return res.status(200).json(new ApiResponse(200, ChannelsAllSubscribers, "Subscribers list fetched Successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid Subscriber Id");
    }

    // Find all subscriptions for the given subscriberId and populate channel details
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate('channel', 'title avatar description') // Adjust fields to include what you need from the channel model
        .exec();

    if (!subscribedChannels || subscribedChannels.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No subscribed channels found"));
    }

    return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}