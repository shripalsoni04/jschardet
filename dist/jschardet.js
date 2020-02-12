(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jschardet = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./src')
},{"./src":8}],2:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var constants = require('./constants');
var CharSetProber = require('./charsetprober');
var logger = require('./logger');

function CharSetGroupProber() {
    CharSetProber.apply(this);

    var self = this;

    function init() {
        self._mActiveNum = 0;
        self._mProbers = [];
        self._mBestGuessProber = null;
    }

    this.reset = function() {
        CharSetGroupProber.prototype.reset.apply(this);
        this._mActiveNum = 0;
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( prober ) {
                prober.reset();
                prober.active = true;
                this._mActiveNum++;
            }
        }
        this._mBestGuessProber = null;
    }

    this.getCharsetName = function() {
        if( !this._mBestGuessProber ) {
            this.getConfidence();
            if( !this._mBestGuessProber ) return null;
        }
        return this._mBestGuessProber.getCharsetName();
    }

    this.feed = function(aBuf) {
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( !prober || !prober.active ) continue;
            var st = prober.feed(aBuf);
            if( !st ) continue;
            if( st == constants.foundIt ) {
                this._mBestGuessProber = prober;
                return this.getState();
            } else if( st == constants.notMe ) {
                prober.active = false;
                this._mActiveNum--;
                if( this._mActiveNum <= 0 ) {
                    this._mState = constants.notMe;
                    return this.getState();
                }
            }
        }
        return this.getState();
    }

    this.getConfidence = function() {
        var st = this.getState();
        if( st == constants.foundIt ) {
            return 0.99;
        } else if( st == constants.notMe ) {
            return 0.01;
        }
        var bestConf = 0.0;
        this._mBestGuessProber = null;
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( !prober ) continue;
            if( !prober.active ) {
                logger.log(prober.getCharsetName() + " not active\n");
                continue;
            }
            var cf = prober.getConfidence();
            logger.log(prober.getCharsetName() + " confidence = " + cf + "\n");
            if( bestConf < cf ) {
                bestConf = cf;
                this._mBestGuessProber = prober;
            }
        }
        if( !this._mBestGuessProber ) return 0.0;
        return bestConf;
    }

    init();
}
CharSetGroupProber.prototype = new CharSetProber();

module.exports = CharSetGroupProber

},{"./charsetprober":3,"./constants":5,"./logger":9}],3:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var constants = require('./constants')

function CharSetProber() {
    this.reset = function() {
        this._mState = constants.detecting;
    }

    this.getCharsetName = function() {
        return null;
    }

    this.feed = function(aBuf) {
    }

    this.getState = function() {
        return this._mState;
    }

    this.getConfidence = function() {
        return 0.0;
    }

    this.filterHighBitOnly = function(aBuf) {
        aBuf = aBuf.replace(/[\x00-\x7F]+/g, " ");
        return aBuf;
    }

    this.filterWithoutEnglishLetters = function(aBuf) {
        aBuf = aBuf.replace(/[A-Za-z]+/g, " ");
        return aBuf;
    }

    // Input: aBuf is a string containing all different types of characters
    // Output: a string that contains all alphabetic letters, high-byte characters, and word immediately preceding `>`, but nothing else within `<>`
    // Ex: input - '¡£º <div blah blah> abcdef</div> apples! * and oranges 9jd93jd>'
    //     output - '¡£º blah div apples and oranges jd jd '
    this.filterWithEnglishLetters = function(aBuf) {
        var result = '';
        var inTag = false;
        var prev = 0;

        for (var curr = 0; curr < aBuf.length; curr++) {
          var c = aBuf[curr];

          if (c == '>') {
            inTag = false;
          } else if (c == '<') {
            inTag = true;
          }

          var isAlpha = /[a-zA-Z]/.test(c);
          var isASCII = /^[\x00-\x7F]*$/.test(c);

          if (isASCII && !isAlpha) {
            if (curr > prev && !inTag) {
              result = result + aBuf.substring(prev, curr) + ' ';
            }

            prev = curr + 1;
          }
        }

        if (!inTag) {
          result = result + aBuf.substring(prev);
        }

        return result;
    }
}

