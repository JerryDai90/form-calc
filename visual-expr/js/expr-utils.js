/**
 * html 转换成 表达式
 * @param _htmlExpr
 * @returns {*}
 */
let parseHtmlToExpression = function (_htmlExpr) {
    if (_htmlExpr.length == 0) {
        return _htmlExpr;
    }

    let transferStationHtml = _htmlExpr;
    // var labelMatch = transferStationHtml.match(/<\s*\/?\s*[a-zA-Z_]([^>]*?["][^"]*["])*[^>"]*>[\W a-zA-Z]*<\/a>/g);

    //不存在标签就直接跳过
    const labelMatch = transferStationHtml.match(/<a(([\s\S])*?)<\/a>/g);
    if (labelMatch == null) {
        return _htmlExpr;
    }

    console.log(labelMatch);

    let tempPlaceholderMap = {};

    for (let i = 0; i < labelMatch.length; i++) {
        const _label = labelMatch[i];
        const _key = Math.random();

        //使用临时数据替换所有的标签，用于切割出标签后再替换回去
        transferStationHtml = transferStationHtml.replace(_label, _key);

        //提取操作符，只识别指定的操作符
        // let nItem = _label.match(/("\$[\w.\w]*")|("[+\-*\/><=!\(\)]*")|("[in and or not]*")/g)[0].replace(/\"/g, "");
        let nItem = _label.match(/("[\$]?[\s\w\W]*?[.]?")/g)[0].replace(/\"/g, "");

        tempPlaceholderMap[_key] = nItem;
    }

    console.log(transferStationHtml);
    console.log(tempPlaceholderMap);

    //转换解析后的表达式
    for (let key in tempPlaceholderMap) {
        transferStationHtml = transferStationHtml.replace(key, tempPlaceholderMap[key]);
    }

    //由于.html()获取的是转义的字符，需要处理
    transferStationHtml = transferStationHtml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    console.log(transferStationHtml);
    return transferStationHtml
}
