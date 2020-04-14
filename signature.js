
const r = require('crypto-js/hmac-sha1');
const o = require('crypto-js/enc-base64');
const i = require('crypto-js/enc-utf8');

class Signature {
    randomUUID() {
        const arr = [];
        const str = '0123456789abcdef';
        for (var i = 0; i < 36; i++) {
            arr[i] = str.substr(Math.floor(16 * Math.random()), 1);
        }
        arr[14] = '4';
        arr[19] = str.substr(3 & arr[19] | 8, 1);
        arr[8] = arr[13] = arr[18] = arr[23] = '-';
        return arr.join('');
    }
    returnUTCDate() {
        const date = new Date;
        return Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds(),
        );
    }
    AliyunEncodeURI(decodeUrl) {
        var url = encodeURIComponent(decodeUrl);
        url = url.replace('+', '%2B').replace('*', '%2A').replace('%7E', '~');
        return url;
    }
    makesort(e, t, i) {
        if (!e) {
            throw new Error("PrismPlayer Error: vid should not be null!");
        }
        var r = [];
        for (var o in e) {
            r.push(o);
        }
        var n = r.sort();
        var a = "";
        var len = n.length;
        for (o = 0; o < len; o++) {
            if (a == '') {
                a = n[o] + t + e[n[o]];
            } else {
                a += i + n[o] + t + e[n[o]];
            }
        }
        return a
    }
    makeUTF8sort(e, t, i) {
        if (!e) {
            throw new Error("PrismPlayer Error: vid should not be null!");
        }
        var r = [];
        for (var o in e) {
            r.push(o);
        }
        var n = r.sort();
        var a = "";
        var len = n.length;
        for (o = 0; o < len; o++) {
            var l = this.AliyunEncodeURI(n[o]);
            var u = this.AliyunEncodeURI(e[n[o]]);
            if (a == '') {
                a = l + t + u;
            } else {
                a += i + l + t + u;
            }
        }
        return a
    }
    makeChangeSiga(e, t, i) {
        if (!e) {
            throw new Error("PrismPlayer Error: vid should not be null!");
        }
        if (!i) {
            i = 'GET';
        }
        const hash = r(i + "&" + this.AliyunEncodeURI("/") + "&" + this.AliyunEncodeURI(this.makeUTF8sort(e, "=", "&")), t + "&");
        return o.stringify(hash);
    }
    ISODateString(e) {
        function t(e) { return e < 10 ? "0" + e : e }
        return e.getUTCFullYear() + "-" + t(e.getUTCMonth() + 1) + "-" + t(e.getUTCDate()) + "T" + t(e.getUTCHours()) + ":" + t(e.getUTCMinutes()) + ":" + t(e.getUTCSeconds()) + "Z"
    }
    encPlayAuth(e) {
        e = i.stringify(o.parse(e));
        if (!e) {
            throw new Error("playuth\u53c2\u6570\u89e3\u6790\u4e3a\u7a7a");
        }
        return JSON.parse(e)
    }
    encRsa() {

    }
}
const signature = new Signature();

module.exports = signature;