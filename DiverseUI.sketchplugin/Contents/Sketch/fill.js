function onRun(context) {
  const selection = context.selection;
  const command = context.command;
  const identifier = command.identifier();
  const sketch = context.api();

  if (selection.length === 0) {
    sketch.alert('Woops, did you forget to select a layer first?', 'Select one or more layers and try again.');
    return;
  }

  if (!allShapes(selection)) {
    sketch.alert('Woops, did you select a non-shape?', 'Select only shapes and try again.');
    return;
  }

  let count = countShapes(selection);
  const url = generateUrl(identifier, count);
  const images = fetchUrl(url);

  // Relies on `count` and `images` which are defined in above scope
  const fillLayers = (layers) => {
    layers.forEach((layer) => {
      if (layer.className() == 'MSShapeGroup') {
        const image = images[count % images.length];
        const fill = layer.style().fills().firstObject();
        fill.setFillType(4);
        fill.setImage(generateImageData(image.url));
        fill.setPatternFillType(1);

        count -= 1;
      } else if (layer.className() == 'MSLayerGroup') {
        fillLayers(layer.layers());
      }
    });
  };

  fillLayers(selection);
}

function allShapes(layers) {
  return layers.every((layer) => {
    if (layer.className() == 'MSShapeGroup') {
      return true;
    } else if (layer.className() == 'MSLayerGroup') {
      return allShapes(layer.layers());
    } else {
      return false;
    }
  });
};

function countShapes(layers) {
  let count = 0;

  layers.forEach((layer) => {
    if (layer.className() == 'MSShapeGroup') {
      count += 1;
    } else if (layer.className() == 'MSLayerGroup') {
      count += countShapes(layer.layers());
    }
  });

  return count;
};

function generateUrl(gender, count) {
  let genderQuery = '';

  // Use == because gender is a sketch identifier object
  // and it needs to be cast to a string
  if (gender == 'diverseui-female') {
    genderQuery = '&gender=female';
  } else if (gender == 'diverseui-male') {
    genderQuery = '&gender=male';
  }

  return 'https://www.diverseui.com/images?count=' + count + genderQuery;
}

function fetchUrl(url) {
  var request = [[NSMutableURLRequest alloc] init];
  [request setHTTPMethod:@"GET"];
  [request setURL:[NSURL URLWithString:url]];

  var error = [[NSError alloc] init];
  var responseCode = null;

  var oResponseData = [NSURLConnection sendSynchronousRequest:request returningResponse:responseCode error:error];

  var dataString = [[NSString alloc] initWithData:oResponseData
  encoding:NSUTF8StringEncoding];

  var pattern = new RegExp("\\\\'", "g");
  var validJSONString = dataString.replace(pattern, "'");

  return JSON.parse(validJSONString);
}

function generateImageData(url) {
  var url = [[NSURL alloc] initWithString: url];
  var newImage = [[NSImage alloc] initByReferencingURL:url];
  return MSImageData.alloc().initWithImageConvertingColorSpace(newImage)
}
