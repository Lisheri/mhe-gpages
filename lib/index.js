// 入口文件, 实现代码都在这里
module.exports = (name, options) => {
    if (typeof name !== "string") {
        throw new TypeError(`Expected a string, got ${typeof name}`)
    }

    options = Object.assign({}, options)

    return `${name}@${options.host || 'mhe.me'}`
}

