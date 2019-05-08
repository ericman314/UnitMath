// Karma configuration
// Generated on Fri May 03 2019 18:36:44 GMT+0000 (GMT)

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    files: [
      'test/**/*.test.js'
    ],
    preprocessors: {
      'test/**/*.test.js': [ 'webpack', 'sourcemap' ]
    },
    webpack: {
      // ...
      devtool: 'inline-source-map'
    },
    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        reporter: 'html'
      }
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['IE'],
    singleRun: true,
    concurrency: Infinity
  })
}
