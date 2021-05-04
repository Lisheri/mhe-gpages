#!/usr/bin/env node
// cli入口, 必须添加上述声明, 同时需要修改权限为最高读写(>755)
// 这里只需要让gulp跑起来就行了, 因此需要引入gulp/bin/gulp, 但其实它内部就是require了一个gulp-cli
process.argv.push("--cwd");
process.argv.push(process.cwd()); // 这个就代表了当前工作目录了, 也就是执行插件的目录
process.argv.push("--gulpfile");
// require是载入这个模块, resolve是找到这个模块所对应的路径, 传递的参数是一样的, 都是通过相对路径去传递
// 传一个..就可以了，它会自动去找package.json下的main字段对应地路径
process.argv.push(require.resolve('..')); // 这个就是index.js的目录
require("gulp/bin/gulp");

// 剩下的就是需要制定cwd的路径了
// process.argv前两个参数是固定的, 一个表示node的bin下的node所在位置(node执行文件), 第二个是当前link文件的路径(也是固定的)
// 第三个参数开始就是传入的内容了, 比如此处通过空格分开了两个东西 --xxx xxx, 于是这两个东西就是第三和第四参数
// 于是可以在gulp运行之前, 先向process.argv中push一些东西
// console.info(process.argv)
