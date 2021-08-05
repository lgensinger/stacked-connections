import test from "ava";

import { configuration, configurationDimension, configurationLayout } from "../src/configuration.js";
import { StackedConnections } from "../src/index.js";

/******************** EMPTY VARIABLES ********************/

// initialize
let sc = new StackedConnections();

// TEST INIT //
test("init", t => {

    t.true(sc.height === configurationDimension.height);
    t.true(sc.paddingStackCell === configurationLayout.paddingStackCell);
    t.true(sc.paddingStackText === configurationLayout.paddingStackText);
    t.true(sc.width === configurationDimension.width);

});

// TEST get DATA //
test("get_data", t => {

    t.true(typeof(sc.data) == "object");

});

// TEST get HORIZONTALSCALE //
test("get_horizontalscale", t => {

    t.true(typeof(sc.horizontalScale) == "function");

});

// TEST GENERATESTACKLAYOUT //
test("generateStackLayout", t => {

    t.true(typeof(sc.generateStackLayout()) == "object");

});

// TEST RENDER //
test("render", t => {

    // clear document
    document.body.innerHTML = "";

    // render to dom
    sc.render(document.body);

    // get generated element
    let artboard = document.querySelector(`.${configuration.name}`);

    t.true(artboard !== undefined);
    t.true(artboard.nodeName == "svg");
    t.true(artboard.getAttribute("viewBox").split(" ")[3] == configurationDimension.height);
    t.true(artboard.getAttribute("viewBox").split(" ")[2] == configurationDimension.width);

});

/******************** DECLARED PARAMS ********************/

let testWidth = 300;
let testHeight = 500;
let testPaddingCell = 5;
let testPaddingText = 10;
let testData = {
    stacks: [
        { "stack1": { "aaa": 1, "aab": 2, "aac": 3 } },
        { "stack2": { "bbb": 2, "bbc": 5} },
        { "stack3": { "ccc": 1, "ccd": 8, "cce": 8} },
        { "stack4": { "ddd": 5, "dde": 11, "ddf": 0} }
    ],
    connections: [
        { "source": "aaa", "target": "bbb", "focus": "some-label" },
        { "source": "bbb", "target": "ccd", "focus": null }
    ]
}

// initialize
let scn = new StackedConnections(testData, testWidth, testHeight, testPaddingCell, testPaddingText);

// TEST INIT //
test("init_params", t => {

    t.true(scn.height === testHeight);
    t.true(scn.paddingStackCell === testPaddingCell);
    t.true(scn.paddingStackText === testPaddingText);
    t.true(scn.width === testWidth);

});

// TEST get DATA //
test("get_data_params", t => {

    t.true(typeof(scn.data) == "object");

});

// TEST get HORIZONTALSCALE //
test("get_horizontalscale_params", t => {

    t.true(typeof(scn.horizontalScale) == "function");

});

// TEST GENERATESTACKLAYOUT //
test("generateStackLayout_params", t => {

    t.true(typeof(scn.generateStackLayout(testData)) == "object");

});

// TEST RENDER //
test("render_params", t => {

    // clear document
    document.body.innerHTML = "";

    // render to dom
    scn.render(document.body);

    // get generated element
    let artboard = document.querySelector(`.${configuration.name}`);

    t.true(artboard !== undefined);
    t.true(artboard.nodeName == "svg");
    t.true(artboard.getAttribute("viewBox").split(" ")[3] == testHeight);
    t.true(artboard.getAttribute("viewBox").split(" ")[2] == testWidth);

});
