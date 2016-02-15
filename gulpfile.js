"use strict";
const gulp = require('gulp'),
      eslint = require('gulp-eslint'),
      browserSync = require('browser-sync'),
      del = require('del'),
      typescript = require('gulp-typescript'),
      sourcemaps = require('gulp-sourcemaps'),
      tslint = require('gulp-tslint'),
      tsconfig = require('tsconfig-glob'),
      merge = require('merge-stream'),
      historyApiFallback = require('connect-history-api-fallback'),
      fs = require('fs');
      
var tsConfig = require('./tsconfig.json');

// clean the contents of the distribution directory
gulp.task('clean', () => {
    return del('public/**/*');
});

gulp.task('tsconfig-glob', () => {
    return tsconfig({
        configPath: '.',
        indent: 2
    });
});

// TypeScript compile
gulp.task('compile', ['clean'], () => {
    tsConfig = require('./tsconfig.json')
    return gulp
        .src(tsConfig.files)
        .pipe(sourcemaps.init())
        .pipe(typescript(tsConfig.compilerOptions))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(tsConfig.compilerOptions.outDir));
});

// copy dependencies
gulp.task('copy:libs', ['clean'], () => {
    return gulp.src([
        'node_modules/angular2/bundles/angular2-polyfills.js',
        'node_modules/systemjs/dist/system.src.js',
        'node_modules/rxjs/bundles/Rx.js',
        'node_modules/angular2/bundles/angular2.dev.js',
        'node_modules/angular2/bundles/router.dev.js',
        'node_modules/admin-lte/dist/js/app.js'
    ])
        .pipe(gulp.dest('public/lib'))
});

// copy static assets - non TypeScript compiled source
gulp.task('copy:assets', ['clean'], () => {
    return merge(
        gulp.src(['websrc/**/*', '!websrc/**/*.ts'], { base : './websrc' })
            .pipe(gulp.dest('public')),
        gulp.src([
            'node_modules/admin-lte/dist/css/**',
            '!node_modules/admin-lte/dist/css/**/*.min.css',
            'node_modules/admin-lte/bootstrap/css/bootstrap.css'
        ])
            .pipe(gulp.dest('public/css'))
    )
});

gulp.task('watch:ts', () => {
    return gulp.watch(tsConfig.files, ['compile']);    
});

gulp.task('watch:assets', () => {
    return gulp.watch(['websrc/**/*', '!websrc/**/*.ts'], ['copy:assets']);
});

gulp.task('reload', () => {
    return browserSync.reload();
});

gulp.task('eslint', () => {
    return gulp.src(['node/**/*.js'])
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

// TypeScript linting
gulp.task('tslint', () => {
    return gulp.src(tsConfig.files)
        .pipe(tslint())
        .pipe(tslint.report('verbose'));
});

// Run browsersync for development
gulp.task('serve', ['build'], (cb) => {
    browserSync.init({
        port: 3002,
        server: {
            baseDir: 'public',
            middleware: [ historyApiFallback() ]
        },
        reloadDelay: 100
    });
    
    gulp.watch([
        "public/**/*.js",
        "public/**/*.css",
        "public/**/*.html"
    ], browserSync.reload, cb);
});


gulp.task('lint',['eslint', 'tslint']);
gulp.task('build:nolint', ['clean', 'tsconfig-glob', 'compile', 'copy:libs', 'copy:assets']);
gulp.task('build', ['lint', 'build:nolint']);
gulp.task('buildAndReload', ['build'], browserSync.reload);
gulp.task('watch', ['watch:assets', 'watch:ts']);
gulp.task('default', ['build']);
