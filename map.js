function init()
{
    var title = "Vous êtes où sur cette belle île ?";
    document.title = title;
    $('#heading').html(title);
    drawMap(.9);
}

function drawMap(mapScaleWithinDiv)
{
    var width = $("#mapdiv").width(), height = $("#mapdiv").height();

    var projection = d3.geo.mercator();

    var path = d3.geo.path()
        .projection(projection);
        
    var svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height);

    d3.json("geodata/arronds_topo2.json", function(error, mtl) {
        var features = topojson.feature(mtl, mtl.objects.arronds2).features;
        var splitResult = splitFeatureInTwo(features, 'Dorval', 'Île Dorval');
        if ( splitResult.idx >= 0 ) {
            features.splice(splitResult.idx, 1);
            features.push(splitResult.splitFeat1);
            features.push(splitResult.splitFeat2);
        }
        
        projection
          .scale(1)
          .translate([0, 0]);
          
        var curr_x = Infinity, curr_y = Infinity, curr_x2 = -Infinity, curr_y2 = -Infinity;
        for ( var i=1; i < features.length; i++ ) {
            var miniBounds = path.bounds(features[i]);
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

        svg
            .selectAll("path")
            .data(features)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            //.attr("fill", "white")
            .attr("title", function(d,i) { console.info(d.properties.nom, i); return d.properties.nom; })
            .attr("class", function(d) { return d.properties.arrond_mtl == 'T'? 'arrondDeMTL' : 'arrondPasDeMTL'; })
            .on("mouseover", function(d) { d3.select(this).style({'fill-opacity':.5}); })
            .on("mouseout", function(d) { d3.select(this).style({'fill-opacity':1}); });
          
        if (navigator.geolocation) {
            var id = "mypos";
            navigator.geolocation.getCurrentPosition(
               function(pos) {
                var myPosLL = { lat: pos.coords.latitude, lng:pos.coords.longitude };
                var myPosXY = projection([myPosLL.lng,myPosLL.lat]);
                svg.append("circle")
                    .attr("id", id)
                    .attr("r",2)
                    .attr("title","Vous êtes ici")
                    .attr("stroke", "green")
                    .attr("transform", function(d) {return "translate(" + myPosXY + ")"})
                    .transition()
                    .duration(700)
                    .attr("r", 4)
                    .each("end", animateSecondStep);
                    
                var myQuartier = $("path").filter(function(i) {return Raphael.isPointInsidePath($(this).attr('d'),myPosXY[0],myPosXY[1]);}).attr('title');
                var currTitle = $("#" + id).attr("title");
                $("#" + id).attr("title", currTitle + ", dans le quartier " + myQuartier + " !");
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

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function splitFeatureInTwo(features, name, othername)
{
    for ( var i=0; i < features.length; i++ ) {
        var currFeat = features[i];
        if ( currFeat.properties.nom == name && currFeat.geometry.coordinates.length == 2) {
            var sf1 = clone(currFeat), sf2 = clone(currFeat);
            sf2.geometry.coordinates.splice(1,1);
            sf1.geometry.coordinates.splice(0,1);
            sf1.properties.nom = othername;
            return { idx:i, splitFeat1:sf1, splitFeat2:sf2 };
        }
    }
    return { idx:-1 };
}