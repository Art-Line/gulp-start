var gulp = require('gulp'),                                 // Gulp
    browserSync = require('browser-sync'),                  // Browser Sync
    sass = require('gulp-sass'),                            // Для компиляции sass
    sourcemap = require("gulp-sourcemaps"),                 // map sass
    del = require('del'),                                   // Для удаления директорий и файлов
    cleanCSS = require('gulp-clean-css'),                   // Для минификации CSS
    remane = require('gulp-rename'),                        // Для переименования файлов
    replace = require('gulp-replace'),                      // Для замены содержимого внутри файлов
    mediaQueries = require('gulp-group-css-media-queries'), // для склейки @media
    htmlMin = require('gulp-htmlmin'),                      // для минификации html
    postcss = require("gulp-postcss"),
    autoprefixer = require("autoprefixer");

//// Для разработки (app)

// Подключаем Browser Sync
gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false
    });
});

// Перезапустить Browser Sync для app/*.html
gulp.task('code', function () {
    return gulp.src('app/*.html')
        .pipe(browserSync.reload({ stream: true }))
});


// Следим за изменениями sass и всеми его @import + Перезапустить Browser Sync
gulp.task('sass', function () {
    return gulp.src('app/sass/**/*.+(scss|sass)')
        .pipe(sourcemap.init())
        .pipe(sass())
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(sourcemap.write("."))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }));
});


//// Для продакшена (dist)

// Чистим папку dist
gulp.task('clean', function (done) {
    del.sync('dist');
    done();
});

// Собираем style.sass и все его @import, объединяем все @media, сжимаем, переименовываем, выливаем в папку dist
gulp.task('css', function () {
    return gulp.src('app/sass/**/*.+(scss|sass)')
        .pipe(sass())
        .pipe(mediaQueries())
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(cleanCSS())
        .pipe(remane({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'));
});

// Замена строк внутри всех html файлов, выливаем в папку dist
gulp.task('html', function () {
    return gulp.src('app/*.html')
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

// Переносим на продакшн (dist): img, fonts
gulp.task('build-dist', function (done) {
    var buildImg = gulp.src('app/img/**/*')
        .pipe(gulp.dest('dist/img'));

    var buildFonts = gulp.src('app/fonts/*')
        .pipe(gulp.dest('dist/fonts'));

    done();
});

// Наблюдаем  за sass и html
gulp.task('watch', function () {
    gulp.watch('app/sass/**/*.+(scss|sass)', gulp.parallel('sass'));
    gulp.watch('app/*.html', gulp.parallel('code'));
});

gulp.task('default', gulp.parallel('sass', 'browser-sync', 'watch'));  //  Запускаем задачи в режиме разработки командой gulp
gulp.task('build', gulp.series('clean', 'css', 'html', 'build-dist'));   //  Собираем проект для продакшена командой gulp build