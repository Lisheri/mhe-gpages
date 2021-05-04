const { src, dest, series, parallel, watch } = require("gulp");

const del = require("del");

const browserSync = require("browser-sync"); // 并非gulp的插件

const loadPlugins = require("gulp-load-plugins");

const plugins = loadPlugins(); // 执行结果是一个对象, 命名方法就是将`gulp-xxx` 的 `gulp-`取消掉

const bs = browserSync.create();

const cwd = process.cwd(); // cwd会返回node在运行时所在的工作目录, 比如此处在~/documents/mohongen/lagou/mhe-gpages
// 在上述工作目录下就有配置文件

let config = {
    // default config
    build: {
        src: "src",
        dist: "dist",
        temp: "temp",
        public: "public",
        // 除了上述基础路径之外还需要提取文件路径
        paths: {
            styles: "assets/styles/*.scss",
            scripts: "assets/scripts/*.js",
            pages: "**/*.html",
            images: "assets/images/**",
            fonts: "assets/fonts/**"
        }
    }
}

try {
    // require一个不存在的地址会报错
    const loadConfig = require(`${cwd}/pages.config.js`);
    // 需要合并默认配置, merge Options
    config = Object.assign({}, config, loadConfig);
} catch (e) {

}

const style = () => {
    // src第一参数直接替换成styles所在的目录肯定不对, 但若是加上cwd配置就可以, 他会从cwd配置开始往下找, 默认cwd是项目运行时的根路径
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
        .pipe(plugins.sass({ outputStyle: 'expanded' })) // 基本上的插件都会提供一个函数, 函数调用的结果就是这个文件流转换后的文件流
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true })); // 以流的方式往浏览器中推
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
        // 此处应该修改为require去找, require寻找文件, 会依次向上寻找, 但是直接使用, 就会在使用它的项目根目录下面找, 而那里没有, 就报错了
        .pipe(plugins.babel({ presets: [require("@babel/preset-env")] })) // @babel/preset-env用于将ES新特性转换为ES5代码
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

const page = () => {
    // 双星号代表匹配src目录下所有子目录下包含.html的文件和目录
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
        .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 将数据以data参数的形式传递进去, 防止模板缓存导致页面不能及时更新
        // 修改page中目标路径, 首先放入一个中间目录temp, dist -> temp
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

// 图片转换
const image = () => {
    return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

// 文字转换
const font = () => {
    return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

// 拷贝额外文件
const extra = () => {
    return src("**", {base: config.build.public, cwd: config.build.public})
        .pipe(dest(config.build.dist))
}

// 清空dist
const clean = () => {
    return del([config.build.dist, config.build.temp])
}

// 清除中间过程temp
const cleanTemp = () => {
    return del([config.build.temp])
}

// 开发服务器
const serve = () => {
    // watch的cwd也可以通过传第二参数的方式传进去
    watch(config.build.paths.styles, {cwd: config.build.src}, style); // watch函数的第一个参数是匹配的路径, 第二个参数是文件改变后执行的目标任务, 当路径下文件改变后, 会执行目标的任务
    watch(config.build.paths.scripts, {cwd: config.build.src}, script);
    watch(config.build.paths.pages, {cwd: config.build.src}, page);
    watch([
        // 监听一个数组
        config.build.paths.images,
        config.build.paths.fonts
    ], {cwd: config.build.src}, bs.reload);

    // 抽离public, 因为cwd不同, 或者字符串拼接, 但是拼接不太好
    watch("**", {cwd: config.build.public}, bs.reload);


    bs.init({
        server: {
            baseDir: [config.build.temp, config.build.src, config.build.public],
            routes: {
                "/node_modules": "./node_modules"
            },
        },
        open: true, // 启动时, 是否打开浏览器
        notify: false, // 关闭启动时的提示
        port: 9999, // port指定端口号
    }) 
}

const useref = () => {
    return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
        .pipe(plugins.useref({ searchPath: [config.build.temp, "."] }))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({ 
            collapseWhitespace: true,
            minifyCSS: true, // 处理html中的css
            minifyJS: true // 处理html中的js
         })))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page);

const build = series(clean, parallel(series(compile, useref), extra, image, font), cleanTemp);

const dev = series(compile, serve);

module.exports = {
    build,
    dev,
}