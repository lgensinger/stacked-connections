const configuration = {};

const configurationDimension = {
    height: process.env.DIMENSION_HEIGHT || 600,
    width: process.env.DIMENSION_WIDTH || 600
}

const configurationLayout = {
    paddingStackCell: process.env.LAYOUT_PADDING_STACK_CELL || configurationDimension.height * .02,
    paddingStackText: process.env.LAYOUT_PADDING_STACK_TEXT || 2
}

export { configuration, configurationDimension, configurationLayout };
export default configuration;
