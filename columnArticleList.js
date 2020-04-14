// 获取专栏文章列表
const config = require('./config.js');
const superagent = require('superagent');
const utils = require('./utils');
const path = require('path');
const generaterPdf = require('./generaterPdf.js');
const downloadAudio = require('./downloadAudio.js');
const downloadComment = require('./downloadComment.js');
const downloadVideo = require('./downloadVideo.js');

const columnDir = path.resolve(__dirname, 'share', config.columnName);
/**
 * 执行方法
 */
(async function getColumnArticleList (firstArticalId){
    await utils.createDir(columnDir);
    console.log('专栏文章链接开始获取');
    let columnArticleUrlList = [];
    let articalId = firstArticalId;
    async function getNextColumnArticleUrl (){
        try {
            let res = await superagent.post(config.url)
            .set({
                'Content-Type': 'application/json',
                'Cookie': config.cookie,
                'Referer': config.videoCid ? `${config.videoBaseUrl}${config.videoCid}-${articalId}` : `${config.columnBaseUrl}${articalId}`,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
            }).send({
                'id': articalId,
                'include_neighbors': true
            });
            if (res.body && res.body.error && res.body.error.code){
                console.log('error msg', res.body.error.msg);
                throw new Error(res.body.error.msg);
            }
            console.log(res.body.data.article_title);
            let columnArticle = res.body.data;

            let articleInfo = {
                articleTitle: columnArticle.article_title, // 文章标题
                articalUrl: config.videoCid ? `${config.videoBaseUrl}${config.videoCid}-${articalId}` : `${config.columnBaseUrl}${articalId}`, // 文章地址
                articleContent: columnArticle.article_content, // 文章内容
                articleCover: columnArticle.article_cover, // 文章背景图
                authorName: columnArticle.author_name, // 文章作者
                articleCtime: utils.formatDate(columnArticle.article_ctime), // 文章创建时间 unix 时间戳 单位为 s 
                articleNeighbors: columnArticle.neighbors,  //  上下篇文章信息
                audioDownloadUrl: columnArticle.audio_download_url,
                audioTitle: columnArticle.audio_title,
                aid: columnArticle.id,
                video_id: columnArticle.video_id,
            };
            columnArticleUrlList.push(articleInfo);
            articleInfo.commentsTotal = 0;
            articleInfo.commentsArr = [];
            // 是否导出评论
            if (config.isComment) {
                let {commentsTotal, commentsArr} = await downloadComment(
                    config.columnBaseUrl + articalId,
                    articalId);
                articleInfo.commentsTotal = commentsTotal;
                articleInfo.commentsArr = commentsArr;
            }
            // 替换文章名称的 / 线， 解决路径被分割的问题
            let useArticleTtle = columnArticle.article_title.replace(/\//g, '-');
            // 生成PDF
            if (!config.videoCid) {
                await generaterPdf(articleInfo,
                    useArticleTtle + '.pdf',
                    columnDir
                );
            }
            // 下载视频
            if (config.videoCid && articleInfo.video_id) {
                await downloadVideo(
                    articleInfo,
                    useArticleTtle + '.mp4',
                    columnDir
                );
            }
            // 是否下载音频
            if (config.isdownloadVideo && columnArticle.audio_download_url) {
                await downloadAudio(
                    columnArticle.audio_download_url,
                    useArticleTtle + '.mp3',
                    columnDir
                );
            }
            // 判断是否还有下一篇文章
            let neighborRight = columnArticle.neighbors.right;
            if (neighborRight && neighborRight.id){
                articalId = neighborRight.id;
                await utils.sleep(1.5);
                await getNextColumnArticleUrl();
            }
        } catch(err){
            console.log(`访问 地址 ${config.videoCid ? `${config.videoBaseUrl}${config.videoCid}-${articalId}` : `${config.columnBaseUrl}${articalId}`} err`, err.message);
        }
    }
    await getNextColumnArticleUrl();
    console.log('专栏文章链接获取完成');
    utils.writeToFile(columnDir, JSON.stringify(columnArticleUrlList,null,4));
    return columnArticleUrlList;
})(config.firstArticalId);