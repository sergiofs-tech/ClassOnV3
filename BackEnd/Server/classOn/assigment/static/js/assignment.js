var textoGlobal = 'default';

$(document).ready(function() {
	var container = document.getElementById("assign-container");
	var str = container.textContent;
	container.innerHTML = str;

	$("#doubtPostGOOD").click( function() {
 	   	var text = document.getElementById('doubtText').value;
	    if (text != "") {
	        socket.emit('doubt_post', text);
	    	textoGlobal = text;
	        // queryDoubts();        
	    }
	});
});