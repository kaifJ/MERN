const express = require('express')
const router = express.Router()
const config = require('config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')
const User = require('../../models/User')
const auth = require('../../middleware/auth')

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')

        res.json(user)
    } catch (error) {
        res.status(500).send('Server error')
    }
})

router.post('/', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter the password').exists()
], async(req, res) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({error: error.array()})
    }

    const { email, password } = req.body

    try {
        let user = await User.findOne({email})
        if(!user){
            return res.status(400).send('Invalid Credentials')
        }
    
        const isValidPassword = await bcrypt.compare(password, user.password)
        if(!isValidPassword){
            return res.status(400).send('Invalid Credentials')
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'), 
            { expiresIn: 3600000000 },
            (err, token) => {
                if(err) throw new err
                res.json({ token })
            }
        )
    } catch (error) {
        return res.status(500).send('Server Error')
    }
})

module.exports = router