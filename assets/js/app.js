const MAX_WIDTH = 720;
const MAX_HEIGHT = 720;
const width = MAX_WIDTH;
const height = MAX_HEIGHT;

const PROFILE_IMG_SOURCE = 'assets/img/profile_placeholder.jpg';
const LOGO_IMG_SOURCE = 'assets/img/logo_neotvr.svg';
const ZOOM_IMG_SOURCE = 'assets/img/zoom.svg';

const items = {};

// Prepare stage

const stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height,
});

const layer = new Konva.Layer();
stage.add(layer);

createZoomImg();
// Transformers
const transformProfile = createProfileTransformer();
const transformLogo = createLogoTransformer();

// Images
const profileImgObj = new Image();
const profileImg = createProfileImg();

profileImg.on('transform', () => {
    applyCrop('center-middle');
})
createLogoImg();
// Append layers
layer.add(profileImg);
layer.add(transformProfile);
layer.add(transformLogo);
layer.batchDraw();
layer.draw();

// Factories

function createProfileTransformer() {
    return new Konva.Transformer({
        ignoreStroke: true,
        shouldOverdrawWholeArea: true,
        anchorStrokeWidth: 5,
        anchorStroke: 'rgba(255,255,255,0.39)',
        borderStroke: 'gray',
        keepRatio: true,
        boundBoxFunc: function (oldBoundBox, newBoundBox) {
            // "boundBox" is an object with
            // x, y, width, height and rotation properties
            // transformer tool will try to fit nodes into that box

            // the logic is simple, if new width is too big
            // we will return previous state
            if (Math.abs(newBoundBox.width) > MAX_WIDTH) {
                return oldBoundBox;
            }

            return newBoundBox;
        },
    });
}

function createLogoTransformer() {
    return new Konva.Transformer({
        ignoreStroke: true,
        shouldOverdrawWholeArea: false,
        anchorStrokeWidth: 20,
        anchorStroke: 'rgba(255,255,255,0.39)',
        borderStroke: 'gray',
        // borderStrokeWidth: '5',
        boundBoxFunc: function (oldBoundBox, newBoundBox) {
            // "boundBox" is an object with
            // x, y, width, height and rotation properties
            // transformer tool will try to fit nodes into that box

            // the logic is simple, if new width is too big
            // we will return previous state
            if (Math.abs(newBoundBox.width) > MAX_WIDTH) {
                return oldBoundBox;
            }

            return newBoundBox;
        },
    });
}

function createProfileImg() {
    profileImgObj.src = PROFILE_IMG_SOURCE;

    const profileImg = new Konva.Image({
        x: 0,
        y: 0,
        draggable: true,
        dragOnTop: false,
        name: 'profile',
        image: profileImgObj,
    });

    transformProfile.nodes([profileImg]);
    items.profileImg = profileImg;
    return profileImg;
}

function createLogoImg() {
    Konva.Image.fromURL(LOGO_IMG_SOURCE, (logoImg) => {
        layer.add(logoImg);
        logoImg.setAttrs({
            // Right corner
            x: 213,
            y: 150,
            width: 285,
            height: 310,
            draggable: true,
            dragOnTop: true,

        });
        transformLogo.nodes([logoImg]);
        items.logoImg = logoImg;
    });
}
function createZoomImg() {
    Konva.Image.fromURL(ZOOM_IMG_SOURCE, (zoomImg) => {
        layer.add(zoomImg);
        zoomImg.setAttrs({
            x: 0,
            y: 0,
            width: 720,
            height: 720,
            draggable: false,
            dragOnTop: false,
            listening: false,
            shadowEnabled: false,
            fillEnabled: false,
            strokeHitEnabled: false,
            strokeScaleEnabled: false,
            strokeEnabled: false,
        });

        items.zoomImg = zoomImg;
    });

}

// Helpers

function downloadURI(uri, name) {
    let link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // noinspection JSAnnotator
    delete link;
}

function toggleTransformHandles(obj, state) {
    obj.resizeEnabled(state);
    obj.flipEnabled(state);
    obj.rotateEnabled(state);
    obj.borderEnabled(state);
}