module.exports = CharSetProber

},{"./constants":5}],4:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var constants = require('./constants')

function CodingStateMachine(sm) {
    var self = this;

    function init(sm) {
        self._mModel = sm;
        self._mCurrentBytePos = 0;
        self._mCurrentCharLen = 0;
        self.reset();
    }

    this.reset = function() {
        this._mCurrentState = constants.start;
    }

    this.nextState = function(c) {
        // for each byte we get its class
        // if it is first byte, we also get byte length
        var byteCls = this._mModel.classTable[c.charCodeAt(0)];
        if( this._mCurrentState == constants.start ) {
            this._mCurrentBytePos = 0;
            this._mCurrentCharLen = this._mModel.charLenTable[byteCls];
        }
        // from byte's class and stateTable, we get its next state
        this._mCurrentState = this._mModel.stateTable[this._mCurrentState * this._mModel.classFactor + byteCls];
        this._mCurrentBytePos++;
        return this._mCurrentState;
    }

    this.getCurrentCharLen = function() {
        return this._mCurrentCharLen;
    }

    this.getCodingStateMachine = function() {
        return this._mModel.name;
    }

    init(sm);
}

module.exports = CodingStateMachine

},{"./constants":5}],5:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

module.exports = {
    detecting   : 0,
    foundIt     : 1,
    notMe       : 2,

    start       : 0,
    error       : 1,
    itsMe       : 2,

    SHORTCUT_THRESHOLD  : 0.95
};

},{}],6:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var CharSetProber = require('./charsetprober');
var CodingStateMachine = require('./codingstatemachine');
var escsm = require('./escsm');
var constants = require('./constants');

function EscCharSetProber() {
    CharSetProber.apply(this);

    var self = this;

    function init() {
        self._mCodingSM = [
            new CodingStateMachine(escsm.HZSMModel),
            new CodingStateMachine(escsm.ISO2022CNSMModel),
            new CodingStateMachine(escsm.ISO2022JPSMModel),
            new CodingStateMachine(escsm.ISO2022KRSMModel)
        ];
        self.reset();
    }

    this.reset = function() {
        EscCharSetProber.prototype.reset.apply(this);
        for( var i = 0, codingSM; codingSM = this._mCodingSM[i]; i++ ) {
            if( !codingSM ) continue;
            codingSM.active = true;
            codingSM.reset();
        }
        this._mActiveSM = self._mCodingSM.length;
        this._mDetectedCharset = null;
    }

    this.getCharsetName = function() {
        return this._mDetectedCharset;
    }

    this.getConfidence = function() {
        if( this._mDetectedCharset ) {
            return 0.99;
        } else {
            return 0.00;
        }
    }

    this.feed = function(aBuf) {
        for( var i = 0, c; i < aBuf.length; i++ ) {
            c = aBuf[i];
            for( var j = 0, codingSM; codingSM = this._mCodingSM[j]; j++ ) {
                if( !codingSM || !codingSM.active ) continue;
                var codingState = codingSM.nextState(c);
                if( codingState == constants.error ) {
                    codingSM.active = false;
                    this._mActiveSM--;
                    if( this._mActiveSM <= 0 ) {
                        this._mState = constants.notMe;
                        return this.getState();
                    }
                } else if( codingState == constants.itsMe ) {
                    this._mState = constants.foundIt;
                    this._mDetectedCharset = codingSM.getCodingStateMachine();
                    return this.getState();
                }
            }
        }

        return this.getState();
    }

    init();
}
EscCharSetProber.prototype = new CharSetProber();

module.exports = EscCharSetProber

},{"./charsetprober":3,"./codingstatemachine":4,"./constants":5,"./escsm":7}],7:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var consts = require('./constants');

