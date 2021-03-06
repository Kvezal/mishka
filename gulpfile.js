"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var mqpacker = require("css-mqpacker");
var csscomb = require("gulp-csscomb");
var minify = require("gulp-cssnano");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var svgstore = require("gulp-svgstore");
var svgmin = require("gulp-svgmin");
var uglify = require('gulp-uglify');
var pump = require('pump');
var del = require("del");
var run = require("run-sequence");
var ghPages = require('gulp-gh-pages');

gulp.task("style", function() {
  return gulp.src("sass/style.scss")
    .pipe(plumber())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([
      autoprefixer({browsers: [
        "last 2 versions",
        "safari >= 6",
        "ios >= 7",
        "ie >= 10"
      ]}),
      mqpacker({
        sort: true
      })
    ]))
    .pipe(csscomb())
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("serve", function() {
  server.init({
    server: "build/",
    notify: false
  });

  gulp.watch("sass/**/*.scss", ["style"]);
  gulp.watch("*.html", ["html:update"]);
  gulp.watch("js/*.js",["js:update"]);
});

gulp.task("image", function() {
  return gulp.src("build/img/**/*.{png,jpg,gif}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function() {
  return gulp.src("build/img/icons/*.svg")
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("js", function() {
  return gulp.src("build/js/scripts.js")
    .pipe(jsmin())
    .pipe(rename("scripts.min.js"))
    .pipe(gulp.dest("build/js"));
})

gulp.task("copy", function() {
  return gulp.src([
    "fonts/**/*.{woff, woff2}",
    "img/**",
    "js/**",
    "*.html"
  ], {
    base: "."
  })
  .pipe(gulp.dest("build"));
});

gulp.task("html:copy", function() {
  return gulp.src("*.html")
    .pipe(gulp.dest("build"));
});

gulp.task("html:update", ["html:copy"], function(done) {
  server.reload();
  done();
});

gulp.task('js:copy', function () {
  pump([
    gulp.src('js/**.js'),
    gulp.dest('build/js')
  ]);
});

gulp.task('js:update', ['js:copy', 'compress'], function (done) {
  server.reload();
  done();
});

gulp.task('compress', function (callback) {
  pump([
    gulp.src('js/*.js'),
    uglify(),
    rename({suffix: '.min'}),
    gulp.dest('build/js-min'),
  ],
      callback
  );
});

gulp.task("clean", function() {
  return del("build");
});

gulp.task('deploy', function () {
  del('.publich');
  return gulp.src('build/**/*')
    .pipe(ghPages());
});

gulp.task("build", function(callback) {
  run(
    "clean",
    "copy",
    "style",
    "compress",
    "image",
    "sprite",
    callback
  );
});
