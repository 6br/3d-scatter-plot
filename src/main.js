// import * as THREE from "three"
import * as d3_color from 'd3-scale-chromatic';
import * as dat from 'dat.gui';

//let json = require('../json/cells.json');
// let exp = require('../json/exp.json');
// let exps = require('../sample/all_time_cdx4_exp_list.json');
// let exps = require('../small_data/exp/CDX4.json');
let exps = {};
let exps_json = 'CDX4.json';
let exps_jsons = ['exp/CDX4.json', 'exp/EVE1.json', 'exp/NOTO.json', 'exp/RIPPLY1.json', 'exp/RX3.json', 'exp/SOX2.json'];
let time_cell_json = 'time_cell_vd_va_lr.json';
// import OrbitControls from "./OrbitControls";
// let json = require('../partial_cells.json')

var API = {
    time: 0,
    play: false,
}

var colour = d3_color.interpolateInferno; // Colours for nodes.
var colour = d3.interpolate("#666666", "purple");

function createTextCanvas(text, color, font, size) {
    size = size || 160;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    // ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = color || 'black'; //Set a text color.
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshLambertMaterial({
        map: tex,
        color: 0xcccccc,
        transparent: true,
        alphaTest:0.01
    });
    //tex.map.premultiplyAlpha = false;
    var mesh = new THREE.Mesh(plane, planeMat);
    // mesh.scale.set(0.075, 0.075, 0.075);
    mesh.scale.set(0.01, 0.01, 0.01);
    mesh.material.side = THREE.DoubleSide;
    //mesh.doubleSided = true;
    return mesh;
}

// from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

function hexToRgb(hex) { //TODO rewrite with vector output
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function sq(x) {
    var s = Math.pow(x, 2);
    return s;
}

function getPts(x) {
    //console.log(x)
    var unfiltered = [],
        lowPass = [],
        highPass = [];

    x.forEach(function(d, i) {

        var line = d.split(",");

        unfiltered[i] = {
            x: +line[0],
            y: +line[1],
            z: +line[2]
        };
        lowPass[i] = {
            x: +line[4],
            y: +line[5],
            z: +line[6]
        };
        highPass[i] = {
            x: +line[7],
            y: +line[8],
            z: +line[9]
        };
    })
    var xyzData = {
        unfiltered: unfiltered,
        lowPass: lowPass,
        highPass: highPass
    }
    return xyzData;
}

// var uploader = document.getElementById("uploader");
var reader = new FileReader();
var data;
var rendered = false;

reader.onload = function(e) {
    var contents = e.target.result;
    var rawData = contents.split(/\n/);
    var tempData = rawData.slice(2, rawData.length);
    data = getPts(tempData);
    scatter(data);

    // remove button after loading file
    // uploader.parentNode.removeChild(uploader);
};

// uploader.addEventListener("change", handleFiles, false);

function handleFiles() {
    var file = this.files[0];
    reader.readAsText(file);
};

var renderer = new THREE.WebGLRenderer({
    antialias: true
});

var w = window.innerWidth;
var h = window.innerHeight;

renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0); // Set Background Colors
document.getElementById("container").appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
camera.position.z = 100;
camera.position.x = -100;
camera.position.y = 100;

onResize();
// リサイズイベント発生時に実行
window.addEventListener('resize', onResize);