var HZ_cls = [
    1,0,0,0,0,0,0,0,  // 00 - 07
    0,0,0,0,0,0,0,0,  // 08 - 0f
    0,0,0,0,0,0,0,0,  // 10 - 17
    0,0,0,1,0,0,0,0,  // 18 - 1f
    0,0,0,0,0,0,0,0,  // 20 - 27
    0,0,0,0,0,0,0,0,  // 28 - 2f
    0,0,0,0,0,0,0,0,  // 30 - 37
    0,0,0,0,0,0,0,0,  // 38 - 3f
    0,0,0,0,0,0,0,0,  // 40 - 47
    0,0,0,0,0,0,0,0,  // 48 - 4f
    0,0,0,0,0,0,0,0,  // 50 - 57
    0,0,0,0,0,0,0,0,  // 58 - 5f
    0,0,0,0,0,0,0,0,  // 60 - 67
    0,0,0,0,0,0,0,0,  // 68 - 6f
    0,0,0,0,0,0,0,0,  // 70 - 77
    0,0,0,4,0,5,2,0,  // 78 - 7f
    1,1,1,1,1,1,1,1,  // 80 - 87
    1,1,1,1,1,1,1,1,  // 88 - 8f
    1,1,1,1,1,1,1,1,  // 90 - 97
    1,1,1,1,1,1,1,1,  // 98 - 9f
    1,1,1,1,1,1,1,1,  // a0 - a7
    1,1,1,1,1,1,1,1,  // a8 - af
    1,1,1,1,1,1,1,1,  // b0 - b7
    1,1,1,1,1,1,1,1,  // b8 - bf
    1,1,1,1,1,1,1,1,  // c0 - c7
    1,1,1,1,1,1,1,1,  // c8 - cf
    1,1,1,1,1,1,1,1,  // d0 - d7
    1,1,1,1,1,1,1,1,  // d8 - df
    1,1,1,1,1,1,1,1,  // e0 - e7
    1,1,1,1,1,1,1,1,  // e8 - ef
    1,1,1,1,1,1,1,1,  // f0 - f7
    1,1,1,1,1,1,1,1   // f8 - ff
];

var HZ_st = [
    consts.start,consts.error,    3,consts.start,consts.start,consts.start,consts.error,consts.error, // 00-07
    consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, // 08-0f
    consts.itsMe,consts.itsMe,consts.error,consts.error,consts.start,consts.start,    4,consts.error, // 10-17
        5,consts.error,    6,consts.error,    5,    5,    4,consts.error, // 18-1f
        4,consts.error,    4,    4,    4,consts.error,    4,consts.error, // 20-27
        4,consts.itsMe,consts.start,consts.start,consts.start,consts.start,consts.start,consts.start  // 28-2f
];

var HZCharLenTable = [0, 0, 0, 0, 0, 0];

exports.HZSMModel = {
    "classTable"    : HZ_cls,
    "classFactor"   : 6,
    "stateTable"    : HZ_st,
    "charLenTable"  : HZCharLenTable,
    "name"          : "HZ-GB-2312"
};

var ISO2022CN_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07
    0,0,0,0,0,0,0,0,  // 08 - 0f
    0,0,0,0,0,0,0,0,  // 10 - 17
    0,0,0,1,0,0,0,0,  // 18 - 1f
    0,0,0,0,0,0,0,0,  // 20 - 27
    0,3,0,0,0,0,0,0,  // 28 - 2f
    0,0,0,0,0,0,0,0,  // 30 - 37
    0,0,0,0,0,0,0,0,  // 38 - 3f
    0,0,0,4,0,0,0,0,  // 40 - 47
    0,0,0,0,0,0,0,0,  // 48 - 4f
    0,0,0,0,0,0,0,0,  // 50 - 57
    0,0,0,0,0,0,0,0,  // 58 - 5f
    0,0,0,0,0,0,0,0,  // 60 - 67
    0,0,0,0,0,0,0,0,  // 68 - 6f
    0,0,0,0,0,0,0,0,  // 70 - 77
    0,0,0,0,0,0,0,0,  // 78 - 7f
    2,2,2,2,2,2,2,2,  // 80 - 87
    2,2,2,2,2,2,2,2,  // 88 - 8f
    2,2,2,2,2,2,2,2,  // 90 - 97
    2,2,2,2,2,2,2,2,  // 98 - 9f
    2,2,2,2,2,2,2,2,  // a0 - a7
    2,2,2,2,2,2,2,2,  // a8 - af
    2,2,2,2,2,2,2,2,  // b0 - b7
    2,2,2,2,2,2,2,2,  // b8 - bf
    2,2,2,2,2,2,2,2,  // c0 - c7
    2,2,2,2,2,2,2,2,  // c8 - cf
    2,2,2,2,2,2,2,2,  // d0 - d7
    2,2,2,2,2,2,2,2,  // d8 - df
    2,2,2,2,2,2,2,2,  // e0 - e7
    2,2,2,2,2,2,2,2,  // e8 - ef
    2,2,2,2,2,2,2,2,  // f0 - f7
    2,2,2,2,2,2,2,2   // f8 - ff
];

