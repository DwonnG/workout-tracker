(function () {
  var WT = window.WT;

  WT.USDA_KEY = 'VOIKDIoWNogouS2QG32mSnWZN3ViW4sYh9IzCiJm';
  WT.LOCAL_FOODS = [
    {name:'Chicken breast (4 oz)',p:35},{name:'Chicken breast (6 oz)',p:52},{name:'Chicken thigh (4 oz)',p:28},
    {name:'Ground beef 90/10 (4 oz)',p:22},{name:'Ground turkey (4 oz)',p:22},{name:'Steak sirloin (6 oz)',p:46},
    {name:'Salmon fillet (4 oz)',p:25},{name:'Tuna canned (3 oz)',p:20},{name:'Shrimp (4 oz)',p:24},
    {name:'Eggs (1 large)',p:6},{name:'Eggs (2 large)',p:12},{name:'Eggs (3 large)',p:18},{name:'Eggs (4 large)',p:24},
    {name:'Egg whites (1 cup)',p:26},
    {name:'Greek yogurt (1 cup)',p:20},{name:'Greek yogurt (5.3 oz)',p:15},{name:'Cottage cheese (1 cup)',p:28},
    {name:'Milk whole (1 cup)',p:8},{name:'Milk 2% (1 cup)',p:8},
    {name:'Protein shake (1 scoop)',p:25},{name:'Protein shake (2 scoops)',p:50},{name:'Protein bar',p:20},
    {name:'Tofu firm (4 oz)',p:10},{name:'Lentils cooked (1 cup)',p:18},{name:'Black beans (1 cup)',p:15},
    {name:'Peanut butter (2 tbsp)',p:7},{name:'Almonds (1 oz)',p:6},
    {name:'Cheese cheddar (1 oz)',p:7},{name:'String cheese (1 stick)',p:7},{name:'Mozzarella (1 oz)',p:7},
    {name:'Turkey deli slices (2 oz)',p:12},{name:'Ham deli slices (2 oz)',p:10},
    {name:'Rice cooked (1 cup)',p:4},{name:'Bread whole wheat (1 slice)',p:4},{name:'Oatmeal (1 cup cooked)',p:6},
    {name:'Pasta cooked (1 cup)',p:7},{name:'Quinoa cooked (1 cup)',p:8},
    {name:'Broccoli (1 cup)',p:3},{name:'Spinach (1 cup raw)',p:1},
    {name:'Pork chop (4 oz)',p:26},{name:'Bacon (3 slices)',p:9},{name:'Jerky beef (1 oz)',p:10},
    {name:'Gold Standard 100% Whey (1 scoop)',p:24},{name:'Fairlife protein shake (11.5 oz)',p:30},
    {name:'Premier Protein shake (11 oz)',p:30},{name:'Muscle Milk (14 oz)',p:25},
    {name:'Optimum Nutrition Serious Mass (1 scoop)',p:25},{name:'Dymatize ISO100 (1 scoop)',p:25},
    {name:'Quest protein bar',p:21},{name:'Built Bar',p:17},{name:'RXBar',p:12},
    {name:'Fairlife milk (1 cup)',p:13},{name:'Chobani Greek yogurt (5.3 oz)',p:12},
    {name:'Kirkland protein bar',p:21},{name:"Clif Builder's Bar",p:20},
    {name:'Tuna pouch (2.6 oz)',p:17},{name:'Rotisserie chicken (4 oz)',p:28},
    {name:'Beef patty 80/20 (4 oz)',p:20},{name:'Chicken sausage (1 link)',p:14},
    {name:'Turkey burger (4 oz)',p:22},{name:'Collagen peptides (1 scoop)',p:10}
  ];

  WT.searchLocal = function (q) {
    var lq = q.toLowerCase(), words = lq.split(/\s+/);
    var scored = WT.LOCAL_FOODS.map(function (f) {
      var ln = f.name.toLowerCase(), s = 0;
      if (ln.indexOf(lq) === 0) s += 100;
      else if (ln.indexOf(lq) !== -1) s += 50;
      words.forEach(function (w) { if (w && ln.indexOf(w) !== -1) s += 10; });
      return { f: f, s: s };
    }).filter(function (x) { return x.s > 0; });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, 8).map(function (x) { return x.f; });
  };

  var usdaTimer = null;
  WT.searchUSDA = function (q, cb) {
    clearTimeout(usdaTimer);
    usdaTimer = setTimeout(function () {
      var url = 'https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' + WT.USDA_KEY + '&query=' + encodeURIComponent(q) + '&pageSize=8&dataType=Branded,SR%20Legacy,Foundation';
      fetch(url).then(function (r) { return r.json(); }).then(function (data) {
        if (!data.foods) return cb([]);
        cb(data.foods.map(function (f) {
          var prot = 0;
          (f.foodNutrients || []).forEach(function (n) { if (n.nutrientId === 1003 || n.nutrientName === 'Protein') prot = n.value || 0; });
          var ss = f.servingSize, su = f.servingSizeUnit || 'g';
          var perLabel = ss ? (Math.round(ss) + su) : '100g';
          var protPer = ss ? Math.round(prot * ss / 100) : Math.round(prot);
          var label = f.brandName ? (f.brandName + ' ' + f.description) : f.description;
          if (label.length > 60) label = label.substring(0, 57) + '\u2026';
          return { name: label, p: protPer, per: perLabel, src: 'USDA' };
        }).filter(function (f) { return f.p > 0; }));
      }).catch(function () { cb([]); });
    }, 350);
  };
})();