function onResize() {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
  
    // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

var scene = new THREE.Scene();

var scatterPlot = new THREE.Object3D();
scene.add(scatterPlot);

var directionalLight = new THREE.DirectionalLight(0xffffff);
//directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const light = new THREE.AmbientLight(0xFFFFFF, 1.0);
scene.add(light);

var points = new THREE.Object3D();
scatterPlot.add(points);

var spheres = [];

scatterPlot.rotation.y = 0;

function v(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

var format = d3.format("+.0f");

var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.addEventListener( 'change', renderer );
controls.minDistance = 10;
controls.maxDistance = 1000;


controls.enableDamping = true;
controls.dampingFactor = 0.35;

tick();

function tick() {
    controls.update();

    // レンダリング
    renderer.render(scene, camera);
  
    requestAnimationFrame(tick);
}

// controls.maxPolarAngle = Math.PI / 2;

var xExent = [-1100, 0];
var yExent = [-1100, 0];
var zExent = [0, 1100];

var xScale = d3.scale.linear()
.domain(xExent)
.range([-50, 50]);
var yScale = d3.scale.linear()
    .domain(yExent)
    .range([-50, 50]);
var zScale = d3.scale.linear()
    .domain(zExent)
    .range([-50, 50]);


function rePlot(data) {
    var expExent = d3.extent(data.exp, function(d) {
        return d;
    });
    var pointCount = data.unfiltered.length;
    for (var i = 0; i < pointCount; i++) {
        var x = xScale(data.unfiltered[i].x);
        var y = yScale(data.unfiltered[i].y);
        var z = zScale(data.unfiltered[i].z);
        // console.log(spheres[i])
        spheres[i].position.set(x, y, z)
        spheres[i].material.color.set(new THREE.Color(colour(data.exp[i] / expExent[1])));
        //var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshBasicMaterial({color: new THREE.Color(colour(data.exp[i] / expExent[1]))}));
    }

}

function scatter(data) {

    var temp = data.unfiltered;
    

    /*var xExent = d3.extent(temp, function(d) {
            return d.x;
        }),
        yExent = d3.extent(data.unfiltered, function(d) {
            return d.y;
        }),
        zExent = d3.extent(data.unfiltered, function(d) {
            return d.z;
        }),*/
    var    expExent = d3.extent(data.exp, function(d) {
            return d;
        });
        // console.log(expExent)
    // var xExent = [0, 1100];
    // var yExent = [-1100, 0];
    // var zExent = [-1100, 0];

    var vpts = {
        xMax: xExent[1],
        xCen: (xExent[1] + xExent[0]) / 2,
        xMin: xExent[0],
        yMax: yExent[1],
        yCen: (yExent[1] + yExent[0]) / 2,
        yMin: yExent[0],
        zMax: zExent[1],
        zCen: (zExent[1] + zExent[0]) / 2,
        zMin: zExent[0]
    }

    // var colour = d3_color.interpolateBlues;

    var xScale = d3.scale.linear()
        .domain(xExent)
        .range([-50, 50]);
    var yScale = d3.scale.linear()
        .domain(yExent)
        .range([-50, 50]);
    var zScale = d3.scale.linear()
        .domain(zExent)
        .range([-50, 50]);

    var lineGeoX = new THREE.Geometry();
    lineGeoX.vertices.push(v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)));
    var lineGeoY = new THREE.Geometry();
    lineGeoY.vertices.push(v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zCen)));
    var lineGeoZ = new THREE.Geometry();
    lineGeoZ.vertices.push(v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMin)));
