try {
    var express = require('express')

    var app = express()

    app.use(express.json())

    var port = process.env['PORT'] ?? 3000

    var controllers = [
        require('./controller/transaction.controller.js')
    ]

    for (controller of controllers) {
        new controller(app)
    }

    app.listen(port)
    console.log('App is running at http://localhost:' + port)
} catch (e) {
    console.error(e)
}