const path = require('path');
const superagent = require('superagent');
// const fs = require('fs');
const m3u8ToMp4 = require("m3u8-to-mp4");
const converter = new m3u8ToMp4();
const signature = require('./signature.js');
const config = require('./config.js');
// const converter = require("node-m3u8-to-mp4");
const Hls = require('./template/aliplayer.hls.js');


const getPlayAuth = async (info) => {
    const res = await superagent.post('https://time.geekbang.org/serv/v3/source_auth/video_play_auth')
        .set({
            'Content-Type': 'application/json',
            'Cookie': config.cookie,
            // 'Origin': 'https://time.geekbang.org',
            'Referer': info.articalUrl,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
        }).send({
            aid: info.aid,
            source_type: 1,
            video_id: info.video_id,
        });
    if (res.body && res.body.error && res.body.error.code) {
        console.log('error msg', res.body.error.msg);
        throw new Error(res.body.error.msg);
    }
    return res.body.data;
}

const getPlayInfo = async (info, playAuth) => {
    var auth = signature.encPlayAuth(playAuth);
    var options = {
        AccessKeyId: auth.AccessKeyId,
        Action: "GetPlayInfo",
        VideoId: auth.VideoMeta.VideoId,
        Formats: '', //e.format,
        AuthTimeout: 7200,
        Rand: 'Q6jE13udbzBQDojYoSkEKSHQu/O2xgHUAX4li7DB3hBdWIu243HDNAHmm2vX6gH5Ivxc4JtpnrcAS2XxJ0mgHw==', //_sce_lgtcaygl(_sce_r_skjhfnck()), 
        SecurityToken: auth.SecurityToken,
        StreamType: 'video', // e.mediaType,
        Format: "JSON",
        Version: "2017-03-21",
        SignatureMethod: "HMAC-SHA1",
        SignatureVersion: "1.0",
        SignatureNonce: signature.randomUUID(),
        PlayerVersion: '2.8.2', //d.h5Version
        Definition: '',
        Channel: "HTML5",
        AuthInfo: auth.AuthInfo,
        // OutputType: '',
        PlayConfig: '{}', // JSON.stringify(e.playConfig))
        ReAuthInfo: '{}', // JSON.stringify(e.reAuthInfo)

    };
    let query = signature.makeUTF8sort(options, "=", "&") + "&Signature=" + signature.AliyunEncodeURI(signature.makeChangeSiga(options, auth.AccessKeySecret));
    const url = "https://vod." + auth.Region + ".aliyuncs.com/?" + query;
    info.playInfoOptions = options;
    info.encPlayAuth = auth;
    const res = await superagent.get(url)
        .set({
            'Content-Type': 'application/json',
            // 'Cookie': config.cookie,
            'Origin': 'https://time.geekbang.org',
            // 'Referer': config.videoCid ? `${config.videoBaseUrl}${config.videoCid}-${articalId}` : `${config.columnBaseUrl}${articalId}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
        }).send();
    if (res.body && res.body.error && res.body.error.code) {
        console.log('error msg', res.body.error.msg);
        throw new Error(res.body.error.msg);
    }
    return res.body.PlayInfoList;
}
/**
 * 下载对应的视频文件
 * @param {String} info 
 * @param {String} fileName 文件名称
 * @param {String} fileDir 保存文件夹地址
 */
const downloadVideo = async (info, fileName, fileDir = __dirname) => {
    console.log('开始下载 视频文件: ', fileName);
    let url = '';
    try {
        const res = await getPlayAuth(info);
        const { PlayInfo } = await getPlayInfo(info, res.play_auth);
        const item = PlayInfo.find(x => x.Definition === 'SD');
        url = item.PlayURL;
        info.playAuth = res.play_auth;
        info.PlayInfo = PlayInfo;
    } catch (e) {
        // console.log(e);
    }

    if (!url) throw '请传入一个视频地址';
    if (path.extname(fileName) !== '.mp4') { // 判断传的文件后缀是否是 mp4
        fileName = fileName + '.mp4';
    }
    let filePath = path.resolve(fileDir, fileName);
    // let writeStream = fs.createWriteStream(filePath);
    // superagent.get(url).pipe(writeStream);
    // const res = new Promise((resolve, reject) => {
    //     const hls = new Hls();
    //     hls.on(Hls.Events.MANIFEST_LOADED, function(e, t) {
    //         resolve(t)
    //     });
    //     hls.on(Hls.Events.ERROR, reject);
    //     hls.loadSource(url);
    // })
    // console.log(res);

    // await converter
    //     .setInputFile(url)
    //     .setOutputFile(filePath)
    //     .start();
    // await converter(url, filePath, (status, index, total) => {
    //     // console.log(status, index, total)
    // });
    console.log('结束下载 视频文件: ', fileName);
};

// downloadVideo(
//    'https://static001.geekbang.org/resource/audio/e7/b1/e7ffca8ca5b09224969b3237723a0bb1.mp4',
//    '305 | 学会几个系统调用：咱们公司能接哪些类型的项目？.mp4',
//    '/Users/jiang/Project/geektime2pdf/geektime_趣谈Linux操作系统')

module.exports = downloadVideo;




// const path = require('path');

// const randomUserAgent = () => {
//     const userAgentList = [
//         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
//         'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
//         'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
//         'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
//         'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
//         'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
//         'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper',
//         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4',
//         'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
//         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0',
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586',
//         'Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
//     ]
//     const num = Math.floor(Math.random() * userAgentList.length)
//     return userAgentList[num]
// }

