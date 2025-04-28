let originalConsole = {
    ...console
}

console.debug = function(...args) {
    originalConsole.debug(`[DEBUG]`, ...args);
}

console.info = function(...args) {
    originalConsole.info(`[INFO]`, ...args);
}

console.warn = function(...args) {
    originalConsole.warn(`[WARN]`, ...args);
}

console.error = function(...args) {
    originalConsole.error(`[ERROR]`, ...args);
}

console.log = function(...args) {
    originalConsole.log(`[LOG]`, ...args);
}

module.exports = {
    create(scope) {
        let logger = {
            ...console
        }
        logger.debug = function(...args) {
            console.debug(`[${scope}]`, ...args);
        }
        logger.info = function(...args) {
            console.info(`[${scope}]`, ...args);
        }
        logger.warn = function(...args) {
            console.warn(`[${scope}]`, ...args);
        }
        logger.error = function(...args) {
            console.error(`[${scope}]`, ...args);
        }
        logger.log = function(...args) {
            console.log(`[${scope}]`, ...args);
        }
        return logger
    }
}