const express = require('express')
const router = express.Router()
const request = require('request')
const config = require('config')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')

//Get my profile
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',[
            'name', 'avatar'
        ])

        if(!profile){
            return res.status(400).send({error: 'No user found'})
        }
        res.json(profile)
    } catch (error) {
        res.status(500).json({error})
    }
})

//Add and update Profile
router.post('/', 
    [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty()
    ]
  ], async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
        company, 
        website, 
        location , 
        bio, 
        status, 
        skills, 
        githubusername, 
        youtube, 
        facebook , 
        twitter, 
        instagram, 
        linkedin
    } = req.body

    let profileFields = {}
    profileFields.user = req.user.id
    if(company) profileFields.company = company
    if(website) profileFields.website = website
    if(location) profileFields.location = location
    if(bio) profileFields.bio = bio
    if(status) profileFields.status = status
    if(githubusername) profileFields.githubusername = githubusername
    if(skills){
        profileFields.skills = skills.split(',').map(each => each.trim())
    }
    
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube
    if(instagram) profileFields.social.instagram = instagram
    if(facebook) profileFields.social.facebook = facebook
    if(twitter) profileFields.social.twitter = twitter
    if(linkedin) profileFields.social.linkedin = linkedin

    try {
        let profile = await Profile.findOne({ user: req.user.id })
        if(profile){
           
             profile = await Profile.findOneAndUpdate(
                 {user: req.user.id},
                 {$set: profileFields},
                 {new: true}
             )
             
        }else {
             profile = await new Profile(profileFields)
            await profile.save()
        }

        return res.json(profile)
    } catch (error) {
        res.status(500).json(error)
    }
})

//get all profiles
router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.send(profiles)
    } catch (error) {
        res.status(500).json({error})
    }
})

//get profile by id
router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar'])
        if(!profile){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.send(profile)
    } catch (error) {
        if(error.kind === 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }

        res.status(500).send('server error')
    }
})

//delete profile and user
router.delete('/', auth, async(req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id })
        await User.findOneAndRemove({ _id: req.user.id })

        res.send('User deleted')

    } catch (error) {
        res.status(500).send('Serer Error')
    }
})

//Add profile experience
router.put('/experience', [
    auth,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]
], async(req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {
        title,
        from,
        to,
        company,
        location,
        current,
        description
    } = req.body

    const newExp = {title,
        from,
        to,
        company,
        location,
        current,
        description}

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experience.unshift(newExp)
        await profile.save()
        res.send(profile)
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

//Remove Profile Experiece by id
router.delete('/experience/:experience_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experience = profile.experience.filter(experience => experience.id !== req.params.experience_id)
        await profile.save()
        res.send(profile)
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

//Add education details
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'School is required').not().isEmpty(),
    check('fieldofstudy', 'School is required').not().isEmpty(),
    check('from', 'School is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body

    let newEducation = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.education.unshift(newEducation)
        await profile.save()
        res.json(profile)
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

//delete education by id
router.delete('/education/:education_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.education = profile.education.filter(education => education.id !== req.params.education_id)
        await profile.save()
        res.send(profile)
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

router.get('/github/:username', async(req, res) => {
    try {
        const option = {
            uri: `https://api.github.com/users/${req.params.username}/repos?
            per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}
            &client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        }

        request(option, (error, response, body) => {
            if(error) console.log(error)
            if(response.statusCode !== 200){
                return res.status(400).json({ msg: "No Git hub user found" })
            }
            res.json(JSON.parse(body))
        })
    } catch (error) {
        res.status(500).send('Server Error')
    }
})

module.exports = router