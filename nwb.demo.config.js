module.exports = {
    type: 'react-component',
    webpack: {
        extra: {
            entry: './demo/src/index',
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.less', '.svg']
            },
            module: {
                rules: [
                    {test: /\.ts|\.tsx$/, loader: 'ts-loader'},
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
