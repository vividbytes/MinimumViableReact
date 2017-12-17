const path = require('path');
const fs = require('fs');

const babelConfig = fs.readFileSync(path.resolve(__dirname, './.babelrc'));

module.exports = {

    entry: {
        ComponentTests: './test/ComponentTests.js',
        KeysTests: './test/KeysTests.js',
        LifecycleTests: './test/LifecycleTests.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },

    resolve: {
        extensions: ['', '.js']
    },

    module: {
        loaders: [
            {
                loader: 'babel-loader',

                // Skip any files outside of your project's `src` directory
                exclude: [
                    path.resolve(__dirname, 'node_modules')
                ],

                // Only run `.js` and `.jsx` files through Babel
                test: /\.jsx?$/,

                // Options to configure babel with
                query: JSON.parse(babelConfig)
            }
        ]
    }
};
