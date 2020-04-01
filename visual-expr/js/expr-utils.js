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

/**
 * 在指定的位置进行拼接
 * @param html 只支持 a标签的解析，且里面无多余标签
 * @param pos 拼接位置（显示的位置）
 * @param addHtmlData 拼接的html
 * @returns {*}
 */
let spliceAtSpecifiedPos = function (html, pos, addHtmlData) {
    // var bkhtml = html;
    // // var matchItems = html.match(/<\s*\/?\s*[a-zA-Z_]([^>]*?["][^"]*["])*[^>"]*>[\W a-zA-Z]*<\/a>/g);
    // html = html.replace(/<\s*\/?\s*[a-zA-Z_]([^>]*?["][^"]*["])*[^>"]*>/g, "").replace(/\&nbsp;/g, " ");
    //
    //
    // var startHtml = html.substring(0, pos);
    // var endHtml = html.substring(pos);

    // $("#test")   .html(startHtml+addData+endHtml);


    //(<a\s*value="[\$]?\w*\W[.]?\w*">\w*\W*<\/a>)|(&nbsp;)


    if (html == null || html.length == 0) {
        return addHtmlData;
    }

    const labelSplit = [];
    const countWords = [];

    //先把标签、空格分解，方便后面做字数统计
    let labels = html.split(/(<a\s*value="[\$]?\w*\W[.]?\w*">\w*\W*<\/a>)|(&nbsp;)/g);

    for (let _index in labels) {
        let label = labels[_index];
        if (label == undefined || label == "") {
            continue;
        }
        labelSplit.push(label);
        //空格算一个字符
        if (label == "&nbsp;") {
            countWords.push(1);
        } else {
            //去掉便签后再算长度
            countWords.push(label.replace(/(<a\s*value="[\$]?[\s\w\W]*?[.]?">)|(<\/a>)/g, "").length);
        }
    }

    let sunChars = 0;

    for (const _index in countWords) {

        // debugger;
        let wordLength = countWords[_index];
        sunChars += wordLength;

        if (sunChars >= pos || (_index == (countWords.length - 1))) {

            //先判断是标签还是还是普通文本
            let label = labelSplit[_index];

            if (label == "&nbsp;") {
                //直接拼接
                labelSplit[_index] = labelSplit[_index] + addHtmlData;
            } else {

                //判断如果是标签的，就直接拼接到后面即可
                const match = label.match(/(<a\s*value="[\$]?\w*\W[.]?\w*">\w*\W*<\/a>)/g);
                if (match) {
                    labelSplit[_index] = labelSplit[_index] + addHtmlData;
                } else {

                    //手动输入的，需要分析长度
                    let cutOffPoint = label.length - (wordLength - pos);
                    let startStr = label.substring(0, cutOffPoint);
                    let endStr = label.substring(cutOffPoint);

                    labelSplit[_index] = startStr + addHtmlData + endStr;
                }
            }
            break;
        }
    }

    debugger;
    console.log(labels);
    console.log(labelSplit);
    console.log(countWords);

    console.log(labelSplit.join(""));

    return labelSplit.join("");
}
