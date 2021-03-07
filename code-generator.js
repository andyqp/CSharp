/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const fs = require('fs')
const path = require('path')
const codegen = require('./codegen-utils')

/**
 * C# Code Generator
 */
class CsharpCodeGenerator {

    /**
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     */
    constructor(baseModel, basePath) {

        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {string} */
        this.basePath = basePath;

    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    getIndentString(options) {
        if (options.useTab) {
            return "\t";
        } else {
            var i, len, indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(" ");
            }
            return indent.join("");
        }
    }

    /**
     * Return line ending sequence based on options
     * @param {Object} options
     * @return {string}
     */
    getLineEnding(options) {
        return options.useCrLf ? "\r\n" : "\n";
    }

    /**
     * Generate codes from a given element
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     */
    generate(elem, path, options) {
        var fullPath, codeWriter;
        var isAnnotationType = elem.stereotype === "annotationType";

        // Package
        if (elem instanceof type.UMLPackage) {
            fullPath = path + "/" + elem.name;
            if (!fs.existsSync(fullPath))
                fs.mkdirSync(fullPath);
            if (Array.isArray(elem.ownedElements)) {
                elem.ownedElements.forEach(child => {
                    console.log('package generate');
                    return this.generate(child, fullPath, options);
                });
            }
        } else if (elem instanceof type.UMLClass) {

            // AnnotationType
            if (isAnnotationType) {
                console.log('annotationType generate');
                console.log(elem.name.substring(elem.name.length - 9, elem.name.length));

                if (elem.name.length < 9) {
                    elem.name = elem.name + "Attribute";
                } else if (elem.name.substring(elem.name.length - 9, elem.name.length) !== "Attribute") {
                    elem.name = elem.name + "Attribute";
                }
                fullPath = path + "/" + elem.name + ".cs";
                codeWriter = new codegen.CodeWriter(this.getIndentString(options), this.getLineEnding(options));
                codeWriter.writeLine("using System;");
                codeWriter.writeLine("using System.Collections.Generic;");
                codeWriter.writeLine("using System.Linq;");
                codeWriter.writeLine("using System.Text;");
                codeWriter.writeLine();
                this.writeNamespace("writeAnnotationType", codeWriter, elem, options, isAnnotationType);
                fs.writeFileSync(fullPath, codeWriter.getData());
            } else {
                // Class
                fullPath = path + "/" + elem.name + ".designer.cs";
                console.log('Class generate' + fullPath);

                codeWriter = new codegen.CodeWriter(this.getIndentString(options), this.getLineEnding(options));
                codeWriter.writeLine("using System;");
                codeWriter.writeLine("using System.Collections.Generic;");
                codeWriter.writeLine("using System.Linq;");
                codeWriter.writeLine("using System.Text;");
                codeWriter.writeLine();
                this.writeNamespace("writeClass", codeWriter, elem, options, isAnnotationType);
                fs.writeFileSync(fullPath, codeWriter.getData());
            }
        } else if (elem instanceof type.UMLInterface) {
            // Interface
            fullPath = path + "/" + elem.name + ".cs";
            console.log('Interface generate' + fullPath);

            codeWriter = new codegen.CodeWriter(this.getIndentString(options), this.getLineEnding(options));
            codeWriter.writeLine("using System;");
            codeWriter.writeLine("using System.Collections.Generic;");
            codeWriter.writeLine("using System.Linq;");
            codeWriter.writeLine("using System.Text;");
            codeWriter.writeLine();
            this.writeNamespace("writeInterface", codeWriter, elem, options, isAnnotationType);
            fs.writeFileSync(fullPath, codeWriter.getData());
        } else if (elem instanceof type.UMLEnumeration) {
            // Enum
            fullPath = path + "/" + elem.name + ".cs";
            codeWriter = new codegen.CodeWriter(this.getIndentString(options), this.getLineEnding(options));
            codeWriter.writeLine("using System;");
            codeWriter.writeLine("using System.ComponentModel;");
            codeWriter.writeLine();
            this.writeNamespace("writeEnum", codeWriter, elem, options, isAnnotationType);
            fs.writeFileSync(fullPath, codeWriter.getData());
        } else {
            // Others (Nothing generated.)
            console.log('nothing generated');
        }
    }

