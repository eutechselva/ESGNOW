const path = require('path');

module.exports = {
    mode: "development",
    devtool: "source-map",
    resolve: {
        alias: {
            "@components": path.resolve(__dirname, 'src/components'),
            "@hooks": path.resolve(__dirname, 'src/hooks'),
            "@ums-service": path.resolve(__dirname, 'src/ums-service.ts'),
            "@other-services": path.resolve(__dirname, 'src/other-services.ts'),
            "@utils": path.resolve(__dirname, 'src/utils.ts'),
            "@types": path.resolve(__dirname, 'src/types.ts'),
            "@uxp": path.resolve(__dirname, 'src/uxp.ts'),
            "@images": path.resolve(__dirname, 'src/images')
        },
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    entry: "./src/index.tsx",
    output: {
        path: path.join(__dirname, '/dist'),
        publicPath: "/dist/",
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.module\.scss$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                localIdentName: "[name]__[local]___[hash:base64:5]"
                            },
                        },
                    },
                    "sass-loader"
                ]
            },
            {
                test: /\.scss$/,
                exclude: /\.module\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                test: /\.(png|jp(e*)g|svg|gif)$/,
                type: "asset/inline",
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "recharts": "Recharts",
        "uxp/components": "UXPComponents",
        "widget-designer/components": "WidgetDesignerComponents",
    },
    devServer: {
        static: {
            directory: path.join(__dirname, '/'),
        },
        compress: true,
        liveReload: true,
    }
};
