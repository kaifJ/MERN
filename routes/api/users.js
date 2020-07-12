const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const gravatar = require('gravatar')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator')

// router.get('/', (req, res) => res.send('User Route'))
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Minimum Length of password is 6').isLength({ min: 6})
],async (req, res) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({error: error.array()})
    } 
    
    const { email, name, password } = req.body
    try {
        let user = await User.findOne({email})

        if(user){
            return res.status(400).json({errors: [{
                msg: 'User already exists'
            }]})
        }

        const avatar = gravatar.url(email,{
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        const salt = await bcrypt.genSalt(10)

        user = new User({
            email,
            password,
            name,
            avatar
        })

        user.password = await bcrypt.hash(password, salt)

        await user.save()

        const jwtPayload = {
            user:{
                id: user.id
            }
        }

        jwt.sign(
            jwtPayload, 
            config.get('jwtSecret'), 
            { expiresIn: 3600000000 },
            (err, token) => {
                if(err) throw new err
                res.json({ token })
            }
        )
        
    } catch (error) {
        res.status(500).send('Server error')
    }
})

module.exports = router