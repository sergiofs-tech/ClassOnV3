
  function showSketch() {

                  var layout = document.getElementById("col2");
                  layout.innerHTML=null;
                  var body = document.createElement("body");
                  var row = document.getElementById("rows");
                  var col = document.getElementById("columns");

                  numRows=row.value;
                  numColumns=col.value;

                  for (var i = 0; i < numRows; i++) {

                    var row = document.createElement("tr");

                    for (var j = 0; j < numColumns; j++) {

                      var box  = document.createElement("td");

                      var x = document.createElement("IMG");
                      x.setAttribute("src", "https://png.icons8.com/ultraviolet/50/000000/monitor.png");

                      box.appendChild(x);
                      row.appendChild(box);
                    }

                    body.appendChild(row);
                  }
                  var row = document.createElement("tr2");
                  var board = document.createElement("IMG");
                  board.setAttribute("src", "https://png.icons8.com/ios-glyphs/50/000000/rectangle-stroked.png");

                  row.appendChild(board);
                  body.appendChild(row);

                  layout.appendChild(body);

}

