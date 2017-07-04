(function () {

    var container = document.getElementById("logo-container");
    var size = Math.min(container.clientWidth, container.clientHeight);
    var app = new PIXI.Application({ transparent: false, width: size, height: size });
    app.renderer.backgroundColor = 0xFFFFFF;

    container.appendChild(app.view);
    var texture = new SHLogo.LogoTexture(app.renderer, size, init);

    function init() {
        var rt = texture.get();
        var mesh = new SHLogo.LogoMesh(rt, app, size);
        setupMesh(mesh);

        app.ticker.add(function (delta) {
            texture.update();
            mesh.update(delta);
        });

        // setup gui controls
        var currSettings = {};
        var mainGui = setupMainGui(currSettings, mesh);
        var textureGui = setupLayersGui(currSettings, mesh);
        setupStageDownload(currSettings);
        setupStageUpload(currSettings, mainGui, textureGui);
    }

    function setupMesh(mesh) {
        var range = { x: 0, y: 0 };
        var speed = { x: 0, y: 0 };
        mesh.setDeformer("none", range, speed);

        var distanceRange = { min: 0, range: 0 };
        var speedRange = { min: 0, range: 0 };
        mesh.setShapeDeformer(distanceRange, speedRange);
    }

    function setupMainGui(currSettings, mesh) {
        var gui = new dat.GUI();
        setupMeshAnimGui(gui, currSettings, mesh);
        setupMeshShapeGui(gui, currSettings, mesh.getShape());
        return gui;
    }

    function setupMeshAnimGui(gui, currSettings, mesh) {
        var movements = {
            wave: "wave",
            shake: "shake",
            none: "none"
        };
        var opts = {
            reset: function () {
                if (mesh) {
                    mesh.reset();
                }
            },
            changeShape: function () {
                if (mesh) {
                    mesh.shape.reset();
                }
            },
            movement: "none",
            range: { x: 0, y: 0 },
            period: { x: 0, y: 0 },
            rotation: 0
        };
        var setDeformer = function () {
            mesh.setDeformer(opts.movement, opts.range, opts.period);
        };
        var meshSection = gui.addFolder("Mesh transformation");
        var deformersSection = meshSection.addFolder("Deformations");
        deformersSection.add(opts, 'movement', movements)
            .name("Type")
            .onChange(setDeformer).listen();
        deformersSection.add(opts.range, "x").min(0).max(3).step(0.01).name("x range")
            .onChange(setDeformer).listen();
        deformersSection.add(opts.period, "x").min(0).max(3000).step(10).name("x pace (ms)")
            .onChange(setDeformer).listen();
        deformersSection.add(opts.range, "y").min(0).max(3).step(0.01).name("y range")
            .onChange(setDeformer).listen();
        deformersSection.add(opts.period, "y").min(0).max(3000).step(10).name("y pace (ms)")
            .onChange(setDeformer).listen();
        var rotationSection = meshSection.addFolder("Mesh rotation");
        rotationSection.add(opts, "rotation")
            .name("Pace (ms)")
            .min(0).max(150).step(1)
            .onChange(function (val) {
                var speed = val / 1000;
                mesh.queueRotation(speed);
            }).listen();
        meshSection.add(opts, "reset").name("Reset mesh");
        meshSection.open();
        //
        currSettings["mesh"] = opts;
    }

    function setupMeshShapeGui(gui, currSettings, shape) {
        //
        var sizeSetter = function (bubble) {
            return function (size) {
                bubble.size = size;
            }
        }
        var orbitSetter = function (point) {
            return function (orbit) {
                point.orbit = orbit;
            }
        };
        var paceSetter = function (point) {
            return function (pace) {
                point.pace = (pace);
            }
        };
        var rotationSetter = function (point) {
            return function (angle) {
                point.rotation = angle;
            }
        }
        var directionSetter = function(point) {
            return function(isClockwise) {
                point.direction = isClockwise ? -1 : 1;
            }
        }
        //
        var outlineSection = gui.addFolder("Outline transformation");
        var shapeBase = shape.getBaseShape();
        var opts = {
            baseSize: shapeBase.size,
            isApplied: true,
        };
        var updateBshSize = sizeSetter(shapeBase);
        outlineSection.add(opts, "baseSize")
            .name("Size")
            .min(0).max(110).step(1)
            .onChange(updateBshSize)
            .listen();
        outlineSection.add(opts, "isApplied")
            .name("Apply the mask")
            .onChange(function (isApplied) {
                if (isApplied) {
                    shape.show();
                } else {
                    shape.hide();
                }
            });
        //
        var bubbles = shape.getOutlineBubbles();
        for (var i = 0; i < bubbles.length; i++) {
            var bubble = bubbles[i];
            var pivot = bubble.pivot;
            var name = "bubble" + i;
            opts[name] = {
                id: i,
                size: bubble.size,
                isHidding: false,
                pivot: {
                    orbit: pivot.orbit,
                    pace: pivot.pace,
                    rotation: pivot.rotation,
                    isClockwise: pivot.isClockwise(),
                },
                bubble: {
                    orbit: bubble.orbit,
                    pace: bubble.pace,
                    rotation: bubble.rotation,
                    isClockwise: bubble.isClockwise()
                }
            }
            var folder = outlineSection.addFolder("Bubble #" + (i + 1));
            var updatesize = sizeSetter(bubble);
            folder.add(opts[name], "size")
                .name("Size")
                .min(0).max(100).step(1)
                .min(0).max(100).step(1)
                .onChange(updatesize).listen();
            //
            var pivotFolder = folder.addFolder("Rotation pivot settings");
            var updatePivotOrbit = orbitSetter(bubble.pivot);
            var updatePivotPace = paceSetter(bubble.pivot);
            var updatePivotRotation = rotationSetter(bubble.pivot);
            var updatePivotDirection = directionSetter(bubble.pivot);
            pivotFolder.add(opts[name].pivot, "rotation")
                .name("Initial rotation")
                .min(0).max(100).step(1)
                .onChange(updatePivotRotation).listen();
            pivotFolder.add(opts[name].pivot, "orbit")
                .name("Orbit")
                .min(0).max(100).step(1)
                .onChange(updatePivotOrbit).listen();
            pivotFolder.add(opts[name].pivot, "pace")
                .name("Pace (ms)")
                .min(0).max(50000).step(10)
                .onChange(updatePivotPace).listen();
            pivotFolder.add(opts[name].bubble, "isClockwise")
                .name("Is Clockwise")
                .onChange(updatePivotDirection).listen();
            //
            var bubbleFolder = folder.addFolder("Bubble settings");
            var updateOrbit = orbitSetter(bubble);
            var updatePace = paceSetter(bubble);
            var updateInitialRotation = rotationSetter(bubble);
            var updateDirection = directionSetter(bubble);
            bubbleFolder.add(opts[name].bubble, "rotation")
                .name("Initial rotation")
                .min(0).max(100).step(1)
                .onChange(updateInitialRotation).listen();
            bubbleFolder.add(opts[name].bubble, "orbit")
                .name("Orbit")
                .min(0).max(100).step(1)
                .onChange(updateOrbit).listen();
            bubbleFolder.add(opts[name].bubble, "pace")
                .name("Pace (ms)")
                .min(0).max(50000).step(10)
                .onChange(updatePace).listen();
            bubbleFolder.add(opts[name].bubble, "isClockwise")
                .name("Is Clockwise")
                .onChange(updateDirection).listen();
        }
        outlineSection.open();
        currSettings["shape"] = opts;
    }

    function setupLayersGui(currSettings, mesh) {
        var opts = {};
        var layers = texture.layers;
        var gui = new dat.GUI();
        var shape = mesh.getShape();
        var baseShapeCoeff = shape.getBaseShapeSize() / 100;
        var colorSetter = function (item) {
            return function (color) {
                item.color(color);
            }
        };
        var alphaSetter = function (item) {
            return function (alpha) {
                var a = alpha / 100;
                item.alpha(a);
            }
        };
        var scaleSetter = function (item) {
            return function (scale) {
                var curr = (scale * baseShapeCoeff);
                item.scale(curr);
            }
        };
        var rotationSetter = function (item) {
            return function (angle) {
                var rotation = lPercents2Rad(angle);
                item.rotation(rotation);
            }
        };

        var polarPosSetter = function(item, opts) {
            return function () {
                var angle = lPercents2Rad(opts.pos.angle);
                var radius = opts.pos.radius * baseShapeCoeff;
                item.polarCoords(radius, angle);
            }
        }

        var show = true;
        for (var layer in layers) {
            var curr = layers[layer];
            var coords = curr.polarCoords();
            opts[layer] = {
                alpha: Math.round(curr.alpha() * 100),
                color: curr.color().toHex(),
                rotation: lRad2Percents(curr.rotation()),
                scale: Math.round(curr.scale() / baseShapeCoeff),
                pos: {
                    angle: lRad2Percents(coords.angle),
                    radius: Math.round(coords.radius / baseShapeCoeff)
                },
            };
            var updateColor = colorSetter(curr);
            var updateAlpha = alphaSetter(curr);
            var updateScale = scaleSetter(curr);
            var updateRotation = rotationSetter(curr);
            var updatePolarCoords = polarPosSetter(curr, opts[layer]);
            var section = gui.addFolder("Layer " + layer);
            section.addColor(opts[layer], "color")
                .onChange(updateColor)
                .listen();
            section.add(opts[layer], "alpha")
                .min(0).max(100).step(1)
                .onChange(updateAlpha)
                .listen();
            section.add(opts[layer], "scale")
                .min(10).max(500).step(1)
                .onChange(updateScale)
                .listen();
            section.add(opts[layer], "rotation")
                .min(0).max(100).step(1)
                .onChange(updateRotation)
                .listen();
            section.add(opts[layer].pos, "angle")
                .min(0).max(100).step(1)
                .onChange(updatePolarCoords)
                .listen();
            section.add(opts[layer].pos, "radius")
                .min(0).max(100).step(1)
                .onChange(updatePolarCoords)
                .listen();
            if (show) {
                section.open();
                show = false;
            }
        }
        currSettings["texture"] = opts;
        return gui;
    }

    function setupStageDownload(settings) {
        //todo check support

        var saveStageForm = document.getElementById("save-stage-form"),
            stageName = document.getElementById("stage-name-input");

        saveStageForm.addEventListener("submit", function (event) {
            event.preventDefault();
            console.log("save stage...");
            var plainSettings = JSON.stringify(settings);
            var blob = new Blob([plainSettings], { type: "text/plain;charset=" + document.characterSet });
            var fileName = (stageName.value || stageName.placeholder) + ".txt";
            saveAs(blob, fileName);
        }, false);
    }

    function setupStageUpload(originSettings, mainGui, textureGui) {
        // todo check support
        var reader = new FileReader();
        var loadStageInput = document.getElementById("load-stage-input");
        loadStageInput.addEventListener("change", function (event) {
            event.preventDefault();
            console.log("upload stage...");
            if (!event.target.files || !event.target.files.length) {
                return;
            }
            var stageFile = event.target.files[0];
            reader.onload = function (e) {
                var output = e.target.result;
                var uploadSettings = JSON.parse(output);
                mergeDeep(originSettings, uploadSettings);
                refreshSettings(mainGui);
                refreshSettings(textureGui);
            };
            reader.readAsText(stageFile);
        });
    }

    function refreshSettings(gui) {
        for (var i = 0; i < gui.__controllers.length; i++) {
            if (typeof (gui.__controllers[i].__onChange) === "function") {
                var value = gui.__controllers[i].getValue();
                gui.__controllers[i].__onChange(value);
            }
        }
        for (var key in gui.__folders) {
            refreshSettings(gui.__folders[key]);
        }
    }

    function isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    function mergeDeep(target, source) {

        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }
                    mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
    }

    function lRad2Percents(angle) {
        var res = Math.round((angle * 100) / (Math.PI * 2));
        if (res >= 100) { res -= 100; }
        if (res < 0) { res += 100; }
        return res;
    }

    function lPercents2Rad(angle) {
        return (Math.PI * 2 * angle)/ 100;
    }

})();