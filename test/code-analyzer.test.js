import assert from 'assert';
import * as esprima from 'esprima';
import {parseCode, getElem, treeTo2DArray, makeTableHTML, getHTML, main} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":"Literal","value":1,"raw":"1","loc":{"start":{"line":1,"column":8},"end":{"line":1,"column":9}}},"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":9}}}],"kind":"let","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}],"sourceType":"script","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}'
        );
    });

    it('test code output function', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}\n',{loc:true}),[1,2,3]).code,
            'function foo(x, y, z) {\n    if (x + 1 + y < z) {\n        return x + y + z + (0 + 5);\n    } else if (x + 1 + y < z * 2) {\n        return x + y + z + (0 + x + 5);\n    } else {\n        return x + y + z + (0 + z + 5);\n    }\n}'
        );
    });

    it('test no params', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(){\n' +
                '        return 1;\n' +
                '    }',{loc:true}),[]).code,
            'function foo() {\n    return 1;\n}'
        );
    });


    it('test no locals', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x){\n' +
                'x = 3;\n' +
                'if(x < 4)\n' +
                'return x;\n' +
                '}',{loc:true}),[]).code,
            'function foo(x) {\n    x = 3;\n    if (x < 4)\n        return x;\n}'
        );
    });

    it('test nested, no locals', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x){\n' +
                'if(x < 2){\n' +
                ' x = 3;\n' +
                ' if(x === 3)\n' +
                '   return \'success\';\n' +
                '}\n' +
                '}',{loc:true}),[1]).code,
            'function foo(x) {\n    if (x < 2) {\n        x = 3;\n        if (x === 3)\n            return \'success\';\n    }\n}'
        );
    });

    it('test nested, with locals', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x){\n' +
                'if(x < 2){\n' +
                ' x = 3;\n' +
                ' if(x === 3)\n' +
                '   return \'success\';\n' +
                '}\n' +
                '}',{loc:true}),[1]).code,
            'function foo(x) {\n    if (x < 2) {\n        x = 3;\n        if (x === 3)\n            return \'success\';\n    }\n}'
        );
    });

    it('test nested local assign, with locals', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x){\n' +
                'let a = 2;\n' +
                'if(x + a < 20){\n' +
                ' a = 3;\n' +
                ' if(a === 3)\n' +
                '   return \'success\';\n' +
                '}\n' +
                '}',{loc:true}),[1]).code,
            'function foo(x) {\n    if (x + 2 < 20) {\n        if (3 === 3)\n            return \'success\';\n    }\n}'
        );
    });

    it('test while loop', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x){\n' +
                'let a = 2;\n' +
                'while(x < 10)\n' +
                'x = x + a;\n' +
                'return x;\n' +
                '}',{loc:true}),[1]).code,
            'function foo(x) {\n    while (x < 10)\n        x = x + 2;\n    return x;\n}'
        );
    });

    it('test while loop', () => {
        assert.deepEqual(
            main(esprima.parse('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n',{loc:true}),[10,1,2]).code,
            'function foo(x, y, z) {\n    while (x + 1 < z) {\n        z = (x + 1 + (x + 1 + y)) * 2;\n    }\n    return z;\n}'
        );
    });

});
