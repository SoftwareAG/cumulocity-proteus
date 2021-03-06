module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-processhtml');

  function proxy(path) {
    return {
      context: '/' + path,
      host: 'proteus.cumulocity.com',
      port: 80,
      https: false,
      xforward: false
    };
  }

  grunt.config('connect', {
    server: {
      options: {
        port: 9000,
        hostname: '127.0.0.1',
        base: 'app',
        keepalive: true,
        middleware: function (connect, options) {
          var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
          return [
            proxy,
            connect.static(options.base[0])
          ];
        }
      },
      proxies: ['user', 'inventory', 'measurement'].map(proxy)
    }
  });

  grunt.config('processhtml', {
    build: {
      files: {
        'build/index.html': ['app/index.html']
      }
    }
  });

  grunt.config('uglify', {
    build: {
      files: {
        'build/script/main.js': [
          'app/bower_components/d3/d3.js',
          'app/bower_components/moment/moment.js',
          'app/bower_components/moment/locale/de.js',
          'app/bower_components/touche/src/touche.js',
          'app/script/main.js'
        ]
      }
    }
  });

  grunt.config('copy', {
    main: {
      files: [
        {
          expand: true,
          dest: 'build/',
          cwd: 'app',
          src: ['img/logo.svg','img/grad.png', 'style/main.css']
        }
      ]
    }
  });

  grunt.registerTask('server', [
    'configureProxies:server',
    'connect'
  ]);

  grunt.registerTask('build', [
    'processhtml',
    'uglify',
    'copy'
  ]);

};
