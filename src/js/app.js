import $ from 'jquery';
import {parseCode,main} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let input = $('#input').val();
        main(parsedCode,input);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});
