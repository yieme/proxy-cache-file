var proxyCacheFile = require('./')({ dir: './tmp' })
var url = 'https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.min.css'

proxyCacheFile(url, function(err, proxyData) {
	if (err) {
		console.error(err)
	} else {
		console.log(JSON.stringify(proxyData, null, 2))
	}
})
