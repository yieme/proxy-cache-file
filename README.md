# proxy-cache-file

Proxy and cache a file and related headers

<!-- [![build status](https://secure.travis-ci.org/yieme/proxy-cache-file.png)](http://travis-ci.org/yieme/proxy-cache-file) -->

## Installation

This module is installed via npm:

```sh
npm i proxy-cache-file --save
```

## Example Usage

Setup

```js
var proxyCacheFile = require('proxy-cache-file')

proxyCacheFile({ dir: 0 })      // disable file cache
proxyCacheFile({ dir: '/tmp' }) // temporary folder used for disk cache, default
```

Get proxy entry via ```url``` string

```js
var proxyCacheFile = require('./')({ dir: './tmp' })
var url = 'https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.min.css'

proxyCacheFile(url, function(err, proxyData) {
	if (err) throw err
	console.log(proxyData)
})
```

```js
{
  "headers": [
    {
      "name": "content-type",
      "value": "text/css"
    }
  ],
  "data": [104, 116, 109, ... 120, 125, 125],
	"isBuffer": true
}
```


Get proxy entry gzipped

```js
proxyCacheFile({ url: url, gzip: true }, function(err, proxyData) {
	if (err) {
		console.error(err)
	} else {
		console.log(JSON.stringify(proxyData, null, 2))
	}
})
```

```js
{
  "headers": [
    {
      "name": "content-type",
      "value": "text/css"
    },
    {
      "name": "content-encoding",
      "value": "gzip"
    }
  ],
  "data": [115, 40, 204, ... 6, 0, 0],
  "isBuffer": true
}
```

Then run again cache hit returns:

```js
{
  "headers": [
    {
      "name": "content-type",
      "value": "text/css"
    },
    {
      "name": "content-encoding",
      "value": "gzip"
    }
  ],
  "data": {
    "_readableState": {
      "highWaterMark": 65536,
			...
      "encoding": null
    },
    "readable": true,
    "domain": null,
    "_events": {},
    "_maxListeners": 10,
    "path": "tmp/12decaf9245f4bf9f86ce8272481ee1f",
    "fd": null,
    "flags": "r",
    "mode": 438,
    "autoClose": true
  }
}
```

## Returned proxyData:

```{ headers: [], data: Buffer || Stream, isBuffer: boolean }```

- headers: an array of {name: 'header-name', value: 'header-value'}
- data: Buffer or Stream of data ready for express, ie ```res.send(proxyData.data)```
- isBuffer: true if ```proxyData.data``` is a Buffer

Data is returned as a Buffer during non-cached proxy requests

## Rights

Copyright (C) 2015 by Yieme, License: MIT