var ISO2022CN_st = [
    consts.start,    3,consts.error,consts.start,consts.start,consts.start,consts.start,consts.start, // 00-07
    consts.start,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, // 08-0f
    consts.error,consts.error,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, // 10-17
    consts.itsMe,consts.itsMe,consts.itsMe,consts.error,consts.error,consts.error,    4,consts.error, // 18-1f
    consts.error,consts.error,consts.error,consts.itsMe,consts.error,consts.error,consts.error,consts.error, // 20-27
        5,    6,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, // 28-2f
    consts.error,consts.error,consts.error,consts.itsMe,consts.error,consts.error,consts.error,consts.error, // 30-37
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.error,consts.start  // 38-3f
];

var ISO2022CNCharLenTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];

exports.ISO2022CNSMModel = {
    "classTable"    : ISO2022CN_cls,
    "classFactor"   : 9,
    "stateTable"    : ISO2022CN_st,
    "charLenTable"  : ISO2022CNCharLenTable,
    "name"          : "ISO-2022-CN"
};

var ISO2022JP_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07
    0,0,0,0,0,0,2,2,  // 08 - 0f
    0,0,0,0,0,0,0,0,  // 10 - 17
    0,0,0,1,0,0,0,0,  // 18 - 1f
    0,0,0,0,7,0,0,0,  // 20 - 27
    3,0,0,0,0,0,0,0,  // 28 - 2f
    0,0,0,0,0,0,0,0,  // 30 - 37
    0,0,0,0,0,0,0,0,  // 38 - 3f
    6,0,4,0,8,0,0,0,  // 40 - 47
    0,9,5,0,0,0,0,0,  // 48 - 4f
    0,0,0,0,0,0,0,0,  // 50 - 57
    0,0,0,0,0,0,0,0,  // 58 - 5f
    0,0,0,0,0,0,0,0,  // 60 - 67
    0,0,0,0,0,0,0,0,  // 68 - 6f
    0,0,0,0,0,0,0,0,  // 70 - 77
    0,0,0,0,0,0,0,0,  // 78 - 7f
    2,2,2,2,2,2,2,2,  // 80 - 87
    2,2,2,2,2,2,2,2,  // 88 - 8f
    2,2,2,2,2,2,2,2,  // 90 - 97
    2,2,2,2,2,2,2,2,  // 98 - 9f
    2,2,2,2,2,2,2,2,  // a0 - a7
    2,2,2,2,2,2,2,2,  // a8 - af
    2,2,2,2,2,2,2,2,  // b0 - b7
    2,2,2,2,2,2,2,2,  // b8 - bf
    2,2,2,2,2,2,2,2,  // c0 - c7
    2,2,2,2,2,2,2,2,  // c8 - cf
    2,2,2,2,2,2,2,2,  // d0 - d7
    2,2,2,2,2,2,2,2,  // d8 - df
    2,2,2,2,2,2,2,2,  // e0 - e7
    2,2,2,2,2,2,2,2,  // e8 - ef
    2,2,2,2,2,2,2,2,  // f0 - f7
    2,2,2,2,2,2,2,2   // f8 - ff
];

var ISO2022JP_st = [
    consts.start,    3,consts.error,consts.start,consts.start,consts.start,consts.start,consts.start, // 00-07
    consts.start,consts.start,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, // 08-0f
    consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, // 10-17
    consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.error,consts.error, // 18-1f
    consts.error,    5,consts.error,consts.error,consts.error,    4,consts.error,consts.error, // 20-27
    consts.error,consts.error,consts.error,    6,consts.itsMe,consts.error,consts.itsMe,consts.error, // 28-2f
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.itsMe, // 30-37
    consts.error,consts.error,consts.error,consts.itsMe,consts.error,consts.error,consts.error,consts.error, // 38-3f
    consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.error,consts.start,consts.start  // 40-47
];

