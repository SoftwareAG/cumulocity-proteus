(function () {
  var setGauge,
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez'],
    deviceId = '22600';

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
      scaleX = d3.scale.linear()
        .domain([0, data.length - 1])
        .range([0, width - margin * 2]),
      scaleY = d3.scale.linear()
        .domain([0, 100])
        .range([height - margin * 2, 0]),

      x = function (d, i)  { return scaleX(i); },
      y = function (d)  { return scaleY(d.val); },


      line = d3.svg.line().x(x).y(y),
      area = d3.svg.area().x(x).y(y),

      yAxis = d3.svg.axis()
        .scale(scaleY)
        .orient('left')
        .tickValues([0, 25, 50, 75, 100])
        .innerTickSize(0)
        .outerTickSize(0),
      xAxis = d3.svg.axis()
        .scale(scaleX)
        .tickSize(1)
        .innerTickSize(1)
        .outerTickSize(0)
        .tickFormat(function (d) { return months[d] || ''; })
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
          return '<td class="beige tile">' + months[d.month] + '</td>' +
            '<td style="text-align:right">' + d.val + '</td>';
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

    $('.battery').attr('class', 'battery ' + scale(battery));
    $('.battery .val').text(battery + '%');
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
    drawCircle($('#gauge').width());


    getMainData().success(function (mo) {
      var signal = mo.c8y_SignalStrength.rssi.value,
        battery = mo.c8y_Battery.level.value,
        capacity = mo.c8y_TankConfiguration.capacity.usable,
        remaining = mo.c8y_TekelecRemainingFuel.capacity.value,
        hw = mo.c8y_Hardware,
        fuel = mo.c8y_TankConfiguration.fuel;


      setSignal(signal);
      setBattery(battery);
      setCapacity(capacity + 'L');

      setTimeout(function() {
        setGauge(Math.round(remaining / capacity * 100));
      }, 500);
      setLastUpdate(mo.lastUpdate);
      setStaticInfo({
        serial: hw.serialNumber,
        vol: capacity + 'L',
        medium: fuel
      });
    });
  }

  function setupStats() {
    var graphData = [
      {month: 0, val: 20},
      {month: 1, val: 24},
      {month: 2, val: 60},
      {month: 3, val: 60},
      {month: 4, val: 100},
      {month: 5, val: 90},
      {month: 6, val: 80},
    ];

    drawGraph(graphData);
    drawTable(graphData);
  }

  function getMainData() {
    var url = '/data/managedObject.json';
    return $.ajax({
      url: url,
      headers:  {
        Authorization: 'Basic bWFuYWdlbWVudC9hZG1pbjpQeWkxYm8xcg=='
      }
    });
  }


  $(function() {
    var main = $('.main'),
      stats = $('.stats');


    $('#btnStat').on('click', function (e) {
      e.preventDefault();
      main.hide();
      stats.show();
      setupStats();
    });

    $('#btnGauge').on('click', function (e) {
      e.preventDefault();
      stats.hide();
      main.show();
      setupMain();
    });

    setupMain();
  });
}());

