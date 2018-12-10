import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc:true});
};

let code = null;


function checkSymbols(symbols) {
    let res = [];
    symbols.forEach((item)=> {
        if(item !== undefined && item.name !== undefined)
            res.push(item);
    });
    return res;
}

export function main(_code,input) {
    code = JSON.parse(JSON.stringify(_code));
    let symbols = getSymbols(code);
    symbols = checkSymbols(symbols);
    replaceSymbols(symbols);
    input = eval(input);
    let redLines = getRedLines(code,input);
    let greenLines = getGreenLines(code,input);
    return {code:escodegen.generate(code), redLines:redLines, greenLines:greenLines};
}

function getSymbols(obj) {
    let symbols = [];
    if(obj === null) return;
    if(obj.type !== undefined && obj.type === 'VariableDeclarator')
        symbols.push({name:obj.id.name, value: obj.init});

    if(Array.isArray(obj))
        obj.forEach((item) => {
            symbols = symbols.concat(getSymbols(item));
        });

    Object.keys(obj).forEach(function(key) {
        if(!isNaN(key))
            return;
        symbols = symbols.concat(getSymbols(obj[key]));
    });
    return symbols;
}

function getSymbol(name,symbols) {
    let res = null;
    symbols.v.forEach((item) => {
        if(item.name ===  name)
            res = item;
    });
    return res;
}

function clearObject(obj) {
    for(const e in obj)
        delete obj[e];
}

function checkTemp(temp) {
    if(temp === undefined) return true;
    if(temp === null) return false;
    return Object.keys(temp).length === 0 && temp.constructor === Object;

}

function replaceHelper(obj,symbols) {
    let temp = [];
    if (Array.isArray(obj)) {
        obj.forEach((item) => {
            temp.push(replaceSymbol(item,symbols));
        });
        while (obj.length > 0) {obj.pop();}
        temp.forEach((i) => {
            if(!(Object.keys(i).length === 0)) obj.push(i);});
    }
    Object.keys(obj).forEach(function (key) {
        if (!isNaN(key)) return obj;
        let symbolsCopy = JSON.parse(JSON.stringify(symbols));
        let temp =  replaceSymbol(obj[key],symbols), shouldClear = checkTemp(temp);
        if(!shouldClear) {obj[key] = temp; symbols = symbolsCopy;}
        else clearObject(obj);
    });
    return symbols;
}

function handleOccurrence(obj,symbols) {
    if (obj.name !== undefined) {
        let temp = getSymbol(obj.name,symbols);
        if (temp !== null)
            return JSON.parse(JSON.stringify(temp.value));
    }
    return obj;
}

function handleAssign(obj,symbols) {
    let temp;
    let x = replaceSymbol(obj.right, symbols);
    temp = getSymbol(obj.left.name,symbols);
    if(temp !== null) {
        temp.value = x;
        return {};
    }
    return obj;

}

function removeLines(obj,symbols) {
    if(obj.type === undefined) return obj;
    if(obj.type === 'VariableDeclaration')
        return {};
    else if(obj.type === 'AssignmentExpression'){
        return handleAssign(obj,symbols);
    }
    return obj;
}


function replaceSymbol(obj,symbols) {
    if (!(obj !== undefined && obj !== null)) return obj;
    let res = removeLines(obj,symbols);
    if (res === obj)
        res = handleOccurrence(obj,symbols);
    if (res !== obj)
        return res;

    symbols.v = replaceHelper(obj,symbols).v;
    return obj;
}

function replaceSymbols(symbols) {
    let len = symbols.length;
    for (let i = 0; i < len; i++) {
        replaceSymbol(code,{v:symbols});
    }
}

/*
* 1) find all return statements
* 2) collect "if"s line while doing so
* 3) replace return body with {val: [line1,...,lineN]}
* 4) evaluate
* 5) get lines
* 6) each if in line is green
* 7) all others are red
* */

function replaceReturn(obj,val) {
    if(obj === null || obj === undefined) return;
    if (obj.type === 'ReturnStatement')
        obj.argument = esprima.parse(JSON.stringify('{val: [' + val + ']}'));
    if(Array.isArray(obj))
        obj.forEach((item) => {
            replaceReturn(item,val);
        });
    let isIf = false;
    Object.keys(obj).forEach(function(key) {
        if(!isNaN(key)) return;
        if(obj[key] === 'IfStatement')
            isIf = true;
        replaceReturn(obj[key],isIf && key === 'consequent' ? val.concat([obj.loc.start.line]) : val);
    });
}

function calcLines(code, input) {
    let codeCopy = JSON.parse(JSON.stringify(code));
    replaceReturn(codeCopy, []);
    let toEval = '(' + escodegen.generate(codeCopy) + ') (' + input.join(', ') + ' )';
    let result = eval(toEval);
    return eval(result);
}

function getAllLines(code) {
    let tagged = getElem(code), res = [];
    tagged.forEach((item) => {
        res.push(item.line);
    });
    return res;
}

function getRedLines(code,input) {
    let res = calcLines(code, input);
    let allLines = getAllLines(code);
    return allLines.filter(function(i) {return res.indexOf(i) < 0;});
}

function getGreenLines(code,input) {
    return calcLines(code, input);
}

function getElem(parsedCode) {
    let result = [];
    //if(parsedCode === undefined) return result;
    //if(parsedCode.body[0] === undefined) return result;
    if(parsedCode.body[0].body === undefined) return result;
    let body = parsedCode.body[0].body.body;
    body = body === undefined ? parsedCode.body : body;
    body.forEach((item) => {
        if(item.type === 'IfStatement')
            result = result.concat(getIfExp(item));
    });
    return result;
}

function getIfExp(item){
    let result = [];
    let condition = escodegen.generate(item.test);
    let line = item.loc.start.line;
    let value = null;
    let name = null;
    let type = item.type;
    result.push({line:line,type:type,name:name,condition:condition,value:value});
    result = result.concat(getElem({body:[item.consequent]}));
    let temp = item.alternate === null ? [] : getElem({body:[item.alternate]});
    result = result.concat(temp);
    return result;
}


export {parseCode};
