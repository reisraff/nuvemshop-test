transactionService = require('./../service/transaction.service.js')

module.exports = function (app) {
    var _self = this
    _self.app = app
    _self.transactionService = new transactionService();

    _self.app.post('/transaction/process', async function (req, res) {
        try {
            var payload = req.body

            if (!_self.transactionService.validate(payload)) {
                res.json({
                    'error': 'Invalid Input'
                }, 400)
            }

            var response = await _self.transactionService.process(payload)
            res.json(response)
        } catch (e) {
            console.error(e)
            res.json({
                'error': 'Server Error'
            }, 500)
        }
    })

    _self.app.get('/payable/receipes', async function (req, res) {
        try {
            var response = await _self.transactionService.payableReceipes()

            res.json(response)
        } catch (e) {
            console.error(e)
            res.json({
                'error': 'Server Error'
            }, 500)
        }
    })
}