/*
        v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)),
        v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),

        v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)),
        v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)),
        v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)),

        v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)),
        v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),

        v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMax)),
        v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)),
        v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)),

        v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
        v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),
        v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),
        v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)),

        v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)),
        v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)),
        v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)),
        v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax))

    );
    */
    var lineMat = new THREE.LineBasicMaterial({
        color: 0xcccccc,
        lineWidth: 1
    });
    var lineX = new THREE.Line(lineGeoX, lineMat);
    lineX.type = THREE.Lines;
    scatterPlot.add(lineX);
    var lineY = new THREE.Line(lineGeoY, lineMat);
    lineY.type = THREE.Lines;
    scatterPlot.add(lineY);
    var lineZ = new THREE.Line(lineGeoZ, lineMat);
    lineZ.type = THREE.Lines;
    scatterPlot.add(lineZ);

    var titleX = createText2D('Left(-X)');
    titleX.position.x = xScale(vpts.xMin) - 6,
    titleX.position.y = 2;
    scatterPlot.add(titleX);

    var valueX = createText2D(format(xExent[0]));
    valueX.position.x = xScale(vpts.xMin) - 6,
    valueX.position.y = -2;
    scatterPlot.add(valueX);

    var titleX2 = createText2D('Right(X)');
    titleX2.position.x = xScale(vpts.xMax) + 6;
    titleX2.position.y = 2;
    scatterPlot.add(titleX2);

    var valueX2 = createText2D(format(xExent[1]));
    valueX2.position.x = xScale(vpts.xMax) + 6,
    valueX2.position.y = -2;
    scatterPlot.add(valueX2);

    var titleY = createText2D('Vegetal(-Y)');
    titleY.position.y = yScale(vpts.yMin) - 5;
    scatterPlot.add(titleY);

    var valueY = createText2D(format(yExent[0]));
    valueY.position.y = yScale(vpts.yMin) - 9,
    scatterPlot.add(valueY);

    var titleY2 = createText2D('Animal(Y)');
    titleY2.position.y = yScale(vpts.yMax) + 9;
    scatterPlot.add(titleY2);

    var valueY2 = createText2D(format(yExent[1]));
    valueY2.position.y = yScale(vpts.yMax) + 5,
    scatterPlot.add(valueY2);

    var titleZ = createText2D('Ventral(-Z) ' + format(zExent[0]));
    titleZ.position.z = zScale(vpts.zMin) + 2;
    scatterPlot.add(titleZ);

    var titleZ2 = createText2D('Dorsal(Z) ' + format(zExent[1]));
    titleZ2.position.z = zScale(vpts.zMax) + 2;
    scatterPlot.add(titleZ2);

    var mat = new THREE.ParticleBasicMaterial({
        vertexColors: true,
        size: 10
    });


    scatterPlot.remove(points);
    points = new THREE.Object3D();

    var pointCount = data.unfiltered.length;
    var pointGeo = new THREE.Geometry();
    for (var i = 0; i < pointCount; i++) {
        var x = xScale(data.unfiltered[i].x);
        var y = yScale(data.unfiltered[i].y);
        var z = zScale(data.unfiltered[i].z);
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshLambertMaterial({color: new THREE.Color(colour(data.exp[i] / expExent[1]))}));
        sphere.position.set(x, y, z);
        //pointGeo.vertices.push(new THREE.Vector3(x, y, z));
        // console.log(colour(data.unfiltered[i].exp))
        //console.log(new THREE.Color(colour(data.unfiltered[i].exp)))
        spheres.push(sphere);
        points.add(sphere);
    }
    // var points = new THREE.ParticleSystem(pointGeo, mat);
    scatterPlot.add(points);

    renderer.render(scene, camera);
    var paused = false;
    var last = new Date().getTime();
    var down = false;
    var sx = 0,
        sy = 0;
/*
    window.onmousedown = function(ev) {
        down = true;
        sx = ev.clientX;
        sy = ev.clientY;
    };
    window.onmouseup = function() {
        down = false;
    };
    window.onmousemove = function(ev) {
        if (down) {
            var dx = ev.clientX - sx;
            var dy = ev.clientY - sy;
            var dist = Math.sqrt(sq(camera.position.x) + sq(camera.position.y) + sq(camera.position.z));

            scatterPlot.rotation.y += dx * 0.01;
            scatterPlot.rotation.x += dy * 0.01;

            sx += dx;
            sy += dy;
        }
    }*/
    var animating = false;
    window.ondblclick = function() {
        animating = !animating;
    };

    function animate(t) {
        if (!paused) {
            last = t;
            renderer.clear();
            camera.lookAt(scene.position);
            titleX.quaternion.copy( camera.quaternion );
            titleY.quaternion.copy( camera.quaternion );
            titleX2.quaternion.copy( camera.quaternion );
            titleY2.quaternion.copy( camera.quaternion );
            titleZ.quaternion.copy( camera.quaternion );
            valueX.quaternion.copy( camera.quaternion );
            valueY.quaternion.copy( camera.quaternion );
            valueX2.quaternion.copy( camera.quaternion );
            valueY2.quaternion.copy( camera.quaternion );
            titleZ2.quaternion.copy( camera.quaternion );
            renderer.render(scene, camera);
        }
        window.requestAnimationFrame(animate, renderer.domElement);
    };
    animate(new Date().getTime());
    onmessage = function(ev) {
        paused = (ev.data == 'pause');
    };
    rendered = true;

}

