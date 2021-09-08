import { max, sum } from "d3-array";
import { path } from "d3-path";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { stack } from "d3-shape";

import { configuration, configurationDimension, configurationLayout } from "../configuration.js";

/**
 * StackedConnections is a hybrid visualization of a series of stacked bar charts with curved connection paths between related stacked values.
 * @param {array} data - objects where each represents a path in the hierarchy
 * @param {integer} height - artboard height
 * @param {boolean} includeValueInLabel - TRUE will show % value with stacked bars
 * @param {integer} width - artboard width
 * @param {integer} paddingStackCell - space between stacked shapes
 * @param {integer} paddingStackText - space between stack shape and corresponding label
 */
class StackedConnections {
    constructor(data, width=configurationDimension.width, height=configurationDimension.height, includeValueInLabel=true, paddingStackCell=configurationLayout.paddingStackCell, paddingStackText=configurationLayout.paddingStackText) {

        // update self
        this.artboard = null;
        this.barWidth = null;
        this.connectionGroup = null;
        this.dataSource = data;
        this.height = height;
        this.includeValueInLabel = includeValueInLabel;
        this.name = configuration.name;
        this.paddingStackCell = paddingStackCell;
        this.paddingStackText = paddingStackText;
        this.stackGroup = null;
        this.stackLabelGroup = null;
        this.width = width;

        // using font size as the base unit of measure make responsiveness easier to manage across devices
        this.artboardUnit = typeof window === "undefined" ? 16 : parseFloat(getComputedStyle(document.body).fontSize);

        // update self
        this.paddingAnnotations = this.artboardUnit * 2;

        // get value for max keys in any stack
        let maxKeyCount = max(this.dataSource.stacks.map(d => Object.keys(d[Object.keys(d)[0]]).length));

        // try to use the provided padding but
        // if requested would set a negative scale
        // use the largest possible padding given remaining space
        let paddingIsValid = paddingStackCell * (maxKeyCount - 1) < this.height;

        // padding is too big as requested
        if (!paddingIsValid) {

            // set new padding with available space
            this.paddingStackCell = (this.height / maxKeyCount) * 0.2;

        }

        // process data
        this.stacks = this.data;
        this.barWidth = this.horizontalScale.bandwidth();
        this.connectionPaths = this.generateConnectionPaths(this.stacks);

    }

    /**
     * Condition data for visualization requirements.
     * @returns A xx.
     */
    get data() {

        let result = null;

        // verify valid source provided
        if (this.dataSource && Object.keys(this.dataSource).length == 2) {

            result = [];

            // loop through series'
            for (const s of this.dataSource.stacks) {

                // get key of series which correlates to its label
                let key = Object.keys(s)[0];

                let stacked = this.generateStackLayout(s[key]);

                // format into consistent stack/connection object
                result.push({
                    connections: stacked ?  this.dataSource.connections.filter(d => (stacked.series.map(x => x.key)).includes(d.source)) : null,
                    key: key,
                    scale: stacked ? stacked.scale : null,
                    series: stacked ? stacked.series : [],
                    totalValues: stacked ? stacked.totalValues : 0
                })

            }

        }

        return result;

    }

    /**
     * Construct horizonal scale.
     * @returns A d3 scale function.
     */
    get horizontalScale() {
        return scaleBand()
            .domain(this.stacks ? this.stacks.map(d => d.key) : [])
            .rangeRound([0, this.width])
            .paddingInner(0.9);
    }