// const randomIpAddress = () => `211.161.244.${Math.floor(254 * Math.random())}`

// const fetch = require('node-fetch')

// const JkbURL = 'https://time.geekbang.org'
// const JkbRequest = (url, query, cookie) => {
//     const opts = {
//         method: 'POST',
//         headers: {
//             Origin: 'https://time.geekbang.org',
//             Referer: 'https://time.geekbang.org',
//             'User-Agent': randomUserAgent(),
//             'X-Real-IP': randomIpAddress(),
//             Cookie: cookie || '',
//             Connection: 'keep-alive',
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(query),
//     }
//     return new Promise((resolve, reject) => {
//         fetch(JkbURL + url, opts)
//             .then(res => res.json())
//             .then(json => resolve(json))
//             .catch(e => reject(e))
//     })
// }

// // 根据课程id获取视频m3u8列表，cookie可以为空，为空时返回内容是试听版列表
// const fetchCourseMediaList = (courseId, cookie) => {
//     const params = {
//         cid: courseId,
//         size: 200,
//         prev: 0,
//         order: 'earliest',
//         sample: true,
//     }
//     return new Promise((resolve, reject) => {
//         JkbRequest('/serv/v1/column/articles', params, cookie)
//             .then(res => {
//                 const mediaList = res.data.list
//                     .filter(item => item.video_media !== '')
//                     .map(item => ({
//                         articleTitle: item.article_title.replace(' ', '').replace('|', ''),
//                         hdM3u8: JSON.parse(item.video_media).hd.url,
//                         // 直接取高清视频，当然也有标清，字段是sd
//                     }))
//                 resolve(mediaList)
//             })
//             .catch(err =>
//                 reject({
//                     success: false,
//                     message: err.toString(),
//                 })
//             )
//     })
// }
// const spawn = require('child-process-promise').spawn

// const convertM3u8ToMp4 = (m3u8, saveToFilename) => {
//     const promise = spawn('ffmpeg', [
//         '-i',
//         `${m3u8}`,
//         '-c',
//         'copy',
//         '-bsf:a',
//         'aac_adtstoasc',
//         `${saveToFilename}`,
//     ])

//     const childProcess = promise.childProcess

//     // console.log('[spawn] childProcess.pid: ', childProcess.pid)
//     // childProcess.stdout.on('data', data => {
//     //     console.log('[spawn] stdout: ', data.toString())
//     // })
//     // childProcess.stderr.on('data', data => {
//     //     console.log('[spawn] stderr: ', data.toString())
//     // })

//     return promise
//     // .then(() => {
//     //     console.log('[spawn] done!')
//     // })
//     // .catch(err => {
//     //     console.error('[spawn] ERROR: ', err)
//     // })
// }

// let courseId = ''
// let cookie = ''
// const fs = require('fs')
// const util = require('util')

// try {
//     let conf = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')))
//     courseId = conf.courseId;
//     cookie = conf.cookie;
// } catch (e) {
//     console.log('please check the conf.json')
// }


// // fetchCourseMediaList(courseId, cookie)
// //     .then((list) => {
// //         console.log('list', list)
// //         return list.forEach(i => {
// //             const mkdirAsync = util.promisify(fs.mkdir)
// // mkdirAsync(`/Users/Dom/temp2/${i.articleTitle}`)
// //     .then(dummy => {
// //         console.log(`convert m3u8 ${i.hdM3u8} to mp4`)
// //         convertM3u8ToMp4(
// //             i.hdM3u8,
// //             `/Users/Dom/temp2/${i.articleTitle}/${i.articleTitle}.mp4`
// //         )
// //     })
// //     .catch(err => {
// //         console.error('ERROR: ', err)
// //     })
// //         })
// //     }

// function dlOne(i) {
//     // console.log('__dirname', __dirname)
//     // console.log('process.cwd', process.cwd())
//     const mkdirAsync = util.promisify(fs.mkdir)
//     const downloadPath = path.join(process.cwd(), i.articleTitle)
//     const savedPath = `${downloadPath}/${i.articleTitle}.mp4`
//     // return console.log(downloadPath, savedPath);
//     // ---------------------
//     return mkdirAsync(downloadPath)
//         .then(dummy => {
//             // console.log(`convert m3u8 ${i.hdM3u8} to mp4`)
//             return convertM3u8ToMp4(
//                 i.hdM3u8,
//                 savedPath
//             )
//         })
//         .catch(err => {
//             console.error('ERROR: ', err)
//         })
// }

// // )
// // .catch(err => {
// //     console.error('ERROR: ', err)
// // })

// async function oneByOne(peFn) {
//     const list = await fetchCourseMediaList(courseId, cookie)
//     for (let i = 0; i < list.length; i++) {
//         peFn && peFn(i, list.length, list[i])
//         await dlOne(list[i])
//         // console.log(`the ${list[i].articleTitle} download finished`)
//         // fn || fn(list[i]);
//     }
//     console.log('have fun with geektime');
//     return true
// }

// // dlOne(9)

// // (async (s)=>{
// //     await oneByOne(s)
// // })(24)
// oneByOne();

// // export default oneByOne;

// // const ora = require('ora');

// // const spinner = ora('start fetch Course Media').start();
// // require('../index')((i, len, o)=>{
// //   spinner.text = `downloading the ${i+1}/${len} [${o.articleTitle}]`;
// // });