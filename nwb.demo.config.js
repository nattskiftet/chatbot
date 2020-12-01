module.exports = {
    type: 'react-component',
    webpack: {
        extra: {
            entry: './demo/src/index',
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.less']
            },
            module: {
                rules: [
                    {
                        test: /\.ts|\.tsx$/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    plugins: [
                                        [
                                            '@quickbaseoss/babel-plugin-styled-components-css-namespace',
                                            {
                                                cssNamespace: '#nav-chatbot'
                                            }
                                        ],
                                        'babel-plugin-styled-components'
                                    ]
                                }
                            },
                            'ts-loader'
                        ]
                    },
                    {
                        test: /\.less$/,
                        use: ['style-loader', 'css-loader', 'less-loader']
                    }
                ]
            }
        },
        rules: {
            svg: {
                loader: 'svg-inline-loader'
            }
        }
    }
};
