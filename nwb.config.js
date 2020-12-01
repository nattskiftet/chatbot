module.exports = {
    type: 'react-component',
    browsers: '>0.01%',
    npm: {
        umd: {
            global: 'NAVChatBot',
            externals: {
                react: 'React',
                '@navikt/fnrvalidator': '@navikt/fnrvalidator',
                'nav-frontend-alertstriper': 'nav-frontend-alertstriper',
                'nav-frontend-alertstriper-style':
                    'nav-frontend-alertstriper-style',
                'nav-frontend-chevron-style': 'nav-frontend-chevron-style',
                'nav-frontend-core': 'nav-frontend-core',
                'nav-frontend-ikoner-assets': 'nav-frontend-ikoner-assets',
                'nav-frontend-js-utils': 'nav-frontend-js-utils',
                'nav-frontend-knapper': 'nav-frontend-knapper',
                'nav-frontend-knapper-style': 'nav-frontend-knapper-style',
                'nav-frontend-lenkepanel': 'nav-frontend-lenkepanel',
                'nav-frontend-lenkepanel-style':
                    'nav-frontend-lenkepanel-style',
                'nav-frontend-lenker': 'nav-frontend-lenker',
                'nav-frontend-lenker-style': 'nav-frontend-lenker-style',
                'nav-frontend-paneler': 'nav-frontend-paneler',
                'nav-frontend-paneler-style': 'nav-frontend-paneler-style',
                'nav-frontend-skjema': 'nav-frontend-skjema',
                'nav-frontend-skjema-style': 'nav-frontend-skjema-style',
                'nav-frontend-spinner': 'nav-frontend-spinner',
                'nav-frontend-spinner-style': 'nav-frontend-spinner-style',
                'nav-frontend-typografi': 'nav-frontend-typografi',
                'nav-frontend-typografi-style': 'nav-frontend-typografi-style',
                'styled-components': 'styled-components'
            }
        },
        cjs: false,
        esModules: false
    },
    webpack: {
        extra: {
            entry: './src/index',
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
        },
        copy: [{from: './src/index.d.ts', to: './'}]
    }
};