var ISO2022JPCharLenTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

exports.ISO2022JPSMModel = {
    "classTable"    : ISO2022JP_cls,
    "classFactor"   : 10,
    "stateTable"    : ISO2022JP_st,
    "charLenTable"  : ISO2022JPCharLenTable,
    "name"          : "ISO-2022-JP"
};

var ISO2022KR_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07
    0,0,0,0,0,0,0,0,  // 08 - 0f
    0,0,0,0,0,0,0,0,  // 10 - 17
    0,0,0,1,0,0,0,0,  // 18 - 1f
    0,0,0,0,3,0,0,0,  // 20 - 27
    0,4,0,0,0,0,0,0,  // 28 - 2f
    0,0,0,0,0,0,0,0,  // 30 - 37
    0,0,0,0,0,0,0,0,  // 38 - 3f
    0,0,0,5,0,0,0,0,  // 40 - 47
    0,0,0,0,0,0,0,0,  // 48 - 4f
    0,0,0,0,0,0,0,0,  // 50 - 57
    0,0,0,0,0,0,0,0,  // 58 - 5f
    0,0,0,0,0,0,0,0,  // 60 - 67
    0,0,0,0,0,0,0,0,  // 68 - 6f
    0,0,0,0,0,0,0,0,  // 70 - 77
    0,0,0,0,0,0,0,0,  // 78 - 7f
    2,2,2,2,2,2,2,2,  // 80 - 87
    2,2,2,2,2,2,2,2,  // 88 - 8f
    2,2,2,2,2,2,2,2,  // 90 - 97
    2,2,2,2,2,2,2,2,  // 98 - 9f
    2,2,2,2,2,2,2,2,  // a0 - a7
    2,2,2,2,2,2,2,2,  // a8 - af
    2,2,2,2,2,2,2,2,  // b0 - b7
    2,2,2,2,2,2,2,2,  // b8 - bf
    2,2,2,2,2,2,2,2,  // c0 - c7
    2,2,2,2,2,2,2,2,  // c8 - cf
    2,2,2,2,2,2,2,2,  // d0 - d7
    2,2,2,2,2,2,2,2,  // d8 - df
    2,2,2,2,2,2,2,2,  // e0 - e7
    2,2,2,2,2,2,2,2,  // e8 - ef
    2,2,2,2,2,2,2,2,  // f0 - f7
    2,2,2,2,2,2,2,2   // f8 - ff
];

var ISO2022KR_st = [
    consts.start,    3,consts.error,consts.start,consts.start,consts.start,consts.error,consts.error, // 00-07
    consts.error,consts.error,consts.error,consts.error,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, // 08-0f
    consts.itsMe,consts.itsMe,consts.error,consts.error,consts.error,    4,consts.error,consts.error, // 10-17
    consts.error,consts.error,consts.error,consts.error,    5,consts.error,consts.error,consts.error, // 18-1f
    consts.error,consts.error,consts.error,consts.itsMe,consts.start,consts.start,consts.start,consts.start  // 20-27
];

var ISO2022KRCharLenTable = [0, 0, 0, 0, 0, 0];

exports.ISO2022KRSMModel = {
    "classTable"    : ISO2022KR_cls,
    "classFactor"   : 6,
    "stateTable"    : ISO2022KR_st,
    "charLenTable"  : ISO2022KRCharLenTable,
    "name"          : "ISO-2022-KR"
};

},{"./constants":5}],8:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var UniversalDetector = require('./universaldetector');
var setLogger = require('./logger').setLogger;

exports.detect = function(buffer, options) {
    var u = new UniversalDetector(options);
    u.reset();
    if( typeof Buffer == 'function' && buffer instanceof Buffer ) {
        u.feed(buffer.toString('binary'));
    } else {
        u.feed(buffer);
    }
    u.close();
    return u.result;
}
exports.UniversalDetector = UniversalDetector;
exports.enableDebug = function() {
    setLogger(console.log.bind(console));
}

},{"./logger":9,"./universaldetector":12}],9:[function(require,module,exports){
// By default, do nothing
exports.log = function () {};

exports.setLogger = function setLogger(loggerFunction) {
  exports.enabled = true;
  exports.log = loggerFunction;
};

},{}],10:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var CharSetGroupProber = require('./charsetgroupprober');
var UTF8Prober = require('./utf8prober');

