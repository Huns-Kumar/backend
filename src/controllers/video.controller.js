import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

// error
const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "User id is not valid")
    }
    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the offset for pagination
    const offset = (pageNumber - 1) * limitNumber;

    // Build the query object
    const queryObj = {};
    let videos;
    // Add search query if provided
    if (query) {
        queryObj.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search on title
            { description: { $regex: query, $options: 'i' } } // Case-insensitive search on description
        ];
    }

    // Add userId filter if provided
    if (userId) {
        // queryObj.userId = new mongoose.Types.ObjectId(userId); // Filter by userId
        videos = await Video.find({owner: userId});
    }

    // Build the sort object
    const sortObj = {};
    sortObj[sortBy] = sortType === 'asc' ? 1 : -1;

    // Fetch the videos from the database with pagination and sorting
    // const videos = await Video.find(queryObj)
    //     .sort(sortObj)
    //     .skip(offset)
    //     .limit(limitNumber);

    //     console.log(videos)
    

    console.log(videos)
    // Fetch the total count of videos for pagination
    const totalVideos = await Video.countDocuments(queryObj);

    // Prepare the response with pagination info
    // const response = new ApiResponse(200, {
    //     videos,
    //     pagination: {
    //         totalVideos,
    //         totalPages: Math.ceil(totalVideos / limitNumber),
    //         currentPage: pageNumber,
    //         pageSize: limitNumber
    //     }
    // }, "Videos fetched successfully");
    const response = new ApiResponse(200, {
        videos,
    }, "Videos fetched successfully");

    // Send the response
    res.status(200).json(response);

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (title?.trim() === "") {
        throw new ApiError(401, "Title is required")
    }

    const existedVideo = await Video.findOne({ title })

    if (existedVideo) {
        throw new ApiError(401, "Video Already Published")
    }

    if (description?.trim() === "") {
        throw new ApiError(401, "description is required")
    }

    let thumbnailLocalPath;

    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    let videoFileLocalPath;

    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoFileLocalPath = req.files.videoFile[0].path;
    }

    if (!(thumbnailLocalPath || videoFileLocalPath)) {
        throw new ApiError(401, "Video and Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if (!thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail to cloudinary")
    }
    if (!videoFile) {
        throw new ApiError(500, "Something went wrong while uploading videoFile to cloudinary")
    }

    // console.log("thumbnail ", thumbnail)
    // console.log("video File", videoFile)

    const video = await Video.create({
        title, description,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        owner: req.user?._id,
        duration: videoFile.duration
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while creating video")
    }

    return res.status(200).json(new ApiResponse(200, video, "Video Uploaded Successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(401, "unauthorized request")
    }

    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video id");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(500, "Something went wrong while finding video")
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id")
    }

    if (
        [title, description].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(401, "Title and Description is required")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title, description
        }
    }, { new: true })

    if (!video) {
        throw new ApiError(501, "Something went wrong while updating the video")
    }

    return res.status(200).json(new ApiResponse(200, video, "Title and Description updated successfully"))
})

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    const oldThumbnailPath = video.thumbnail
    const publicId = oldThumbnailPath.split('/').pop().split('.')[0];

    if (!video) {
        throw new ApiError(401, "Unauthorized Request")
    }

    if (!oldThumbnailPath) {
        throw new ApiError(401, "Old Thumbnail not found")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(401, "Something went wrong while uploading thumbnail at cloudinary")
    }

    video.thumbnail = thumbnail.url
    await video.save({ validateBeforeSave: false })

    await deleteFromCloudinary(publicId)

    return res.status(200).json(new ApiResponse(200, video, "Thumbnail Updated Successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(401, "Unauthorized Request")
    }
    // console.log(video)
    // console.log("video.thumbnail", video.thumbnail)
    // console.log("video.videoFile", video.videoFile)

    const thumbnailPublicId = video.thumbnail.split('/').pop().split('.')[0];
    const videoFilePublicId = video.videoFile.split('/').pop().split('.')[0];

    // console.log("thumbnail Public Id", thumbnailPublicId)
    // console.log("video File Public Id", videoFilePublicId)


    const deletedVideo = await Video.findByIdAndDelete(videoId)

    const thumbnailDeletedFromCloudinary = await deleteFromCloudinary(thumbnailPublicId, "image");
    const videoFileDeletedFromCloudinary = await deleteFromCloudinary(videoFilePublicId, "video");

    if (!thumbnailDeletedFromCloudinary.success || !videoFileDeletedFromCloudinary.success) {
        throw new ApiError(500, "Something went wrong while deleting video or thumbnail from cloudinary")
    }

    return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted Succesfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(500, "Video not found")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res.status(200).json(new ApiResponse(200, video, "isPublished toggle Succesfully"))
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateThumbnail
}