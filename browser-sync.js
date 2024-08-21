const browserSync = require("browser-sync").create();

browserSync.init({
  proxy: "localhost:3000",
  files: ["public/**/*.*", "views/**/*.*"],
  ignore: ["node_modules"],
  reloadDelay: 10,
  ui: false,
  notify: false
});