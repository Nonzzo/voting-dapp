const webpack = require('webpack');

module.exports = function override(config, env) {
    // Add Buffer polyfill
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "buffer": require.resolve("buffer/"),
        
    };
    
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ];
    

    // Ignore warnings for source maps
    config.ignoreWarnings = [
        { module: /node_modules\/dag-jose/ },
    ];

    return config;
};