    /**
     * Write Namespace
     * @param {functionName} writeFunction
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeNamespace(writeFunction, codeWriter, elem, options) {
        var path = null;
        if (elem._parent) {
            if (elem._parent === this.baseModel && elem._parent instanceof type.UMLPackage) {
                path = elem._parent.name;
            }
            else {
                path = elem._parent.getPath(this.baseModel).map(function (e) { return e.name; }).join(".");
            }
        }
        if (path) {
            codeWriter.writeLine("namespace " + path + " {");
            codeWriter.indent();
        }
        if (writeFunction === "writeAnnotationType") {
            this.writeAnnotationType(codeWriter, elem, options);
        } else if (writeFunction === "writeClass") {
            this.writeClass(codeWriter, elem, options);
        } else if (writeFunction === "writeInterface") {
            this.writeInterface(codeWriter, elem, options);
        } else if (writeFunction === "writeEnum") {
            this.writeEnum(codeWriter, elem, options);
        }

        if (path) {
            codeWriter.outdent();
            codeWriter.writeLine("}");
        }
    }

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeEnum(codeWriter, elem, options) {

        var i, t, len, tlen, tag, terms = [];
        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);
        // Tags
        for (t = 0, tlen = elem.tags.length; t < tlen; t++) {
            tag = elem.tags[t];
            codeWriter.writeLine("[" + tag.name + (tag.kind === "string" ? "(\"" + tag.value + "\")" : "") + "]");
        }
        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        // Enum
        terms.push("enum");
        terms.push(elem.name);

        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.indent();

        // Literals
        for (i = 0, len = elem.literals.length; i < len; i++) {
            var defaultValue = null;
            this.writeDoc(codeWriter, elem.literals[i].documentation, options);
            // Tags
            var hadDescription = false;
            for (t = 0, tlen = elem.literals[i].tags.length; t < tlen; t++) {
                tag = elem.literals[i].tags[t];
                hadDescription = hadDescription || (tag.name === "Description");
                if (tag.name === "Value") {
                    defaultValue = tag.number;
                }
                else {
                    codeWriter.writeLine("[" + tag.name + (tag.kind === "string" ? "(\"" + tag.value + "\")" : "") + "]");
                }
            }
            if (!hadDescription && elem.literals[i].documentation) {
                codeWriter.writeLine("[Description(\"" + elem.literals[i].documentation + "\")]");
            }
            codeWriter.writeLine(elem.literals[i].name + (defaultValue != null ? " = " + defaultValue : "") + (i < elem.literals.length - 1 ? "," : ""));
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    }

    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeInterface(codeWriter, elem, options) {


        var i, len, terms = [];

        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);

        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }

        // Interface
        terms.push("interface");
        terms.push(elem.name);

        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push(": " + _extends.map(function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options, true);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, true, false);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");


    }


    /**
     * Write AnnotationType
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeAnnotationType(codeWriter, elem, options) {



        var i, len, terms = [];
        // Doc
        let doc = elem.documentation.trim();
        let author = app.project.getProject().author;
        if (author && author.length > 0) {
            doc += "\n@author " + author;
        }
        this.writeDoc(codeWriter, doc, options);

        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (elem.operations.some(function (op) { return op.isAbstract === true; })) {
            _modifiers.push("abstract");
        }
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(" "));
        }

        // Class
        terms.push("class");
        terms.push(elem.name);

        // AnnotationType => Attribute in C#
        terms.push(" : System.Attribute");


        //        // Extends
        //        var _extends = this.getSuperClasses(elem);
        //        if (_extends.length > 0) {
        //            terms.push(": " + _extends[0].name);
        //        }
        //
        //        // Implements
        //        var _implements = this.getSuperInterfaces(elem);
        //        if (_implements.length > 0) {
        //            if (_extends.length > 0) {
        //                terms.push(", " + _.map(_implements, function (e) { return e.name; }).join(", "));
        //            } else {
        //                terms.push(": " + _.map(_implements, function (e) { return e.name; }).join(", "));
        //            }
        //        }

        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Constructor
        this.writeConstructor(codeWriter, elem, options);
        codeWriter.writeLine();

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });

        console.log('association length: ' + associations.length);

        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
                console.log('assoc end1');
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
                console.log('assoc end2');
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, false, false);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    console.log("class in class");
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }


        codeWriter.outdent();
        codeWriter.writeLine("}");


    }

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeClass(codeWriter, elem, options) {


        var i, len, terms = [];

        // Doc
        var doc = elem.documentation.trim();
        // let author = app.project.getProject().author;
        // if (author && author.length > 0) {
        //     doc += "\n@author " + author;
        // }
        this.writeDoc(codeWriter, doc, options);

        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_modifiers.indexOf("abstract") < 0 && elem.operations.some(function (op) { return op.isAbstract === true; })) {
            _modifiers.push("abstract");
        }
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(" "));
        }

        // Class
        terms.push("partial class");
        terms.push(elem.name);

        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push(" : " + _extends[0].name);
        }

        // Implements
        var _implements = this.getSuperInterfaces(elem);
        if (_implements.length > 0) {
            if (_extends.length > 0) {
                terms.push(", " + _implements.map(function (e) { return e.name; }).join(", "));
            } else {
                terms.push(": " + _implements.map(function (e) { return e.name; }).join(", "));
            }
        }

        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Constructor
        // this.writeConstructor(codeWriter, elem, options);
        // codeWriter.writeLine();

        // id property if stereotype is entity
        if (elem.stereotype && elem.stereotype.name.toLowerCase() === "entity") {
            codeWriter.writeLine("public virtual System.Guid Id { get; protected set; }")
            codeWriter.writeLine();
        }

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });

        console.log('association length: ' + associations.length);

        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
                console.log('assoc end1');
            }
            if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
                console.log('assoc end2');
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, false, false);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    console.log("class in class");
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }


        codeWriter.outdent();
        codeWriter.writeLine("}");


    };


    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     * @param {boolean} skipBody
     * @param {boolean} skipParams
     */
    writeMethod(codeWriter, elem, options, skipBody, skipParams) {
        if (elem.name.length > 0) {
            var terms = [];
            var params = elem.getNonReturnParameters();
            var returnParam = elem.getReturnParameter();

            // doc
            var doc = elem.documentation.trim();
            this.writeDoc(codeWriter, doc, options);
            params.forEach(function (param) {
                codeWriter.writeLine("/// <param name=\"" + param.name + "\">" + param.documentation + "</param>");
            });
            if (returnParam) {
                codeWriter.writeLine("/// <returns>" + returnParam.documentation + "</returns>");
            }

            // modifiers
            var _modifiers = this.getModifiers(elem, true);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }

            if (!elem.specification && !_modifiers.includes("abstract") && !_modifiers.includes("virtual")) {
                terms.push("partial");
            }

            // type
            if (returnParam) {
                terms.push(this.getType(returnParam, options));
            } else if (elem.stereotype != "constructor") {
                terms.push("void");
            }

            // name + parameters
            var paramTerms = [];
            if (!skipParams) {
                var i, len;
                for (i = 0, len = params.length; i < len; i++) {
                    var p = params[i];
                    var s = this.getType(p, options) + " " + p.name;
                    if (p.defaultValue) {
                        s += " = " + p.defaultValue;
                    }
                    paramTerms.push(s);
                }
            }
            terms.push(elem.name + "(" + paramTerms.join(", ") + ")");

            // body
            if (skipBody === true || !elem.specification || terms.includes("partial")) {
                codeWriter.writeLine(terms.join(" ") + ";");
            } else {
                codeWriter.writeLine(terms.join(" ") + " {");
                codeWriter.indent();
                var lines = elem.specification.split("\n");
                for (i = 0, len = lines.length; i < len; i++) {
                    codeWriter.writeLine(lines[i]);
                }
                codeWriter.outdent();
                codeWriter.writeLine("}");
            }
        }
    }

    /**
     * Return type expression
     * @param {type.Model} elem
     * @param {Object} options
     * @return {string}
     */

    getType(elem, options) {
        var _type = "void";
        var _nullable = false;
        // type name
        if (elem instanceof type.UMLAssociationEnd) {
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
                if (elem._parent !== elem.reference._parent) {
                    // TODO: Namespaces?
                }
            }
        } else {
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
                _nullable = elem.type instanceof type.UMLEnumeration;
            } else if ((typeof elem.type === 'string') && elem.type.length > 0) {
                _type = elem.type;
                _nullable = elem.type !== "string";
            }
        }


        // multiplicity
        if (elem.multiplicity) {
            if (["0..*", "1..*", "*"].includes(elem.multiplicity.trim())) {
                if (elem.isOrdered === true) {
                    _type = options.orderedCollectionType + "<" + _type + ">";
                } else {
                    _type = options.unorderedCollectionType + "<" + _type + ">";
                }
            } else if (elem.multiplicity !== "1" && elem.multiplicity.match(/^\d+$/)) { // number
                _type += "[]";
            } else if (elem.multiplicity === "0..1" && _nullable && !_type.match(/\?$/)) {
                _type += "?";
            }
        }
        return _type;
    };


    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */

    writeMemberVariable(codeWriter, elem, options, omitModifiers) {

        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };

        if (elem.name.length > 0) {
            var terms = [];
            var backingFieldName = "";
            // doc
            this.writeDoc(codeWriter, elem.documentation, options);
            // modifiers
            if (!omitModifiers) {
                var _modifiers = this.getModifiers(elem, elem.stereotype !== "field");
                if (_modifiers.length > 0) {
                    terms.push(_modifiers.join(" "));
                }
            }
            if (elem.stereotype === "field" && elem.isReadOnly) {
                terms.push("readonly");
            }
            // type
            var type = this.getType(elem, options);
            terms.push(type);
            // name
            terms.push(elem.name);

            if (elem.stereotype !== "field") {
                if (elem.isDerived) {
                    terms.push("=> " + elem.defaultValue + ";");
                }
                else if (!elem.isReadOnly && !endsWith(elem.multiplicity.trim(), "*")) {
                    terms.push("{ get; set; }");
                } else if (!options.generateBackingField) {
                    terms.push("{ get; }");
                }
                else {
                    var name = (options.backingFieldPrefix.length === 0 || options.backingFieldPrefix === "_")
                        ? elem.name.charAt(0).toLowerCase() + elem.name.slice(1)
                        : elem.name;
                    backingFieldName = options.backingFieldPrefix + name;
                    terms.push("=> " + backingFieldName + ";");
                }
            }
            // initial value
            if (elem.defaultValue && elem.defaultValue.length > 0 && !elem.isDerived && backingFieldName === "") {
                terms.push("= " + elem.defaultValue + (elem.stereotype === "field" ? "" : ";"));
            }

            codeWriter.writeLine(terms.join(" ") + (elem.stereotype === "field" ? ";" : ""));

            if (backingFieldName !== "") {
                terms = ["private", type, backingFieldName];
                if (elem.defaultValue && elem.defaultValue.length > 0) {
                    terms.push("= " + elem.defaultValue);
                }
                codeWriter.writeLine(terms.join(" ") + ";");
            }
        }
    }


    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeConstructor(codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];
            // Doc
            this.writeDoc(codeWriter, elem.documentation, options);
            // Visibility
            var visibility = this.getVisibility(elem);
            if (visibility) {
                terms.push(visibility);
            }
            terms.push(elem.name + "()");
            codeWriter.writeLine(terms.join(" ") + " {");
            codeWriter.writeLine("}");
        }
    }

    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     * @param {Object} options
     */
    writeDoc(codeWriter, text, options) {

        var i, len, lines;
        if (options.csharpDoc && (typeof text === 'string')) {
            console.log("write Doc");
            lines = text.trim().split("\n");
            codeWriter.writeLine("/// <summary>");
            for (i = 0, len = lines.length; i < len; i++) {
                codeWriter.writeLine("/// " + lines[i]);
            }
            codeWriter.writeLine("/// </summary>");
        }
    }

    /**
     * Return visibility
     * @param {type.Model} elem
     * @return {string}
     */
    getVisibility(elem) {
        switch (elem.visibility) {
            case type.UMLModelElement.VK_PUBLIC:
                return "public";
            case type.UMLModelElement.VK_PROTECTED:
                return "protected";
            case type.UMLModelElement.VK_PRIVATE:
                return "private";
        }
        return null;
    }

    /**
     * Collect modifiers of a given element.
     * @param {type.Model} elem
     * @return {Array.<string>}
     */
    getModifiers(elem, isMethod) {
        var modifiers = [];
        var visibility = this.getVisibility(elem);
        if (visibility && !(elem.stereotype === "constructor" && elem.isStatic))
            modifiers.push(visibility);
        if (elem.isStatic === true)
            modifiers.push("static");
        else if (elem.isAbstract === true)
            modifiers.push("abstract");
        else if (isMethod === false && (elem.isFinalSpecialization === true || elem.isLeaf === true))
            modifiers.push("sealed");
        else if (isMethod === true && !(elem.isFinalSpecialization === true || elem.isLeaf === true) && elem.visibility !== type.UMLModelElement.VK_PRIVATE)
            modifiers.push("virtual");
        //if (elem.concurrency === UML.CCK_CONCURRENT) {
        //http://msdn.microsoft.com/ko-kr/library/c5kehkcz.aspx
        //modifiers.push("synchronized");
        //}
        // transient
        // volatile
        // strictfp
        // const
        // native
        return modifiers;
    }

    /**
     * Collect super classes of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    getSuperClasses(elem) {
        var generalizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem);
        });
        return generalizations.map(function (gen) { return gen.target; });
    }

    /**
     * Collect super interfaces of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    getSuperInterfaces(elem) {
        var realizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem);
        });
        return realizations.map(function (gen) { return gen.target; });
    }
}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate(baseModel, basePath, options) {
    var csharpCodeGenerator = new CsharpCodeGenerator(baseModel, basePath);
    csharpCodeGenerator.generate(baseModel, basePath, options);
}

exports.generate = generate;
