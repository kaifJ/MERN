const express = require('express')

const app = express()

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => res.send('API running'))

app.listen(PORT, () => {
    console.log(`Port running on port ${PORT}`)
})