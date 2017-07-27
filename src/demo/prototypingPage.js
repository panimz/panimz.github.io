(function () {
    // helpers
    var percents2rad = (Math.PI * 2) / 100;
    var rad2percents = 100.0 / (Math.PI * 2);

    var baseShapeCoeff = 1 / 100;
    var colorSetter = function (item, opts) {
        return function () {
            item.color = (opts.color);
        }
    };
    var alphaSetter = function (item, opts) {
        return function () {
            item.alpha = (opts.alpha);
        }
    };
    var blurSetter = function (item, opts) {
        return function () {
            item.blur = (opts.blur);
        }
    };
    var scaleSetter = function (item, opts) {
        return function () {
            var curr = (opts.scale * baseShapeCoeff);
            item.scale = (curr);
        }
    };
    var rotationSetter = function (item, opts) {
        return function () {
            var rotation = percents2rad * opts.rotation;
            item.rotation = (rotation);
        }
    };
    var polarPosSetter = function (item, opts) {
        return function () {
            var angle = percents2rad * opts.polarCoords.angle;
            var radius = opts.polarCoords.radius * baseShapeCoeff;
            item.polarCoords = { radius: radius, angle: angle};
        }
    }
    var layerAnimationSetter = function(item, opts) {
        return function () {
            item.localPace = opts.pace.local;
            item.centerPace = opts.pace.center;
        }
    }
    // helpers

    var container = document.getElementById("logo-container");
    var size = Math.min(container.clientWidth, container.clientHeight);
    var app = new PIXI.Application({
        transparent: true,
        width: size, 
        height: size,
        forceCanvas: false,
    });
    app.renderer.backgroundColor = 0xFFFFFF;

    container.appendChild(app.view);
    var texture = new SHLogo.LogoTexture(app.renderer, size, init);

    function init() {
        var mesh = new SHLogo.LogoMesh(texture, app, size);
        setupMesh(mesh);

        app.ticker.add(function (delta) {
            texture.update(delta);
            mesh.update(delta);
        });

        setupGui(mesh);
        setupTransitionComponent(mesh);
    }

    function setupMesh(mesh) {
        var range = { x: 0, y: 0 };
        var speed = { x: 0, y: 0 };
        mesh.setDeformer("none", range, speed);

        var distanceRange = { min: 0, range: 0 };
        var speedRange = { min: 0, range: 0 };
        mesh.setShapeDeformer(distanceRange, speedRange);
    }

    function setupTransitionComponent(mesh) {
        var component = new TransitionComponent("#tr_queue", mesh);
    }

    function setupGui(mesh) {
        var currSettings = {};
        //setup control panels
        var guiContainer = new ControlKit();
        setupMainGui(guiContainer, currSettings, mesh);
        setupLayersGui(guiContainer, currSettings, mesh);
        // setup save/load features
        setupStageDownload(mesh);
        setupStageUpload(guiContainer, currSettings, mesh);
    }

    function setupMainGui(guiContainer, currSettings, mesh) {
        setupMeshAnimGui(guiContainer, currSettings, mesh);
        setupOutlineShapeGui(guiContainer, currSettings, mesh.getShape());
        return guiContainer;
    }

    function setupMeshAnimGui(guiContainer, currSettings, mesh) {
        var guiPanel = guiContainer.addPanel({
            label: "Mesh Settings",
            align: "right",
            fixed: true,
            width: 270,
        });
        var opts = {
            movementTypes: ["none", "wave", "shake"],
            movement: "none",
            range: { x: 0, y: 0, range: [0, 3]},
            pace: { x: 0, y: 0, range: [0, 3000] },
            rotationRange: [0, 150],
            rotation: 0
        };
        var setDeformer = function () {
            mesh.setDeformer(opts.movement, opts.range, opts.pace);
        };
        var meshSection = guiPanel.addGroup({ label: "Mesh transformation"});
        var deformersSection = meshSection.addSubGroup({label: "Deformations"});
        deformersSection.addSelect(opts,
            "movementTypes",
            {
                label: "Type",
                selectTarget: "movement",
                onChange: function(idx) {
                    opts.movement = opts.movementTypes[idx];
                    setDeformer();
                },
            });
        deformersSection
            .addSlider(opts.range, "x", "range",
            {
                label: "x range",
                onFinish: setDeformer,
                step: 0.1,
            });
        deformersSection
            .addSlider(opts.pace, "x", "range",
            {
                label: "x pace (ms)",
                onFinish: setDeformer,
                step: 10,
            });
        deformersSection
            .addSlider(opts.range, "y", "range",
            {
                label: "y range",
                onFinish: setDeformer,
                step: 0.1,
            });
        deformersSection
            .addSlider(opts.pace, "y", "range",
            {
                label: "y pace (ms)",
                onFinish: setDeformer,
                step: 10,
            });
        var rotationSection = meshSection.addSubGroup({label: "Mesh rotation"});
        rotationSection.addSlider(opts, "rotation", "rotationRange",
            {
                label: "Pace (??)",
                onFinish: function () {
                    var speed = opts.rotation / 1000;
                    mesh.queueRotation(speed);
                },
                step: 1,
            });
        meshSection.addButton("Reset mesh",
            function() {
                if (mesh) {
                    mesh.reset();
                }
            });
        // store mesh settings in the root object
        currSettings["mesh"] = opts;
    }

    function setupOutlineShapeGui(guiContainer, currSettings, shape) {
        // callback builders
        var sizeSetter = function (bubble, opts) {
            return function () {
                bubble.size = opts.size;
            }
        }
        var orbitSetter = function (point, opts) {
            return function () {
                point.orbit = opts.orbit;
            }
        };
        var paceSetter = function (point, opts) {
            return function () {
                point.pace = opts.pace;
            }
        };
        var rotationSetter = function (point, opts) {
            return function () {
                point.rotation = opts.rotation;
            }
        }
        var directionSetter = function(point, opts) {
            return function() {
                point.isClockwise = opts.isClockwise;
            }
        }
        // setup shape section of the control panel
        var outlineSection = guiContainer.addPanel({
            label: "Shape Settings",
            align: "right",
            fixed: true,
            width: 270,
        });
        var shapeBase = shape.getBaseShape();
        var opts = {
            sizeRange: [0, 110],
            size: shapeBase.size,
            isApplied: true,
            antialiasingRange: [0, 10],
            antialiasing: shape.getOutlineAntialiasing(),
        };
        var updateBshSize = sizeSetter(shapeBase, opts);
        var updateAntialiasing = function() {
            shape.setOutlineAntialiasing(opts.antialiasing);
        }
        outlineSection
            .addSlider(opts, "size", "sizeRange",
            {
                label: "Size",
                onChange: updateBshSize,
                onFinish: updateBshSize,
                step: 1,
            });
        outlineSection
            .addSlider(opts, "antialiasing", "antialiasingRange",
            {
                label: "Antialiasing",
                onChange: updateAntialiasing,
                onFinish: updateAntialiasing,
                step: 1,
            });
        outlineSection.addCheckbox(opts,
            "isApplied",
            {
                label: "Apply mask",
                onChange: function() {
                    if (opts.isApplied) { shape.show(); } 
                    else { shape.hide(); }
                }
            });
        // setup controls for each outline "bubble"
        var bubbles = shape.getOutlineBubbles();
        for (var i = 0; i < bubbles.length; i++) {
            var bubble = bubbles[i];
            var pivot = bubble.pivot;
            var name = "bubble" + i;
            opts[name] = {
                id: i,
                size: bubble.size,
                sizeRange: [0, 100],
                pivot: {
                    durationRange: [0, 50000],
                    percentRange: [0, 100],
                    orbit: pivot.orbit,
                    pace: pivot.pace,
                    rotation: pivot.rotation,
                    isClockwise: pivot.isClockwise,
                },
                bubble: {
                    durationRange: [0, 50000],
                    percentRange: [0, 100],
                    orbit: bubble.orbit,
                    pace: bubble.pace,
                    rotation: bubble.rotation,
                    isClockwise: bubble.isClockwise
                }
            }
            var folderLabel = "Bubble #" + (i + 1);
            var folder = outlineSection.addGroup({label: folderLabel, enable: false});
            var updateSize = sizeSetter(bubble, opts[name]);
            folder
                .addSlider(opts[name],
                    "size",
                    "sizeRange",
                    {
                        label: "Size",
                        onChange: updateSize,
                        onFinish: updateSize,
                        step: 1,
                    });
            // setup pivot initioal position & transitions
            var pivotFolder = folder.addSubGroup({label: "Rotation pivot settings"});
            var updatePivotOrbit = orbitSetter(bubble.pivot, opts[name].pivot);
            var updatePivotPace = paceSetter(bubble.pivot, opts[name].pivot);
            var updatePivotRotation = rotationSetter(bubble.pivot, opts[name].pivot);
            var updatePivotDirection = directionSetter(bubble.pivot, opts[name].pivot);
            pivotFolder
                .addSlider(opts[name].pivot, "rotation", "percentRange",
                {
                    label: "Initial rotation",
                    onChange: updatePivotRotation,
                    onFinish: updatePivotRotation,
                    step: 1,
                });
            pivotFolder
                .addSlider(opts[name].pivot, "orbit", "percentRange",
                {
                    label: "Orbit",
                    onChange: updatePivotOrbit,
                    onFinish: updatePivotOrbit,
                    step: 1,
                });
            pivotFolder
                .addSlider(opts[name].pivot, "pace", "durationRange",
                {
                    label: "Pace (ms)",
                    onChange: updatePivotPace,
                    onFinish: updatePivotPace,
                    step: 1,
                });
            pivotFolder.addCheckbox(opts[name].pivot,
                "isClockwise",
                {
                    label: "Is Clockwise",
                    onChange: updatePivotDirection
                });
            //
            var bubbleFolder = folder.addSubGroup({label: "Bubble settings"});
            var updateOrbit = orbitSetter(bubble, opts[name].bubble);
            var updatePace = paceSetter(bubble, opts[name].bubble);
            var updateInitialRotation = rotationSetter(bubble, opts[name].bubble);
            var updateDirection = directionSetter(bubble, opts[name].bubble);
            bubbleFolder
                .addSlider(opts[name].bubble, "rotation", "percentRange",
                {
                    label: "Initial rotation",
                    onChange: updateInitialRotation,
                    onFinish: updateInitialRotation,
                    step: 1,
                });
            bubbleFolder
                .addSlider(opts[name].bubble, "orbit", "percentRange",
                {
                    label: "Orbit",
                    onChange: updateOrbit,
                    onFinish: updateOrbit,
                    step: 1,
                });
            bubbleFolder
                .addSlider(opts[name].bubble, "pace", "durationRange",
                {
                    label: "Pace (ms)",
                    onChange: updatePace,
                    onFinish: updatePace,
                    step: 1,
                });
            bubbleFolder.addCheckbox(opts[name].bubble,
                "isClockwise",
                {
                    label: "Is Clockwise",
                    onChange: updateDirection
                });
        }
        currSettings["shape"] = opts;
    }

    function setupLayersGui(guiContainer, currSettings, mesh) {

        var opts = {};
        var layers = texture.layers;
        var shape = mesh.getShape();
        var sizeRoundingCoeff = 1.01;
        // specify baseShapeCoeff
        baseShapeCoeff = (shape.getBaseShapeSize() * sizeRoundingCoeff) / 100;
        
        // setup control panel
        var gui = guiContainer.addPanel({
            label: "Texture Settings",
            align: "right",
            fixed: true,
            width: 200,
        });
        var show = true;
        for (var layer in layers) {
            var curr = layers[layer];
            var coords = curr.polarCoords;
            opts[layer] = {
                percentRange: [0, 100],
                scaleRange: [0, 500],
                blurRange: [0, 50],
                blur: curr.blur,
                alpha: curr.alpha,
                color: curr.color.toString(),
                rotation: rad2percents * curr.rotation,
                scale: curr.scale / baseShapeCoeff,
                polarCoords: {
                    angle: rad2percents * coords.angle,
                    radius: coords.radius / baseShapeCoeff,
                    percentRange: [0, 100]
                },
                pace: {
                    center: curr.centerPace,
                    local: curr.localPace, 
                    range: [-3000, 3000]
                },
            };
            var updateColor = colorSetter(curr, opts[layer]);
            var updateAlpha = alphaSetter(curr, opts[layer]);
            var updateBlur = blurSetter(curr, opts[layer]);
            var updateScale = scaleSetter(curr, opts[layer]);
            var updateRotation = rotationSetter(curr, opts[layer]);
            var updatePolarCoords = polarPosSetter(curr, opts[layer]);
            var updateAnimation = layerAnimationSetter(curr, opts[layer]);
            var sectionName = "Layer " + layer;
            var section = gui.addGroup({label: sectionName, enable: show});
            section.addColor(opts[layer],
                "color",
                {
                    label: "Color",
                    colorMode: "hex",
                    onChange: updateColor,
                });
            section
               .addSlider(opts[layer], "alpha", "percentRange",
               {
                   label: "Alpha",
                   onChange: updateAlpha,
                   onFinish: updateAlpha,
                   step: 1,
               });
            section
               .addSlider(opts[layer], "scale", "scaleRange",
               {
                   label: "Scale",
                   onChange: updateScale,
                   onFinish: updateScale,
                   step: 1,
            });
            section
               .addSlider(opts[layer], "blur", "blurRange",
               {
                    label: "Blur",
                    onChange: updateBlur,
                    onFinish: updateBlur,
                    step: 1,
                });
            var selfRotation = section.addSubGroup({ label: "Self rotation" });
            selfRotation
               .addSlider(opts[layer], "rotation", "percentRange",
               {
                   label: "Rotation",
                   onChange: updateRotation,
                   onFinish: updateRotation,
                   step: 1,
                });
       
            selfRotation
              .addSlider(opts[layer].pace, "local", "range",
              {
                label: "Pace",
                onChange: updateAnimation,
                onFinish: updateAnimation,
                step: 1,
            });
            var centerRotation = section.addSubGroup({ label: "Centered rotation" });
            centerRotation
               .addSlider(opts[layer].polarCoords, "radius", "percentRange",
               {
                   label: "Radius",
                   onChange: updatePolarCoords,
                   onFinish: updatePolarCoords,
                   step: 1,
               });
            centerRotation
              .addSlider(opts[layer].polarCoords, "angle", "percentRange",
              {
                  label: "Angle",
                  onChange: updatePolarCoords,
                  onFinish: updatePolarCoords,
                  step: 1,
                });
            centerRotation
              .addSlider(opts[layer].pace, "center", "range",
              {
                label: "Pace",
                onChange: updateAnimation,
                onFinish: updateAnimation,
                step: 1,
            });
            if (show) { show = false; }
        }
        currSettings["texture"] = opts;
        return gui;
    }

    function setupStageDownload(mesh) {
        var saveStageForm = document.getElementById("save-stage-form"),
            stageName = document.getElementById("stage-name-input");
        saveStageForm.addEventListener("submit", function (event) {
            event.preventDefault();
            console.log("save stage...");
            var settings = mesh.getState();
            var plainSettings = JSON.stringify(settings);
            var blob = new Blob([plainSettings], { type:"application:json" });
            var fileName = (stageName.value || stageName.placeholder) + ".json";
            saveAs(blob, fileName);
        }, false);
    }
   
    function setupStageUpload(guiContainer, originSettings, mesh) {
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
                var stageSettings = JSON.parse(output);
                mesh.setState(stageSettings);
                updateGui(guiContainer, originSettings, stageSettings);
            };
            reader.readAsText(stageFile);
        });
    }

    function updateGui(guiContainer, originSettings, stageSettings) {
        mergeDeep(originSettings, stageSettings);
        rescaleSettings(originSettings);
        guiContainer._panels.forEach(function(panel) {
            panel._groups.forEach(function(group) {
                group._components.forEach(function (component) {
                    if (typeof (component._applySelected) === "function") {
                        var idx = component._values.indexOf(originSettings.mesh.movement);
                        component.setValue(idx);
                    }
                    else if (typeof (component.applyValue) === "function") {
                        component.applyValue();
                    }
                });
            });
        });
    }

    function rescaleSettings(settings) {
        for (var key in settings.texture) {
            var item = settings.texture[key];
            if (typeof (item) !== "object") {
                return;
            }

            if (item.rotation) {
                item.rotation *= rad2percents;
            }
            if (item.scale) {
                item.scale /= baseShapeCoeff;
            }
            if (item.polarCoords) {
                item.polarCoords.angle *= rad2percents;
                item.polarCoords.radius /= baseShapeCoeff;
            }
        }
    }

})();