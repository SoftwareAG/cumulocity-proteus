(function () {
  var setGauge,
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez'],
    deviceId = '22600',
    URL_BASE = '',
    TENANT = 'innotecmk',
    DEVICE_ID = '78200',
    DEVICE_DATA = {},
    USER;

  function drawCircle(size) {
    if (size > 400) {
      size = 400;
    }
    var gap = 0.79,
      width = size/10,
      radius = size / 2,
      svg = getSvg(size),

      scale = d3.scale.linear()
        .domain([0,100])
        .range([gap-Math.PI, Math.PI - gap]),

      arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - width)
        .startAngle(scale.range()[0]),

      arc2 = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - width)
        .startAngle(0)
        .endAngle(Math.PI * 2);

    d3.select('#gradientImage')
      .attr({
        width: size * 1.2,
        height: size * 1.2
      });

    d3.select('#circleClip')
      .append('path')
      .attr('d', arc2)
      .attr('x', 0)
      .attr('y', 0);

    gauge = d3.select('#gaugeClip')
      .datum({endAngle: scale.range()[0]})
      .append('path')
      .attr('d', arc)
      .attr('x', 0)
      .attr('y', 0);

    svg.append('path')
      .attr('d', arc2)
      .attr('stroke', '#999')
      .attr('stroke-width', '2px')
      .attr('fill', '#DAD3CA')
      .attr('filter', 'url(#blur)')
      .attr('clip-path', 'url(#circleClip)');

    svg.append('path')
      .attr('clip-path', 'url(#gaugeClip)')
      .attr('fill', 'url(#grad)')
      .attr("d", arc2);

    setGauge = function (val) {
      var newAngle = scale(val);
      gauge.transition()
       .attrTween('d', function (d) {
         var interpolate = d3.interpolate(d.endAngle, newAngle);
         return function (t) {
           d.endAngle = interpolate(t);
           return arc(d);
         };
       });

       $('.gauge .percentage .nr').text(val);
    };
  }

  function hideSpinner() {
    $('.spinner').hide();
  }

  function showSpinner() {
    $('.graph svg').remove();
    $('.spinner').show();
    $('.list').empty();
  }

  function drawGraph(data) {
    hideSpinner();

    var root = d3.select('div.graph'),
      width = $('div.graph').width(),
      height = width * (3/4),
      margin = 25,
      scaleX = d3.time.scale()
        .domain([data[0].date.toDate(), data[data.length - 1].date.toDate()])
        .range([0, width - margin * 2]),
      scaleY = d3.scale.linear()
        .domain([0, 100])
        .range([height - margin * 2, 0]),

      x = function (d)  { return scaleX(d.date.toDate()); },
      y = function (d)  { return scaleY(d.val); },


      line = d3.svg.line().x(x).y(y),
      area = d3.svg.area().x(x).y(y),

      yAxis = d3.svg.axis()
        .scale(scaleY)
        .orient('left')
        .tickValues([0, 25, 50, 75, 100])
        .innerTickSize(0)
        .outerTickSize(0),

      doneMonths = [],
      doneDays = [],
      xAxis = d3.svg.axis()
        .tickFormat(function (d) {
          var day = moment(d).format('DDMMM'),
            m = moment(d).format('YYYYMM'),
            tick = '';

          if (doneDays.indexOf(day) === -1) {
            doneDays.push(day);
            tick = moment(d).format('DD');
          }

          if (doneMonths.indexOf(m) === -1) {
            doneMonths.push(m);
            tick += ' ' + moment(d).format('MMM');
          }

          return tick;
        })
        .scale(scaleX)
        .tickSize(1)
        .innerTickSize(1)
        .outerTickSize(0)
        .orient('bottom');

    root.select('svg').remove();
    area.y0(height - margin * 2);

    var svg = root
      .append('svg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform' , 'translate(' + margin + ',' + margin + ')');

    svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + (height - (margin * 2) * 0.95) + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'axis')
      // .attr('transform', 'translate(0,0)')
      .call(yAxis);

    svg.append('path')
      .datum(data)
      .attr('class', 'graphPath')
      .attr('d', line);

    svg.append('path')
      .datum(data)
      .attr('class', 'graphArea')
      .attr('d', area);

  }

  function drawTable(data) {
    var root = d3.select('.list'),
      row = root.selectAll('tr').data(data);

    var tr = row.enter()
      .append('tr')
        .html(function (d) {
          return '<td class="beige tile">' + d.ref + '</td>' +
            '<td style="text-align:right">' + d.val + '%</td>';
        });

  }

  function getSvg(size) {
    var width = size,
      height = size;


    d3.select('.gaugeSvgG').remove();

    var svg = d3.select('#gaugeSvg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('class', 'gaugeSvgG')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    return svg;
  }

  function setCapacity(capacity) {
    $('.infoAbsolute .capacity').text(capacity);
  }

  function setRemaining(remaining) {
    $('.infoAbsolute .remaining').text(remaining);
  }

  function setBattery(battery) {
    var scale = d3.scale.quantile()
      .domain([0,100])
      .range(['empty', 'low', 'medium' ,'high', 'full']);
    var scalePercent = d3.scale.linear()
      .domain([0,6])
      .range([0,100]);
    var percent = Math.round(scalePercent(battery));

    $('.battery').attr('class', 'battery ' + scale(percent));
    $('.battery .val').text(percent + '%');
  }

  function setSignal(nr) {
    var scale = d3.scale.quantile()
        .domain([-53, -73, -83, -93, -109])
        .range(['marginal', 'ok', 'good', 'excellent']),
      txt = {
        excellent: 'ausgezeichnet',
        good: 'gut',
        ok: 'ok',
        marginal: 'niedrig'
      },
      val = scale(nr);

    $('.network').attr('class', 'network ' + val);
    $('.network .val').text(txt[val]);
  }

  function setLastUpdate(lastUpdate) {
    var txt = moment(lastUpdate).fromNow();
    $('.lastUpdate .info').text(txt);
  }

  function setStaticInfo(info) {
    $('.staticInfo .serialNr .val').text(info.serial);
    $('.staticInfo .vol .val').text(info.vol);
    $('.staticInfo .medium .val').text(info.medium);
  }

  function setupMain() {

    if (!setupMain.done) {
      drawCircle($('#gauge').width());
      setupMain.done = true;
    }

    getMainData().success(function (data) {
      drawMainData(data.managedObjects[0] || {});
      if (isBigScreen()) {
        showScreen('stats', true);
      } else {

      }
    });
  }

  function drawMainData(mo) {
    DEVICE_DATA = mo;

    var signal = mo.c8y_SignalStrength.rssi.value,
      battery = mo.c8y_Battery.level.value,
      capacity = mo.c8y_TankConfiguration.capacity.usable,
      remaining = mo.c8y_TekelecRemainingFuel.capacity.value,
      hw = mo.c8y_Hardware,
      fuel = mo.c8y_TankConfiguration.fuel;


    setSignal(signal);
    setBattery(battery);
    setCapacity(capacity + 'L');
    setRemaining(remaining + 'L');

    setGauge(Math.round(remaining / capacity * 100));
    setLastUpdate(mo.lastUpdate);
    setStaticInfo({
      serial: hw.serialNumber,
      vol: capacity + 'L',
      medium: fuel
    });
  }

  function setupStats() {

    showSpinner();

    getMeasurementData().success(function (data) {
      var measurements = data.measurements,
        map = {},
        graphData = measurements.map(function (m) {
          var d = moment(m.time);

          return {
            val: Math.round( m.c8y_TekelecRemainingFuel.capacity.value / DEVICE_DATA.c8y_TankConfiguration.capacity.usable * 100),
            date: d
          };
        }),
        tableData = [];

      graphData.forEach(function (m) {
        var d = m.date,
          ref = d.format('YYYYMM');
        map[ref] = {
          val: m.val,
          date: d
        };
      });

      var keys = Object.keys(map);
      keys.sort(function (a, b) {
        return parseInt(a, 10) > parseInt(b, 10) ? -1 : 1;
      });

      keys.forEach(function (ref) {
        tableData.push({
          ref: map[ref].date.format('MMM'),
          date: map[ref].date,
          val: map[ref].val
        });
      });



      drawGraph(graphData);
      drawTable(tableData);

    });
  }

  function getMainData() {
    var moID = DEVICE_ID;
    var url = URL_BASE + '/inventory/managedObjects/?fragmentType=c8y_TankConfiguration&pageSize=1';
    return $.ajax({
      url: url,
      headers:  {
        Authorization: 'Basic ' + TOKEN
      }
    });
  }

  function getMeasurementData() {
    var days = 360,
      dateFrom = moment().subtract(days, 'days').format('YYYY-MM-DD'),
      dateTo = moment().add(1, 'days').format('YYYY-MM-DD'),
      url = URL_BASE + '/measurement/measurements/?' +
        'pageSize=5000' +
        '&source=' + DEVICE_DATA.id +
        '&dateFrom=' + dateFrom +
        '&dateTo=' + dateTo +
        '&type=c8y_TekelecRemainingFuel';

    return $.ajax({
      url: url,
      headers: {
        Authorization: 'Basic ' + TOKEN
      }
    });
  }

  function getHeaders(_token) {
    var t = _token || TOKEN;
    return {
      Authorization: 'Basic ' + t,
      UseXBasic: true,
      // 'X-Cumulocity-Application-Key': 'devicemanagement-application-key',
      Accept: 'application/vnd.com.nsn.cumulocity.user+json;',
      'Content-type': 'application/vnd.com.nsn.cumulocity.user+json;'
    };
  }

  function saveToken(token) {
    window.localStorage.setItem('t', token);
  }

  function getToken() {
    return window.localStorage.getItem('t');
  }

  function clearToken() {
    return window.localStorage.removeItem('t');
  }

  function login(user, pass, tenant) {
    if (!tenant && TENANT) {
      tenant = TENANT;
    }
    var token = buildToken(user, pass, tenant);
    TOKEN = token;

    getUser(token).then(function () {
      USER.pass = pass;
    }, function (data) {
      alert('ungültige Anmeldeinformationen');
    });
  }

  function buildToken(user, pass, tenant) {
    return btoa(
      (tenant ? tenant + '/' : '') +
      user + ':' +
      pass
    );
  }

  function logout() {
    clearToken();
    $('.logout').hide();
    $('.user').text('').hide();
    showScreen('login');
  }

  function getUser(token) {
    var url = URL_BASE  + '/user/currentUser';
    return $.ajax({
      url: url,
      headers: getHeaders(token)
    }).then(function (data) {
      USER = data;
      TOKEN = token;
      if ($('[name=remember]:checked').length) {
        saveToken(token);
      }
      showScreen('main');
      displayUser();
      return data;
    });
  }

  function setupLogin() {
    $('.login form').on('submit', function(e) {
      e.preventDefault();
      var form = $(this),
        username = form.find('[name=username]').val(),
        password = form.find('[name=password]').val();

      if (username && password) {
        login(username, password);
      }
    });
  }

  function setupChangePassword() {
    var ERROR_SIZE = 'Das Passwort muss größer als 6 Zeichen lang sein',
      ERROR_OLD_PASSWORD = 'Aktuelle Passwort ist nicht korrekt',
      ERROR_PASSWORD_MATCH = 'Neues Passwort und Passwortbestätigung stimmen nicht überein',
      PASSWORD_CHANGED = 'Kennwort geändert';

    $('.changePassword form').on('submit', function(e) {
      e.preventDefault();
      var form = $(this),
        currentPassword = form.find('[name=currentPassword]').val(),
        newPassword = form.find('[name=newPassword]').val(),
        newPasswordConfirm = form.find('[name=newPasswordConfirm]').val();

      if (newPassword.length < 6) {
        return alert(ERROR_SIZE);
      }

      if (newPassword !== newPasswordConfirm) {
        return alert(ERROR_PASSWORD_MATCH);
      }

      $.ajax({
        url: URL_BASE  + '/user/currentUser',
        headers: getHeaders(buildToken(USER.userName, currentPassword, TENANT))
      }).then(function () {
        updatePassword(newPassword).then(function() {
          alert(PASSWORD_CHANGED);
        });
      }, function() {
        alert(ERROR_OLD_PASSWORD);
      });
    });
  }

  function updatePassword(password) {
    // var url = URL_BASE + '/user/' + TENANT + '/users/' + USER.userName;
    var url = URL_BASE + '/user/currentUser';
    return  $.ajax({
      url : url,
      type: 'PUT',
      data: JSON.stringify({password: password}),
      headers: getHeaders(getToken())
    }).then(function () {
      return login(USER.userName, password, TENANT);
    });
  }

  function displayUser() {
    $('.user').text(USER.userName)
      .show()
      .on('click', function (e) {
        e.preventDefault();
        showScreen('changePassword');
      });
    $('.logout')
      .show()
      .on('click', function (e) {
        e.preventDefault();
        logout();
      });

  }

  function hideScreens() {
    $('.screen').hide();
  }

  function cleanFields() {
    $('.changePassword input').each(function () {
      $(this).val('');
    });
  }

  function showScreen(scr, noHide) {
    var actions = {
      main: setupMain,
      stats: setupStats,
      changePassword: cleanFields
    };


    if (!noHide) {
      hideScreens();
    }

    $('.' + scr).show();

    if (actions[scr]) {
      actions[scr]();
    }
  }

  function init() {
    var t = getToken();
    hideScreens();
    setupLogin();
    setupChangePassword();

    if (t) {
      getUser(t).then(function () {}, function () {
        showScreen('login');
      });
    } else {
      showScreen('login');
    }
  }



  function isBigScreen() {
    return $(window).width() > 800;
  }

  $(function() {

    $('#btnStat').on('click', function (e) {
      e.preventDefault();
      showScreen('stats');
    });

    $('#btnGauge').on('click', function (e) {
      e.preventDefault();
      showScreen('main');
    });

    $('.cancel_btn').on('click', function (e) {
      e.preventDefault();
      showScreen('main');
    });


    var reinit;
    $(window).on('resize', function () {
      clearTimeout(reinit);
      reinit = setTimeout(function () {
          setupMain.done = false;
          init();
      }, 800);
    });

    init();
  });
}());

