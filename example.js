'use strict';

var proxyCacheFile = require('./')
var url = 'https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.min.css'

process.on('uncaughtException', function (err) {
	console.log('uncaughtExemption:', err)
	console.log('stack:', err.stack)
})

proxyCacheFile(url, function(err, proxyData) {
	if (err) throw err
	console.log(proxyData)
})
