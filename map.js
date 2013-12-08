function init()
{
    var title = "D3 YAY!";
    document.title = title;
    $('#heading').html(title);
    drawMap(.9);
}

function drawMap(mapScaleWithinDiv)
{
    var width = $("#mapdiv").width(), height = $("#mapdiv").height();

    var projection = d3.geo.mercator()
        //.scale(10);
        //.translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height);

    d3.json("arronds_topo.json", function(error, mtl) {
        var arronds = topojson.feature(mtl, mtl.objects.arronds),
          arrond = arronds.features.filter(function(d) { return d.id === 'Hampstead'; })[0];
        
        projection
          .scale(1)
          .translate([0, 0]);
          
        var curr_x = Infinity, curr_y = Infinity, curr_x2 = -Infinity, curr_y2 = -Infinity;
        for ( var i=1; i < arronds.features.length; i++ ) {
            var miniBounds = path.bounds(arronds.features[i]);
            var x= miniBounds[0][0], y = miniBounds[0][1], x2 = miniBounds[1][0], y2 = miniBounds[1][1];
            curr_x = Math.min(x, curr_x);
            curr_y = Math.min(y, curr_y);
            curr_x2 = Math.max(x2, curr_x2);
            curr_y2 = Math.max(y2, curr_y2);
        }
      
        var bbox = [[curr_x, curr_y], [curr_x2, curr_y2]], bboxW = curr_x2-curr_x, bboxH = curr_y2-curr_y;
        
        if (typeof(mapScaleWithinDiv) === 'undefined') {
            mapScaleWithinDiv = .95;
        }
        var maxWidth = mapScaleWithinDiv*width, maxHeight = mapScaleWithinDiv*height;
        var maxScale = Math.min(Math.round(maxWidth/bboxW), Math.round(maxHeight/bboxH));
        var translation = [(width-(maxScale*(curr_x+curr_x2))) / 2,(height-(maxScale*(curr_y+curr_y2)))/2];
      
        projection
            .scale(maxScale)
            .translate(translation);

        svg.append("path")
            .datum(arronds)
            .attr("class", "feature")
            .attr("d", path)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("fill", "white");
          
        if (navigator.geolocation) {
            console.info("Plotting location...");
            navigator.geolocation.getCurrentPosition(
               function(pos) {
                var myPosLL = { lat: pos.coords.latitude, lng:pos.coords.longitude };
                svg.append("circle")
                    .attr("r",2)
                    .attr("stroke", "green")
                    .attr("transform", function(d) {return "translate(" + projection([myPosLL.lng,myPosLL.lat]) + ")"})
                    .transition()
                    .duration(700)
                    .attr("r", 4)
                    .each("end", animateSecondStep);
            });
        }
    });
}

function animateSecondStep()
{
    d3.select(this)
      .transition()
        .duration(500)
        .attr("r", 2)
        .each("end", animateAgainFirstStep);
}

function animateAgainFirstStep()
{
    d3.select(this)
      .transition()
        .duration(700)
        .attr("r", 4)
        .each("end", animateSecondStep);
}