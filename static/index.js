const webcamElement = document.getElementById('webcam');
const classifier = knnClassifier.create();

let net;

async function setupWebcam() {
    return new Promise((resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia ||
            navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
            navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({ video: true },
                stream => {
                    webcamElement.srcObject = stream;
                    webcamElement.addEventListener('loadeddata', () => resolve(), false);
                },
                error => reject());
        } else {
            console.log('error getUserMedia Failed.')
            reject();
        }
    });
}

async function app() {
    console.log('loading mobilenet...');

    //load the model
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    await setupWebcam();
    // Reads an image from the webcam and associates it with a specific class
    // index.
    const addExample = classId => {
        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = net.infer(webcamElement, 'conv_preds');

        // Pass the intermediate activation to the classifier.
        classifier.addExample(activation, classId);
    };

    // When clicking a button, add an example for that class.
    document.getElementById('class-a').addEventListener('click', () => addExample(0));
    document.getElementById('class-b').addEventListener('click', () => addExample(1));
    document.getElementById('class-c').addEventListener('click', () => addExample(2));

    while (true) {
        // const result = await net.classify(webcamElement);
        if (classifier.getNumClasses() > 0) {
            // Get the activation from mobilenet from the webcam.
            const activation = net.infer(webcamElement, 'conv_preds');
            // Get the most likely class and confidences from the classifier module.
            const result = await classifier.predictClass(activation);

            const classes = ['A', 'B', 'C'];
            document.getElementById('console').innerText = `
                prediction: ${classes[result.classIndex]}\n
                probability: ${result.confidences[result.classIndex]}
            `;
        }

        // document.getElementById('console').innerText = `
        //     prediction: ${result[0].className}\n
        //     probability: ${result[0].probability}
        //     `;

        // Give some breathing room by waiting for the next animation frame to
        // fire.
        await tf.nextFrame();
    }
}

app();