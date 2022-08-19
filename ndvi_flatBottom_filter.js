var modis = ee.ImageCollection('MODIS/006/MOD13Q1')
                .select('NDVI')
                .filterBounds(table2)
                .filterDate('2000-04-01', '2018-09-30');

var index = function(image){
 return image.divide(10000)
             .set('system:time_start', image.get('system:time_start'));
};

var ndviCollection = modis.map(index);
print(ndviCollection);

var flat_bottom = function(collection){
  var join_filter = ee.Filter.and(
    ee.Filter.maxDifference(
      1*16*1000*60*60*24, 'system:time_start', null, 'system:time_start'
    )
  );
  
  var join_result = ee.Join.saveAll('matches').apply(collection, collection, join_filter);

  var min_local = function (img){
    var actual = ee.Image(img.toList(3).get(0));
    var prior = ee.Image(img.toList(3).get(1));
    var after = ee.Image(img.toList(3).get(2));
    var minimal = prior.min(after);
    return actual.where(actual.lt(minimal), minimal);
  };
  
  var flat_local = function(img){
    var img3periods = ee.ImageCollection.fromImages(img.get('matches'));
    var saida = ee.Algorithms.If(
      ee.Number(img3periods.size()).lt(3),
      ee.Image(img3periods.toList(3).get(0)),
      min_local(img3periods)
      );
    
    return ee.Image(img).addBands(
      ee.Image(saida).select(['NDVI'], ['NDVI_flat']));
  };

  var filtered = join_result.map(flat_local);
  
  return filtered;
};

var flat_ndvi = flat_bottom(ndviCollection);
print(flat_ndvi);


var mapfunc = function(feat) {
  var geom = feat.geometry();
  var addProp = function(imgB, f) {
    var newf = ee.Feature(f);
    var date = ee.Image(imgB).date().format();
    //print(date)
    var value = ee.Image(imgB).reduceRegion(ee.Reducer.mean(), geom, 231.656).get('NDVI_flat');
    //print(value)
    return ee.Feature(ee.Algorithms.If(value,
                                       newf.set(date, ee.String(value)),
                                       newf.set(date, ee.String('No data'))));
  };
  var newfeat = ee.Feature(flat_ndvi.iterate(addProp, feat));
  //print(newfeat)
  return newfeat;
};

var newft = table2.map(mapfunc);
//print(newft);

Export.table.toAsset(newft,
"NDVI_Flat",
"NDVI_Flat");

