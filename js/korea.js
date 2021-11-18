var pointInPolygon = '../node_modules/point-in-polygon';

window.onload = function() {
    drawMap('#container');
};

//지도 그리기
function drawMap(target) {
    var width = 700; //지도의 넓이
    var height = 700; //지도의 높이
    var initialScale = 5500; //확대시킬 값
    var initialX = -11900; //초기 위치값 X
    var initialY = 4050; //초기 위치값 Y
    var labels;

    var imgElem = document.getElementById("myImg");
    imgElem.exifdata = null;
    EXIF.getData(imgElem, function() {
        var make = EXIF.getTag(this, "Make"); //"Make" 항목만 확인
        // console.log( make );
        var allMetaData = EXIF.getAllTags(this); //모든 EXIF정보
        // console.log( JSON.stringify(allMetaData, null, "\t") );

        var exifLong = EXIF.getTag(this, "GPSLongitude");
        var exifLat = EXIF.getTag(this, "GPSLatitude");
        var exifLongRef = EXIF.getTag(this, "GPSLongitudeRef");
        var exifLatRef = EXIF.getTag(this, "GPSLatitudeRef");

        if (exifLatRef == "S") {
            var latitude = (exifLat[0]*-1) + (( (exifLat[1]*-60) + (exifLat[2]*-1) ) / 3600);						
        } else {
            var latitude = exifLat[0] + (( (exifLat[1]*60) + exifLat[2] ) / 3600);
        }

        if (exifLongRef == "W") {
            var longitude = (exifLong[0]*-1) + (( (exifLong[1]*-60) + (exifLong[2]*-1) ) / 3600);						
        } else {
            var longitude = exifLong[0] + (( (exifLong[1]*60) + exifLong[2] ) / 3600);
        }

        wtmX = latitude;
        wtmY = longitude;

        console.log("wtmX : ", wtmX);
        console.log("wtmY : ", wtmY);
   });
   
   
    var projection = d3.geo
        .mercator()
        .scale(initialScale)
        .translate([initialX, initialY]);
    var path = d3.geo.path().projection(projection);
    var zoom = d3.behavior
        .zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([height, 800 * height])
        .on('zoom', zoom)
        ;

    var svg = d3
        .select(target)
        .append('svg')
        .attr('width', width + 'px')
        .attr('height', height + 'px')
        .attr('id', 'map')
        .attr('class', 'map')
        ;

    svg
        .append('defs')
        .append('pattern')
        .attr('id', 'imgpattern')
        .attr('x','0')
        .attr('y','0')
        .attr('width', '1')
        .attr('height', '1')
        .append("image")
        .attr("xlink:href", "https://unsplash.it/300/300")
        .attr("width", "400")
        .attr("height", "400");
        
   
    var states = svg
        .append('g')
        .attr('id', 'states')
        // .attr("xlink:href", "https://cdn.pixabay.com/photo/2021/11/11/13/08/leopard-6786267_960_720.jpg")
        // .call(zoom)
        ;

    
    states
        .append('rect')
        .attr('class', 'background')
        .attr('width', width + 'px')
        .attr('height', height + 'px');


    

    //geoJson데이터를 파싱하여 지도그리기
    d3.json('json/korea-sgg.json', function(json) {

        // var polygon =
        
        findSigCd(json.features);
        function findSigCd ( arr ) {
            for(let i = 0; i < arr.length; i++) {
                
                var polygon = arr[i].geometry.coordinates[0];

                console.log(pointInPolygon,([ 37.4386, 126.3786 ], polygon));

                // console.log(arr[i].geometry.coordinates[0]);
                // console.log(arr[i].properties);

            }
        }
        console.log(json) ;
        
        states
            .selectAll('path') //지역 설정
            .data(json.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('id', function(d) {
                return 'path-' + d.properties.name_eng;
            })
            
        labels = states
            .selectAll('text')
            .data(json.features) //라벨표시
            .enter()
            .append('text')
            .attr('transform', translateTolabel)
            .attr('id', function(d) {
                return 'label-' + d.properties.name_eng;
            })
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .text(function(d) {
                return d.properties.SIG_KOR_NM;
            });
    });

    

    //텍스트 위치 조절 - 하드코딩으로 위치 조절을 했습니다.
    function translateTolabel(d) {
        var arr = path.centroid(d);
        if (d.properties.code == 31) {
            //서울 경기도 이름 겹쳐서 경기도 내리기
            arr[1] +=
                d3.event && d3.event.scale
                    ? d3.event.scale / height + 20
                    : initialScale / height + 20;
        } else if (d.properties.code == 34) {
            //충남은 조금 더 내리기
            arr[1] +=
                d3.event && d3.event.scale
                    ? d3.event.scale / height + 10
                    : initialScale / height + 10;
        }
        return 'translate(' + arr + ')';
    }

    function zoom() {
        projection.translate(d3.event.translate).scale(d3.event.scale);
        states.selectAll('path').attr('d', path);
        labels.attr('transform', translateTolabel);
        // imgs.attr('transform', 'rotate(0)');
    }
}
