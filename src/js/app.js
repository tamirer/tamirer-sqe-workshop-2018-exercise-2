import $ from 'jquery';
import {parseCode,main} from './code-analyzer';

let originalCode = '';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        originalCode = codeToParse;
        let input = $('#input').val();
        let result = main(JSON.parse(JSON.stringify(parsedCode)),input);
        let newCode = result.code;
        $('#parsedCodeDiv').empty();
        $('#parsedCodeDiv').append(getHTML(newCode,result.greenLines));
        //$('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

function getHTML(code,greenLines) {
    let result = '',line = 1;
    let split = code.split('if');
    let lim = split.length, i;
    for( i = 0; i < lim; i++){
        if(i === 0)
            result += '<p>' + split[i] +'</p>';
        else{
            let condition = getCondition(split[i])[0], rest = getCondition(split[i])[1];
            if(greenLines.includes(line))
                result += '<p style = "background-color: lawngreen">if' + condition + '</p>';
            else
                result += '<p style = "background-color: orangered" >if' + condition +'</p>';
            result += '<p>' + rest +'</p>';
        }
        line += getNewLines(i);
    }
    return result;
}

function getNewLines(i) {
    let count = {}, split = originalCode.split('if')[i].split('');
    split.forEach((c)=>{
        count[c] = count[c] ? count[c] + 1: 1;
    });
    return count['\n'];
}

function getCondition(splitElement) {
    let bracketCount = 0, isFirst = true, count = 0;
    let result = [], arr = splitElement.trim().split('');
    while(checkCond(isFirst, bracketCount) && count < arr.length){
        if(arr[count] === '(')
            bracketCount++;
        if(arr[count] === ')')
            bracketCount--;
        result.push(arr[count]);
        isFirst = false;
        count++;
    }
    let rest = arr.slice(count).join('').split('\n').join('</br>');
    return [result.join(''),rest];
}

function checkCond(isFirst, bracketCount) {
    return (isFirst || bracketCount > 0);
}
