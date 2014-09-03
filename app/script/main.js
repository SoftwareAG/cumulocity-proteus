(function () {
  var setGauge,
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez'],
    deviceId = '22600',
    URL_BASE = '',
    TENANT = 'innotecmk',
    DEVICE_ID = '78200',
    DEVICE_DATA = {};

  function drawCircle(size) {
    var gap = 0.79,
      width = 30,
      radius = size / 2,
      svg = getSvg(size),

      scale = d3.scale.linear()
        .domain([0,100])
        .range([gap-Math.PI, Math.PI - gap]),

      arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - width)
        .startAngle(scale.range()[0]);

      arc2 = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - width)
        .startAngle(0)
        .endAngle(Math.PI * 2);

    d3.select('image')
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

  function drawGraph(data) {
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
      xAxis = d3.svg.axis()
        .tickFormat(function (d) {
          var m = moment(d).format('MMM'),
            tick = '';
          if (doneMonths.indexOf(m) === -1) {
            doneMonths.push(m);
            tick = m;
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
          return '<td class="beige tile">' + d.month + '</td>' +
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

  function setBattery(battery) {
    var scale = d3.scale.quantile()
      .domain([0,100])
      .range(['empty', 'low', 'medium' ,'high', 'full']);
    var scalePercent = d3.scale.linear()
      .domain([0,6])
      .range([0,100]);
    var percent = scalePercent(battery);

    $('.battery').attr('class', 'battery ' + scale(battery));
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

    setGauge(Math.round(remaining / capacity * 100));
    setLastUpdate(mo.lastUpdate);
    setStaticInfo({
      serial: hw.serialNumber,
      vol: capacity + 'L',
      medium: fuel
    });
  }

  function setupStats() {
    // var graphData = [
    //   {month: 0, val: 20},
    //   {month: 1, val: 24},
    //   {month: 2, val: 60},
    //   {month: 3, val: 60},
    //   {month: 4, val: 100},
    //   {month: 5, val: 90},
    //   {month: 6, val: 80},
    // ];

    getMeasurementData().success(function (data) {
      var measurements = data.measurements,
        map = {},
        graphData = [];

      measurements.forEach(function (m) {
        var d = moment(m.time),
          month = d.format('YYYYMM');
        map[month] = {
          val: Math.round( m.c8y_TekelecRemainingFuel.capacity.value / DEVICE_DATA.c8y_TankConfiguration.capacity.usable * 100),
          date: d
        };
      });

      Object.keys(map).sort(function (a, b) {
        return Number(a) > Number(b);
      }).forEach(function (month) {

        graphData.push({
          month: map[month].date.format('MMM'),
          date: map[month].date,
          val: map[month].val
        });

      });

      drawGraph(graphData);
      drawTable(graphData);

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
      url = URL_BASE + '/measurement/measurements/?pageSize= ' + days +
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
      Accept: 'application/vnd.com.nsn.cumulocity.user+json;'
    };
  }

  function login(user, pass, tenant) {
    if (!tenant && TENANT) {
      tenant = TENANT;
    }

    var token = btoa(
      (tenant ? tenant + '/' : '') +
      user + ':' +
      pass
    );
    TOKEN = token;
    var url = URL_BASE  + '/user/currentUser';

    return $.ajax({
      url: url,
      headers: getHeaders(token)
    }).then(function (data) {
      TOKEN = token;
      showScreen('main');
      setupMain();
      return data;
    }, function (data) {
      alert('ungültige Anmeldeinformationen');
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

  function hideScreens() {
    $('.screen').hide();
  }

  function showScreen(scr) {
    var actions = {
      main: setupMain,
      stats: setupStats
    };

    hideScreens();
    $('.' + scr).show();

    if (actions[scr]) {
      actions[scr]();
    }
  }


  $(function() {
    var main = $('.main'),
      stats = $('.stats');

    $('#btnStat').on('click', function (e) {
      e.preventDefault();
      showScreen('stats');
    });

    $('#btnGauge').on('click', function (e) {
      e.preventDefault();
      showScreen('main');
    });

    setupLogin();
  });
}());