    /**
     * Calculate the character width based of typographic em value.
     * @param {string} word - word to calculate
     * @param {float} unit - smallest atmoic unit of measure (should normally be the fontsize)
     * @returns A float representing the length of a given word based on provided unit and typographic rules of em sizing.
     */
    characterWidth(word, unit) {

        let em = 0.6;
        let small = 0.25;
        let mid = 0.45;

        let reference = {
            a: em,
            b: mid,
            c: mid,
            d: em,
            e: mid,
            f: small,
            g: em,
            h: mid,
            i: small,
            j: mid,
            k: mid,
            l: small,
            m: em,
            n: 0.5,
            o: em,
            p: mid,
            q: mid,
            r: small,
            s: em,
            t: small,
            u: mid,
            v: mid,
            w: mid,
            x: mid,
            y: small,
            z: mid,
            A: em,
            B: em,
            C: em,
            D: em,
            E: em,
            F: em,
            G: em,
            H: em,
            I: small,
            J: mid,
            K: em,
            L: em,
            M: em,
            N: em,
            O: em,
            P: mid,
            Q: mid,
            R: mid,
            S: mid,
            T: em,
            U: mid,
            V: em,
            W: em,
            X: em,
            Y: em,
            Z: em
        };

        let result = 0;

        // loop through characters
        for (const c of word) {

            // calculate percent difference from em unit
            let difference = reference[c];

            // if it is null assume 1 em for punctuation etc.
            if (difference) {
                result += difference * unit;
            } else {
                result += em * unit;
            }

        }

        return result;

    }

    /**
     * Position and minimally style annotations in SVG dom element.
     * @param {node} domNode - d3.js SVG selection
     */
    configureAnnotations(domNode) {
        domNode.append("text")
            .attr("class", "lgv-annotation")
            .attr("x", (d,i) => i == this.stacks.length - 1 ? this.width : this.horizontalScale(d.key))
            .attr("y", this.paddingAnnotations / 2)
            .attr("text-anchor", (d,i) => i == this.stacks.length - 1 ? "end" : "start")
            .text(d => d.key);
    }

    /**
     * Generate SVG text elements in the HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateAnnotations(domNode) {
        return domNode.append("g")
            .selectAll("g")
            .data(this.stacks ? this.stacks : [])
            .join("g");
    }

    /**
     * Generate SVG artboard in the HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateArtboard(domNode) {
        return select(domNode)
            .append("svg")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("class", this.name);
    }

    /**
     * Construct bar shapes in HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateBars(domNode) {
        domNode.each((category, i, nodes) => {

            // render stack values
            select(nodes[i])
                .selectAll(`.${category.key}`)
                .data(category.series)
                .enter()
                .append("rect")
                .attr("data-key", d => d.key)
                .attr("class", "lgv-bar")
                .attr("x", this.horizontalScale(category.key))
                .attr("y", (d,i) => category.scale(d[0][0]) + (this.paddingStackCell * i))
                .attr("height", d => category.scale(d[0][1]) - category.scale(d[0][0]))
                .attr("width", this.barWidth)
                .on("mouseover", (e,d) => {

                    // update class
                    select(e.target).attr("class", "lgv-bar active");

                    // send event to parent
                    this.artboard.dispatch("barmouseover", {
                        bubbles: true,
                        detail: {
                            label: d.key,
                            stack: category.key,
                            paths: this.connectionPaths.filter(x => x.includes(d.key)),
                            xy: [e.clientX + (this.artboardUnit / 2), e.clientY + (this.artboardUnit / 2)]
                        }
                    });

                })
                .on("mouseout", (e,d) => {

                    // update class
                    select(e.target).attr("class", "lgv-bar");

                    // send event to parent
                    this.artboard.dispatch("barmouseout", {
                        bubbles: true
                    });

                });

        });
    }

    /**
     * Construct connection group in HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateConnectionGroups(domNode) {
        return domNode
            .selectAll(".lgv-connection")
            .data(this.stacks ? this.stacks.slice(0, this.stacks.length - 1) : [])
            .enter()
            .append("g")
            .attr("class", (d, i) => `lgv-connection-${this.stacks[i].key}-to-${this.stacks[i+1].key}`);
    }

    /**
     * Construct hierachial paths noting connections between stacks visually left to right.
     * @param {array} stacks - generated data array from get data()
     * @returns An array of strings where each is a period delimited representation of the connection path between stack from visual left-to-right.
     */
    generateConnectionPaths(stacks) {

        let result = [];

        // loop through stacks
        stacks.forEach(d => {

            // loop through connections
            d.connections.forEach(dt => {

                // check for prefix already captured
                let segmentsWithSource = result.filter(d => d.split(".")[d.split(".").length - 1] === dt.source);
                let hasPrefix = segmentsWithSource.length > 0;

                // if prefixes are found
                if (hasPrefix) {

                    // loop through matches
                    segmentsWithSource.forEach(s => {

                        // add to list
                        result.push(`${s}.${dt.target}`);

                    });

                } else {

                    // add to list
                    result.push(`${dt.source}.${dt.target}`);

                }

            });

        });

        // one more loop to remove paths that were needed only to append to
        // but now are out-of-date since later children complete the path
        let prunedResult = [];
        result.forEach(d => {
            result.forEach(dt => {
                if (dt.includes(d) && dt.length > d.length) {
                    prunedResult.push(dt);
                }
            });
        });

        return prunedResult;

    }

