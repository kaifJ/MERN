const express = require('express')
const router = express.Router()
const User = require('../../models/User')
const Profile = require('../../models/Profile')
const Post = require('../../models/Post')
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')

//create a post
router.post('/',[auth, [
    check('text', 'Text is required').not().isEmpty()
]],async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    try {
        const user = await User.findOne({ _id: req.user.id }).select('-password')
        
        let newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })
        const post = await newPost.save()
        res.json(post)
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

//get all posts
//get post by id
//delet post
//like route
//unlike route
//add comment
//dete comment

module.exports = router