(function () {
    // helpers
    var percents2rad = (Math.PI * 2) / 100;
    var rad2percents = 100.0 / (Math.PI * 2);

    var sizeRoundingCoeff = 1.01;
    var baseShapeCoeff = 1 / 100;
  
    // helpers

    var container = document.getElementById("logo-container");
    var size = Math.min(container.clientWidth, container.clientHeight);
    var app = new PIXI.Application({
        transparent: true,
        width: size, 
        height: size,
        forceCanvas: true,
    });

    app.renderer.backgroundColor = 0xFFFFFF;

    container.appendChild(app.view);
    var texture = new SHLogo.LogoTexture(app.renderer, size, init);

    function init() {
        var mesh = new SHLogo.LogoMesh(texture, app, size);

        app.ticker.add(function (delta) {
            texture.update(delta);
            mesh.update(delta);
        });

        setupGui(mesh);
        setupTransitionComponent(mesh);
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
        var guiPanel = guiContainer.addPanel({
            label: "Mesh & Shape",
            align: "right",
            fixed: true,
            width: 270,
        });
        setupMeshAnimGui(guiPanel, currSettings, mesh);
        setupOutlineShapeGui(guiPanel, currSettings, mesh.getShape());
        return guiContainer;
    }

    function setupMeshAnimGui(guiPanel, currSettings, mesh) {
        var currMovement = mesh.getState().mesh;
        var opts = {
            movementTypes: ["none", "wave", "shake"],
            movement: -1,
            devRange: [0, 3],
            paceRange: [0, 6000],
            xRange: currMovement.xRange,
            yRange: currMovement.yRange,
            xPace: currMovement.xPace,
            yPace: currMovement.yPace
        };
        opts.movement = opts.movementTypes.indexOf(currMovement.movement);
        var setDeformer = function () { mesh.movement.setState(opts);};
        var meshSection = guiPanel.addGroup({ label: "Mesh Animation Settings" });
        meshSection
            .addSelect(opts,
                "movementTypes",
                {
                    label: "Type",
                    target: "movement",
                    onChange: function (idx) {
                        opts.movement = opts.movementTypes[idx];
                        setDeformer();
                    }
            });
        meshSection
            .addSlider(opts, "xRange", "devRange",
            {
                label: "x range",
                onFinish: setDeformer,
                step: 0.1,
            });
        meshSection
            .addSlider(opts, "xPace", "paceRange",
            {
                label: "x pace (ms)",
                onFinish: setDeformer,
                step: 10,
            });
        meshSection
            .addSlider(opts, "yRange", "devRange",
            {
                label: "y range",
                onFinish: setDeformer,
                step: 0.1,
            });
        meshSection
            .addSlider(opts, "yPace", "paceRange",
            {
                label: "y pace (ms)",
                onFinish: setDeformer,
                step: 10
            });
       
        // store mesh settings in the root object
        currSettings["mesh"] = opts;
    }

    function setupOutlineShapeGui(guiPanel, currSettings, shape) {
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
                point.initRotation = opts.initRotation;
            }
        }
        // setup shape section of the control panel
        var outlineSection = guiPanel.addGroup({ label: "Shape Settings" });
        var shapeBase = shape.getBaseShape();
        var opts = {
            sizeRange: [0, 110],
            size: shapeBase.size,
            isApplied: true,
        };
        var updateBshSize = sizeSetter(shapeBase, opts);
        outlineSection
            .addSlider(opts, "size", "sizeRange",
            {
                label: "Size",
                onChange: updateBshSize,
                onFinish: updateBshSize,
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
                    paceRange: [-60000, 60000],
                    percentRange: [0, 100],
                    orbit: pivot.orbit,
                    pace: pivot.pace,
                    initRotation: pivot.initRotation
                },
                bubble: {
                    paceRange: [-60000, 60000],
                    percentRange: [0, 100],
                    orbit: bubble.orbit,
                    pace: bubble.pace,
                    initRotation: bubble.initRotation
                }
            }
            var folderLabel = "Bubble #" + (i + 1);
            var folder = guiPanel.addGroup({ label: folderLabel, enable: false });
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
            pivotFolder
                .addSlider(opts[name].pivot, "initRotation", "percentRange",
                {
                    label: "Init rotation",
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
                .addSlider(opts[name].pivot, "pace", "paceRange",
                {
                    label: "Pace (ms)",
                    onChange: updatePivotPace,
                    onFinish: updatePivotPace,
                    step: 1,
                });
            var bubbleFolder = folder.addSubGroup({label: "Bubble settings"});
            var updateOrbit = orbitSetter(bubble, opts[name].bubble);
            var updatePace = paceSetter(bubble, opts[name].bubble);
            var updateInitRotation = rotationSetter(bubble, opts[name].bubble);
            bubbleFolder
                .addSlider(opts[name].bubble, "initRotation", "percentRange",
                {
                    label: "Init rotation",
                    onChange: updateInitRotation,
                    onFinish: updateInitRotation,
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
                .addSlider(opts[name].bubble, "pace", "paceRange",
                {
                    label: "Pace (ms)",
                    onChange: updatePace,
                    onFinish: updatePace,
                    step: 1,
                });
        }
        currSettings["shape"] = opts;
    }

    function setupLayersGui(guiContainer, currSettings, mesh) {

        //
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
                var rotation = percents2rad * opts.initRotation;
                item.initRotation = (rotation);
            }
        };
        var paceSetter = function(item, opts) {
            return function () {
                item.pace = (opts.pace);
            }
        }
        var pivotOrbitSetter = function (point, opts) {
            return function () {
                point.orbit = opts.orbit;
            }
        };
        var pivotPaceSetter = function (point, opts) {
            return function () {
                point.pace = opts.pace; 
            }
        };
        var pivotRotationSetter = function (point, opts) {
            return function () {
                point.initRotation = opts.initRotation;
            }
        }

        var opts = {};
        var layers = texture.layers;
        var shape = mesh.getShape();
        // specify baseShapeCoeff
        baseShapeCoeff = (shape.getBaseShapeSize() * sizeRoundingCoeff) / 100;
        
        // setup control panel
        var gui = guiContainer.addPanel({
            label: "Texture Settings",
            align: "right",
            fixed: true,
            width: 200,
        });
        for (var layer in layers)
        {
            var curr = layers[layer];
            opts[layer] = {
                percentRange: [0, 100],
                paceRange: [-60000, 60000],
                scaleRange: [0, 500],
                blurRange: [0, 50],
                blur: curr.blur,
                alpha: curr.alpha,
                color: curr.color.toString(),
                scale: curr.scale / baseShapeCoeff,
                initRotation: rad2percents * curr.initRotation,
                pace: curr.pace,
                pivot: {
                    paceRange: [-60000, 60000],
                    percentRange: [0, 100],
                    orbit: curr.pivot.orbit,
                    pace: curr.pivot.pace,
                    initRotation: curr.pivot.initRotation
                }
            };
            var updateColor = colorSetter(curr, opts[layer]);
            var updateAlpha = alphaSetter(curr, opts[layer]);
            var updateBlur = blurSetter(curr, opts[layer]);
            var updateScale = scaleSetter(curr, opts[layer]);
            var sectionName = "Layer " + layer;
            var section = gui.addGroup({
                label: sectionName,
                enable: false
            });
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
            var updateRotation = rotationSetter(curr, opts[layer]);
            var updateSelfPace = paceSetter(curr, opts[layer]);
            selfRotation
               .addSlider(opts[layer], "initRotation", "percentRange",
               {
                   label: "Init Angle",
                   onChange: updateRotation,
                   onFinish: updateRotation,
                   step: 1,
                });
       
            selfRotation
              .addSlider(opts[layer], "pace", "paceRange",
              {
                label: "Pace",
                onChange: updateSelfPace,
                onFinish: updateSelfPace,
                step: 1,
            });
            var centerRotation = section.addSubGroup({ label: "Centered rotation" });
            var updatePivotOrbit = pivotOrbitSetter(curr.pivot, opts[layer].pivot);
            var updatePivotPace = pivotPaceSetter(curr.pivot, opts[layer].pivot);
            var updatePivotRotation = pivotRotationSetter(curr.pivot, opts[layer].pivot);
            centerRotation
                .addSlider(opts[layer].pivot, "initRotation", "percentRange",
                {
                    label: "Init Angle",
                    onChange: updatePivotRotation,
                    onFinish: updatePivotRotation,
                    step: 1,
                });
            centerRotation
                .addSlider(opts[layer].pivot, "orbit", "percentRange",
                {
                    label: "Orbit",
                    onChange: updatePivotOrbit,
                    onFinish: updatePivotOrbit,
                    step: 1,
                });
            centerRotation
                .addSlider(opts[layer].pivot, "pace", "paceRange",
                {
                    label: "Pace",
                    onChange: updatePivotPace,
                    onFinish: updatePivotPace,
                    step: 1
                });
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
            console.log("stage has been saved");
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
            console.log("stage has been uploadd");
        });
    }

    function updateGui(guiContainer, originSettings, stageSettings) {
        mergeSettings(originSettings, stageSettings);
        rescaleSettings(originSettings);
        guiContainer._panels.forEach(function(panel) {
            panel._groups.forEach(function (group) {
                group._components.forEach(function (component) {
                    var key = component._targetKey || component._key;
                    var curr = component._obj[key];
                    if (typeof (component._applySelected) === "function") {
                        component.setValue(curr);
                    } else {
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
            if (item.initRotation) {
                item.initRotation *= rad2percents;
            }
            if (item.scale) {
                item.scale /= baseShapeCoeff;
            }
        }
    }

    function mergeSettings(target, source) {
        mergeMesh(target.mesh, source.mesh);
        mergeShape(target.shape, source.shape);
        mergeTexture(target.texture, source.texture);
    }

    function mergeMesh(target, source) {
        if (!target || !source) {
            return;
        }
        for (var key in source) {
            if (target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }

    function mergeShape(target, source) {
        target.isApplied = true;
        target.size = source.mainSize;
        for (var i = 0; i < source.bubbles.length; i++) {
            var key = "bubble" + i;
            if (!target.hasOwnProperty(key)) { continue; }
            var bubble = source.bubbles[i];
            mergeDeep(target[key], bubble);
        }
    }

    function mergeTexture(target, source) {
        for (var layer in target) {
            if (!source.hasOwnProperty(layer)) {
                continue;
            }
            var currSource = source[layer];
            var currTarget = target[layer];
            for (var key in currTarget) {
                if (!currSource.hasOwnProperty(key)) { continue; }
                if (key === "pivot") {
                    currTarget.pivot.orbit = currSource.pivot.orbit;
                    currTarget.pivot.initRotation = currSource.pivot.initRotation;
                    currTarget.pivot.pace = currSource.pivot.pace;
                }
                currTarget[key] = currSource[key];
            }
            currTarget.pace = convertSpeedPace(currSource.speed);
        }
        console.log(target);
    }

    function convertSpeedPace(origin) {
        return !origin ? 0 : (100 * Math.PI) / (origin * 3);
    }

})();