function MBCSGroupProber() {
    CharSetGroupProber.apply(this);
    this._mProbers = [
        new UTF8Prober()
    ];
    this.reset();
}
MBCSGroupProber.prototype = new CharSetGroupProber();

module.exports = MBCSGroupProber

},{"./charsetgroupprober":2,"./utf8prober":13}],11:[function(require,module,exports){
var consts = require('../constants');

var UTF8_cls = [
    1,1,1,1,1,1,1,1,  // 00 - 07  //allow 0x00 as a legal value
    1,1,1,1,1,1,0,0,  // 08 - 0f
    1,1,1,1,1,1,1,1,  // 10 - 17
    1,1,1,0,1,1,1,1,  // 18 - 1f
    1,1,1,1,1,1,1,1,  // 20 - 27
    1,1,1,1,1,1,1,1,  // 28 - 2f
    1,1,1,1,1,1,1,1,  // 30 - 37
    1,1,1,1,1,1,1,1,  // 38 - 3f
    1,1,1,1,1,1,1,1,  // 40 - 47
    1,1,1,1,1,1,1,1,  // 48 - 4f
    1,1,1,1,1,1,1,1,  // 50 - 57
    1,1,1,1,1,1,1,1,  // 58 - 5f
    1,1,1,1,1,1,1,1,  // 60 - 67
    1,1,1,1,1,1,1,1,  // 68 - 6f
    1,1,1,1,1,1,1,1,  // 70 - 77
    1,1,1,1,1,1,1,1,  // 78 - 7f
    2,2,2,2,3,3,3,3,  // 80 - 87
    4,4,4,4,4,4,4,4,  // 88 - 8f
    4,4,4,4,4,4,4,4,  // 90 - 97
    4,4,4,4,4,4,4,4,  // 98 - 9f
    5,5,5,5,5,5,5,5,  // a0 - a7
    5,5,5,5,5,5,5,5,  // a8 - af
    5,5,5,5,5,5,5,5,  // b0 - b7
    5,5,5,5,5,5,5,5,  // b8 - bf
    0,0,6,6,6,6,6,6,  // c0 - c7
    6,6,6,6,6,6,6,6,  // c8 - cf
    6,6,6,6,6,6,6,6,  // d0 - d7
    6,6,6,6,6,6,6,6,  // d8 - df
    7,8,8,8,8,8,8,8,  // e0 - e7
    8,8,8,8,8,9,8,8,  // e8 - ef
    10,11,11,11,11,11,11,11,  // f0 - f7
    12,13,13,13,14,15,0,0    // f8 - ff
];

var UTF8_st = [
    consts.error,consts.start,consts.error,consts.error,consts.error,consts.error,    12,  10, //00-07
        9,    11,    8,    7,    6,    5,    4,   3, //08-0f
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //10-17
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //18-1f
    consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, //20-27
    consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe,consts.itsMe, //28-2f
    consts.error,consts.error,    5,    5,    5,    5,consts.error,consts.error, //30-37
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //38-3f
    consts.error,consts.error,consts.error,    5,    5,    5,consts.error,consts.error, //40-47
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //48-4f
    consts.error,consts.error,    7,    7,    7,    7,consts.error,consts.error, //50-57
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //58-5f
    consts.error,consts.error,consts.error,consts.error,    7,    7,consts.error,consts.error, //60-67
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //68-6f
    consts.error,consts.error,    9,    9,    9,    9,consts.error,consts.error, //70-77
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //78-7f
    consts.error,consts.error,consts.error,consts.error,    9,    9,consts.error,consts.error, //80-87
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //88-8f
    consts.error,consts.error,   12,   12,   12,   12,consts.error,consts.error, //90-97
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //98-9f
    consts.error,consts.error,consts.error,consts.error,consts.error,   12,consts.error,consts.error, //a0-a7
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //a8-af
    consts.error,consts.error,   12,   12,   12,consts.error,consts.error,consts.error, //b0-b7
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error, //b8-bf
    consts.error,consts.error,consts.start,consts.start,consts.start,consts.start,consts.error,consts.error, //c0-c7
    consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error,consts.error  //c8-cf
];

var UTF8CharLenTable = [0, 1, 0, 0, 0, 0, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6];

module.exports = {
    "classTable"    : UTF8_cls,
    "classFactor"   : 16,
    "stateTable"    : UTF8_st,
    "charLenTable"  : UTF8CharLenTable,
    "name"          : "UTF-8"
};

},{"../constants":5}],12:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

