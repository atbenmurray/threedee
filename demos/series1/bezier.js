
    // helpers
    var setup_spheres = function(points, radius, material, scene) {
      var spheres = [];
      for (var i = 0; i < points.length; ++i) {
        var geom = new THREE.SphereBufferGeometry(radius, 32, 32);
        spheres[i] = new THREE.Mesh(geom, new THREE.MeshPhongMaterial(material));
        spheres[i].position.set(points[i].x, points[i].y, points[i].z);
        scene.add(spheres[i]);
      }
      return spheres;
    };

    var setup_interp_lines = function(points, material, scene) {
      var lines = [];
      for (var i = 0; i < points.length-1; ++i) {
        var mat = new THREE.LineBasicMaterial(material);
        var geom = new THREE.Geometry();
        geom.vertices.push(points[i], points[i+1]);
        lines[i] = new THREE.Line(geom, mat);
        scene.add(lines[i]);
      };
      return lines;
    };

    var setup_curve = function(points, material, scene) {
      var geom = new THREE.Geometry();
      for (var t = 0; t < 100; ++t) {
        var t1 = t * 0.01;
        var t2 = t1 * t1;
        var t3 = t2 * t1
        var tp1 = 1 - t1;
        var tp2 = tp1 * tp1;
        var tp3 = tp2 * tp1;
        var p0 = points[0].clone().multiplyScalar(tp3);
        var p1 = points[1].clone().multiplyScalar(3 * tp2 * t1);
        var p2 = points[2].clone().multiplyScalar(3 * tp1 * t2);
        var p3 = points[3].clone().multiplyScalar(t3);
        geom.vertices.push(p0.add(p1).add(p2).add(p3));
      }
      var mat = new THREE.LineBasicMaterial(material);
      scene.add(new THREE.Line(geom, mat));
    }

    var setup_arrow = function(material, scene) {
        var mat = new THREE.MeshPhongMaterial(material);
        var geom1 = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 18);
        var geom2 = new THREE.ConeGeometry(0.15, 0.3, 18);
        geom2.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.35, 0));
        geom1.merge(geom2);
        var tangent = new THREE.Mesh(geom1, mat);
        scene.add(tangent);
        return tangent
    }
 
    var setup_tangent = function(material, scene) {
      return setup_arrow(material, scene);
    }

    var setup_binormal = function(material, scene) {
      return setup_arrow(material, scene);
    }

    var setup_normal = function(material, scene) {
      return setup_arrow(material, scene);
    }

    var interp_point = function(pt0, point, t) {
      var tpt0 = pt0.clone().multiplyScalar(1-t);
      var tpt1 = point.clone().multiplyScalar(t);
      return new THREE.Vector3().addVectors(tpt0, tpt1);
    }

    var update_interp_points = function(points, interpPoints, t) {
      for (var i = 0; i < interpPoints.length; ++i) {
        interpPoints[i] = interp_point(points[i], points[i+1], t);
        //interpPoints[i].position.set(pos.x, pos.y, pos.z);          
      }
    };

    var update_interp_spheres = function(points, spheres) {
      for (var i = 0; i < points.length; ++i) {
        spheres[i].position.set(points[i].x, points[i].y, points[i].z);
      }
    };

    var update_interp_lines = function(points, lines) {
      for (var i = 0; i < lines.length; ++i) {
        var verts = lines[i].geometry.vertices;
        verts[0].x = points[i].x;
        verts[0].y = points[i].y;
        verts[0].z = points[i].z;
        verts[1].x = points[i+1].x;
        verts[1].y = points[i+1].y;
        verts[1].z = points[i+1].z;
        lines[i].geometry.verticesNeedUpdate = true;
      }
    };

    var calculate_tangent = function(points, t) {
      var t2 = t * t;
      var tp = 1 - t;
      var tp2 = tp * tp;
      var p0 = points[0].clone().multiplyScalar(-tp2);
      var p1 = points[1].clone().multiplyScalar(3 * tp2 - 2 * tp);
      var p2 = points[2].clone().multiplyScalar(-3 * t2 + 2 * t);
      var p3 = points[3].clone().multiplyScalar(t2);
      var tangent = p0.add(p1).add(p2).add(p3).normalize();
      return tangent;
    };

    var calculate_binormal = function(points, t) {
      var tangent = calculate_tangent(points, t);
      var binormal = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
      return binormal;
    };

    var calculate_normal = function(points, t) {
      var tangent = calculate_tangent(points, t);
      var binormal = calculate_binormal(points, t);
      var normal = new THREE.Vector3().copy(tangent).cross(binormal);
      return normal;
    };

    var calculate_orientation = function(points, t) {
      var tangent = calculate_tangent(points, t);
      var normal = calculate_normal(points, t);
    };

    var update_tangent = function(points, interpPoint, tangentLine, t) {
      var tangent = calculate_tangent(points, t);
      var q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), tangent);
      var p = new THREE.Vector3(0, 0.5, 0).applyQuaternion(q);
      tangentLine.quaternion.copy(q);
      tangentLine.position.copy(interpPoint.clone().add(p));
    };

    var update_binormal = function(points, interpPoint, binormalLine, t) {
      var binormal = calculate_binormal(points, t);
      var q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), binormal);
      var p = new THREE.Vector3(0, 0.5, 0).applyQuaternion(q);
      binormalLine.quaternion.copy(q);
      binormalLine.position.copy(interpPoint.clone().add(p)); 
    };


    var update_normal = function(points, interpPoint, normalLine, t) {
      var normal = calculate_normal(points, t);
      var q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), normal);
      var p = new THREE.Vector3(0, 0.5, 0).applyQuaternion(q);
      normalLine.quaternion.copy(q);
      normalLine.position.copy(interpPoint.clone().add(p)); 
    };


    // initialize top-level
    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(
      75, window.innerWidth/window.innerHeight, 0.1, 10000);
    camera.position.z = 20;

    var renderer = new THREE.WebGLRenderer({ autosize: true, antialiasing: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    var orbit = new THREE.OrbitControls(camera, renderer.domElement);

    document.body.appendChild(renderer.domElement);

    var low = -4;
    var high = 4;
    var t = 0.5;

    // initialize gui
    var gui = new dat.GUI();
    var effectController = {};
    effectController.tParam = t;
    gui.add(effectController, "tParam", 0, 1, 0.01).name("t parameter");

    // element setup
    var light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 100, 0);
    scene.add(light);

    // the control points
    var controlPoints = [
      new THREE.Vector3(low, low, low),
      new THREE.Vector3(high, low, low),
      new THREE.Vector3(high, high, low),
      new THREE.Vector3(high, high, high)
    ];

    // the first-order interpolation points
    var interpPoints1 = [
      interp_point(controlPoints[0], controlPoints[1], t),
      interp_point(controlPoints[1], controlPoints[2], t),
      interp_point(controlPoints[2], controlPoints[3], t)
    ];

    // the second-order interpolation points
    var interpPoints2 = [
        interp_point(interpPoints1[0], interpPoints1[1], t),
        interp_point(interpPoints1[1], interpPoints1[2], t)
    ];

    // the third-order interpolation point
    var interpPoints3 = [
        interp_point(interpPoints2[0], interpPoints2[1], t)
    ];
    
    // - spheres for anchor points
    var anchorSpheres = setup_spheres(
      controlPoints, 0.4,
      {
        color: 0x007f00, emissive: 0x309f30, shading: THREE.FlatShading
      },
      scene);

    // - spheres for intermediate points 1
    var interpSpheres1 = setup_spheres(
      interpPoints1, 0.2,
      { color: 0x7f0000, emissive: 0x9f3030, shading: THREE.FlatShading },
      scene);

    // - spheres for intermediate points 2
    var interpSpheres2 = setup_spheres(
      interpPoints2, 0.2,
      { color: 0x00007f, emissive: 0x30309f, shading: THREE.FlatShading },
      scene);

    // - spheres for intermediate points 3
    var interpSpheres3 = setup_spheres(
      interpPoints3, 0.2,
      { color: 0x7f007f, emissive: 0x9f309f, shading: THREE.FlatShading },
      scene);


    // - first-order lines
    for (var i = 0; i < controlPoints.length-1; ++i) {
      var mat = new THREE.LineBasicMaterial({color:0xffffff});
      var geom = new THREE.Geometry();
      geom.vertices.push(controlPoints[i], controlPoints[i+1]);
      scene.add(new THREE.Line(geom, mat));
    };

    // - second-order lines
    var interpLines1 = setup_interp_lines(
      interpPoints1, {color:0x7f0000}, scene);

    // - third-order line
    var interpLines2 = setup_interp_lines(
      interpPoints2, {color:0x00007f}, scene);

    // curve
    setup_curve(controlPoints, {color:0x7f007f}, scene);

    // tangent
    tangentLine = setup_tangent(
      { color:0x0000ab, emissive:0x3030db, shading: THREE.FlatShading }, scene);

    // binormal
    binormalLine = setup_binormal(
      { color:0xab0000, emissive:0xdb3030, shading: THREE.FlatShading }, scene);

    // normal
    normalLine = setup_normal(
      { color:0x00ab00, emissive:0x30db30, shading: THREE.FlatShading }, scene);

    // render loop
    var render = function() {
      requestAnimationFrame(render);
      
      var t = effectController.tParam;
      update_interp_points(controlPoints, interpPoints1, t);
      update_interp_spheres(interpPoints1, interpSpheres1);
      update_interp_points(interpPoints1, interpPoints2, t);
      update_interp_spheres(interpPoints2, interpSpheres2);
      update_interp_points(interpPoints2, interpPoints3, t); 
      update_interp_spheres(interpPoints3, interpSpheres3);
      update_interp_lines(interpPoints1, interpLines1);
      update_interp_lines(interpPoints2, interpLines2);
      var tangent = calculate_tangent(controlPoints, t);
      var binormal = calculate_binormal(controlPoints, tangent, t);
      update_tangent(controlPoints, interpPoints3[0], tangentLine, t);
      update_binormal(controlPoints, interpPoints3[0], binormalLine, t);
      update_normal(controlPoints, interpPoints3[0], normalLine, t);

      renderer.render(scene, camera);
    }

    render();

