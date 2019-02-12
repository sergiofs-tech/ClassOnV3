$(document).ready(function() {
    var row = document.getElementById('row');
    var rowNumber = parseInt(row.className, 10);
    var windowHeight = window.innerHeight;

    var rowHeight = (windowHeight - 150 ) / rowNumber ;
    var cardHeight = rowHeight-24;

    var style = document.createElement('style');

    if (cardHeight > 100) {
		style.innerHTML =
			'tr {' +
				'height: '+ rowHeight + 'px;' +
				'max-height: 150px;' +				

			'}' +
			'.card {' +
				'height: '+ cardHeight + 'px;' +
				'max-height: 130px;' +

			'}';
	} else {
		style.innerHTML =
			'tr {' +
				'height: '+ rowHeight + 'px;' +
				'max-height: 150px;' +				
			'}' +
			'.card {' +
				'height: '+ cardHeight + 'px;' +
				'max-height: 130px;' +
			'}' +
			'.list-group {' +
				'display: none;' +
			'}'+
			'.card-body {' +
				'height: 100%;' +
			'}'

			;
	}
	var ref = document.querySelector('script');
	ref.parentNode.insertBefore(style, ref);
});
