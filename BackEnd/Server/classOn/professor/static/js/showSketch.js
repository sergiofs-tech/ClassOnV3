 function showSketch() {

      var layout = document.getElementById("col2");
      layout.innerHTML=null;
      var block = document.createElement("block");
      var rows = document.getElementById("rows");
      var cols = document.getElementById("columns");
      var name= document.getElementById("room");

      numRows=rows.value;
      numColumns=cols.value;

      var row = document.createElement("tr2");
      row.classList.add("class-name");
      row.innerHTML=name.value;
      block.appendChild(row);

      for (var i = 0; i < numRows; i++) {

        var row = document.createElement("tr2");
        for (var j = 0; j < numColumns; j++) {

          var box  = document.createElement("td2");
          var x = document.createElement("IMG");
          x.setAttribute("src", "/professor/static/images/monitor.png");
          box.appendChild(x);
          if (numColumns>11) {
            box.style.width="6%";
          }
          row.appendChild(box);
        }
        block.appendChild(row);
      }

      var row = document.createElement("tr3");
      block.appendChild(row);
      row.innerHTML="Blackboard";
      layout.appendChild(block);
      layout.style.display="block";

}