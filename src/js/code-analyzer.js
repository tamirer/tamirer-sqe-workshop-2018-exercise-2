import * as esprima from 'esprima';
import {getElem} from 'tag-parser';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

let symbols;

export function main(code,input) {
    symbols = getSymbols(code)

    code.body.forEach((item) => {
        replaceSymbol(item);
    });

    let redLines = getRedLines(code,input);
    let greenLines = getGreenLines(code,input);
    return {redLines:redLines, greenLines:greenLines};
}

function getSymbols(code) {
    code = getElem(code);
    let symbols = [];
    symbols.forEach((item)=>{
        if(item.type === 'Var')
    })
    return code;
}

function replaceSymbol(item) {
    //TODO
    return item;
}

function getRedLines(code,input) {
    //TODO
    return [];
}

function getGreenLines(code,input) {
    //TODO
    return [];
}









export {parseCode};
