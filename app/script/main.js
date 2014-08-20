function drawCircle(size) {
  var gap = 0.75,
    width = 30,
    radius = size / 2,
    svg = getSvg(size),
    arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - width)
      .startAngle(gap - Math.PI)
      .endAngle(Math.PI - gap),
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

  svg.append('path')
    .attr('d', arc2)
    .attr('stroke', '#999')
    .attr('stroke-width', '2px')
    .attr('fill', '#DAD3CA')
    .attr('filter', 'url(#blur)')
    .attr('clip-path', 'url(#circleClip)');

   svg.append('path')
    .attr('d', arc)
    .attr('fill', 'url(#grad)');
}

function getSvg(size) {
  if (!getSvg.svg) {
    var width = size,
      height = size;

    getSvg.svg = d3.select('#gaugeSvg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  }

  return getSvg.svg;
}


$(function() {
  drawCircle($('#gauge').width());
});