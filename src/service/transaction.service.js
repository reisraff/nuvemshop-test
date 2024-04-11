var axios = require('axios')

module.exports = function (microserviceBaseUrl) {
    var _self = this;

    _self.microserviceBaseUrl = microserviceBaseUrl ?? 'http://json-server:8080'

    _self.validate = function (transaction) {
        var fields = [
            'value',
            'description',
            'payment_method',
            'card',
        ]

        var card_fields = [
            'number',
            'owner',
            'expiration_date',
            'cvv',
        ]

        for (field of fields) {
            if ((typeof transaction[field] == 'string' && transaction[field].trim() != '') || typeof transaction[field] == 'object') {
                continue
            }

            return false
        }

        for (field of card_fields) {
            if (typeof transaction['card'][field] == 'string' && transaction['card'][field].trim() != '') {
                continue
            }

            return false
        }

        if (['debit_card', 'credit_card'].indexOf(transaction['payment_method']) == -1) {
            return false
        }

        return true
    }

    _self.createPayable = async function (transaction) {
        var value = parseFloat(transaction['value'])
        var isDebit = transaction['payment_method'] == 'debit_card'
        var fee = isDebit ? 2 : 4
        var discont = value * fee / 100

        var date = isDebit ?
             new Date() :
             new Date(new Date().setDate(new Date().getDate() + 30))

        var year = date.getFullYear()
        var month = (date.getMonth() + 1).toString().padStart(2, '0')
        var day = (date.getDate()).toString().padStart(2, '0')

        var formatedDate = `${day}/${month}/${year}`

        var payload_payable = {
          "status": isDebit ? 'paid' : 'waiting_funds',
          "create_date": formatedDate,
          "subtotal": value.toString(),
          "discount": discont.toString(),
          "total": (value - discont).toString()
        }

        var response = axios.post(_self.microserviceBaseUrl + '/payables', payload_payable)

        return response.data
    }

    _self.createTransaction = async function (transaction) {
        var payload_transaction = {
          "value": transaction['value'],
          "description": transaction['description'],
          "method": transaction['payment_method'],
          "cardNumber": transaction['card']['number'],
          "cardHolderName": transaction['card']['owner'],
          "cardExpirationDate": transaction['card']['expiration_date'],
          "cardCvv": transaction['card']['cvv']
        }

        var response = await axios.post(_self.microserviceBaseUrl + '/transactions', payload_transaction)

        return response.data
    }

    _self.process = async function (transaction) {
        var createdTransaction = await _self.createTransaction(transaction)

        _self.createPayable(transaction) // no need to await

        var result = createdTransaction
        result['cardNumber'] = result['cardNumber'].substr(-4)
        delete result['cardCvv']

        return result
    }

    _self.payableReceipes = async function () {
        var result = await axios.get(_self.microserviceBaseUrl + '/payables')

        var total = 0
        var totalFee = 0
        var totalToReceive = 0

        for (entry of result.data) {
            if (entry['status'] == 'paid') {
                total += parseFloat(entry['total'])
                totalFee += parseFloat(entry['discount'])
                continue
            }

            totalToReceive += parseFloat(entry['total'])
        }

        return {
            total: total,
            totalFee: totalFee,
            totalToReceive: totalToReceive,
        }
    }

    return {
        'validate': _self.validate,
        'process': _self.process,
        'payableReceipes': _self.payableReceipes,
    }
}
