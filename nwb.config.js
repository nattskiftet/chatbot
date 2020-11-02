module.exports = {
    type: 'react-component',
    npm: {
        umd: {
            global: 'NAVChatBot',
            externals: {
                react: 'React',
                moment: 'moment',
                'react-app-polyfill/ie11': 'react-app-polyfill/ie11',
                'react-app-polyfill/stable': 'react-app-polyfill/stable',
                '@navikt/fnrvalidator': '@navikt/fnrvalidator',
                'nav-frontend-alertstriper': 'nav-frontend-alertstriper',
                'nav-frontend-alertstriper-style':
                    'nav-frontend-alertstriper-style',
                'nav-frontend-core': 'nav-frontend-core',
                'nav-frontend-ikoner-assets': 'nav-frontend-ikoner-assets',
                'nav-frontend-js-utils': 'nav-frontend-js-utils',
                'nav-frontend-knapper': 'nav-frontend-knapper',
                'nav-frontend-knapper-style': 'nav-frontend-knapper-style',
                'nav-frontend-lenker': 'nav-frontend-lenker',
                'nav-frontend-lenker-style': 'nav-frontend-lenker-style',
                'nav-frontend-paneler-style': 'nav-frontend-paneler-style',
                'nav-frontend-skjema': 'nav-frontend-skjema',
                'nav-frontend-skjema-style': 'nav-frontend-skjema-style',
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
                    {test: /\.ts|\.tsx$/, loader: 'ts-loader'},
                    {
                        test: /\.less$/,
                        use: [
                            {
                                loader: 'style-loader'
                            },
                            {
                                loader: 'css-loader'
                            },
                            {
                                loader: 'less-loader'
                            }
                        ]
                    },
                    {
                        test: /\.svg$/,
                        loader: 'svg-inline-loader'
                    }
                ]
            }
        },
        copy: [{from: './src/index.d.ts', to: './'}]
    }
};
