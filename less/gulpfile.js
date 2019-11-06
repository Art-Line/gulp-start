var gulp = require('gulp'),                 // Gulp
    browserSync = require('browser-sync'),  // Browser Sync
    less = require('gulp-less'),            // Для компиляции less
    path = require('path'),                 // @import для less 
    del = require('del'),                   // Для удаления директорий и файлов
    concat = require('gulp-concat'),        // Для склеивания файлов (конкатенация)
    uglify = require('gulp-uglify'),        // Для сжатия js
    cleanCSS = require('gulp-clean-css'),   // Для минификации CSS
    remane = require('gulp-rename'),        // Для переименования файлов
    replace = require('gulp-replace');      // Для замены содержимого внутри файлов

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

// Перезапустить Browser Sync для app/js/script.js
gulp.task('js-script', function () {
    return gulp.src('app/js/script.js')
        .pipe(browserSync.reload({ stream: true }));
});

// Следим за изменениями js бибилотек и собираем их в один файл + Перезапустить Browser Sync
gulp.task('js', function () {
    return gulp.src(['app/js/jquery/jquery.min.js', 'app/js/libs/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({ stream: true }));
});

// Следим за изменениями style.less и всеми его @import + Перезапустить Browser Sync
gulp.task('less', function () {
    return gulp.src('app/less/style.less')
        .pipe(less({
            paths: [path.join('app/less/', 'less', 'includes')]
        }))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }));
});

//// Для продакшена (dist)

// Чистим папку dist
gulp.task('clean', function (done) {
    del.sync('dist');
    done();
});

// Все библиотеки и наш скрипт сливаем в один файл, сжимаем и переносим в папку dist
gulp.task('js-prod', function () {
    return gulp.src(['app/js/jquery/jquery.min.js', 'app/js/libs/*.js', 'app/js/script.js'])
        .pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// Собираем style.less и все его @import, сжимаем, переименовываем, выливаем в папку dist
gulp.task('css', function () {
    return gulp.src('app/less/style.less')
        .pipe(less({
            paths: [path.join('app/less/', 'less', 'includes')]
        }))
        .pipe(cleanCSS())
        .pipe(remane({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'));
});

// Замена строк внутри всех html файлов, выливаем в папку dist
gulp.task('html', function () {
    return gulp.src('app/*.html')
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(replace('js/all.js', 'js/all.min.js'))
        .pipe(replace('<script src="js/script.js"></script>', ''))
        .pipe(gulp.dest('dist'));
});

// Переносим на продакшн (dist): svg, img, fonts, xml (example, sitemap.xml), txt (example, robots.txt)
gulp.task('build-dist', function (done) {
    var buildSvg = gulp.src('app/svg/*.svg')
        .pipe(gulp.dest('dist/svg'));

    var buildImg = gulp.src('app/img/**/*')
        .pipe(gulp.dest('dist/img'));

    var buildFonts = gulp.src('app/fonts/*')
        .pipe(gulp.dest('dist/fonts'));

    done();
});

// Наблюдаем  за less и его импортами, script.js и js библиотеки, html
gulp.task('watch', function () {
    gulp.watch('app/less/**/*.less', gulp.parallel('less'));
    gulp.watch(['app/js/script.js', 'app/js/libs/*.js'], gulp.parallel('js', 'js-script'));
    gulp.watch('app/*.html', gulp.parallel('code'));
});

gulp.task('default', gulp.parallel('less', 'js', 'js-script', 'browser-sync', 'watch'));  //  Запускаем задачи в режиме разработки командой gulp
gulp.task('build', gulp.series('clean', 'css', 'js-prod', 'html', 'build-dist'));   //  Собираем проект для продакшена командой gulp build
