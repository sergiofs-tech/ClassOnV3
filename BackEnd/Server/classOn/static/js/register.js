
function validate (num) {

	var checkBox = document.getElementById('check'+ num);
	var subButton = document.getElementById('submit'+ num);
	
	if (checkBox.checked) {
		subButton.removeAttribute("disabled");
	} else {
		subButton.setAttribute("disabled","");
	}

}