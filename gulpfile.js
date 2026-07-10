/**
 * Gulpfile for node-red-contrib-modbus-server
 */
'use strict'

const gulp = require('gulp')
const htmlmin = require('gulp-htmlmin')
const babel = require('gulp-babel')
const sourcemaps = require('gulp-sourcemaps')
const clean = require('gulp-clean')
const replace = require('gulp-replace')

const paths = {
  src: {
    js: ['src/**/*.js'],
    html: ['src/**/*.html'],
    locales: ['src/locales/**/*.json']
  },
  dist: 'modbus/'
}

// Clean built files
gulp.task('clean', () => {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean())
})

// Build JavaScript files
gulp.task('build:js', () => {
  return gulp.src(paths.src.js)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env'],
      comments: false
    }))
    .pipe(replace('// SOURCE-MAP-REQUIRED', ''))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dist))
})

// Copy HTML files
gulp.task('build:html', () => {
  return gulp.src(paths.src.html)
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    }))
    .pipe(gulp.dest(paths.dist))
})

// Copy localization files
gulp.task('build:locales', () => {
  return gulp.src(paths.src.locales)
    .pipe(gulp.dest(paths.dist + 'locales/'))
})

// Build all
gulp.task('build', gulp.series(
  'clean',
  gulp.parallel(
    'build:js',
    'build:html',
    'build:locales'
  )
))

// Default task
gulp.task('default', gulp.series('build'))
