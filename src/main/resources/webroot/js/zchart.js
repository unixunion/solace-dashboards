/*

The chart class

*/

var ZChart = function(name, dl, divName, type, color, interval)
{
  this.name = name;
  this.dataLength = dl;
  this.dps = [];
  this.yVal = 0;
  this.xVal = 0;
  this.self = this;
  this.valueFormatString = "HH:mm:ss";
  this.eventRate = 1; // default event rate, will recalc on update
  this.eventTokens = 0; // used to keep track of value changes. 
  this.eventRateCounter = 0; // counter for how many times we have checked

  // if counter, delta on update to stop ever mounding
  this.counter = false;
  this.last_val = 0;
  this.last_dl = dl;

  if (! color ) {
    this.color = "rgba(40,175,101,0.6)";
  } else {
    this.color = color;
  }

  // render type area, stackedColumn, ...
  this.type = type;

  // interval
  if (interval == undefined) {
    this.interval = 5000;
  } else {
    this.interval = interval;
  }
  
  // create a new DIV
  var ni = document.getElementById(divName);
  var newdiv = document.createElement('div');
  var divIdName = 'zchartContainer' + chartCount;
  this.divName = divIdName;
  console.log("created chart: " + divIdName );
  newdiv.setAttribute('id', divIdName);
  // newdiv.setAttribute('class', "row");
  newdiv.style.height = chart_height;
  newdiv.style.width = '100%';
  newdiv.innerHTML = '';

  try {
    ni.appendChild(newdiv);
  } catch (err) {
    app_error("Div: " + divName + " doesnt' exist");
  }
  
  this.is_visible = function() {
    var d = document.getElementById(this.divName).getAttribute("class");
    if (d == "hide") {
      return false;
    } else {
      return true;
    }

  }
  
  this.chart = new CanvasJS.Chart("zchartContainer" + chartCount,
  {
    // animationEnabled: true,
    exportEnabled: false,
    exportFileName: this.name,
    colorSet:  "customColorSet1",
    interactivityEnabled: ! ismobile,

		title :{
			text: this.name
		},

    axisX: {
      valueFormatString: this.valueFormatString,
      labelFontSize: 8,
      labelAngle: 50,
      interval: interval,
      intervalType: "second",
      // lineThickness: 2,
    },

    axisY: {
      includeZero: true,
    },

    legend:{
      fontSize: 12,
    },

    toolTip:{
    	content: "{name}: {y}"
    },

		data: []
	});

  // wanna make this a simple chart?
  this.initData = function() {
    this.chart.options.data=[{
      type: this.type,
      color: this.color,
      markerSize: 0,
      dataPoints: this.dps 
    }]
  }

  this.update = function(y1)
  {
    if (this.dataLength != this.last_dl )
    {
      console.log("dataLength changed, updating");
      this.dataLength = dataLength;
    }
    
  	this.dps.push({
  		y: this.yVal,
      x: new Date()
  	});

    if (this.dps.length > (this.dataLength*this.eventRate))
    {
      this.dps.shift();
    }
    
    this.last_dl = this.dataLength;
    
  }


  this.clear = function()
  {
    while (this.dps.length > 0)
    {   
      this.dps.shift();
    }
  }

  this.zrender = function()
  {

      if (self.chart.options.data instanceof Array) {
        for (var d in self.chart.options.data ) {
          while (self.chart.options.data[d].dataPoints.length > self.dataLength) {
            self.chart.options.data[d].dataPoints.shift();
          }
        }
      }

      while (self.dps.length > self.dataLength)
      {
         self.dps.shift();
      }

      if (self.is_visible()) {
        self.chart.render();       
      }

      

  }

  var self = this;
  window.setInterval(this.zrender, 1000);
  chartCount++;
    
}