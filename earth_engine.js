//Determinando a data de interesse
var ndviMedMax = ee.FeatureCollection("ft:1D4K1e8xozYe4CsKxSye7P5wkjOcG9yaaIJt3fHTk");

var date = ee.DateRange('2000-07-01', '2001-06-30');
var dateT = ee.DateRange('2000-07-01', '2005-06-30');

//Fusion Tables com Série temporal NDVI das amostras

//var ndviSg = ee.FeatureCollection('ft:1L6NXMjWfVKvWDZHIoBxoruWQFVdAC6NUoyg4Bgbm');

//Importa o pixel amostrado e configura o estilo para que plote somente a outline
var obj1 = ee.FeatureCollection("users/deniscortevieira/Mato_Grosso/amostraScript")
              .style({color: 'blue', fillColor: '11ffee00'});

//Importa os pontos amostrados como uma coleção e informa a quantidade de pontos desta coleção
var table = ee.FeatureCollection("users/deniscortevieira/Mato_Grosso/amostraScript")
              .sort('POINT_ID', true);
              
var list = table.toList(table.size());

var sampleSize = table.size().getInfo();

//---------------IMAGENS LANDSAT-5---------------------------
var collectionL5 = ee.ImageCollection("LANDSAT/LT05/C01/T1")
  .select(['B3', 'B4', 'B5'])
  .filterMetadata('CLOUD_COVER', 'less_than', 20);
  
//---------------IMAGENS LANDSAT-7---------------------------

var collectionL7 = ee.ImageCollection("LANDSAT/LE07/C01/T1")
  .select(['B3', 'B4', 'B5'])
  .filterMetadata('CLOUD_COVER', 'less_than', 20);
  
//---------------IMAGENS LANDSAT-8---------------------------

var collectionL8 = ee.ImageCollection("LANDSAT/LC08/C01/T1")
  .select(['B4', 'B5', 'B6'])
  .filterMetadata('CLOUD_COVER', 'less_than', 20);
  
//---------------IMAGENS SENTINEL-2---------------------------

var collectionS2 = ee.ImageCollection("COPERNICUS/S2")
  .select(['B4', 'B8', 'B11'])
  .filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 20);

// Contador que será utilizado para acesso aos dados.
var b = 0;
var index = 1;
var i = 0;
var y = 2002;
var yy = 2003;
var yyT = 2007;
var c = 2003;

// Listas
var listElement = ee.List([]);
var temp = ee.List([]);
var liste = ee.List([]);
var obj = ee.List([]);
var lastSample = null;

//Textbox para informar a ultima amostra totalmente classificada
var textbox = ui.Textbox({
  placeholder: 'Informe a última amostra totalmente classificada',
  onChange: function(text) {
    i = ee.Number.parse(text).toInt().getInfo();
    index = i+1;
    var item = list.get(i);
    obj = ee.List(obj).add(item);
    obj = obj.get(b);
    var inf = ee.Feature(obj).get('POINT_ID').getInfo();
    panel.clear();
    panel.add(ui.Label('Amostra recebida!'), {position: 'bottom-left', fontWeight: 'bold'});
    panel.add(ui.Button({
      label: 'INICIAR CLASSIFICAÇÃO',
      onClick: drawPoint
    }));
  }
});

// Classe selecionada
var elementClass = null;

// Classe que será atribuida
var clas = '2001';

