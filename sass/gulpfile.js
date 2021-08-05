const gulp = require('gulp'),                               // Gulp
    browserSync = require('browser-sync'),                  // Browser Sync

    sass = require('gulp-sass'),                            // Для компиляции sass
    sourcemap = require("gulp-sourcemaps"),                 // Для поиска исходного файла
    cleanCSS = require('gulp-clean-css'),                   // Для минификации CSS
    mediaQueries = require('gulp-group-css-media-queries'), // Для склейки @media
    postcss = require("gulp-postcss"),                      // postcss
    autoprefixer = require("autoprefixer"),                 // autoprefixer

    htmlMin = require('gulp-htmlmin'),                      // Для минификации html

    uglify = require('gulp-uglify'),                        // Для сжатия js
    babel = require('gulp-babel'),                          // js в старый

    imagemin = require("gulp-imagemin"),                    // Для ужатия графики
    svgstore = require("gulp-svgstore"),                    // Для svg спрайта
    webp = require("gulp-webp"),                            // Для создания webp графики

    del = require('del'),                                   // Для удаления директорий и файлов
    concat = require('gulp-concat'),                        // Для склеивания файлов (конкатенация)
    rename = require('gulp-rename'),                        // Для переименования файлов
    replace = require('gulp-replace');                      // Для замены содержимого внутри файлов


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
        .pipe(sass({ outputStyle: 'expanded' }))
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(sourcemap.write("."))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }));
});

// Перезапустить Browser Sync для app/js/script.js
gulp.task('js-script', function () {
    return gulp.src('app/js/script.js')
        .pipe(browserSync.reload({ stream: true }));
});

// Следим за изменениями js бибилотек и собираем их в один файл + Перезапустить Browser Sync
gulp.task('js', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js', 'node_modules/bootstrap/dist/js/bootstrap.js', 'node_modules/slick-carousel/slick/slick.min.js', 'app/js/script.js'])
        .pipe(concat('all.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({ stream: true }));
});

// клеем спрайт из иконок
gulp.task('svg-sprite', function () {
    return gulp.src("app/img/icons/*.svg")
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("app/img"));
});

//// Для продакшена (dist)

// Чистим папку dist
gulp.task('clean', function (done) {
    del.sync('dist');
    done();
});

// Все библиотеки и наш скрипт сливаем в один файл, сжимаем и переносим в папку dist
gulp.task('js-prod', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js', 'node_modules/bootstrap/dist/js/bootstrap.js', 'node_modules/slick-carousel/slick/slick.min.js', 'app/js/script.js'])
        .pipe(concat('all.min.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// Собираем style.sass и все его @import, объединяем все @media, сжимаем, переименовываем, выливаем в папку dist
gulp.task('css', function () {
    return gulp.src('app/sass/**/*.+(scss|sass)')
        .pipe(sass())
        //.pipe(mediaQueries())
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'));
});


// Замена строк внутри всех html файлов, выливаем в папку dist
gulp.task('html', function () {
    return gulp.src('app/*.html')
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(replace('js/all.js', 'js/all.min.js'))
        //.pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

// ужимаем графику
gulp.task('optimize-images', function () {
    return gulp.src(["app/img/**/*.{png,jpg,svg}", "!app/img/sprite.svg", "!app/img/icons/*.svg"])
        .pipe(imagemin([
            imagemin.mozjpeg({ progressive: true }),
            imagemin.optipng({ optimizationLevel: 3 }),
            imagemin.svgo()
        ]))
        .pipe(gulp.dest('dist/img'));
});

// клеем спрайт из иконок для прода
gulp.task('svg-sprite-prod', function () {
    return gulp.src("app/img/icons/*.svg")
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("dist/img"));
});

// Переносим на продакшн fonts
gulp.task('copy-dist', function (done) {
    gulp.src('app/fonts/**/*.*')
        .pipe(gulp.dest('dist/fonts'));
    done();
});

// Наблюдаем  за sass и его импортами, script.js и js библиотеки, html
gulp.task('watch', function () {
    gulp.watch('app/sass/**/*.+(scss|sass)', gulp.parallel('sass'));
    gulp.watch('app/img/icons/*.svg', gulp.parallel('svg-sprite'));
    gulp.watch('app/js/script.js', gulp.parallel('js', 'js-script'));
    gulp.watch('app/*.html', gulp.parallel('code'));
});

gulp.task('default', gulp.parallel('sass', 'js', 'js-script', 'svg-sprite', 'browser-sync', 'watch'));  //  Запускаем задачи в режиме разработки командой gulp
gulp.task('build', gulp.series('clean', 'css', 'js-prod', 'html', 'optimize-images', 'svg-sprite-prod', 'copy-dist')); //  Собираем проект для продакшена командой gulp build


// делаем webp
gulp.task('webp', function () {
    return gulp.src("app/img/**/*.{jpg,png}")
        .pipe(webp({ quality: 90 }))
        .pipe(gulp.dest("app/img"))
});

// делаем webp prod
gulp.task('webp-prod', function () {
    return gulp.src("app/img/**/*.{jpg,png}")
        .pipe(webp({ quality: 90 }))
        .pipe(gulp.dest("dist/img"))
});
