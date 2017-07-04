(function (window, PIXI) {

    var app = new PIXI.Application({ transparent: false });
    app.renderer.backgroundColor = 0xFFFFFF;

    document.body.appendChild(app.view);
    var size = { width: 300, height: 300 };
    var texture = new SHLogo.LogoTexture(app.renderer, size, init);

    function init() {
        var rt = texture.get();
        var mesh = new SHLogo.LogoMesh(rt, self.app, 300);
        setupMesh(mesh);
        setupGUI();
        app.ticker.add(function (delta) {
            texture.update();
            mesh.update(delta);
        });
    }

    function setupMesh(mesh) {
        var range = { x: 1.5, y: 1.4 };
        var speed = { x: 0.08, y: 0.12 };
        var rotationSpeed = 0.0005;
        mesh.queueRotation(rotationSpeed);
        mesh.setDeformer("shake", range, speed);

        var distanceRange = { min: 0.4, range: 0.2 };
        var speedRange = { min: 3, range: 1 };
        mesh.setShapeDeformer(distanceRange, speedRange);
    }

    function setupGui() {
        
        var opt = {
            general : {
                blendMode: PIXI.BLEND_MODES.NORMAL,
                baseColor: 0xFFFFFF,
            }
        }

    }

    function name(parameters) {
        var opts = {
            //general
            blendMode: PIXI.BLEND_MODES.NORMAL,
            baseColor: 0xFFFFFF,
            // layers
            blueAlpha: 1,
            blueRotation: 0,
            blueScale: 1,
            blueOrder: 0,
            greenAlpha: 1,
            greenRotation: Math.PI * 2 * (1 / 5),
            greenScale: 1,
            greenOrder: 1,
            purpleAlpha: 1,
            purpleRotation: Math.PI * 2 * (2 / 5),
            purpleScale: 1,
            purpleOrder: 2,
            tealAlpha: 4,
            tealRotation: Math.PI * 2 * (3 / 5),
            tealScale: 1,
            tealOrder: 3,
            yellowAlpha: 1,
            yellowRotation: Math.PI * 2 * (4 / 5),
            yellowScale: 1,
            yellowOrder: 4
        }



        // gui
        var gui = new dat.GUI();

        var generalSection = gui.addFolder("General Settings");
        /*
        gui.add(opts, 'blendMode',
            {
                Normal: PIXI.BLEND_MODES.NORMAL,
                Add: PIXI.BLEND_MODES.ADD,
                Multiply: PIXI.BLEND_MODES.MULTIPLY,
                Screen: PIXI.BLEND_MODES.SCREEN
            })
            .name("Blend mode")
            .onChange(function (mode) {
                texture.setBlendMode(mode);
            });*/

        gui.addColor(opts, "baseColor")
            .name("Base color")
            .onChange(function (color) {
                texture.setBaseColor(color);
            });

        generalSection.open();

        var blueSection = gui.addFolder("Blue layer");
        blueSection.add(opts, "blueAlpha")
            .name("Alpha")
            .min(0).max(1).step(0.001)
            .onChange(function (value) {
                texture.setAlpha("blue", value);
            });
        blueSection.add(opts, "blueRotation")
            .name("Rotation")
            .min(0).max(Math.PI * 2).step(0.001)
            .onChange(function (value) {
                texture.setRotation("blue", value);
            });
        blueSection.add(opts, "blueScale")
            .name("Scale")
            .min(1).max(4).step(0.001)
            .onChange(function (value) {
                texture.setScale("blue", value);
            });
        blueSection.open();

        var greenSection = gui.addFolder("Green layer");
        greenSection.add(opts, "greenAlpha")
            .name("Alpha")
            .min(0).max(1).step(0.001)
            .onChange(function (value) {
                texture.setAlpha("green", value);
            });
        greenSection.add(opts, "greenRotation")
            .name("Rotation")
            .min(0).max(Math.PI * 2).step(0.001)
            .onChange(function (value) {
                texture.setRotation("green", value);
            });
        greenSection.add(opts, "greenScale")
            .name("Scale")
            .min(1).max(4).step(0.001)
            .onChange(function (value) {
                texture.setScale("green", value);
            });
        greenSection.open();

        var purpleSection = gui.addFolder("Purple layer");
        purpleSection.add(opts, "purpleAlpha")
            .name("Alpha")
            .min(0).max(1).step(0.001)
            .onChange(function (value) {
                texture.setAlpha("purple", value);
            });
        purpleSection.add(opts, "purpleRotation")
            .name("Rotation")
            .min(0).max(Math.PI * 2).step(0.001)
            .onChange(function (value) {
                texture.setRotation("purple", value);
            });
        purpleSection.add(opts, "purpleScale")
            .name("Scale")
            .min(1).max(4).step(0.001)
            .onChange(function (value) {
                texture.setScale("purple", value);
            });
        purpleSection.open();

        var tealSection = gui.addFolder("Teal layer");
        tealSection.add(opts, "tealAlpha")
            .name("Alpha")
            .min(0).max(1).step(0.001)
            .onChange(function (value) {
                texture.setAlpha("teal", value);
            });
        tealSection.add(opts, "tealRotation")
            .name("Rotation")
            .min(0).max(Math.PI * 2).step(0.001)
            .onChange(function (value) {
                texture.setRotation("teal", value);
            });
        tealSection.add(opts, "tealScale")
            .name("Scale")
            .min(1).max(4).step(0.001)
            .onChange(function (value) {
                texture.setScale("teal", value);
            });
        tealSection.open();

        var yellowSection = gui.addFolder("Yellow layer");
        yellowSection.add(opts, "yellowAlpha")
            .name("Alpha")
            .min(0).max(1).step(0.001)
            .onChange(function (value) {
                texture.setAlpha("yellow", value);
            });
        yellowSection.add(opts, "yellowRotation")
            .name("Rotation")
            .min(0).max(Math.PI * 2).step(0.001)
            .onChange(function (value) {
                texture.setRotation("yellow", value);
            });
        yellowSection.add(opts, "yellowScale")
            .name("Scale")
            .min(1).max(4).step(0.001)
            .onChange(function (value) {
                texture.setScale("yellow", value);
            });
        yellowSection.open();
    }



})(window, PIXI)