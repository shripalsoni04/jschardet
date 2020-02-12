[![NPM](https://nodei.co/npm/jschardet.png?downloads=true&downloadRank=true)](https://nodei.co/npm/jschardet/)

JsChardet (Detects Only UTF-8)
=========

Port of python's chardet (https://github.com/chardet/chardet).

License
-------

LGPL

How To Use It
-------------

### Node
```   
npm install jschardet
```

    var jschardet = require("jschardet")

    // "àíàçã" in UTF-8
    jschardet.detect("\xc3\xa0\xc3\xad\xc3\xa0\xc3\xa7\xc3\xa3")
    // { encoding: "UTF-8", confidence: 0.9690625 }

    // "次常用國字標準字體表" in Big5
    jschardet.detect("\xa6\xb8\xb1\x60\xa5\xce\xb0\xea\xa6\x72\xbc\xd0\xb7\xc7\xa6\x72\xc5\xe9\xaa\xed")
    // { encoding: "Big5", confidence: 0.99 }

### Browser
Copy and include [jschardet.min.js](https://github.com/aadsm/jschardet/tree/master/dist/jschardet.min.js) in your web page.

This library is also available in [cdnjs](https://cdnjs.com) at [https://cdnjs.cloudflare.com/ajax/libs/jschardet/1.4.1/jschardet.min.js](https://cdnjs.cloudflare.com/ajax/libs/jschardet/1.4.1/jschardet.min.js)

Options
-------

```javascript
// See all information related to the confidence levels of each encoding.
// This is useful to see why you're not getting the expected encoding.
jschardet.enableDebug();

// Default minimum accepted confidence level is 0.20 but sometimes this is not
// enough, specially when dealing with files mostly with numbers.
// To change this to 0 to always get something or any other value that can
// work for you.
jschardet.detect(str, { minimumThreshold: 0 });
```

Supported Charsets
------------------

* UTF-8 (with or without a BOM)
* ASCII

Technical Information
---------------------

I haven't been able to create tests to correctly detect:

* ISO-2022-CN
* windows-1250 in Hungarian
* windows-1251 in Bulgarian
* windows-1253 in Greek
* EUC-CN

Development
-----------
Use `npm run dist` to update the distribution files. They're available at https://github.com/aadsm/jschardet/tree/master/dist.

Authors
-------

Ported from python to JavaScript by António Afonso (https://github.com/aadsm/jschardet)

Transformed into an npm package by Markus Ast (https://github.com/brainafk)