var drawPoint = function() {
    i;
    index;
    panel.clear();
    Map.clear();
    if (index > sampleSize) {
      panel.add(ui.Label('ACABARAM AS AMOSTRAS!', {position: 'bottom-center', fontWeight: 'bold'}));
      var elements = ee.FeatureCollection(liste);
      panel.add(ui.Button({
        label: 'Exportar dados classificados', 
        onClick: function() {
          Export.table.toDrive({
            collection: elements,
            description: 'Tabela_Amostras_Classificadas',
            folder: 'Amostras_Classificadas',
            fileNamePrefix: 'Tabela_Amostras_Classificadas',
          });
        }
      }));
    } else {
      var center = table.filter(ee.Filter.eq("POINT_ID", index));
      var point = ee.Algorithms.String(index).getInfo();
     
      var centerized = ee.Feature(list.get(i)).centroid();
      var centerCoor = centerized.geometry();
      var lon = ee.Number(centerCoor.coordinates().get(0)).getInfo();
      var lat = ee.Number(centerCoor.coordinates().get(1)).getInfo();
      
      var bioPoint = ee.Feature(list.get(i));
      var legenda = bioPoint.get('LEGENDA');
      var vegetacao  = legenda.getInfo();
      
      elements = ee.FeatureCollection(liste);
      panel.add(ui.Button({
          label: 'Exportar dados classificados', 
          onClick: function() {
            Export.table.toDrive({
              collection: elements,
              description: 'Tabela_Amostras_Classificadas',
              folder: 'Amostras_Classificadas',
              fileNamePrefix: 'Tabela_Amostras_Classificadas',
            });
            print('A ultima amostra totalmente classificada foi a de número:', lastSample);
          }
        }));
      
      panel.add(ui.Label('Amostra número'), {position: 'bottom-left', fontWeight: 'bold'});
      panel.add(ui.Label(index),{position: 'bottom-right', fontWeight: 'bold'});
      panel.add(ui.Label(vegetacao),{position: 'bottom-center', fontWeight: 'bold'});
      
      panel.add(ui.Select({
        items: [
            {label: 'Campo', value: 'Campo'},
            {label: 'Savana', value: 'Savana'},
            {label: 'Floresta', value: 'Floresta'},
            {label: 'Floresta Sazonal', value: 'Floresta Sazonal'},
            {label: 'Água', value: 'Agua'},
            {label: 'Outras Coberturas', value: 'Outras Coberturas'},
            {label: 'Cultivo único', value: 'Cultivo unico'},
            {label: 'Cultivo duplo', value: 'Cultivo duplo'},
            {label: 'Cultivo múltiplo', value: 'Cultivo multiplo'},
            {label: 'Cultivo semi-perene', value: 'Cultivo semi-perene'},
            {label: 'Cultivo perene', value: 'Cultivo perene'},
            {label: 'Pastagem', value: 'Pastagem'},
            {label: 'Reflorestamento', value: 'Reflorestamento'},
            {label: 'Outros Usos', value: 'Outros Usos'},
            {label: 'Em Conversão', value: 'Em Conversao'}
                ],
        onChange: function(value){
            elementClass = ee.Feature(obj).set(clas, value);
        }       
      }).setPlaceholder('SELECIONE UMA CLASSE PARA A AMOSTRA'));
      
      panel.add(ui.Button({
      label: 'Confirmar classe',
      onClick: function() {
        if (elementClass) {
          listElement = ee.List(listElement).add(ee.Feature(elementClass));//.cat(temp);
          elementClass = null;
          obj = listElement.get(b); 
          b += 1;
          if(y < 2017){
            if(yyT <= 2018){
              var start = y+'-07-01';
              var end = yy+'-06-30';
              var endT = yyT+'-06-30';
              date = ee.DateRange(start, end);
              dateT = ee.DateRange(start, endT);
              var cn = ee.Number(c).toInt();
              clas = ee.String(cn).getInfo();
            }  
            else{
              start = y+'-07-01';
              end = yy+'-06-30';
              date = ee.DateRange(start, end);
              dateT = ee.DateRange('2013-07-01', '2018-06-30');
              cn = ee.Number(c).toInt();
              clas = ee.String(cn).getInfo();
              temp = ee.List(temp).add(ee.Feature(elementClass));
            }
            y += 2;
            yy += 2;
            yyT += 2;
            c += 2;
          }
          else{
            if (y == 2018){
              date = ee.DateRange('2017-07-01', '2018-06-30');
              dateT = ee.DateRange('2013-07-01', '2018-06-30');
              y += 2;
              yy += 2;
              clas = '2018';
              temp = ee.List(temp).add(ee.Feature(elementClass));
            }
            else{
              date = ee.DateRange('2000-07-01', '2001-06-30');
              dateT = ee.DateRange('2000-07-01', '2005-06-30');
              lastSample = i;
              i += 1;
              index += 1
              lastSample = i;
              y = 2002;
              yy = 2003;
              yyT = 2007;
              c = yy;
              b = 0;
              clas = '2001';
              obj = list.get(i);
              var busca = listElement.length().getInfo();
              var cut = listElement.get(busca-1);
              liste = liste.add(cut);
              listElement = listElement.removeAll(listElement);
              temp = temp.removeAll(temp);
            }
          }
          drawPoint();
        }
        else{
          // Do Nothing
        }
    }}));
      
      //---------------MERGE DAS COLEÇÕES---------------------------
      var collection = ee.ImageCollection(collectionL5.merge(collectionL7).merge(collectionL8).merge(collectionS2))
                                .filterBounds(center)
                                .filterDate(date)
                                .sort('system:time_start', true);
      
      //------------------OBTENÇÃO DOS MULTIPAINÉIS E IMAGE SHOW------------
      var collectionList = collection.toList(collection.size());
      var collectionSize = collection.size().getInfo();
      var passo = ee.Number(collectionSize/3).round();
      var constant = passo.getInfo();
      
      var imgFirst = ee.Image(collectionList.get(0));
      var imgSecond = ee.Image(collectionList.get(constant+(1)));
      var imgThird = ee.Image(collectionList.get(constant+constant+(1)));
      var imgFourth = ee.Image(collectionList.get(collectionSize-(1)));
      
      var imDateOne = imgFirst.get('system:time_start').getInfo();
      var imDateTwo = imgSecond.get('system:time_start').getInfo();
      var imDateThree = imgThird.get('system:time_start').getInfo();
      var imDateFour = imgFourth.get('system:time_start').getInfo();
      
      var imgDateOne = ee.Date(imDateOne).format('dd/MM/yyyy').getInfo();
      var imgDateTwo = ee.Date(imDateTwo).format('dd/MM/yyyy').getInfo();
      var imgDateThree = ee.Date(imDateThree).format('dd/MM/yyyy').getInfo();
      var imgDateFour = ee.Date(imDateFour).format('dd/MM/yyyy').getInfo();
      
      var nameSatOne = imgFirst.get('SPACECRAFT_ID').getInfo()+'a';
      var nameSatTwo = imgSecond.get('SPACECRAFT_ID').getInfo()+'a';
      var nameSatThree = imgThird.get('SPACECRAFT_ID').getInfo()+'a';
      var nameSatFour = imgFourth.get('SPACECRAFT_ID').getInfo()+'a';
      
      var satOne = ee.String(nameSatOne).length();
      var satTwo = ee.String(nameSatTwo).length();
      var satThree = ee.String(nameSatThree).length();
      var satFour = ee.String(nameSatFour).length();
      
      var n = ee.Number(satOne).getInfo();
      var nn = ee.Number(satTwo).getInfo();
      var nnn = ee.Number(satThree).getInfo();
      var nnnn = ee.Number(satFour).getInfo();
      
      if(n == 10){
        var sateliteOne = 'SPACECRAFT_ID';
        var nameOne = imgFirst.get(sateliteOne).getInfo();
        var endingOne = ee.String(nameOne).rindex('LANDSAT_8');
        var endOne = ee.Number(endingOne).getInfo();
        if(endOne === 0){
          var bandsOne = ['B5', 'B6', 'B4'];
          var minOne = 6326;
          var maxOne = 28850;
        }
        else{
          bandsOne = ['B4', 'B5', 'B3'];
          minOne = 15;
          maxOne = 179;
        }
      }
      else{
        sateliteOne = 'SPACECRAFT_NAME';
        nameOne = imgFirst.get(sateliteOne).getInfo();
        bandsOne = ['B8', 'B11', 'B4'];
        minOne = 270;
        maxOne = 4485;
      }
      
      if(nn == 10){
        var sateliteTwo = 'SPACECRAFT_ID';
        var nameTwo = imgSecond.get(sateliteTwo).getInfo();
        var endingTwo = ee.String(nameTwo).rindex('LANDSAT_8');
        var endTwo = ee.Number(endingTwo).getInfo();
        if(endTwo === 0){
          var bandsTwo = ['B5', 'B6', 'B4'];
          var minTwo = 6326;
          var maxTwo = 28850;
        }
        else{
          bandsTwo = ['B4', 'B5', 'B3'];
          minTwo = 15;
          maxTwo = 179;
        }
      }
      else{
        sateliteTwo = 'SPACECRAFT_NAME';
        nameTwo = imgSecond.get(sateliteTwo).getInfo();
        bandsTwo = ['B8', 'B11', 'B4'];
        minTwo = 270;
        maxTwo = 4485;
      }
      
      if(nnn == 10){
        var sateliteThree = 'SPACECRAFT_ID';
        var nameThree = imgThird.get(sateliteThree).getInfo();
        var endingThree = ee.String(nameThree).rindex('LANDSAT_8');
        var endThree = ee.Number(endingThree).getInfo();
        if(endThree === 0){
          var bandsThree = ['B5', 'B6', 'B4'];
          var minThree = 6326;
          var maxThree = 28850;
        }
        else{
          bandsThree = ['B4', 'B5', 'B3'];
          minThree = 15;
          maxThree = 179;
        }
      }
      else{
        sateliteThree = 'SPACECRAFT_NAME';
        nameThree = imgThird.get(sateliteThree).getInfo();
        bandsThree = ['B8', 'B11', 'B4'];
        minThree = 270;
        maxThree = 4485;
      }
      
      if(nnnn == 10){
        var sateliteFour = 'SPACECRAFT_ID';
        var nameFour = imgFourth.get(sateliteFour).getInfo();
        var endingFour = ee.String(nameFour).rindex('LANDSAT_8');
        var endFour = ee.Number(endingFour).getInfo();
        if(endFour === 0){
          var bandsFour = ['B5', 'B6', 'B4'];
          var minFour = 6326;
          var maxFour = 28850;
        }
        else{
          bandsFour = ['B4', 'B5', 'B3'];
          minFour = 15;
          maxFour = 179;
        }
      }
      else{
        sateliteFour = 'SPACECRAFT_NAME';
        nameFour = imgFourth.get(sateliteFour).getInfo();
        bandsFour = ['B8', 'B11', 'B4'];
        minFour = 270;
        maxFour = 4485;
      }
      
      var NAMES = [
        'img_first',
        'img_second',
        'img_third',
        'img_fourth'
      ];
      
      var maps = [];
      
      NAMES.forEach(function(index) {
        var map = ui.Map();
        map.setCenter(lon, lat, 14);
        maps.push(map);
      });
      
      var linker = ui.Map.Linker(maps);
      
      maps[0].add(ui.Label(nameOne, {position: 'bottom-center', fontWeight: 'bold'}));
      maps[0].add(ui.Label(imgDateOne, {position: 'top-center', fontWeight: 'bold'}));
      maps[0].addLayer(imgFirst, {bands: bandsOne, min: minOne, max: maxOne});
      maps[0].addLayer(obj1);
      
      maps[1].add(ui.Label(nameTwo, {position: 'bottom-center', fontWeight: 'bold'}));
      maps[1].add(ui.Label(imgDateTwo, {position: 'top-center', fontWeight: 'bold'}));
      maps[1].addLayer(imgSecond, {bands: bandsTwo, min: minTwo, max: maxTwo});
      maps[1].addLayer(obj1);
      
      maps[2].add(ui.Label(nameThree, {position: 'bottom-center', fontWeight: 'bold'}));
      maps[2].add(ui.Label(imgDateThree, {position: 'top-center', fontWeight: 'bold'}));
      maps[2].addLayer(imgThird, {bands: bandsThree, min: minThree, max: maxThree});
      maps[2].addLayer(obj1);
      
      var maxSlider = ee.Number(collectionSize-(1));
      
      var showLayer = function() {
        maps[3].clear();
        var position = slider.getValue();
        var image = ee.Image(collectionList.get(position));
        var dtImage = image.get('system:time_start').getInfo();
        var dateImage = ee.Date(dtImage).format('dd/MM/yyyy').getInfo();
        var nameSat = image.get('SPACECRAFT_ID').getInfo()+'a';
        var sat = ee.String(nameSat).length();
        var p = ee.Number(sat).getInfo();
        
        if(p == 10){
          var sateliteSlid = 'SPACECRAFT_ID';
          var nameSlid = image.get(sateliteSlid).getInfo();
          var endingSlid = ee.String(nameSlid).rindex('LANDSAT_8');
          var endSlid = ee.Number(endingSlid).getInfo();
          if(endSlid === 0){
            var bandsSlid = ['B5', 'B6', 'B4'];
            var minSlid = 6326;
            var maxSlid = 28850;
          }
          else{
            bandsSlid = ['B4', 'B5', 'B3'];
            minSlid = 15;
            maxSlid = 179;
          }
        }
        else{
          sateliteSlid = 'SPACECRAFT_NAME';
          nameSlid = image.get(sateliteSlid).getInfo();
          bandsSlid = ['B8', 'B11', 'B4'];
          minSlid = 270;
          maxSlid = 4485;
        }
        
        maps[3].add(ui.Label(nameSlid, {position: 'bottom-center', fontWeight: 'bold'}));
        maps[3].add(ui.Label(dateImage, {position: 'top-center', fontWeight: 'bold'}));
        maps[3].addLayer({
          eeObject: image,
          visParams: {bands: bandsSlid, min: minSlid, max: maxSlid},
        });
        maps[3].addLayer(obj1);
      };
      
      var slider = ui.Slider({
        min: 0,
        max: maxSlider.getInfo(),
        step: 1,
        onChange: showLayer,
        style: {stretch: 'horizontal'}
      });
      
      var labelSlider = ui.Label('(Jul/01) >>>>> (Jun/30)');
      
      var panelSlider = ui.Panel({
        widgets: [labelSlider, slider],
        layout: ui.Panel.Layout.flow('vertical'), /// adiciona o slider sobre a imagem
        style: {
          position: 'top-left',
          padding: '3px'
        }
      });
      
      slider.setValue(maxSlider.getInfo());
      
      maps[3].clear();
      maps[3].add(ui.Label(nameFour, {position: 'bottom-center', fontWeight: 'bold'}));
      maps[3].add(ui.Label(imgDateFour, {position: 'top-center', fontWeight: 'bold'}));
      maps[3].addLayer(imgFourth, {bands: bandsFour, min: minFour, max: maxFour});
      maps[3].addLayer(obj1);
      
      var mapGrid = ui.Panel(
        [
          ui.Panel([maps[0], maps[2]], null, {stretch: 'both'}),
          ui.Panel([maps[1], maps[3]], null, {stretch: 'both'})
        ],
        ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'}
      );
      ui.root.widgets().reset([mapGrid]);
      ui.root.add(panel);
      
      var dt1 = dateT.start();
      var dt2 = dateT.end();
      var d1 = date.start();
      var d2 = date.end();
      
      panel.add(ui.Chart.feature.byFeature(ndviMedMax, 'date', point)
         .setOptions({
      title: 'NDVI Filtro Mínimos Locais',
      vAxis:{title: 'NDVI', viewWindow: {
          max:1,
          min:0
        }},
      hAxis: {title: 'date', format: 'MMM-yy', gridlines: {count: 6}, viewWindow: {
               max: dt1.millis().getInfo(),
               min: dt2.millis().getInfo()
             }}
      }));
      
      panel.add(ui.Chart.feature.byFeature(ndviMedMax, 'date', point)
         .setOptions({
      title: 'NDVI Filtro Mínimos Locais',
      vAxis:{title: 'NDVI', viewWindow: {
          max:1,
          min:0
        }},
      hAxis: {title: 'date', format: 'MMM-yy', gridlines: {count: 6}, viewWindow: {
               max: d1.millis().getInfo(),
               min: d2.millis().getInfo()
             }}
      }));
   
    panel.add(panelSlider);//slider adicionado ao painel
      
  }
};

// Painel com opções de manipulação de dados
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '350px'}
});

panel.add(textbox);

panel.add(ui.Button({
  label: 'Confirma amostra indicada',
  onClick: textbox
}));

// Adicionando o painel na interface
ui.root.add(panel);