/**
 * This is a port from the python port, version "2.0.1"
 */

var constants = require('./constants');
var MBCSGroupProber = require('./mbcsgroupprober');
var EscCharSetProber = require('./escprober')
var logger = require('./logger');

function UniversalDetector(options) {
    if (!options) options = {};
    if (!options.minimumThreshold)  options.minimumThreshold = 0.20;

    var _state = {
        pureAscii   : 0,
        escAscii    : 1,
        highbyte    : 2
    };
    var self = this;

    function init() {
        self._highBitDetector = /[\x80-\xFF]/;
        self._escDetector = /(\x1B|~\{)/;
        self._mEscCharsetProber = null;
        self._mCharsetProbers = [];
        self.reset();
    }

    this.reset = function() {
        this.result = {"encoding": null, "confidence": 0.0};
        this.done = false;
        this._mStart = true;
        this._mGotData = false;
        this._mInputState = _state.pureAscii;
        this._mLastChar = "";
        this._mBOM = "";
        if( this._mEscCharsetProber ) {
            this._mEscCharsetProber.reset();
        }
        for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
            prober.reset();
        }
    }

    this.feed = function(aBuf) {
        if( this.done ) return;

        var aLen = aBuf.length;
        if( !aLen ) return;

        if( !this._mGotData ) {
            this._mBOM += aBuf;
            // If the data starts with BOM, we know it is UTF
            if( this._mBOM.slice(0,3) == "\xEF\xBB\xBF" ) {
                // EF BB BF  UTF-8 with BOM
                this.result = {"encoding": "UTF-8", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\xFF\xFE\x00\x00" ) {
                // FF FE 00 00  UTF-32, little-endian BOM
                this.result = {"encoding": "UTF-32LE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\x00\x00\xFE\xFF" ) {
                // 00 00 FE FF  UTF-32, big-endian BOM
                this.result = {"encoding": "UTF-32BE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\xFE\xFF\x00\x00" ) {
                // FE FF 00 00  UCS-4, unusual octet order BOM (3412)
                this.result = {"encoding": "X-ISO-10646-UCS-4-3412", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\x00\x00\xFF\xFE" ) {
                // 00 00 FF FE  UCS-4, unusual octet order BOM (2143)
                this.result = {"encoding": "X-ISO-10646-UCS-4-2143", "confidence": 1.0};
            } else if( this._mBOM.slice(0,2) == "\xFF\xFE" ) {
                // FF FE  UTF-16, little endian BOM
                this.result = {"encoding": "UTF-16LE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,2) == "\xFE\xFF" ) {
                // FE FF  UTF-16, big endian BOM
                this.result = {"encoding": "UTF-16BE", "confidence": 1.0};
            }

            // If we got to 4 chars without being able to detect a BOM we
            // stop trying.
            if( this._mBOM.length > 3 ) {
                this._mGotData = true;
            }
        }

        if( this.result.encoding && (this.result.confidence > 0.0) ) {
            this.done = true;
            return;
        }

        if( this._mInputState == _state.pureAscii ) {
            if( this._highBitDetector.test(aBuf) ) {
                this._mInputState = _state.highbyte;
            } else if( this._escDetector.test(this._mLastChar + aBuf) ) {
                this._mInputState = _state.escAscii;
            }
        }

        this._mLastChar = aBuf.slice(-1);

        if( this._mInputState == _state.escAscii ) {
            if( !this._mEscCharsetProber ) {
                this._mEscCharsetProber = new EscCharSetProber();
            }
            if( this._mEscCharsetProber.feed(aBuf) == constants.foundIt ) {
                this.result = {
                    "encoding": this._mEscCharsetProber.getCharsetName(),
                    "confidence": this._mEscCharsetProber.getConfidence()
                };
                this.done = true;
            }
        } else if( this._mInputState == _state.highbyte ) {
            if( this._mCharsetProbers.length == 0 ) {
                this._mCharsetProbers = [
                    new MBCSGroupProber()
                ];
            }
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( prober.feed(aBuf) == constants.foundIt ) {
                    this.result = {
                        "encoding": prober.getCharsetName(),
                        "confidence": prober.getConfidence()
                    };
                    this.done = true;
                    break;
                }
            }
        }
    }

    this.close = function() {
        if( this.done ) return;
        if( this._mBOM.length === 0 ) {
            logger.log("no data received!\n");
            return;
        }
        this.done = true;

        if( this._mInputState == _state.pureAscii ) {
            logger.log("pure ascii")
            this.result = {"encoding": "ascii", "confidence": 1.0};
            return this.result;
        }

        if( this._mInputState == _state.highbyte ) {
            var proberConfidence = null;
            var maxProberConfidence = 0.0;
            var maxProber = null;
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( !prober ) continue;
                proberConfidence = prober.getConfidence();
                if( proberConfidence > maxProberConfidence ) {
                    maxProberConfidence = proberConfidence;
                    maxProber = prober;
                }
                logger.log(prober.getCharsetName() + " confidence " + prober.getConfidence());
            }
            if( maxProber && maxProberConfidence > options.minimumThreshold ) {
                this.result = {
                    "encoding": maxProber.getCharsetName(),
                    "confidence": maxProber.getConfidence()
                };
                return this.result;
            }
        }

        if( logger.enabled ) {
            logger.log("no probers hit minimum threshhold\n");
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( !prober ) continue;
                logger.log(prober.getCharsetName() + " confidence = " +
                    prober.getConfidence() + "\n");
            }
        }
    }

    init();
}

module.exports = UniversalDetector;

},{"./constants":5,"./escprober":6,"./logger":9,"./mbcsgroupprober":10}],13:[function(require,module,exports){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

var CodingStateMachine = require('./codingstatemachine');
var CharSetProber = require('./charsetprober');
var constants = require('./constants');
var UTF8SMModel = require('./mbcssm/utf8');

function UTF8Prober() {
    CharSetProber.apply(this);

    var ONE_CHAR_PROB = 0.5;
    var self = this;

    function init() {
        self._mCodingSM = new CodingStateMachine(UTF8SMModel);
        self.reset();
    }

    this.reset = function() {
        UTF8Prober.prototype.reset.apply(this);
        this._mCodingSM.reset();
        this._mNumOfMBChar = 0;
    }

    this.getCharsetName = function() {
        return "UTF-8";
    }

    this.feed = function(aBuf) {
        for( var i = 0, c; i < aBuf.length; i++ ) {
            c = aBuf[i];
            var codingState = this._mCodingSM.nextState(c);
            if( codingState == constants.error ) {
                this._mState = constants.notMe;
                break;
            } else if( codingState == constants.itsMe ) {
                this._mState = constants.foundIt;
                break;
            } else if( codingState == constants.start ) {
                if( this._mCodingSM.getCurrentCharLen() >= 2 ) {
                    this._mNumOfMBChar++;
                }
            }
        }

        if( this.getState() == constants.detecting ) {
            if( this.getConfidence() > constants.SHORTCUT_THRESHOLD ) {
                this._mState = constants.foundIt;
            }
        }

        return this.getState();
    }

    this.getConfidence = function() {
        var unlike = 0.99;
        if( this._mNumOfMBChar < 6 ) {
            for( var i = 0; i < this._mNumOfMBChar; i++ ) {
                unlike *= ONE_CHAR_PROB;
            }
            return 1 - unlike;
        } else {
            return unlike;
        }
    }

    init();
}
UTF8Prober.prototype = new CharSetProber();

module.exports = UTF8Prober;

},{"./charsetprober":3,"./codingstatemachine":4,"./constants":5,"./mbcssm/utf8":11}]},{},[1])(1)
});
