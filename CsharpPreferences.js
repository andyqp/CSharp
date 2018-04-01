/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, appshell, app */

define(function (require, exports, module) {
    "use strict";

    var AppInit           = app.getModule("utils/AppInit"),
        Core              = app.getModule("core/Core"),
        PreferenceManager = app.getModule("core/PreferenceManager");

    var preferenceId = "csharp";

    var csharpPreferences = {
        "csharp.gen": {
            text: "C# Code Generation",
            type: "Section"
        },
        "csharp.gen.csharpDoc": {
            text: "C# XML comments",
            description: "Generate C# XML comments.",
            type: "Check",
            default: true
        },
        "csharp.gen.useTab": {
            text: "Use Tab",
            description: "Use Tab for indentation instead of spaces.",
            type: "Check",
            default: false
        },
        "csharp.gen.indentSpaces": {
            text: "Indent Spaces",
            description: "Number of spaces for indentation.",
            type: "Number",
            default: 4
        },
        "csharp.gen.unorderedCollectionType": {
            text: "Unordered collections type",
            description: "Generic type to use for unordered collections.",
            type: "String",
            default: "ISet"
        },
        "csharp.gen.orderedCollectionType": {
            text: "Ordered collections type",
            description: "Generic type to use for ordered collections.",
            type: "String",
            default: "IList"
        }
    };

    function getId() {
        return preferenceId;
    }

    function getGenOptions() {
        return {
            csharpDoc     : PreferenceManager.get("csharp.gen.csharpDoc"),
            useTab        : PreferenceManager.get("csharp.gen.useTab"),
            indentSpaces  : PreferenceManager.get("csharp.gen.indentSpaces"),
            unorderedCollectionType  : PreferenceManager.get("csharp.gen.unorderedCollectionType"),
            orderedCollectionType    : PreferenceManager.get("csharp.gen.orderedCollectionType")
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "C#", csharpPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;
});