// function to calculate crop values from source image, its visible size and a crop strategy
function getCrop(image, size, clipPosition = 'center-middle') {
    const width = size.width;
    const height = size.height;
    const aspectRatio = width / height;

    let newWidth;
    let newHeight;

    const imageRatio = image.width / image.height;

    if (aspectRatio >= imageRatio) {
        newWidth = image.width;
        newHeight = image.width / aspectRatio;
    } else {
        newWidth = image.height * aspectRatio;
        newHeight = image.height;
    }

    let x = 0;
    let y = 0;
    if (clipPosition === 'left-top') {
        x = 0;
        y = 0;
    } else if (clipPosition === 'left-middle') {
        x = 0;
        y = (image.height - newHeight) / 2;
    } else if (clipPosition === 'left-bottom') {
        x = 0;
        y = image.height - newHeight;
    } else if (clipPosition === 'center-top') {
        x = (image.width - newWidth) / 2;
        y = 0;
    } else if (clipPosition === 'center-middle') {
        x = (image.width - newWidth) / 2;
        y = (image.height - newHeight) / 2;
    } else if (clipPosition === 'center-bottom') {
        x = (image.width - newWidth) / 2;
        y = image.height - newHeight;
    } else if (clipPosition === 'right-top') {
        x = image.width - newWidth;
        y = 0;
    } else if (clipPosition === 'right-middle') {
        x = image.width - newWidth;
        y = (image.height - newHeight) / 2;
    } else if (clipPosition === 'right-bottom') {
        x = image.width - newWidth;
        y = image.height - newHeight;
    } else if (clipPosition === 'scale') {
        x = 0;
        y = 0;
        newWidth = width;
        newHeight = height;
    } else {
        console.error(
            new Error('Unknown clip position property - ' + clipPosition)
        );
    }

    return {
        cropX: x,
        cropY: y,
        cropWidth: newWidth,
        cropHeight: newHeight,
    };
}

// function to apply crop
function applyCrop(pos) {
    profileImg.setAttr('lastCropUsed', pos);
    const crop = getCrop(
        profileImg.image(),
        { width: profileImg.width(), height: profileImg.height() },
        pos
    );
    profileImg.setAttrs(crop);
}

function registerEvents() {
    // EVENTS
    document.getElementById('save').addEventListener(
        'click',
        onExport,
        false
    );

    document.getElementById('upload').addEventListener('change', (e) => updateProfileImage(e.target.files[0]));

    fitStageIntoParentContainer();
    // adapt the stage on any window resize
    window.addEventListener('resize', fitStageIntoParentContainer);

    const slider = document.getElementById('slider');

    slider.oninput = function () {
        const newScaleX = slider.value;
        const newScaleY = slider.value;

        let newSize = {width: newScaleX, height: newScaleY};
        items.profileImg.setSize(newSize);
    };
}

// Event handlers

const slider = document.querySelector('#slider');

function updateProfileImage(file) {
    const reader = new FileReader();
    reader.onload = function () {
        // noinspection JSValidateTypes
        profileImgObj.src = reader.result;

        slider.value = profileImg.getWidth()/2;
        slider.setAttribute('min', profileImg.getWidth()/3);
    };
    reader.readAsDataURL(file);
}

function fitStageIntoParentContainer() {
    const container = document.querySelector('#container');

    if (container.offsetWidth <= 600) {

        // now we need to fit stage into parent container
        const containerWidth = container.offsetWidth;

        // but we also make the full scene visible
        // so we need to scale all objects on canvas
        const scale = containerWidth / width;

        stage.width(width * scale);
        stage.height(height * scale);
        stage.scale({x: scale, y: scale});
    }
}

function onExport() {
    toggleTransformHandles(transformProfile, false);
    toggleTransformHandles(transformLogo, false);
    items.zoomImg.visible(false);

    const dataURL = stage.toDataURL({
        pixelRatio: 1,
        quality: 100,
    });
    downloadURI(dataURL, 'stage.png');

    toggleTransformHandles(transformProfile, true);
    toggleTransformHandles(transformLogo, true);
    items.zoomImg.visible(true);
}

registerEvents();
// stage.container().style.background = 'url("assets/img/zoom.svg") no-repeat';
// stage.container().style.pointerEvents = 'none'
