(function () {
  var WT = window.WT;

  WT.USDA_KEY = 'VOIKDIoWNogouS2QG32mSnWZN3ViW4sYh9IzCiJm';
  WT.LOCAL_FOODS = [
    {name:'Chicken breast (4 oz)',p:35,cal:187,fat:4,carb:0,sugar:0,fiber:0,sodium:74},
    {name:'Chicken breast (6 oz)',p:52,cal:281,fat:6,carb:0,sugar:0,fiber:0,sodium:111},
    {name:'Chicken thigh (4 oz)',p:28,cal:232,fat:15,carb:0,sugar:0,fiber:0,sodium:84},
    {name:'Ground beef 90/10 (4 oz)',p:22,cal:200,fat:11,carb:0,sugar:0,fiber:0,sodium:75},
    {name:'Ground turkey (4 oz)',p:22,cal:170,fat:9,carb:0,sugar:0,fiber:0,sodium:80},
    {name:'Steak sirloin (6 oz)',p:46,cal:312,fat:14,carb:0,sugar:0,fiber:0,sodium:90},
    {name:'Salmon fillet (4 oz)',p:25,cal:234,fat:14,carb:0,sugar:0,fiber:0,sodium:59},
    {name:'Tuna canned (3 oz)',p:20,cal:90,fat:1,carb:0,sugar:0,fiber:0,sodium:250},
    {name:'Shrimp (4 oz)',p:24,cal:120,fat:2,carb:1,sugar:0,fiber:0,sodium:220},
    {name:'Eggs (1 large)',p:6,cal:72,fat:5,carb:0,sugar:0,fiber:0,sodium:71},
    {name:'Eggs (2 large)',p:12,cal:144,fat:10,carb:1,sugar:0,fiber:0,sodium:142},
    {name:'Eggs (3 large)',p:18,cal:216,fat:15,carb:1,sugar:0,fiber:0,sodium:213},
    {name:'Eggs (4 large)',p:24,cal:288,fat:20,carb:2,sugar:0,fiber:0,sodium:284},
    {name:'Egg whites (1 cup)',p:26,cal:126,fat:0,carb:2,sugar:2,fiber:0,sodium:403},
    {name:'Greek yogurt (1 cup)',p:20,cal:130,fat:0,carb:9,sugar:7,fiber:0,sodium:80},
    {name:'Greek yogurt (5.3 oz)',p:15,cal:100,fat:0,carb:7,sugar:5,fiber:0,sodium:60},
    {name:'Cottage cheese (1 cup)',p:28,cal:220,fat:10,carb:8,sugar:7,fiber:0,sodium:710},
    {name:'Milk whole (1 cup)',p:8,cal:149,fat:8,carb:12,sugar:12,fiber:0,sodium:105},
    {name:'Milk 2% (1 cup)',p:8,cal:122,fat:5,carb:12,sugar:12,fiber:0,sodium:100},
    {name:'Protein shake (1 scoop)',p:25,cal:120,fat:2,carb:3,sugar:1,fiber:0,sodium:130},
    {name:'Protein shake (2 scoops)',p:50,cal:240,fat:4,carb:6,sugar:2,fiber:0,sodium:260},
    {name:'Protein bar',p:20,cal:200,fat:7,carb:22,sugar:5,fiber:3,sodium:200},
    {name:'Tofu firm (4 oz)',p:10,cal:88,fat:5,carb:2,sugar:1,fiber:1,sodium:14},
    {name:'Lentils cooked (1 cup)',p:18,cal:230,fat:1,carb:40,sugar:4,fiber:16,sodium:4},
    {name:'Black beans (1 cup)',p:15,cal:227,fat:1,carb:41,sugar:1,fiber:15,sodium:2},
    {name:'Peanut butter (2 tbsp)',p:7,cal:188,fat:16,carb:7,sugar:3,fiber:2,sodium:136},
    {name:'Almonds (1 oz)',p:6,cal:164,fat:14,carb:6,sugar:1,fiber:4,sodium:0},
    {name:'Cheese cheddar (1 oz)',p:7,cal:113,fat:9,carb:0,sugar:0,fiber:0,sodium:174},
    {name:'String cheese (1 stick)',p:7,cal:80,fat:6,carb:1,sugar:0,fiber:0,sodium:200},
    {name:'Mozzarella (1 oz)',p:7,cal:85,fat:6,carb:1,sugar:0,fiber:0,sodium:138},
    {name:'Turkey deli slices (2 oz)',p:12,cal:60,fat:1,carb:2,sugar:1,fiber:0,sodium:440},
    {name:'Ham deli slices (2 oz)',p:10,cal:60,fat:2,carb:2,sugar:1,fiber:0,sodium:520},
    {name:'Rice cooked (1 cup)',p:4,cal:206,fat:0,carb:45,sugar:0,fiber:1,sodium:2},
    {name:'Bread whole wheat (1 slice)',p:4,cal:81,fat:1,carb:14,sugar:2,fiber:2,sodium:146},
    {name:'Oatmeal (1 cup cooked)',p:6,cal:166,fat:4,carb:28,sugar:1,fiber:4,sodium:9},
    {name:'Pasta cooked (1 cup)',p:7,cal:220,fat:1,carb:43,sugar:1,fiber:3,sodium:1},
    {name:'Quinoa cooked (1 cup)',p:8,cal:222,fat:4,carb:39,sugar:2,fiber:5,sodium:13},
    {name:'Broccoli (1 cup)',p:3,cal:31,fat:0,carb:6,sugar:2,fiber:2,sodium:30},
    {name:'Spinach (1 cup raw)',p:1,cal:7,fat:0,carb:1,sugar:0,fiber:1,sodium:24},
    {name:'Pork chop (4 oz)',p:26,cal:188,fat:9,carb:0,sugar:0,fiber:0,sodium:54},
    {name:'Bacon (3 slices)',p:9,cal:129,fat:10,carb:0,sugar:0,fiber:0,sodium:435},
    {name:'Jerky beef (1 oz)',p:10,cal:82,fat:2,carb:5,sugar:4,fiber:0,sodium:418},
    {name:'Gold Standard 100% Whey (1 scoop)',p:24,cal:120,fat:2,carb:3,sugar:1,fiber:0,sodium:130},
    {name:'Fairlife protein shake (11.5 oz)',p:30,cal:150,fat:3,carb:3,sugar:2,fiber:0,sodium:280},
    {name:'Premier Protein shake (11 oz)',p:30,cal:160,fat:3,carb:5,sugar:1,fiber:1,sodium:280},
    {name:'Muscle Milk (14 oz)',p:25,cal:160,fat:5,carb:9,sugar:3,fiber:2,sodium:230},
    {name:'Optimum Nutrition Serious Mass (1 scoop)',p:25,cal:630,fat:8,carb:126,sugar:20,fiber:3,sodium:180},
    {name:'Dymatize ISO100 (1 scoop)',p:25,cal:110,fat:1,carb:1,sugar:0,fiber:0,sodium:100},
    {name:'Quest protein bar',p:21,cal:190,fat:8,carb:21,sugar:1,fiber:14,sodium:280},
    {name:'Built Bar',p:17,cal:130,fat:4,carb:18,sugar:5,fiber:6,sodium:130},
    {name:'RXBar',p:12,cal:210,fat:9,carb:24,sugar:13,fiber:5,sodium:200},
    {name:'Fairlife milk (1 cup)',p:13,cal:120,fat:5,carb:6,sugar:6,fiber:0,sodium:150},
    {name:'Chobani Greek yogurt (5.3 oz)',p:12,cal:120,fat:3,carb:13,sugar:11,fiber:0,sodium:55},
    {name:'Kirkland protein bar',p:21,cal:190,fat:7,carb:22,sugar:1,fiber:15,sodium:170},
    {name:"Clif Builder's Bar",p:20,cal:270,fat:8,carb:38,sugar:17,fiber:3,sodium:200},
    {name:'Tuna pouch (2.6 oz)',p:17,cal:80,fat:1,carb:0,sugar:0,fiber:0,sodium:200},
    {name:'Rotisserie chicken (4 oz)',p:28,cal:190,fat:9,carb:0,sugar:0,fiber:0,sodium:350},
    {name:'Beef patty 80/20 (4 oz)',p:20,cal:287,fat:23,carb:0,sugar:0,fiber:0,sodium:75},
    {name:'Chicken sausage (1 link)',p:14,cal:110,fat:5,carb:3,sugar:1,fiber:0,sodium:400},
    {name:'Turkey burger (4 oz)',p:22,cal:170,fat:9,carb:0,sugar:0,fiber:0,sodium:80},
    {name:'Collagen peptides (1 scoop)',p:10,cal:40,fat:0,carb:0,sugar:0,fiber:0,sodium:50}
  ];

  var CUSTOM_KEY = 'wt:customFoods';

  WT.loadCustomFoods = function () {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; }
    catch (e) { return []; }
  };

  WT.saveCustomFoods = function (arr) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
    if (WT.db && WT.fbRoot) WT.fbSet('customFoods', arr);
  };

  WT.addCustomFood = function (item) {
    var foods = WT.loadCustomFoods();
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    foods.push(item);
    WT.saveCustomFoods(foods);
    return item;
  };

  WT.updateCustomFood = function (item) {
    var foods = WT.loadCustomFoods();
    for (var i = 0; i < foods.length; i++) {
      if (foods[i].id === item.id) { foods[i] = item; break; }
    }
    WT.saveCustomFoods(foods);
  };

  WT.deleteCustomFood = function (id) {
    var foods = WT.loadCustomFoods().filter(function (f) { return f.id !== id; });
    WT.saveCustomFoods(foods);
  };

  WT.searchLocal = function (q) {
    var lq = q.toLowerCase(), words = lq.split(/\s+/);
    var customs = WT.loadCustomFoods().map(function (f) {
      return { name: f.name, p: f.p || 0, cal: f.cal || 0, fat: f.fat || 0, carb: f.carb || 0, sugar: f.sugar || 0, fiber: f.fiber || 0, sodium: f.sodium || 0, src: 'My Foods' };
    });
    var all = customs.concat(WT.LOCAL_FOODS);
    var scored = all.map(function (f, idx) {
      var ln = f.name.toLowerCase(), s = 0;
      if (ln.indexOf(lq) === 0) s += 100;
      else if (ln.indexOf(lq) !== -1) s += 50;
      words.forEach(function (w) { if (w && ln.indexOf(w) !== -1) s += 10; });
      if (idx < customs.length) s += 5;
      return { f: f, s: s };
    }).filter(function (x) { return x.s > 0; });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, 10).map(function (x) { return x.f; });
  };

  var BARCODE_RE = /^\d{8,13}$/;
  var MAX_NUTRIENT = 9999;

  function clampNum(v) {
    var n = parseFloat(v);
    if (isNaN(n) || n < 0) return 0;
    return Math.min(Math.round(n), MAX_NUTRIENT);
  }

  function safeName(raw) {
    if (typeof raw !== 'string') return 'Unknown product';
    var s = raw.replace(/[<>&"']/g, '').trim();
    return s.length > 80 ? s.substring(0, 77) + '\u2026' : (s || 'Unknown product');
  }

  WT.lookupBarcode = function (code, cb) {
    if (!BARCODE_RE.test(code)) return cb(null, 'Invalid barcode format');

    var offUrl = 'https://world.openfoodfacts.org/api/v2/product/' + code + '.json?fields=product_name,nutriments,serving_size';

    fetch(offUrl).then(function (r) { return r.json(); }).then(function (data) {
      if (data.status === 1 && data.product) {
        var p = data.product;
        var n = p.nutriments || {};
        var result = {
          name: safeName(p.product_name),
          per: p.serving_size || '100g',
          src: 'Open Food Facts',
          p:      clampNum(n.proteins_serving || n.proteins_100g || 0),
          cal:    clampNum(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
          fat:    clampNum(n.fat_serving || n.fat_100g || 0),
          carb:   clampNum(n.carbohydrates_serving || n.carbohydrates_100g || 0),
          sugar:  clampNum(n.sugars_serving || n.sugars_100g || 0),
          fiber:  clampNum(n.fiber_serving || n.fiber_100g || 0),
          sodium: clampNum((n.sodium_serving || n.sodium_100g || 0) * 1000)
        };
        return cb(result, null);
      }

      var usdaUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' + WT.USDA_KEY +
        '&query=' + encodeURIComponent(code) + '&pageSize=1&dataType=Branded';
      return fetch(usdaUrl).then(function (r2) { return r2.json(); }).then(function (d2) {
        if (!d2.foods || !d2.foods.length) return cb(null, 'Product not found');
        var f = d2.foods[0];
        var idMap = {};
        WT.MACRO_ORDER.forEach(function (k) { idMap[WT.MACROS[k].nutrientId] = k; });
        var raw = {};
        WT.MACRO_ORDER.forEach(function (k) { raw[k] = 0; });
        (f.foodNutrients || []).forEach(function (fn) {
          var mk = idMap[fn.nutrientId];
          if (mk) raw[mk] = fn.value || 0;
        });
        var ss = f.servingSize, su = f.servingSizeUnit || 'g';
        var perLabel = ss ? (Math.round(ss) + su) : '100g';
        var ratio = ss ? (ss / 100) : 1;
        var result = { name: safeName(f.description), per: perLabel, src: 'USDA' };
        WT.MACRO_ORDER.forEach(function (k) { result[k] = clampNum(raw[k] * ratio); });
        cb(result, null);
      });
    }).catch(function (err) {
      cb(null, 'Lookup failed: ' + (err.message || 'network error'));
    });
  };

  var usdaTimer = null;
  WT.searchUSDA = function (q, cb) {
    clearTimeout(usdaTimer);
    usdaTimer = setTimeout(function () {
      var url = 'https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' + WT.USDA_KEY + '&query=' + encodeURIComponent(q) + '&pageSize=8&dataType=Branded,SR%20Legacy,Foundation';
      fetch(url).then(function (r) { return r.json(); }).then(function (data) {
        if (!data.foods) return cb([]);
        var idMap = {};
        WT.MACRO_ORDER.forEach(function (k) { idMap[WT.MACROS[k].nutrientId] = k; });
        cb(data.foods.map(function (f) {
          var raw = {};
          WT.MACRO_ORDER.forEach(function (k) { raw[k] = 0; });
          (f.foodNutrients || []).forEach(function (n) {
            var mk = idMap[n.nutrientId];
            if (mk) raw[mk] = n.value || 0;
          });
          var ss = f.servingSize, su = f.servingSizeUnit || 'g';
          var perLabel = ss ? (Math.round(ss) + su) : '100g';
          var ratio = ss ? (ss / 100) : 1;
          var result = { name: '', per: perLabel, src: 'USDA' };
          WT.MACRO_ORDER.forEach(function (k) { result[k] = Math.round(raw[k] * ratio); });
          var label = f.brandName ? (f.brandName + ' ' + f.description) : f.description;
          if (label.length > 60) label = label.substring(0, 57) + '\u2026';
          result.name = label;
          return result;
        }).filter(function (f) { return f.p > 0 || f.cal > 0; }));
      }).catch(function () { cb([]); });
    }, 350);
  };
})();