const MAX_CELL = 1000;
const MAX_FLAME = 699;
const INTERVAL = 150;

export default () => {
    /* Initialize D3.JS */
    var margin = {top:0, right:50, bottom:-100, left:50},
        width = 960 - margin.left - margin.right,
        height = 100 - margin.top - margin.bottom;

    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = d3.select("#play-button");
        
    var xAxis = d3.scale.linear()
        .domain([0, MAX_FLAME])
        .range([0, targetValue])
        .clamp(true);




    /* Initialize THREE.js */
    fetch(time_cell_json).then(res => res.json()).then(json => {
        fetch(exps_json).then(res => res.json()).then(load_exps => {
            let unfiltered = [];
            for(var i = 0; i < MAX_CELL; i++) {
                // console.log(json[i][2])
                unfiltered.push({x: json[0][i][0], y: json[0][i][1], z: json[0][i][2], id: 'point_' + i});
            }
            data = {
                unfiltered,
                exp: load_exps[API.time]
            }
            exps = load_exps;
            scatter(data);
        function step() {
            update(xAxis.invert(currentValue));
            currentValue = currentValue + 1; //(targetValue/151);
            if (currentValue > targetValue) {
              moving = false;
              currentValue = 0;
              clearInterval(timer);
              // timer = 0;
              playButton.text("Play");
              // console.log("Slider moving: " + moving);
            }
        }
    
        var slider = svg.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + margin.left + "," + height/5 + ")");
    
        slider.append("line")
            .attr("class", "track")
            .attr("x1", xAxis.range()[0])
            .attr("x2", xAxis.range()[1])
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.behavior.drag()
                .on("dragend", function() { slider.interrupt(); })
                .on("drag", function() {
                currentValue = d3.event.x;
                update(xAxis.invert(currentValue)); 
                })
            );
    
        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
            .data(xAxis.ticks(10))
            .enter()
            .append("text")
            .attr("x", xAxis)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .text(function(d) { return Math.round(d); });
    
        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);
    
        var label = slider.append("text")  
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .text("0")
            .attr("transform", "translate(0," + (-25) + ")")
   
        var timer;

        playButton
            .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
              moving = false;
              clearInterval(timer);
              // timer = 0;
              button.text("Play");
            } else {
              moving = true;
              timer = setInterval(step, INTERVAL);
              button.text("Pause");
            }
            // console.log("Slider moving: " + moving);
          })

        function update(h) {
            // update position and text of label according to slider scale
            handle.attr("cx", xAxis(h));
            label
                .attr("x", xAxis(h))
                .text(parseInt(h));
            
            // filter data set and redraw plot
            /* var newData = dataset.filter(function(d) {
                return d.date < h;
            })
            drawPlot(newData); */
            let unfiltered = [];
            let time = h;
            for(var i = 0; i < MAX_CELL; i++) {
                // console.log(json[i][2])
                unfiltered.push({x: json[parseInt(time)][i][0], y: json[parseInt(time)][i][1], z: json[parseInt(time)][i][2], id: 'point_' + i});
            }
            data = {
                unfiltered,
                exp: exps[parseInt(time)]
            };
            // console.log(data);
            rePlot(data)
        }
    })
        
    })
};