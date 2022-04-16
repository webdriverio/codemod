module.exports = {
    transforms: {
        "6.0.0": require.resolve("./v6/index.js"),
        "7.0.0": require.resolve("./v7/index.js"),
    },
    presets: {
        protractor: require.resolve("./protractor/index.js"),
        async: require.resolve("./async/index.js"),
    },
};
