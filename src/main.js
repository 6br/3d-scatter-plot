// import * as THREE from "three"
import * as d3_color from 'd3-scale-chromatic';
import * as dat from 'dat.gui';

let json = require('../json/cells.json');
let exp = require('../json/exp.json');
// import OrbitControls from "./OrbitControls";

var API = {
    time: 0,
    play: false,
}

function createTextCanvas(text, color, font, size) {
    size = size || 40;
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
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true,
        alphaTest:0.01
    });
    //tex.map.premultiplyAlpha = false;
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.scale.set(0.075, 0.075, 0.075);
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
var w = 960;
var h = 600;

renderer.setSize(w, h);
document.getElementById("container").appendChild(renderer.domElement);
renderer.setClearColor(new THREE.Color("rgb(255, 255, 255)"));

// 

var camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
camera.position.z = 100;
camera.position.x = -100;
camera.position.y = 100;

var scene = new THREE.Scene();

var scatterPlot = new THREE.Object3D();
scene.add(scatterPlot);

scatterPlot.rotation.y = 0;

function v(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

var format = d3.format("+.0f");

var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.addEventListener( 'change', renderer );
controls.minDistance = 10;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

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
    var    expExent = d3.extent(data.unfiltered, function(d) {
            return d.exp;
        });
        // console.log(expExent)
    var xExent = [0, 1100];
    var yExent = [-1100, 0];
    var zExent = [-1100, 0];

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

    var colour = d3_color.interpolateBlues;

    var xScale = d3.scale.linear()
        .domain(xExent)
        .range([-50, 50]);
    var yScale = d3.scale.linear()
        .domain(yExent)
        .range([-50, 50]);
    var zScale = d3.scale.linear()
        .domain(zExent)
        .range([-50, 50]);

    var lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(
        v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)),
        v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zCen)),
        v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMin)),
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
*/
    );
    var lineMat = new THREE.LineBasicMaterial({
        color: 0xcccccc,
        lineWidth: 1
    });
    var line = new THREE.Line(lineGeo, lineMat);
    line.type = THREE.Lines;
    scatterPlot.add(line);

    var titleX = createText2D('Left(-X)');
    titleX.position.x = xScale(vpts.xMin) - 6,
    titleX.position.y = 2;
    scatterPlot.add(titleX);

    var valueX = createText2D(format(xExent[0]));
    valueX.position.x = xScale(vpts.xMin) - 6,
    valueX.position.y = -2;
    scatterPlot.add(valueX);

    var titleX = createText2D('Right(X)');
    titleX.position.x = xScale(vpts.xMax) + 6;
    titleX.position.y = 2;
    scatterPlot.add(titleX);

    var valueX = createText2D(format(xExent[1]));
    valueX.position.x = xScale(vpts.xMax) + 6,
    valueX.position.y = -2;
    scatterPlot.add(valueX);

    var titleY = createText2D('Vegetal(-Y)');
    titleY.position.y = yScale(vpts.yMin) - 5;
    scatterPlot.add(titleY);

    var valueY = createText2D(format(yExent[0]));
    valueY.position.y = yScale(vpts.yMin) - 9,
    scatterPlot.add(valueY);

    var titleY = createText2D('Animal(Y)');
    titleY.position.y = yScale(vpts.yMax) + 9;
    scatterPlot.add(titleY);

    var valueY = createText2D(format(yExent[1]));
    valueY.position.y = yScale(vpts.yMax) + 5,
    scatterPlot.add(valueY);

    var titleZ = createText2D('Ventral(-Z) ' + format(zExent[0]));
    titleZ.position.z = zScale(vpts.zMin) + 2;
    scatterPlot.add(titleZ);

    var titleZ = createText2D('Dorsal(Z) ' + format(zExent[1]));
    titleZ.position.z = zScale(vpts.zMax) + 2;
    scatterPlot.add(titleZ);

    var mat = new THREE.ParticleBasicMaterial({
        vertexColors: true,
        size: 10
    });

    var pointCount = data.unfiltered.length;
    var pointGeo = new THREE.Geometry();
    for (var i = 0; i < pointCount; i++) {
        var x = xScale(data.unfiltered[i].x);
        var y = yScale(data.unfiltered[i].y);
        var z = zScale(data.unfiltered[i].z);
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshBasicMaterial({color: new THREE.Color(colour(data.unfiltered[i].exp / expExent[1]))}));
        sphere.position.set(x, y, z);
        //pointGeo.vertices.push(new THREE.Vector3(x, y, z));
        // console.log(colour(data.unfiltered[i].exp))
        //console.log(new THREE.Color(colour(data.unfiltered[i].exp)))
        scatterPlot.add(sphere);

    }
    var points = new THREE.ParticleSystem(pointGeo, mat);
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
            renderer.render(scene, camera);
        }
        window.requestAnimationFrame(animate, renderer.domElement);
    };
    animate(new Date().getTime());
    onmessage = function(ev) {
        paused = (ev.data == 'pause');
    };

}

export default () => {
    // init();
    let unfiltered = [];
    for(var i = 0; i < 1000; i++) {
        // console.log(json[i][2])
        unfiltered.push({x: json[i][0], y: json[i][1], z: json[i][2], id: 'point_' + i, exp: exp[i]});
    }
    data = {
        unfiltered
    }
    scatter(data);

    const gui = new dat.GUI();
    gui.add( API, 'time', 0, 700 ).name( 'time' ).onChange( scatter(data) ).listen();
    // gui.add( API, 'time', 0 ).name( 'reset' ).onChange( scatter(data) );
    gui.add( API, 'play', false, true ).name( 'play/pause' ).onChange( scatter(data) );

    setInterval( function () {
        if (API.play === true && API.time < 700) {
            API.time++
        }
     } , 800 );
};