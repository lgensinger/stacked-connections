import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";

const __dirname = dirname(fileURLToPath(import.meta.url));

const webpackConfig = {

    mode: "development",

    entry: {
        index: "./src/index.js"
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
        }),
        new webpack.DefinePlugin({
            "process.env": {
                "DIMENSION_HEIGHT": JSON.stringify(process.DIMENSION_HEIGHT),
                "DIMENSION_WIDTH": JSON.stringify(process.DIMENSION_WIDTH),
                "LAYOUT_PADDING_STACK_CELL": JSON.stringify(process.LAYOUT_PADDING_STACK_CELL),
                "LAYOUT_PADDING_STACK_TEXT": JSON.stringify(process.LAYOUT_PADDING_STACK_TEXT)
            }
        })
    ],

    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true
    }

 };

 export { webpackConfig };
 export default webpackConfig;
