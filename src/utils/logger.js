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