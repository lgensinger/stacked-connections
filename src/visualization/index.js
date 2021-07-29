import { sum } from "d3-array";
import { path } from "d3-path";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { stack } from "d3-shape";

import { configurationDimension, configurationLayout } from "../configuration.js";

/**
 * StackedConnections is a hybrid visualization of a series of stacked bar charts with curved connection paths between related stacked values.
 * @param {array} data - objects where each represents a path in the hierarchy
 * @param {integer} height - artboard height
 * @param {integer} width - artboard width
 * @param {integer} paddingStackCell - space between stacked shapes
 * @param {integer} paddingStackText - space between stack shape and corresponding label
 */
class StackedConnections {
    constructor(data, width=configurationDimension.width, height=configurationDimension.height, paddingStackCell=configurationLayout.paddingStackCell, paddingStackText=configurationLayout.paddingStackText) {

        // update self
        this.dataSource = data;
        this.height = height;
        this.paddingStackCell = paddingStackCell;
        this.paddingStackText = paddingStackText;
        this.width = width;

        // process data
        this.stacks = this.data;

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
                    key: key,
                    series: stacked ? stacked.series : [],
                    scale: stacked ? stacked.scale : null,
                    connections: stacked ?  this.dataSource.connections.filter(d => (stacked.series.map(x => x.key)).includes(d.source)) : null,
                    totalValues: stacked ? stacked.totalValues : 0,
                    showLabels: true
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
            let paddingValues = this.paddingStackCell * (keysSorted.length - 1);

            // y scale
            let yScale = scaleLinear()
                .domain([0, dataValues])
                .range([0, (this.height - paddingValues)]);

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

        let barWidth = this.horizontalScale.bandwidth();

        // generate svg artboard
        let artboard = select(domNode)
            .append("svg")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("class", "lgv-stacked-connections");

        // render group for each stack
        artboard.selectAll(".lgv-stack")
            .data(this.stacks ? this.stacks : [])
            .enter()
            .append("g")
            .attr("id", d => `lgv-stack-${d.key}`)
            .each((category, i, nodes) => {

                // render stack values
                select(nodes[i])
                    .selectAll(`.${category.key}`)
                    .data(category.series)
                    .enter()
                    .append("rect")
                    .attr("x", this.horizontalScale(category.key))
                    .attr("y", (d,i) => category.scale(d[0][0]) + (this.paddingStackCell * i))
                    .attr("height", d => category.scale(d[0][1]) - category.scale(d[0][0]))
                    .attr("width", barWidth);

            });

        // render group for each connection set
        artboard.selectAll(".lgv-connection")
            .data(this.stacks ? this.stacks.slice(0, this.stacks.length - 1) : [])
            .enter()
            .append("g")
            .attr("id", (d, i) => `lgv-connection-${this.stacks[i].key}-to-${this.stacks[i+1].key}`)
            .each((connection, i, nodes) => {

                let sourceStack = connection;
                let targetStack = this.stacks[i+1];

                // render connection values
                select(nodes[i])
                    .selectAll(`.${this.stacks[i].key}-to-${this.stacks[i+1].key}`)
                    .data(this.stacks[i].connections)
                    .enter()
                    .append("path")
                    .attr("class", d => d.focus)
                    .attr("d", d => {

                        let sourceStackLayout = sourceStack.series.filter(x => x.key === d.source)[0];
                        let sourceStackItem = sourceStackLayout[0];
                        let targetStackLayout = targetStack.series.filter(x => x.key === d.target)[0];
                        let targetStackItem = targetStackLayout[0];

                        let sourceX = this.horizontalScale(sourceStack.key) + barWidth;
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

        // render group for each stack text
        artboard.selectAll(".lgv-label")
            .data(this.stacks ? this.stacks : [])
            .enter()
            .append("g")
            .attr("id", d => `lgv-${d.key}-labels`)
            .each((category, i, nodes) => {

                // render labels for each stack value
                artboard.selectAll(`.lgv-${category.key}-label`)
                    .data(category.series)
                    .enter()
                    .append("text")
                    .attr("class", `lgv-${category.key}-label`)
                    .attr("x", i == nodes.length - 1 ? this.horizontalScale(category.key) - this.paddingStackText : this.horizontalScale(category.key) + barWidth + this.paddingStackText)
                    .attr("y", (d, i) => category.scale(d[0][0]) + (this.paddingStackCell * i) + (category.scale(d[0].data[d.key]) * 0.63))
                    .attr("text-anchor", d => i == nodes.length - 1 ? "end" : "start")
                    .text(d => category.showLabels ? `${d.key}, ${((d[0].data[d.key]/category.totalValues) * 100).toFixed(2)}%` : d.key);

            });

    }

};

export { StackedConnections };
export default StackedConnections;
