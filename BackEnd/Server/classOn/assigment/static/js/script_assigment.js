/* Global variables */
var doubtId = 0;

/* Plain JS Code */
$(document).ready(function() {

    queryDoubts();
    $("#btn_answer").click (answerDoubt);
    // $('#modal_answer').on('show.bs.modal', function (event) {
    //     var button = $(event.relatedTarget);                // Button that triggered the modal
    //     doubtId = button.data('doubtid');                   // Extract info from data-* attributes and store in global variable

    //     // Add doubt text to the modal
    //     var modal = $(this);
    //     var doubtSelector = '#doubt_' + doubtId;
    //     var doubtText = $(doubtSelector + '.card .card-body .card-text').text()
    //     modal.find(".modal-body #modal_doubt_text").text(doubtText);
    // });
    $("#doubt").submit(doubt_click);
}); 

/* Functions */
// Add a doubt to the HTML
function appendDoubt( doubtJson ) {   

    let doubts = $("#doubts");                              // Locate doubts container
    const newDoubtHTML = 
    '<div class="card" id=\"doubt_' + doubtJson.db_id + '\">' + 
        '<div class="card-body">' +
            '<span class="badge badge-info">Section: ' + doubtJson.section + '</span>' + 
            '<span class="badge"> OWN DOUBT </span>' + 
            '<p class="card-text">' + doubtJson.text + '</p>' + 
        '</div>' + 
        '<ul class="list-group list-group-flush">' +
            // '<li class="list-group-item list-group-item-secondary">Cras justo odio</li>' +        
        '</ul>' +
        '<div class="card-body">' +
            '<button type=\"button\" onclick=\"solveDoubt('+ doubtJson.db_id + ', '+ numberize(doubtJson.group) + ')\" id=\"'+doubtJson.db_id + '\" class=\"btn btn-primary float-right\"' +
            'data-doubtid=\"'+ doubtJson.db_id + '\">Solve doubt</button>' +           
        '</div>' +
    '</div>' +
    '<br>'
    doubts.append(newDoubtHTML);
}

function numberize (group) {
    var num1 = parseInt(group.charAt(0));
    var num2 = parseInt(group.charAt(2));
    var res = num1*10 + num2;
    return res;
}

function solveDoubt(doubtId, groupId) {

    var element = document.getElementById('doubt_' + doubtId);
    element.parentNode.removeChild(element);
    socket.emit('solve_doubt', { doubt: doubtId, group: groupId });
}

/* Socket.io */
/** Emits  **/
// Generated new doubt --> upload to server
function doubt_click(event) {
    // alert('ey');
    socket.emit('doubt_post', text);
}

// Ask for doubts
function queryDoubts()
{
    socket.emit('doubt_query');
}

function answerDoubt(event)
{
    var answ = $("#text_answer").val();
    $("#text_answer").val('')                               //Clenan field

    if (answ.length > 0)
    {
        socket.emit('answer_post', doubtId, answ);
        $('#modal_answer').modal('hide');
    } else
    {
        
    }
}

/** Responses **/
// New doubt from server
socket.on('doubt_new', function(doubt)
{   
    console.log('aux', 'DOUBT NEW, BUT ON SCRIPT_ASSIGNMENT');
    var doubtJson = JSON.parse(doubt);                      // To JSON
    appendDoubt(doubtJson);

});
// Doubts query result
socket.on('doubt_query_result', function(doubtsJson)
{
    var result = JSON.parse(doubtsJson);
    var doubts = result.doubts;

    for(var i in doubts)
    {
        appendDoubt(doubts[i]);
        for(var j in doubts[i].answers)
        {
            appendAnswer(doubts[i].db_id, doubts[i].answers[j].text);
        }
    }
})

socket.on('new_answer', function(anwserJson)
{
    var answer = JSON.parse(anwserJson);
    var doubtId = answer.doubtid;
    var text = answer.text;
    appendAnswer(doubtId, text);
})

function appendAnswer(doubtId, anwser)
{
    var li = '<li class="list-group-item list-group-item-secondary">'+ anwser +'</li>';        
    $('#doubt_' + doubtId + '> ul').append(li);
}