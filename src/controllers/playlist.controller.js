import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {

    //TODO: create playlist

    const { name, description } = req.body

    if ([name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(401, "name and description is required")
    }

    const AlreadyExistPlaylist = await Playlist.findOne({ name })

    // console.log(AlreadyExistPlaylist)

    if (AlreadyExistPlaylist) {
        throw new ApiError(401, "Same names Playlist Already Exist")
    }

    const playlist = await Playlist.create({
        name, description, owner: req.user?._id
    })
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const allplaylists = await Playlist.find({ owner: userId })

    if (!allplaylists) {
        throw new ApiError(401, "this user dont have playlist")
    }

    return res.status(200).json(new ApiResponse(200, allplaylists, "Playlist fetched Successfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Playlist id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(401, "Playlist not available")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "playlist fetched Successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(401, "Video Already in This Playlist")
    }
    playlist.videos.push(videoId)

    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, playlist, "Video Added to the playlist"))
    // const playlist = await Playlist.aggregate([
    //     {
    //         $match: {
    //             _id: playlistId
    //         }
    //     },
    //     {
    //         $lookup: "videos"
    //     }
    // ])
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    if (!playlist.videos.some((video) => video._id.toString() === videoId)) {
        throw new ApiError(401, "Video not found in This Playlist");
    }

    playlist.videos = playlist.videos.filter((video)=>video._id.toString() !== videoId)

    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, playlist, "Video deleted from the playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {

    // TODO: delete playlist

    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid Playlist id")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(new ApiResponse(200, {}, "Playlist Deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {

    //TODO: update playlist

    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Playlist id is invalid")
    }

    if ([name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(401, "name and description is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        $set: { name, description }
    }, { new: true })

    if (!playlist) {
        throw new ApiError(501, "Something went wrong while updating the playlist")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated Successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}