    /**
     * Generate SVG connection paths in the HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateConnections(domNode) {
        domNode
            .each((connection, i, nodes) => {

                let sourceStack = connection;
                let targetStack = this.stacks[i+1];
                let tracked = 0;

                // render connection values
                select(nodes[i])
                    .selectAll(`.${this.stacks[i].key}-to-${this.stacks[i+1].key}`)
                    .data(this.stacks[i].connections)
                    .enter()
                    .append("path")
                    .attr("class", "lgv-connection")
                    .attr("data-path", d => [...new Set(this.connectionPaths.filter(x => x.includes(d.source) && x.includes(d.target)))])
                    .attr("data-source", d => d.source)
                    .attr("data-target", d => d.target)
                    .attr("d", d => {

                        let sourceStackLayout = sourceStack.series.filter(x => x.key === d.source)[0];
                        let sourceStackItem = sourceStackLayout[0];
                        let targetStackLayout = targetStack.series.filter(x => x.key === d.target)[0];
                        let targetStackItem = targetStackLayout[0];

                        let sourceX = this.horizontalScale(sourceStack.key) + this.barWidth;
                        let sourceY0 = sourceStack.scale(sourceStackItem[0]) + (this.paddingStackCell * sourceStackLayout.index);
                        let sourceY1 = sourceStack.scale(sourceStackItem[1]) + (this.paddingStackCell * sourceStackLayout.index);

                        let targetX = this.horizontalScale(targetStack.key);
                        let targetY0 = targetStack.scale(targetStackItem[0]) + (this.paddingStackCell * targetStackLayout.index);
                        let targetY1 = targetStack.scale(targetStackItem[1]) + (this.paddingStackCell * targetStackLayout.index);

                        // define connection path
                        let p = path();
                        // source top/left point of entire path shape
                        p.moveTo(sourceX, sourceY0);
                        // source top/left point cuved with 2 anchor points to top/right point of entire path shape
                        p.bezierCurveTo(
                            sourceX + (this.horizontalScale.step() / 2), sourceY0,
                            targetX - (this.horizontalScale.step() / 2), targetY0,
                            targetX, targetY0
                        );
                        // target straight line down the height of the stack item to bottom right point of entire path
                        p.lineTo(targetX, targetY1);
                        // target bottom/right point curved with 2 anchor points to bottom/left point of entire path shape
                        p.bezierCurveTo(
                            targetX - (this.horizontalScale.step() / 2), targetY0,
                            sourceX + (this.horizontalScale.step() / 2), sourceY1,
                            sourceX, sourceY1
                        );
                        // source bottom/left point straight up the height of the stack item to top/left point of entire path
                        p.closePath();

                        return p;

                    });

            });
    }

    /**
     * Generate SVG text labels in the HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateStackLabels(domNode) {
        domNode
            .each((d, i, nodes) => {

                // label container
                select(domNode.nodes()[i])
                    .selectAll(".lgv-label")
                    .data(d.series)
                    .enter()
                    .append("g")
                    .attr("class", "lgv-label")
                    .attr("data-key", x => x.key)
                    .attr("transform", (x,j) => {

                        let tx = i == nodes.length - 1 ? this.horizontalScale(d.key) - this.paddingStackText - (this.characterWidth(x.key, this.artboardUnit)) : this.horizontalScale(d.key) + this.barWidth + this.paddingStackText;

                        let ty = d.scale(x[0][0]) + (this.paddingStackCell * j) + (d.scale(x[0].data[x.key]) / 2) - (this.artboardUnit /2);

                        return `translate(${tx},${ty})`;

                    })
                    .each((x, j, nodes2) => {

                        let g = select(nodes2[j]);

                        // add background for when underlying layer makes text illegible
                        g.append("rect")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", this.characterWidth(x.key, this.artboardUnit))
                            .attr("height", this.artboardUnit * 1.4);

                        // add text
                        g.append("text")
                            .attr("x", this.artboardUnit * 0.2)
                            .attr("y", this.artboardUnit)
                            .each((z, l, nodes3) => {
                                select(nodes3[l])
                                    .selectAll("tspan")
                                    .data(this.includeValueInLabel ? [z.key, `${((z[0].data[z.key]/d.totalValues) * 100).toFixed(2)}%`] : [z.key])
                                    .enter()
                                    .append("tspan")
                                    .attr("dx", (a, m) => m == 0 ? "" : `${m * 0.35}em`)
                                    .text(z => z);
                        });

                });

        });
    }

    /**
     * Construct label groups for eac stack in HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateStackLabelGroups(domNode) {
        return domNode
            .selectAll(".lgv-label")
            .data(this.stacks ? this.stacks : [])
            .enter()
            .append("g")
            .attr("class", d => `lgv-${d.key}-labels`);
    }

    /**
     * Construct stack group in HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateStackGroups(domNode) {
        return domNode
            .selectAll(".lgv-stack")
            .data(this.stacks ? this.stacks : [])
            .enter()
            .append("g")
            .attr("class", d => `lgv-stack-${d.key}`);
    }

    /**
     * Construct stack layout.
     * @param {object} data - series data to be stacked
     * @returns An object with key/value maps for series, scale, total values.
     */
    generateStackLayout(data) {

        let result = null;

        // check for valid input
        if (data && Object.keys(data).length > 0) {

            // sort keys by decreasing value order then alpha
            let keysSorted = Object.keys(data)
                .map(d => ({ key: d, value: data[d] }))
                .sort((a,b) => b.value - a.value || a.key.localeCompare(b.key))
                .map(d => d.key);

            // generate stack layout
            let stackLayout = stack()
                .keys(keysSorted);

            // generate series of 1
            const series = stackLayout([data]);

            // calculate total value
            let dataValues = sum(Object.keys(data).map(d => data[d]));

            // determine how much padding is between stack value blocks
            let paddingValues = this.paddingStackCell * keysSorted.length;

            // y scale
            let yScale = scaleLinear()
                .domain([0, dataValues])
                .range([0, (this.height - paddingValues - this.paddingAnnotations)]);

            result = {
                series: series,
                scale: yScale,
                totalValues: dataValues
            }

        }

        return result

    }

    /**
     * Render visualization.
     * @param {node} domNode - HTML node
     */
    render(domNode) {

        // generate svg artboard
        this.artboard = this.generateArtboard(domNode);

        // chart content group
        const artwork = this.artboard
            .append("g")
            .attr("transform", d => `translate(0,${this.paddingAnnotations})`);

        // generate chart annotations
        const annotations = this.generateAnnotations(this.artboard);
        this.configureAnnotations(annotations);

        // generate group for each connection set
        this.connectionGroup = this.generateConnectionGroups(artwork);

        // generate connections
        this.generateConnections(this.connectionGroup);

        // generate group for each stack
        this.stackGroup = this.generateStackGroups(artwork);

        // generate stack bars
        this.generateBars(this.stackGroup);

        // generate group for each stack text
        this.stackLabelGroup = this.generateStackLabelGroups(artwork);

        // generate labels
        this.generateStackLabels(this.stackLabelGroup);

    }

};

export { StackedConnections };
export default StackedConnections;
